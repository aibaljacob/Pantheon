import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
  Milestone as MilestoneIcon,
  Layers,
  GitBranch,
  RefreshCw,
  FolderPlus,
  Clock,
  X,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { useAuthStore } from '../../../auth/store/authStore';
import type {
  ApproveProductionPlanInput,
  ApproveProductionPlanResult,
  GameBlueprint,
  ProductionPlanDraft,
  ProjectDetail,
} from '../../types';

import {
  approveProductionPlan,
  generateProductionPlan,
} from '../../services/blueprintService';

interface AiProductionMapProps {
  project: ProjectDetail;
  blueprint: GameBlueprint;
}

export const AiProductionMap: React.FC<AiProductionMapProps> = ({
  project,
}) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState<ProductionPlanDraft | null>(null);
  const [targetMilestoneTitle, setTargetMilestoneTitle] = useState('');
  const [expandedSystems, setExpandedSystems] = useState<Set<string>>(
    new Set(),
  );
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(
    new Set(),
  );
  const [selectedTaskTempIds, setSelectedTaskTempIds] = useState<Set<string>>(
    new Set(),
  );

  const [approvalResult, setApprovalResult] =
    useState<ApproveProductionPlanResult | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handleGeneratePlan = async () => {
    if (!accessToken) return;
    setIsGenerating(true);
    setError(null);
    setApprovalResult(null);
    try {
      const plan = await generateProductionPlan(project.id, accessToken);
      setDraft(plan);
      setTargetMilestoneTitle(plan.targetMilestoneTitle);

      // Expand all systems and features by default
      const sysIds = new Set<string>();
      const featIds = new Set<string>();
      const taskIds = new Set<string>();

      for (const sys of plan.systems) {
        sysIds.add(sys.tempId);
        for (const feat of sys.features) {
          featIds.add(feat.tempId);
          for (const task of feat.tasks) {
            taskIds.add(task.tempId);
          }
        }
      }

      setExpandedSystems(sysIds);
      setExpandedFeatures(featIds);
      setSelectedTaskTempIds(taskIds);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate production plan.',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSystem = (sysId: string) => {
    setExpandedSystems((prev) => {
      const next = new Set(prev);
      if (next.has(sysId)) {
        next.delete(sysId);
      } else {
        next.add(sysId);
      }
      return next;
    });
  };

  const toggleFeature = (featId: string) => {
    setExpandedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(featId)) {
        next.delete(featId);
      } else {
        next.add(featId);
      }
      return next;
    });
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskTempIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleSelectAllTasks = () => {
    if (!draft) return;
    const all = new Set<string>();
    for (const sys of draft.systems) {
      for (const f of sys.features) {
        for (const t of f.tasks) {
          all.add(t.tempId);
        }
      }
    }
    setSelectedTaskTempIds(all);
  };

  const handleDeselectAllTasks = () => {
    setSelectedTaskTempIds(new Set());
  };

  // Flatten selected tasks for approval payload
  const getSelectedTasksPayload = () => {
    if (!draft) return [];
    const list: Array<{
      tempId: string;
      title: string;
      description?: string;
      type?: string;
      priority?: string;
      discipline?: string;
      dependsOnTempIds?: string[];
    }> = [];

    for (const sys of draft.systems) {
      for (const feat of sys.features) {
        for (const t of feat.tasks) {
          if (selectedTaskTempIds.has(t.tempId)) {
            list.push({
              tempId: t.tempId,
              title: t.title,
              description: t.description,
              type: t.type,
              priority: t.priority,
              discipline: t.discipline || feat.discipline,
              dependsOnTempIds: t.dependsOnTempIds?.filter((dep) =>
                selectedTaskTempIds.has(dep),
              ),
            });
          }
        }
      }
    }
    return list;
  };

  const handleApprovePlan = async () => {
    if (!accessToken || !draft) return;
    const selectedTasks = getSelectedTasksPayload();
    if (selectedTasks.length === 0) {
      setError('Please select at least one task to create a milestone.');
      setIsConfirmModalOpen(false);
      return;
    }

    setIsApproving(true);
    setError(null);
    try {
      const payload: ApproveProductionPlanInput = {
        milestoneTitle: targetMilestoneTitle.trim() || draft.targetMilestoneTitle,
        milestoneDescription: draft.summary,
        tasks: selectedTasks,
      };

      const result = await approveProductionPlan(project.id, payload, accessToken);
      setApprovalResult(result);
      setIsConfirmModalOpen(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to approve and create production plan.',
      );
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="rounded-3xl border border-[#363433] bg-[#141312] p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2b2a29] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-amber-500/40 bg-amber-950/30 px-3 py-1 text-[11px] font-mono font-semibold tracking-wider text-amber-300">
                AI PRODUCTION MAP
              </span>
              <span className="rounded-full border border-[#48473f] bg-[#201f1e] px-3 py-1 text-[11px] font-mono text-[#cac6bc]">
                SYSTEMS → FEATURES → TASKS
              </span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-extrabold tracking-tight text-[#ffffff]">
              Technical Breakdown & Architecture Map
            </h2>
            <p className="text-xs font-sans text-[#cac6bc] max-w-2xl">
              Synthesizes high-level game blueprint specs into structured game systems, features, discipline requirements, and actionable deliverables.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {project.isFounder && (
              <Button
                variant="primary"
                size="md"
                disabled={isGenerating}
                icon={
                  isGenerating ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-[#141312]" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-[#141312]" />
                  )
                }
                onClick={handleGeneratePlan}
              >
                {isGenerating
                  ? 'Generating Breakdown...'
                  : draft
                    ? 'Regenerate Breakdown'
                    : 'Generate Production Plan'}
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

        {/* Approval Success Banner */}
        {approvalResult && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-headline font-bold text-emerald-300">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Production Milestone Successfully Created
              </div>
              <span className="text-xs font-mono text-emerald-400">
                {approvalResult.taskCount} Tasks Activated
              </span>
            </div>

            <p className="text-xs font-sans text-[#cac6bc]">
              Milestone <strong className="text-white">{approvalResult.milestoneTitle}</strong> has been created in your project pipeline with {approvalResult.taskCount} tasks and verified dependency links.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {approvalResult.tasks.slice(0, 8).map((t) => (
                <span
                  key={t.id}
                  className="rounded-md border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 text-[11px] font-mono text-emerald-200"
                >
                  {t.taskCode}: {t.title}
                </span>
              ))}
              {approvalResult.tasks.length > 8 && (
                <span className="text-[11px] font-mono text-emerald-400 self-center">
                  +{approvalResult.tasks.length - 8} more tasks
                </span>
              )}
            </div>
          </div>
        )}

        {/* Draft Plan Container */}
        {draft ? (
          <div className="space-y-6">
            {/* Plan Header Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 rounded-2xl border border-[#363433] bg-[#1c1b1a] p-5">
              <div className="md:col-span-8 space-y-2">
                <div className="text-[10px] font-mono text-amber-300 uppercase tracking-wider font-semibold">
                  Proposal Overview
                </div>
                <p className="text-xs font-sans text-[#cac6bc] leading-relaxed">
                  {draft.summary}
                </p>

                <div className="flex items-center gap-4 text-xs font-mono text-[#8c887e] pt-2">
                  <span className="flex items-center gap-1.5 text-white">
                    <MilestoneIcon className="h-3.5 w-3.5 text-amber-400" />
                    Target:
                  </span>
                  <input
                    type="text"
                    value={targetMilestoneTitle}
                    onChange={(e) => setTargetMilestoneTitle(e.target.value)}
                    className="rounded-lg border border-[#363433] bg-[#141312] px-2.5 py-1 text-xs font-mono text-[#ffffff] focus:border-amber-400 focus:outline-none w-72"
                  />
                  <span className="flex items-center gap-1 text-amber-400">
                    <Clock className="h-3.5 w-3.5" />
                    ~{draft.estimatedWeeks} Weeks Est.
                  </span>
                </div>
              </div>

              <div className="md:col-span-4 flex flex-col justify-between items-start md:items-end border-t md:border-t-0 md:border-l border-[#2b2a29] pt-3 md:pt-0 md:pl-5 space-y-2">
                <div className="text-right">
                  <div className="text-[10px] font-mono text-[#8c887e]">
                    SELECTED TASKS
                  </div>
                  <div className="font-headline text-2xl font-bold text-amber-300">
                    {selectedTaskTempIds.size}{' '}
                    <span className="text-xs font-mono font-normal text-[#8c887e]">
                      of{' '}
                      {draft.systems.reduce(
                        (acc, s) =>
                          acc +
                          s.features.reduce((fAcc, f) => fAcc + f.tasks.length, 0),
                        0,
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllTasks}
                    className="text-[11px] font-mono text-[#8c887e] hover:text-amber-300 underline"
                  >
                    Select All
                  </button>
                  <span className="text-[#8c887e]">•</span>
                  <button
                    type="button"
                    onClick={handleDeselectAllTasks}
                    className="text-[11px] font-mono text-[#8c887e] hover:text-amber-300 underline"
                  >
                    Clear All
                  </button>
                </div>

                {project.isFounder && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<FolderPlus className="h-4 w-4 text-[#141312]" />}
                    disabled={selectedTaskTempIds.size === 0 || isApproving}
                    onClick={() => setIsConfirmModalOpen(true)}
                  >
                    Approve Production Plan
                  </Button>
                )}
              </div>
            </div>

            {/* Tree Hierarchy: Systems -> Features -> Tasks */}
            <div className="space-y-4">
              {draft.systems.map((system) => {
                const isSysExpanded = expandedSystems.has(system.tempId);
                const totalSysTasks = system.features.reduce(
                  (acc, f) => acc + f.tasks.length,
                  0,
                );

                return (
                  <div
                    key={system.tempId}
                    className="rounded-2xl border border-[#363433] bg-[#1c1b1a] overflow-hidden transition-all shadow-md"
                  >
                    {/* System Header */}
                    <div
                      onClick={() => toggleSystem(system.tempId)}
                      className="flex items-center justify-between p-4 sm:p-5 bg-[#201f1e] cursor-pointer hover:bg-[#252423] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="rounded p-1 text-[#8c887e] hover:text-white"
                        >
                          {isSysExpanded ? (
                            <ChevronDown className="h-5 w-5 text-amber-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-[#8c887e]" />
                          )}
                        </button>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="rounded border border-amber-500/40 bg-amber-950/40 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                              SYSTEM
                            </span>
                            <span className="rounded border border-[#48473f] bg-[#141312] px-2 py-0.5 text-[10px] font-mono text-[#cac6bc]">
                              {system.discipline}
                            </span>
                          </div>
                          <h3 className="font-headline text-base sm:text-lg font-bold text-[#ffffff]">
                            {system.name}
                          </h3>
                        </div>
                      </div>

                      <div className="text-right text-xs font-mono text-[#8c887e]">
                        <span>
                          {system.features.length} Features • {totalSysTasks} Tasks
                        </span>
                      </div>
                    </div>

                    {/* Features Container */}
                    {isSysExpanded && (
                      <div className="p-4 sm:p-5 space-y-4 border-t border-[#2b2a29] bg-[#141312]">
                        <p className="text-xs font-sans text-[#8c887e] italic">
                          {system.description}
                        </p>

                        <div className="space-y-3">
                          {system.features.map((feature) => {
                            const isFeatExpanded = expandedFeatures.has(
                              feature.tempId,
                            );

                            return (
                              <div
                                key={feature.tempId}
                                className="rounded-xl border border-[#2b2a29] bg-[#1c1b1a] overflow-hidden"
                              >
                                {/* Feature Header */}
                                <div
                                  onClick={() => toggleFeature(feature.tempId)}
                                  className="flex items-center justify-between p-3.5 bg-[#1f1e1d] cursor-pointer hover:bg-[#232221] transition-colors"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <button
                                      type="button"
                                      className="rounded p-0.5 text-[#8c887e]"
                                    >
                                      {isFeatExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-amber-400" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-[#8c887e]" />
                                      )}
                                    </button>
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className="rounded border border-[#363433] bg-[#141312] px-1.5 py-0.2 text-[9px] font-mono text-amber-300">
                                          FEATURE
                                        </span>
                                        <h4 className="font-headline text-sm font-bold text-[#ffffff]">
                                          {feature.name}
                                        </h4>
                                      </div>
                                      <p className="text-[11px] font-sans text-[#cac6bc]">
                                        {feature.description}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Required Skills Chips */}
                                  <div className="hidden sm:flex items-center gap-1.5">
                                    {feature.requiredSkills.map((sk, idx) => (
                                      <span
                                        key={idx}
                                        className="rounded-md border border-[#363433] bg-[#141312] px-2 py-0.5 text-[10px] font-mono text-[#cac6bc]"
                                      >
                                        {sk}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Tasks List */}
                                {isFeatExpanded && (
                                  <div className="p-3 space-y-2 border-t border-[#2b2a29] bg-[#161514]">
                                    {feature.tasks.map((task) => {
                                      const isSelected = selectedTaskTempIds.has(
                                        task.tempId,
                                      );

                                      return (
                                        <div
                                          key={task.tempId}
                                          onClick={() =>
                                            toggleTaskSelection(task.tempId)
                                          }
                                          className={`flex items-start gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                                            isSelected
                                              ? 'border-amber-500/30 bg-[#201f1e]'
                                              : 'border-[#262524] bg-[#141312] opacity-60'
                                          }`}
                                        >
                                          <button
                                            type="button"
                                            className="mt-0.5 text-amber-400 shrink-0"
                                          >
                                            {isSelected ? (
                                              <CheckSquare className="h-4 w-4" />
                                            ) : (
                                              <Square className="h-4 w-4 text-[#8c887e]" />
                                            )}
                                          </button>

                                          <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="rounded bg-[#2b2a29] px-1.5 py-0.5 text-[9px] font-mono font-bold text-amber-300">
                                                {task.type}
                                              </span>
                                              <span
                                                className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold ${
                                                  task.priority === 'CRITICAL'
                                                    ? 'bg-red-950/60 text-red-300 border border-red-500/30'
                                                    : task.priority === 'HIGH'
                                                      ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                                                      : 'bg-[#2b2a29] text-[#cac6bc]'
                                                }`}
                                              >
                                                {task.priority}
                                              </span>
                                              <span className="font-headline text-xs font-bold text-[#ffffff]">
                                                {task.title}
                                              </span>
                                            </div>

                                            <p className="text-xs font-sans text-[#cac6bc]">
                                              {task.description}
                                            </p>

                                            {task.dependsOnTempIds &&
                                              task.dependsOnTempIds.length >
                                                0 && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8c887e] pt-1">
                                                  <GitBranch className="h-3 w-3 text-amber-400" />
                                                  <span>
                                                    Prerequisite:{' '}
                                                    {task.dependsOnTempIds.join(
                                                      ', ',
                                                    )}
                                                  </span>
                                                </div>
                                              )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Empty state CTA */
          <div className="rounded-2xl border border-dashed border-[#363433] bg-[#1c1b1a]/50 p-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-950/20 text-amber-400">
              <Layers className="h-6 w-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-headline text-base font-bold text-[#ffffff]">
                No Production Plan Generated
              </h3>
              <p className="text-xs font-sans text-[#cac6bc] leading-relaxed">
                Generate an AI-assisted architectural production breakdown. The engine inspects your blueprint specs, pillars, and loop to structure systems, features, skills, and actionable tasks with dependencies.
              </p>
            </div>
            {project.isFounder && (
              <Button
                variant="primary"
                size="sm"
                icon={<Sparkles className="h-4 w-4 text-[#141312]" />}
                disabled={isGenerating}
                onClick={handleGeneratePlan}
              >
                {isGenerating
                  ? 'Generating Breakdown...'
                  : 'Generate Production Plan'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Confirmation & Approval Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-4 flex min-h-full items-start justify-center sm:items-center">
          <div className="relative flex flex-col w-full max-w-md max-h-[82vh] my-auto rounded-2xl border border-[#363433] bg-[#141312] shadow-2xl text-[#e6e2df] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Sticky Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-[#2b2a29] px-4 py-3 sm:px-5 sm:py-3.5 bg-[#171615]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-300">
                  <MilestoneIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                </div>
                <div>
                  <h3 className="font-headline text-sm sm:text-base font-bold text-[#ffffff] leading-tight">
                    Approve & Create Milestone
                  </h3>
                  <p className="text-[10px] sm:text-[11px] font-mono text-[#8c887e]">
                    Explicit founder approval required
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="rounded-lg p-1.5 text-[#8c887e] hover:bg-[#201f1e] hover:text-white transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs font-sans leading-relaxed text-[#cac6bc]">
              <p>
                You are about to approve this production breakdown and initialize real production records in Pantheon:
              </p>
              <div className="rounded-xl border border-[#2b2a29] bg-[#1c1b1a] p-3 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#8c887e]">Milestone:</span>
                  <span className="text-white font-bold">{targetMilestoneTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8c887e]">Tasks to Create:</span>
                  <span className="text-amber-400 font-bold">{selectedTaskTempIds.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8c887e]">Dependency Links:</span>
                  <span className="text-white">Validated and Preserved</span>
                </div>
              </div>
              <p className="text-[10px] text-[#8c887e]">
                Note: Existing tasks with identical titles will be reused to prevent duplicates if you retry or approve additional features later.
              </p>
            </div>

            {/* Sticky Footer */}
            <div className="shrink-0 flex items-center justify-end gap-2.5 px-4 py-3 sm:px-5 sm:py-3 border-t border-[#2b2a29] bg-[#171615]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isApproving}
                icon={
                  isApproving ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-[#141312]" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-[#141312]" />
                  )
                }
                onClick={handleApprovePlan}
              >
                {isApproving ? 'Activating Tasks...' : 'Confirm & Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
