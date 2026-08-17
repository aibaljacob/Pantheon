import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Crown,
  Users,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Compass,
  ArrowRight,
  Clock,
  XCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import type { DashboardProjectItem } from '../../projects/types';
import { fetchUserDashboardProjects } from '../../projects/services/projectService';
import { CreateProjectModal } from '../../profile/components/CreateProjectModal';
import { useAuthStore } from '../../auth/store/authStore';

function formatStatus(status: string): string {
  switch (status) {
    case 'PLANNING':
      return 'Planning';
    case 'PRE_PRODUCTION':
      return 'Pre-Production';
    case 'PROTOTYPE':
      return 'Prototype';
    case 'IN_DEVELOPMENT':
      return 'In Development';
    case 'ALPHA':
      return 'Alpha';
    case 'BETA':
      return 'Beta';
    case 'COMPLETED':
      return 'Completed';
    case 'PAUSED':
      return 'Paused';
    default:
      return status;
  }
}

export const DashboardProjectsSection: React.FC = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [projects, setProjects] = useState<DashboardProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const loadProjects = async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchUserDashboardProjects(accessToken);
      setProjects(res.projects || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load active projects.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [accessToken]);

  const handleProjectCreated = (newProject: DashboardProjectItem) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2b2a29] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-[#8c887e]" />
            <p className="text-xs font-mono uppercase tracking-[0.25em] text-[#8c887e]">
              Active Pantheon Production Work
            </p>
          </div>
          <h2 className="mt-1 font-headline text-2xl font-bold text-[#ffffff]">
            Dashboard Projects
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Crown className="h-3.5 w-3.5 text-amber-400" />}
          >
            Become a Founder
          </Button>

          {projects.length > 0 && (
            <Link
              to="/projects"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[#cac6bc] hover:text-[#ffffff] transition-colors"
            >
              <span>View All ({projects.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-64 rounded-3xl border border-[#363433] bg-[#1c1b1a] p-5 space-y-4"
            >
              <div className="h-28 rounded-2xl bg-[#201f1e]" />
              <div className="h-4 w-3/4 rounded bg-[#201f1e]" />
              <div className="h-3 w-1/2 rounded bg-[#201f1e]" />
            </div>
          ))}
        </div>
      )}

      {/* Error State with Retry */}
      {!isLoading && error && (
        <div className="rounded-3xl border border-red-500/30 bg-red-950/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-300">Unable to load your projects</p>
              <p className="text-xs font-mono text-red-400/80">{error}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadProjects}
            icon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Real Projects Grid */}
      {!isLoading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="h-full p-0 overflow-hidden hover:border-[#48473f] transition-all group relative">
                <div className="relative h-36 border-b border-[#2b2a29] bg-[#141312] overflow-hidden">
                  {project.coverUrl ? (
                    <img
                      src={project.coverUrl}
                      alt={project.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#201f1e] to-[#141312]">
                      <FolderKanban className="h-10 w-10 text-[#363433]" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 rounded-full border border-[#48473f] bg-[#141312]/80 backdrop-blur-md px-3 py-0.5 text-[10px] font-mono text-[#e6e2df]">
                    ● {formatStatus(project.status)}
                  </div>

                  {/* User Role Badge */}
                  <div className="absolute top-3 right-3 rounded-full border border-[#48473f] bg-[#201f1e]/90 backdrop-blur-md px-3 py-0.5 text-[10px] font-mono text-[#ffffff] flex items-center gap-1">
                    {project.isFounder ? (
                      <>
                        <Crown className="h-3 w-3 text-amber-400" />
                        <span className="text-amber-200 font-bold">Founder</span>
                      </>
                    ) : (
                      <span>{project.userRole}</span>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-headline text-lg font-bold text-[#ffffff] group-hover:text-[#e6e2df] transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-xs text-[#8c887e] line-clamp-2 mt-1">
                      {project.description}
                    </p>
                  </div>

                  {/* Moderation Status Banner (For Founder Visibility) */}
                  {project.moderationStatus === 'PENDING_REVIEW' && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-2.5 flex items-center gap-2 text-amber-300 text-[11px] font-mono">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-amber-400 animate-pulse" />
                      <span>Pending Administrator Review</span>
                    </div>
                  )}

                  {project.moderationStatus === 'REJECTED' && (
                    <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-2.5 flex items-center gap-2 text-red-300 text-[11px] font-mono">
                      <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                      <span>Rejected by Administrator</span>
                    </div>
                  )}

                  {/* Metadata Chips */}
                  <div className="text-[11px] font-mono text-[#cac6bc] flex items-center gap-2 flex-wrap">
                    {project.genre && (
                      <span className="rounded-lg border border-[#2b2a29] bg-[#141312] px-2 py-0.5">
                        {project.genre}
                      </span>
                    )}
                    {project.platform && (
                      <span className="rounded-lg border border-[#2b2a29] bg-[#141312] px-2 py-0.5">
                        {project.platform}
                      </span>
                    )}
                    {project.gameEngine && (
                      <span className="rounded-lg border border-[#2b2a29] bg-[#141312] px-2 py-0.5">
                        {project.gameEngine}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-[#2b2a29] pt-3 text-xs font-mono text-[#8c887e]">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-[#8c887e]" />
                      {project.memberCount} {project.memberCount === 1 ? 'member' : 'members'}
                    </span>
                    <span className="text-[10px] text-[#8c887e]">
                      Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}

          {/* Become a Founder Entry Point Card */}
          <BecomeAFounderCard onOpen={() => setIsCreateModalOpen(true)} />
        </div>
      )}

      {/* Empty State (0 projects) */}
      {!isLoading && !error && projects.length === 0 && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#363433] bg-[#141312]">
              <FolderKanban className="h-6 w-6 text-[#8c887e]" />
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-[#ffffff]">
                No active projects yet
              </h3>
              <p className="max-w-md mx-auto mt-1 text-xs text-[#8c887e] leading-relaxed">
                You are currently not participating in any active game production on Pantheon. Explore open game projects or launch your own studio project as a Founder.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to="/dashboard#discover">
                <Button variant="secondary" size="sm" icon={<Compass className="h-4 w-4" />}>
                  Explore Projects
                </Button>
              </Link>
            </div>
          </div>

          {/* Become a Founder Special Entry Point */}
          <BecomeAFounderCard onOpen={() => setIsCreateModalOpen(true)} />
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleProjectCreated}
      />
    </section>
  );
};

export const BecomeAFounderCard: React.FC<{ onOpen: () => void }> = ({ onOpen }) => {
  return (
    <div className="rounded-3xl border border-[#48473f]/60 bg-[#1c1b1a] p-5 sm:p-6 flex flex-col justify-between space-y-4 relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-950/20 px-3 py-1 text-[10px] font-mono font-semibold text-amber-300">
          <Crown className="h-3.5 w-3.5 text-amber-400" />
          Become a Founder
        </span>
        <Sparkles className="h-4 w-4 text-[#8c887e]" />
      </div>

      <div className="space-y-1.5">
        <h4 className="font-headline text-base font-bold text-[#ffffff]">
          Have an idea for a game?
        </h4>
        <p className="text-xs text-[#cac6bc] leading-relaxed">
          Create your game project on Pantheon, define open roles, recruit talent, and direct production.
        </p>
      </div>

      <div className="pt-2 border-t border-[#2b2a29] flex items-center justify-between">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-2 text-xs font-mono font-semibold text-amber-200 hover:bg-amber-900/40 hover:border-amber-400 transition-all"
        >
          <span>Become a Founder →</span>
        </button>
      </div>
    </div>
  );
};
