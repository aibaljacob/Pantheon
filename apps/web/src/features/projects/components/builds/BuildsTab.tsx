import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Cpu,
  Plus,
  Package,
  Loader2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { buildService } from '../../services/buildService';
import { taskService } from '../../services/taskService';
import type {
  BuildJobItem,
  BuildPlatform,
  BuildStatus,
  CreateBuildInput,
  CreatePlayableBuildInput,
  MilestoneItem,
  PlayableBuildItem,
  ProjectTaskMember,
} from '../../types';
import { BuildCard } from './BuildCard';
import { CreateBuildModal } from './CreateBuildModal';
import { BuildDetailModal } from './BuildDetailModal';
import { PlayableBuildsSection } from './PlayableBuildsSection';
import { CreatePlayableBuildModal } from './CreatePlayableBuildModal';

interface BuildsTabProps {
  projectId: string;
  projectName: string;
  isFounder: boolean;
  members: ProjectTaskMember[];
  currentUser: {
    id: string;
    username: string;
    displayName?: string;
    fullName?: string;
    role?: string;
  } | null;
}

export const BuildsTab: React.FC<BuildsTabProps> = ({
  projectId,
  projectName: _projectName,
  isFounder,
  members,
  currentUser,
}) => {
  const [builds, setBuilds] = useState<BuildJobItem[]>([]);
  const [playableBuilds, setPlayableBuilds] = useState<PlayableBuildItem[]>([]);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active view section
  const [activeSection, setActiveSection] = useState<'jobs' | 'releases'>('jobs');

  // Filters
  const [platformFilter, setPlatformFilter] = useState<BuildPlatform | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<BuildStatus | 'ALL'>('ALL');

  // Modals
  const [isCreateBuildOpen, setIsCreateBuildOpen] = useState(false);
  const [isRegisterPlayableOpen, setIsRegisterPlayableOpen] = useState(false);
  const [selectedBuild, setSelectedBuild] = useState<BuildJobItem | null>(null);

  const isFounderOrAdmin = isFounder || currentUser?.role === 'Administrator';
  const isMember = isFounderOrAdmin || members.some((m) => m.userId === currentUser?.id);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedBuilds, fetchedPlayables, fetchedMilestones] = await Promise.all([
        buildService.getBuilds(projectId, {}),
        buildService.getPlayableBuilds(projectId),
        taskService.getMilestones(projectId).catch(() => []),
      ]);
      setBuilds(fetchedBuilds);
      setPlayableBuilds(fetchedPlayables);
      setMilestones(fetchedMilestones);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load builds.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleTriggerBuild = async (input: CreateBuildInput) => {
    const created = await buildService.createBuild(projectId, input);
    await loadData();
    return created;
  };

  const handleCancelBuild = async (buildId: string) => {
    const cancelled = await buildService.cancelBuild(projectId, buildId);
    setBuilds((prev) => prev.map((b) => (b.id === buildId ? cancelled : b)));
    if (selectedBuild && selectedBuild.id === buildId) {
      setSelectedBuild(cancelled);
    }
    return cancelled;
  };

  const handleCreatePlayable = async (input: CreatePlayableBuildInput) => {
    const created = await buildService.createPlayableBuild(projectId, input);
    await loadData();
    return created;
  };

  // Filtered build jobs
  const filteredBuilds = useMemo(() => {
    return builds.filter((b) => {
      if (platformFilter !== 'ALL' && b.targetPlatform !== platformFilter) return false;
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      return true;
    });
  }, [builds, platformFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-950/20 text-amber-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline text-xl font-bold text-[#ffffff]">
                Build Pipeline & Releases
              </h2>
              <span className="rounded-full border border-[#48473f] bg-[#201f1e] px-2.5 py-0.5 text-xs font-mono font-semibold text-[#cac6bc]">
                {builds.length} {builds.length === 1 ? 'job' : 'jobs'}
              </span>
            </div>
            <p className="text-xs font-mono text-[#8c887e]">
              Automate game compilation, monitor engine build runners, and distribute playable packages.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {isFounderOrAdmin && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Package className="h-4 w-4" />}
              onClick={() => setIsRegisterPlayableOpen(true)}
            >
              Register Release
            </Button>
          )}

          {isMember && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setIsCreateBuildOpen(true)}
            >
              Trigger Build
            </Button>
          )}
        </div>
      </div>

      {/* Sub-view Navigation Pill Switcher */}
      <div className="flex items-center gap-2 border-b border-[#2b2a29] pb-3">
        <button
          type="button"
          onClick={() => setActiveSection('jobs')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono transition-all ${
            activeSection === 'jobs'
              ? 'bg-[#1c1b1a] border border-[#48473f] text-[#ffffff] font-bold shadow-sm'
              : 'text-[#8c887e] hover:text-[#ffffff] hover:bg-[#1c1b1a]/40'
          }`}
        >
          <Cpu className="h-3.5 w-3.5 text-amber-400" />
          <span>Build Jobs</span>
          <span className="rounded-full bg-[#201f1e] px-1.5 py-0.2 text-[10px] text-[#cac6bc]">
            {builds.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('releases')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono transition-all ${
            activeSection === 'releases'
              ? 'bg-[#1c1b1a] border border-[#48473f] text-[#ffffff] font-bold shadow-sm'
              : 'text-[#8c887e] hover:text-[#ffffff] hover:bg-[#1c1b1a]/40'
          }`}
        >
          <Package className="h-3.5 w-3.5 text-amber-400" />
          <span>Playable Releases</span>
          <span className="rounded-full bg-[#201f1e] px-1.5 py-0.2 text-[10px] text-[#cac6bc]">
            {playableBuilds.length}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#8c887e]" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-950/20 p-5 text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-xs font-mono">{error}</p>
        </div>
      ) : activeSection === 'jobs' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-[#2b2a29] bg-[#141312] p-3.5">
            <div className="flex items-center gap-2 text-xs font-mono text-[#8c887e]">
              <Filter className="h-3.5 w-3.5 text-amber-400" />
              <span>Filters</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value as BuildPlatform | 'ALL')}
                className="rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs font-mono text-[#e6e2df] focus:border-[#cac6bc] focus:outline-none"
              >
                <option value="ALL">All Platforms</option>
                <option value="WINDOWS">Windows</option>
                <option value="MAC">macOS</option>
                <option value="LINUX">Linux</option>
                <option value="WEBGL">WebGL</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as BuildStatus | 'ALL')}
                className="rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs font-mono text-[#e6e2df] focus:border-[#cac6bc] focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="QUEUED">Queued</option>
                <option value="RUNNING">Running</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {(platformFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setPlatformFilter('ALL');
                    setStatusFilter('ALL');
                  }}
                  className="text-xs font-mono text-amber-400 hover:text-amber-300 px-2 py-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Builds Grid */}
          {filteredBuilds.length === 0 ? (
            <div className="rounded-3xl border border-[#2b2a29] bg-[#1c1b1a] p-12 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#363433] bg-[#141312] text-[#8c887e]">
                <Cpu className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-headline text-lg font-bold text-[#ffffff]">No Build Jobs Found</h3>
                <p className="mt-1 text-xs font-mono text-[#8c887e]">
                  {builds.length === 0
                    ? 'No build jobs have been triggered yet for this project.'
                    : 'No builds match the selected platform or status filters.'}
                </p>
              </div>
              {isMember && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setIsCreateBuildOpen(true)}
                >
                  Trigger First Build
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBuilds.map((b) => (
                <BuildCard key={b.id} build={b} onClick={(item) => setSelectedBuild(item)} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <PlayableBuildsSection
          playableBuilds={playableBuilds}
          onOpenRegisterModal={() => setIsRegisterPlayableOpen(true)}
          isFounderOrAdmin={isFounderOrAdmin}
        />
      )}

      {/* Trigger Build Modal */}
      <CreateBuildModal
        isOpen={isCreateBuildOpen}
        onClose={() => setIsCreateBuildOpen(false)}
        onTrigger={handleTriggerBuild}
        milestones={milestones}
      />

      {/* Register Playable Build Modal */}
      <CreatePlayableBuildModal
        isOpen={isRegisterPlayableOpen}
        onClose={() => setIsRegisterPlayableOpen(false)}
        onCreate={handleCreatePlayable}
        milestones={milestones}
      />

      {/* Build Detail Modal */}
      {selectedBuild && (
        <BuildDetailModal
          build={selectedBuild}
          isOpen={Boolean(selectedBuild)}
          onClose={() => setSelectedBuild(null)}
          onCancelBuild={handleCancelBuild}
          canCancel={
            isFounderOrAdmin ||
            (isMember && selectedBuild.triggeredById === currentUser?.id)
          }
        />
      )}
    </div>
  );
};
