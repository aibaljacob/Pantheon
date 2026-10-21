import React, { useState, useEffect, useCallback } from 'react';
import {
  Palette,
  Vote,
  Layers,
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../../../../components/ui/Button';
import type {
  ArtProposalItem,
  DesignAssetItem,
  GameBlueprint,
  ProjectDetail,
} from '../../../types';
import {
  fetchArtProposals,
  fetchDesignAssets,
} from '../../../services/artDesignService';
import { ArtProposalsView } from './ArtProposalsView';
import { DesignLibrariesView } from './DesignLibrariesView';
import { NewArtProposalModal } from './NewArtProposalModal';
import { ConvertDesignTaskModal } from './ConvertDesignTaskModal';

interface ArtAndDesignStudioProps {
  project: ProjectDetail;
  blueprint: GameBlueprint;
  token?: string;
  onBlueprintUpdated?: (updated: GameBlueprint) => void;
  onNavigateToTab?: (tab: string) => void;
}

type StudioTab = 'PROPOSALS' | 'LIBRARIES';

export const ArtAndDesignStudio: React.FC<ArtAndDesignStudioProps> = ({
  project,
  blueprint: _blueprint,
  token,
  onBlueprintUpdated: _onBlueprintUpdated,
  onNavigateToTab,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('PROPOSALS');
  const [proposals, setProposals] = useState<ArtProposalItem[]>([]);
  const [assets, setAssets] = useState<DesignAssetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isNewProposalModalOpen, setIsNewProposalModalOpen] = useState(false);
  const [taskConversionSource, setTaskConversionSource] = useState<
    | { type: 'PROPOSAL'; item: ArtProposalItem }
    | { type: 'ASSET'; item: DesignAssetItem }
    | null
  >(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedProposals, fetchedAssets] = await Promise.all([
        fetchArtProposals(project.id, undefined, token),
        fetchDesignAssets(project.id, undefined, token),
      ]);
      setProposals(fetchedProposals);
      setAssets(fetchedAssets);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load art & design studio data.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [project.id, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTaskSuccess = (_taskId: string, taskCode: string) => {
    setSuccessBanner(
      `Production task ${taskCode} created successfully from approved design! You can track it in the Tasks tab.`,
    );
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Studio Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#363433] bg-[#141312] p-6 sm:p-8 shadow-2xl">
        {/* Cinematic ambient backlight */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-stone-700/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#2b2a29] pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full border border-amber-500/40 bg-amber-950/30 px-3 py-1 text-[11px] font-mono font-semibold tracking-wider text-amber-300 flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" /> ART & DESIGN STUDIO
              </span>
              <span className="rounded-full border border-[#48473f] bg-[#201f1e] px-3 py-1 text-[11px] font-mono text-[#cac6bc]">
                {project.genre || 'Action / Adventure'}
              </span>
              <span className="rounded-full border border-[#48473f] bg-[#201f1e] px-3 py-1 text-[11px] font-mono text-[#cac6bc]">
                {project.gameEngine || 'Unreal Engine 5'}
              </span>
            </div>

            <h1 className="font-headline text-3xl sm:text-4xl font-extrabold tracking-tight text-[#ffffff]">
              Visual Identity & Production Design
            </h1>

            <p className="max-w-3xl text-sm font-sans leading-relaxed text-[#cac6bc]">
              Visual production workspace. Upload art references, collect member votes with feedback, and promote approved visual designs into production tasks.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Button
              variant="primary"
              size="md"
              icon={<Sparkles className="h-4 w-4 text-[#141312]" />}
              onClick={() => setIsNewProposalModalOpen(true)}
            >
              Upload Art Reference
            </Button>
          </div>
        </div>

        {/* Success Banner */}
        {successBanner && (
          <div className="relative z-10 mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-xs font-mono text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{successBanner}</span>
            </div>
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('tasks')}
                className="text-amber-400 hover:underline flex items-center gap-1 text-[11px] font-bold"
              >
                Go to Tasks <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Sub-Tabs Selector */}
        <div className="relative z-10 pt-6">
          <div className="flex items-center gap-2 rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-1.5 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('PROPOSALS')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono font-bold transition-all ${
                activeTab === 'PROPOSALS'
                  ? 'bg-amber-400 text-[#141312] shadow-sm'
                  : 'text-[#8c887e] hover:text-[#e6e2df] hover:bg-[#201f1e]'
              }`}
            >
              <Vote className="h-4 w-4" />
              <span>Art Proposals & Voting</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  activeTab === 'PROPOSALS'
                    ? 'bg-black/20 text-[#141312]'
                    : 'bg-[#141312] text-amber-300'
                }`}
              >
                {proposals.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('LIBRARIES')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono font-bold transition-all ${
                activeTab === 'LIBRARIES'
                  ? 'bg-amber-400 text-[#141312] shadow-sm'
                  : 'text-[#8c887e] hover:text-[#e6e2df] hover:bg-[#201f1e]'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Design Reference Libraries</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  activeTab === 'LIBRARIES'
                    ? 'bg-black/20 text-[#141312]'
                    : 'bg-[#141312] text-amber-300'
                }`}
              >
                {assets.length}
              </span>
            </button>
          </div>
        </div>

        {/* Content View */}
        <div className="relative z-10 pt-6">
          {isLoading ? (
            <div className="flex h-56 items-center justify-center rounded-2xl border border-[#2b2a29] bg-[#1c1b1a]">
              <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center text-xs font-mono text-red-300">
              {error}
            </div>
          ) : activeTab === 'PROPOSALS' ? (
            <ArtProposalsView
              project={project}
              proposals={proposals}
              token={token}
              onRefresh={loadData}
              onOpenNewProposal={() => setIsNewProposalModalOpen(true)}
              onOpenConvertTask={(proposal) =>
                setTaskConversionSource({ type: 'PROPOSAL', item: proposal })
              }
            />
          ) : (
            <DesignLibrariesView
              project={project}
              assets={assets}
              token={token}
              onRefresh={loadData}
              onOpenConvertTask={(asset) =>
                setTaskConversionSource({ type: 'ASSET', item: asset })
              }
            />
          )}
        </div>
      </div>

      {/* New Proposal Modal */}
      {isNewProposalModalOpen && (
        <NewArtProposalModal
          isOpen={isNewProposalModalOpen}
          onClose={() => setIsNewProposalModalOpen(false)}
          projectId={project.id}
          token={token}
          onCreated={loadData}
        />
      )}

      {/* Convert Task Modal */}
      {taskConversionSource && (
        <ConvertDesignTaskModal
          isOpen={Boolean(taskConversionSource)}
          onClose={() => setTaskConversionSource(null)}
          projectId={project.id}
          source={taskConversionSource}
          token={token}
          onSuccess={handleTaskSuccess}
        />
      )}
    </div>
  );
};
