import React, { useState, useEffect } from 'react';
import {
  Compass,
  Gamepad2,
  Layers,
  Users,
  Edit3,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { useAuthStore } from '../../../auth/store/authStore';
import type { GameBlueprint, ProjectDetail } from '../../types';
import { fetchGameBlueprint } from '../../services/blueprintService';
import { EditBlueprintModal } from './EditBlueprintModal';
import { ArtAndDesignStudio } from './art-design/ArtAndDesignStudio';
import { NarrativeStudio } from './narrative/NarrativeStudio';
import { InteractiveGameplayLoop } from './InteractiveGameplayLoop';
import { AiProductionMap } from './AiProductionMap';
import { VisualSkillCoverage } from './VisualSkillCoverage';

interface BlueprintTabProps {
  project: ProjectDetail;
  onNavigateToTab?: (tab: string) => void;
}

type BlueprintSubView =
  | 'VISION_BOARD'
  | 'NARRATIVE'
  | 'GAMEPLAY_LOOP'
  | 'PRODUCTION_MAP'
  | 'SKILL_COVERAGE';

export const BlueprintTab: React.FC<BlueprintTabProps> = ({
  project,
  onNavigateToTab,
}) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [blueprint, setBlueprint] = useState<GameBlueprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeSubView, setActiveSubView] =
    useState<BlueprintSubView>('VISION_BOARD');

  useEffect(() => {
    let isCancelled = false;

    const loadBlueprint = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const bp = await fetchGameBlueprint(
          project.id,
          accessToken || undefined,
        );
        if (!isCancelled) {
          setBlueprint(bp);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load game blueprint.',
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadBlueprint();

    return () => {
      isCancelled = true;
    };
  }, [project.id, accessToken]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-[#363433] bg-[#1c1b1a]">
        <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-950/20 p-6 text-center space-y-3">
        <AlertCircle className="mx-auto h-6 w-6 text-red-400" />
        <p className="text-sm font-mono text-red-300">{error}</p>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-8 sm:p-12 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-950/20 text-amber-400">
          <Compass className="h-7 w-7" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="font-headline text-lg font-bold text-[#ffffff]">
            No Game Blueprint Created
          </h3>
          <p className="text-xs font-mono text-[#8c887e]">
            A Game Blueprint defines the high concept, core gameplay loop, design pillars, and technical architecture for this production.
          </p>
        </div>

        {project.isFounder && (
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4 text-[#141312]" />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Create Game Blueprint
            </Button>
          </div>
        )}

        <EditBlueprintModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          projectId={project.id}
          blueprint={blueprint}
          onSaved={(saved) => setBlueprint(saved)}
        />
      </div>
    );
  }

  const pillars = blueprint.pillars || [];
  const keyFeatures = blueprint.keyFeatures || [];

  return (
    <div className="space-y-6">
      {/* Sub-navigation Segment Controller */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#363433] bg-[#141312] p-1.5 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSubView('VISION_BOARD')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono font-bold transition-all ${
              activeSubView === 'VISION_BOARD'
                ? 'bg-[#201f1e] text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-[#8c887e] hover:text-[#e6e2df] hover:bg-[#1c1b1a]'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Art & Design Studio</span>
          </button>

          {/* Narrative Studio temporarily hidden */}
          {/* <button
            type="button"
            onClick={() => setActiveSubView('NARRATIVE')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono font-bold transition-all ${
              activeSubView === 'NARRATIVE'
                ? 'bg-[#201f1e] text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-[#8c887e] hover:text-[#e6e2df] hover:bg-[#1c1b1a]'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Narrative Studio</span>
          </button> */}

          <button
            type="button"
            onClick={() => setActiveSubView('GAMEPLAY_LOOP')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono font-bold transition-all ${
              activeSubView === 'GAMEPLAY_LOOP'
                ? 'bg-[#201f1e] text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-[#8c887e] hover:text-[#e6e2df] hover:bg-[#1c1b1a]'
            }`}
          >
            <Gamepad2 className="h-4 w-4" />
            <span>Gameplay Loop</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('PRODUCTION_MAP')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono font-bold transition-all ${
              activeSubView === 'PRODUCTION_MAP'
                ? 'bg-[#201f1e] text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-[#8c887e] hover:text-[#e6e2df] hover:bg-[#1c1b1a]'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Production Map</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('SKILL_COVERAGE')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono font-bold transition-all ${
              activeSubView === 'SKILL_COVERAGE'
                ? 'bg-[#201f1e] text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-[#8c887e] hover:text-[#e6e2df] hover:bg-[#1c1b1a]'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Skill Coverage</span>
          </button>
        </div>

        {project.isFounder && (
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit3 className="h-3.5 w-3.5" />}
            onClick={() => setIsEditModalOpen(true)}
            className="text-xs font-mono text-[#cac6bc]"
          >
            Edit Specs
          </Button>
        )}
      </div>

      {/* Sub-view Render */}
      {activeSubView === 'VISION_BOARD' && (
        <div className="space-y-6">
          <ArtAndDesignStudio
            project={project}
            blueprint={blueprint}
            token={accessToken || undefined}
            onBlueprintUpdated={(saved) => setBlueprint(saved)}
            onNavigateToTab={onNavigateToTab}
          />

          {/* Design Pillars Section */}
          {pillars.length > 0 && (
            <div className="rounded-3xl border border-[#363433] bg-[#141312] p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-amber-400" />
                <h3 className="font-headline text-lg font-bold text-[#ffffff]">
                  Core Design Pillars
                </h3>
              </div>
              <p className="text-xs font-mono text-[#8c887e]">
                Guiding creative and technical principles for all feature decisions
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {pillars.map((pillar: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-5 space-y-2 relative overflow-hidden transition-all hover:border-[#48473f]"
                  >
                    <div className="text-[10px] font-mono font-bold text-amber-400">
                      PILLAR #{idx + 1}
                    </div>
                    <h4 className="font-headline text-base font-bold text-[#ffffff]">
                      {pillar.title}
                    </h4>
                    {pillar.description && (
                      <p className="text-xs leading-relaxed text-[#cac6bc] font-sans">
                        {pillar.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Features & Deliverables Section */}
          {keyFeatures.length > 0 && (
            <div className="rounded-3xl border border-[#363433] bg-[#141312] p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-amber-400" />
                <h3 className="font-headline text-lg font-bold text-[#ffffff]">
                  Key Features & Deliverables
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {keyFeatures.map((feat: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 space-y-2 transition-all hover:border-[#363433]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-md border border-[#363433] bg-[#141312] px-2 py-0.5 text-[10px] font-mono text-amber-300">
                        {feat.category || 'GAMEPLAY'}
                      </span>
                      <h4 className="font-headline text-sm font-bold text-[#ffffff]">
                        {feat.title}
                      </h4>
                    </div>
                    {feat.description && (
                      <p className="text-xs leading-relaxed text-[#cac6bc] font-sans">
                        {feat.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubView === 'NARRATIVE' && (
        <NarrativeStudio
          project={project}
          blueprint={blueprint}
          token={accessToken || undefined}
          onBlueprintUpdated={(saved) => setBlueprint(saved)}
        />
      )}

      {activeSubView === 'GAMEPLAY_LOOP' && (
        <InteractiveGameplayLoop
          project={project}
          blueprint={blueprint}
          onBlueprintUpdated={(saved) => setBlueprint(saved)}
        />
      )}

      {activeSubView === 'PRODUCTION_MAP' && (
        <AiProductionMap project={project} blueprint={blueprint} />
      )}

      {activeSubView === 'SKILL_COVERAGE' && (
        <VisualSkillCoverage
          project={project}
          onNavigateToTab={onNavigateToTab}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditBlueprintModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          projectId={project.id}
          blueprint={blueprint}
          onSaved={(saved) => setBlueprint(saved)}
        />
      )}
    </div>
  );
};
