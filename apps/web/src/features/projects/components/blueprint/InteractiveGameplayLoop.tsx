import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  ArrowRight,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  Save,
  AlertCircle,
  X,
  RefreshCw,
  Clock,
} from 'lucide-react';

import { Button } from '../../../../components/ui/Button';
import { useAuthStore } from '../../../auth/store/authStore';
import type {
  GameBlueprint,
  GameplayLoopData,
  GameplayLoopStep,
  ProjectDetail,
} from '../../types';
import {
  proposeGameplayLoop,
  upsertGameBlueprint,
} from '../../services/blueprintService';

interface InteractiveGameplayLoopProps {
  project: ProjectDetail;
  blueprint: GameBlueprint;
  onBlueprintUpdated: (updated: GameBlueprint) => void;
}

const DEFAULT_PHASES = [
  'EXPLORATION',
  'ENGAGEMENT',
  'SCAVENGING',
  'UPGRADE',
  'PROGRESSION',
];

export const InteractiveGameplayLoop: React.FC<InteractiveGameplayLoopProps> = ({
  project,
  blueprint,
  onBlueprintUpdated,
}) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  // Initialize steps from structured gameplayLoop, or parse arrow-delimited coreLoop
  const [steps, setSteps] = useState<GameplayLoopStep[]>(() => {
    if (
      blueprint.gameplayLoop &&
      Array.isArray(blueprint.gameplayLoop.steps) &&
      blueprint.gameplayLoop.steps.length > 0
    ) {
      return blueprint.gameplayLoop.steps;
    }

    if (blueprint.coreLoop && blueprint.coreLoop.includes('→')) {
      const titles = blueprint.coreLoop
        .split('→')
        .map((s) => s.trim())
        .filter(Boolean);
      return titles.map((title, idx) => ({
        stepNumber: idx + 1,
        phase: DEFAULT_PHASES[idx % DEFAULT_PHASES.length],
        title,
        description: `Engage with ${title.toLowerCase()} in the active sector.`,
        pacing: idx === titles.length - 1 ? 'Cycle reset' : '2-4 mins',
      }));
    }

    return [
      {
        stepNumber: 1,
        phase: 'EXPLORATION',
        title: 'Traverse & Scout Sector',
        description: 'Navigate terrain, scan for anomalies, and locate resources.',
        pacing: '3-5 mins',
      },
      {
        stepNumber: 2,
        phase: 'ENGAGEMENT',
        title: 'Tactical Encounter',
        description: 'Engage mechanical adversaries using cover and squad tactics.',
        pacing: '2-4 mins',
      },
      {
        stepNumber: 3,
        phase: 'SCAVENGING',
        title: 'Salvage Components',
        description: 'Harvest salvage alloys and rare tech schematics.',
        pacing: '1-2 mins',
      },
      {
        stepNumber: 4,
        phase: 'UPGRADE',
        title: 'Fabricate & Reinvest',
        description: 'Upgrade equipment, mod weapons, and prepare for next sector.',
        pacing: 'At Safe Haven',
      },
    ];
  });

  const [summary, setSummary] = useState<string>(
    blueprint.gameplayLoop?.summary ||
      'Repeatable core player engagement and progression loop.',
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Proposal modal state
  const [isProposing, setIsProposing] = useState(false);
  const [proposedLoop, setProposedLoop] = useState<GameplayLoopData | null>(
    null,
  );

  // Step modal / editor state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [stepModalData, setStepModalData] = useState<GameplayLoopStep>({
    stepNumber: 1,
    phase: 'EXPLORATION',
    title: '',
    description: '',
    pacing: '',
  });

  // Re-sync with blueprint prop if external updates happen
  useEffect(() => {
    if (
      blueprint.gameplayLoop &&
      Array.isArray(blueprint.gameplayLoop.steps) &&
      blueprint.gameplayLoop.steps.length > 0
    ) {
      setSteps(blueprint.gameplayLoop.steps);
      setSummary(blueprint.gameplayLoop.summary);
    }
  }, [blueprint.gameplayLoop]);

  const handleSaveLoop = async () => {
    if (!accessToken) return;
    setIsSaving(true);
    setError(null);
    try {
      const derivedCoreLoop = steps.map((s) => s.title.trim()).join(' → ');
      const payload = {
        coreLoop: derivedCoreLoop,
        gameplayLoop: {
          summary,
          steps: steps.map((s, idx) => ({ ...s, stepNumber: idx + 1 })),
        },
      };

      const saved = await upsertGameBlueprint(project.id, payload, accessToken);
      onBlueprintUpdated(saved);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save gameplay loop.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestAiProposal = async () => {
    if (!accessToken) return;
    setIsProposing(true);
    setError(null);
    try {
      const proposal = await proposeGameplayLoop(project.id, accessToken);
      setProposedLoop(proposal);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to request gameplay loop proposal.',
      );
    } finally {
      setIsProposing(false);
    }
  };

  const handleApplyProposal = () => {
    if (!proposedLoop) return;
    setSteps(proposedLoop.steps);
    setSummary(proposedLoop.summary);
    setProposedLoop(null);
  };

  const handleMoveStep = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= steps.length) return;
    const reordered = [...steps];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    setSteps(reordered.map((s, idx) => ({ ...s, stepNumber: idx + 1 })));
  };

  const handleDeleteStep = (index: number) => {
    if (steps.length <= 2) {
      setError('A gameplay loop requires at least 2 steps.');
      return;
    }
    const filtered = steps.filter((_, idx) => idx !== index);
    setSteps(filtered.map((s, idx) => ({ ...s, stepNumber: idx + 1 })));
  };

  const handleOpenEditStep = (index: number) => {
    setEditingIndex(index);
    setStepModalData({ ...steps[index] });
  };

  const handleOpenAddStep = () => {
    setEditingIndex(-1); // -1 signifies adding new step
    setStepModalData({
      stepNumber: steps.length + 1,
      phase: 'ENGAGEMENT',
      title: '',
      description: '',
      pacing: '2-4 mins',
    });
  };

  const handleSaveStepModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepModalData.title.trim()) return;

    if (editingIndex === -1) {
      // Add new step
      const updated = [
        ...steps,
        {
          ...stepModalData,
          stepNumber: steps.length + 1,
        },
      ];
      setSteps(updated);
    } else if (editingIndex !== null) {
      // Update existing step
      const updated = [...steps];
      updated[editingIndex] = {
        ...stepModalData,
        stepNumber: editingIndex + 1,
      };
      setSteps(updated);
    }
    setEditingIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="rounded-3xl border border-[#363433] bg-[#141312] p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2b2a29] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-amber-500/40 bg-amber-950/30 px-3 py-1 text-[11px] font-mono font-semibold tracking-wider text-amber-300">
                INTERACTIVE GAMEPLAY LOOP
              </span>
              <span className="rounded-full border border-[#48473f] bg-[#201f1e] px-3 py-1 text-[11px] font-mono text-[#cac6bc]">
                {steps.length} NODES IN CYCLE
              </span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-extrabold tracking-tight text-[#ffffff]">
              Core Player Agency & Reinforcement Loop
            </h2>
            <p className="text-xs font-sans text-[#cac6bc] max-w-2xl">
              Connected, bidirectional gameplay rhythm governing moment-to-moment player motivation, challenges, resource recovery, and modular progression.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {project.isFounder && (
              <Button
                variant="secondary"
                size="sm"
                disabled={isProposing}
                icon={
                  isProposing ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-amber-400" />
                  )
                }
                onClick={handleRequestAiProposal}
              >
                {isProposing ? 'Analyzing Blueprint...' : 'Propose AI Loop'}
              </Button>
            )}

            {project.isFounder && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={handleOpenAddStep}
              >
                Add Step
              </Button>
            )}

            {project.isFounder && (
              <Button
                variant="primary"
                size="sm"
                disabled={isSaving}
                icon={
                  saveSuccess ? (
                    <Check className="h-4 w-4 text-[#141312]" />
                  ) : (
                    <Save className="h-4 w-4 text-[#141312]" />
                  )
                }
                onClick={handleSaveLoop}
              >
                {isSaving
                  ? 'Saving...'
                  : saveSuccess
                    ? 'Saved!'
                    : 'Save Loop'}
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-950/20 p-4 text-xs font-mono text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Interactive Visual Node Diagram */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-[#8c887e]">
            <span>DIRECTIONAL FLOW (CYCLE STAGE 1 → {steps.length})</span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <RotateCcw className="h-3.5 w-3.5" /> RE-ENGAGEMENT CYCLE
            </span>
          </div>

          {/* Node Flow Grid with Directional Connectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch relative">
            {steps.map((step, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === steps.length - 1;

              return (
                <div
                  key={idx}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[#363433] bg-[#1c1b1a] p-5 shadow-lg transition-all hover:border-amber-500/50 hover:bg-[#201f1e]"
                >
                  {/* Top Step Meta */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-mono font-bold text-amber-300 border border-amber-500/30">
                          {idx + 1}
                        </span>
                        <span className="rounded-md border border-[#363433] bg-[#141312] px-2 py-0.5 text-[10px] font-mono font-semibold text-amber-200">
                          {step.phase}
                        </span>
                      </div>

                      {project.isFounder && (
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            title="Move Earlier"
                            disabled={isFirst}
                            onClick={() => handleMoveStep(idx, idx - 1)}
                            className="rounded p-1 text-[#8c887e] hover:bg-[#2b2a29] hover:text-[#ffffff] disabled:opacity-30"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Move Later"
                            disabled={isLast}
                            onClick={() => handleMoveStep(idx, idx + 1)}
                            className="rounded p-1 text-[#8c887e] hover:bg-[#2b2a29] hover:text-[#ffffff] disabled:opacity-30"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Edit Step"
                            onClick={() => handleOpenEditStep(idx)}
                            className="rounded p-1 text-[#8c887e] hover:bg-[#2b2a29] hover:text-[#ffffff]"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete Step"
                            onClick={() => handleDeleteStep(idx)}
                            className="rounded p-1 text-[#8c887e] hover:bg-red-950/40 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h4 className="font-headline text-base font-bold text-[#ffffff]">
                      {step.title}
                    </h4>

                    <p className="text-xs font-sans leading-relaxed text-[#cac6bc]">
                      {step.description}
                    </p>
                  </div>

                  {/* Bottom Footer with Pacing */}
                  <div className="mt-4 pt-3 border-t border-[#2b2a29] flex items-center justify-between text-[11px] font-mono text-[#8c887e]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-400" />
                      {step.pacing || 'Pacing: Standard'}
                    </span>
                    {!isLast ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        Next <ArrowRight className="h-3 w-3" />
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <RotateCcw className="h-3 w-3" /> Loops back
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Return Cycle Indicator Bar */}
          <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#363433] bg-[#141312] p-3 text-xs font-mono text-[#cac6bc]">
            <RotateCcw className="h-4 w-4 text-amber-400" />
            <span>
              Completing Step {steps.length} seamlessly reinvests progress into Step 1 ({steps[0]?.title})
            </span>
          </div>
        </div>
      </div>

      {/* AI Proposal Review Modal */}
      {proposedLoop && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-4 flex min-h-full items-start justify-center sm:items-center">
          <div className="relative flex flex-col w-full max-w-2xl max-h-[82vh] my-auto rounded-2xl border border-[#363433] bg-[#141312] shadow-2xl text-[#e6e2df] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Sticky Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-[#2b2a29] px-4 py-3 sm:px-5 sm:py-3.5 bg-[#171615]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-300">
                  <Sparkles className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                </div>
                <div>
                  <h3 className="font-headline text-sm sm:text-base font-bold text-[#ffffff] leading-tight">
                    AI Gameplay Loop Proposal
                  </h3>
                  <p className="text-[10px] sm:text-[11px] font-mono text-[#8c887e]">
                    Review proposed rhythm before applying to blueprint
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProposedLoop(null)}
                className="rounded-lg p-1.5 text-[#8c887e] hover:bg-[#201f1e] hover:text-white transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3">
              <div className="rounded-xl border border-[#2b2a29] bg-[#1c1b1a] p-3 text-xs font-sans leading-relaxed text-[#cac6bc]">
                <span className="font-mono font-bold text-amber-300 mr-2">
                  DESIGN SUMMARY:
                </span>
                {proposedLoop.summary}
              </div>

              <div className="space-y-2.5">
                {proposedLoop.steps.map((st, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-[#2b2a29] bg-[#1c1b1a] p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-amber-300">
                        STEP {i + 1} • {st.phase}
                      </span>
                      <span className="text-[#8c887e] text-[11px]">{st.pacing}</span>
                    </div>
                    <h5 className="font-headline text-sm font-bold text-[#ffffff]">
                      {st.title}
                    </h5>
                    <p className="text-xs font-sans text-[#cac6bc]">
                      {st.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="shrink-0 flex items-center justify-end gap-2.5 px-4 py-3 sm:px-5 sm:py-3 border-t border-[#2b2a29] bg-[#171615]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setProposedLoop(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Check className="h-4 w-4 text-[#141312]" />}
                onClick={handleApplyProposal}
              >
                Apply Proposed Loop
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Step Modal */}
      {editingIndex !== null && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-4 flex min-h-full items-start justify-center sm:items-center">
          <form
            onSubmit={handleSaveStepModal}
            className="relative flex flex-col w-full max-w-md max-h-[82vh] my-auto rounded-2xl border border-[#363433] bg-[#141312] shadow-2xl text-[#e6e2df] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Sticky Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-[#2b2a29] px-4 py-3 sm:px-5 sm:py-3.5 bg-[#171615]">
              <h3 className="font-headline text-sm sm:text-base font-bold text-[#ffffff]">
                {editingIndex === -1 ? 'Add Gameplay Step' : `Edit Step ${editingIndex + 1}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingIndex(null)}
                className="rounded-lg p-1.5 text-[#8c887e] hover:bg-[#201f1e] hover:text-white transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-[#8c887e] uppercase mb-1">
                  Phase
                </label>
                <input
                  type="text"
                  value={stepModalData.phase}
                  onChange={(e) =>
                    setStepModalData({
                      ...stepModalData,
                      phase: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g. EXPLORATION, COMBAT, UPGRADE"
                  className="w-full rounded-lg border border-[#363433] bg-[#1c1b1a] px-3 py-2 text-xs sm:text-sm font-mono text-[#ffffff] focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8c887e] uppercase mb-1">
                  Step Title
                </label>
                <input
                  type="text"
                  value={stepModalData.title}
                  onChange={(e) =>
                    setStepModalData({
                      ...stepModalData,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g. Tactical Combat Encounters"
                  className="w-full rounded-lg border border-[#363433] bg-[#1c1b1a] px-3 py-2 text-xs sm:text-sm font-sans text-[#ffffff] focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8c887e] uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={stepModalData.description}
                  onChange={(e) =>
                    setStepModalData({
                      ...stepModalData,
                      description: e.target.value,
                    })
                  }
                  placeholder="What does the player do during this step?"
                  className="w-full rounded-lg border border-[#363433] bg-[#1c1b1a] px-3 py-2 text-xs font-sans text-[#ffffff] focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8c887e] uppercase mb-1">
                  Pacing / Duration
                </label>
                <input
                  type="text"
                  value={stepModalData.pacing || ''}
                  onChange={(e) =>
                    setStepModalData({
                      ...stepModalData,
                      pacing: e.target.value,
                    })
                  }
                  placeholder="e.g. 2-4 mins, At Safe Haven"
                  className="w-full rounded-lg border border-[#363433] bg-[#1c1b1a] px-3 py-2 text-xs sm:text-sm font-mono text-[#ffffff] focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="shrink-0 flex items-center justify-end gap-2.5 px-4 py-3 sm:px-5 sm:py-3 border-t border-[#2b2a29] bg-[#171615]">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setEditingIndex(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Step
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
