import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Film,
  Users,
  GitBranch,
  Layers,
} from 'lucide-react';
import type { NarrativeData, ApproveProductionPlanResult } from '../../../types';
import { approveProductionPlan } from '../../../services/blueprintService';
import { Button } from '../../../../../components/ui/Button';

interface NarrativeTaskApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  narrative: NarrativeData;
  token?: string;
  onTasksApproved?: (result: ApproveProductionPlanResult) => void;
}

interface CandidateTask {
  id: string;
  source: 'SCENE' | 'CHARACTER' | 'QUEST';
  title: string;
  description: string;
  discipline: 'Design' | 'Art' | 'Audio' | 'Engineering';
  type: string;
  priority: string;
  selected: boolean;
}

export const NarrativeTaskApprovalModal: React.FC<NarrativeTaskApprovalModalProps> = ({
  isOpen,
  onClose,
  projectId,
  narrative,
  token,
  onTasksApproved,
}) => {
  const [milestoneTitle, setMilestoneTitle] = useState('Narrative & Cinematic Alpha');
  const [milestoneDescription, setMilestoneDescription] = useState(
    'Production deliverables derived from approved Story Bible, Screenplay, and Quest branches.',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<ApproveProductionPlanResult | null>(null);

  // Generate candidate deliverables from active narrative
  const initialCandidates = useMemo<CandidateTask[]>(() => {
    const list: CandidateTask[] = [];

    // 1. From Scenes
    (narrative.scenes || []).forEach((scene) => {
      list.push({
        id: `task-scene-${scene.id}`,
        source: 'SCENE',
        title: `Cinematics: Author & Stage Scene #${scene.sceneNumber} (${scene.title})`,
        description: `Location: ${scene.slugline.intExt}. ${scene.slugline.location} - ${scene.slugline.timeOfDay}.\nAction: ${scene.actionDirections}\nDialogue lines: ${scene.dialogueLines?.length || 0}`,
        discipline: 'Design',
        type: 'FEATURE',
        priority: 'HIGH',
        selected: true,
      });
    });

    // 2. From Characters
    (narrative.characters || []).forEach((char) => {
      list.push({
        id: `task-char-${char.id}`,
        source: 'CHARACTER',
        title: `Character Production: Asset & Rig for ${char.name} (${char.role})`,
        description: `Archetype: ${char.archetype}\nMotivation: ${char.motivation}\nArc: ${char.arc}`,
        discipline: 'Art',
        type: 'FEATURE',
        priority: 'HIGH',
        selected: true,
      });
    });

    // 3. From Quests
    (narrative.quests || []).forEach((quest) => {
      (quest.objectives || []).forEach((obj, idx) => {
        list.push({
          id: `task-quest-${quest.id}-${idx}`,
          source: 'QUEST',
          title: `Quest Logic: ${obj} (${quest.act})`,
          description: `Part of ${quest.title}. Branch Type: ${quest.type}.\nContext: ${quest.description}`,
          discipline: 'Design',
          type: 'FEATURE',
          priority: 'MEDIUM',
          selected: true,
        });
      });
    });

    return list;
  }, [narrative]);

  const [candidates, setCandidates] = useState<CandidateTask[]>(initialCandidates);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)),
    );
  };

  const selectedCount = candidates.filter((c) => c.selected).length;

  const handleApprove = async () => {
    if (!token) {
      setError('Authentication token missing. Please sign in as the project founder.');
      return;
    }

    const selectedTasks = candidates.filter((c) => c.selected);
    if (selectedTasks.length === 0) {
      setError('Please select at least one narrative deliverable to approve.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        milestoneTitle: milestoneTitle.trim() || 'Narrative Production Milestone',
        milestoneDescription: milestoneDescription.trim() || undefined,
        tasks: selectedTasks.map((t) => ({
          tempId: t.id,
          title: t.title,
          description: t.description,
          type: t.type,
          priority: t.priority,
          discipline: t.discipline,
        })),
      };

      const result = await approveProductionPlan(projectId, payload, token);
      setSuccessResult(result);
      if (onTasksApproved) {
        onTasksApproved(result);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve narrative tasks.');
    } finally {
      setIsLoading(false);
    }
  };

  const sourceIcon: Record<CandidateTask['source'], React.ReactNode> = {
    SCENE: <Film className="h-3.5 w-3.5 text-amber-400" />,
    CHARACTER: <Users className="h-3.5 w-3.5 text-purple-400" />,
    QUEST: <GitBranch className="h-3.5 w-3.5 text-emerald-400" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-3xl rounded-3xl border border-[#363433] bg-[#141312] shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2b2a29] px-6 py-4 shrink-0 bg-[#141312]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-950/20 text-amber-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-headline text-lg font-bold text-[#ffffff]">
                Approve Narrative to Production
              </h2>
              <p className="text-xs font-mono text-[#8c887e]">
                Explicit founder approval required before creating official project milestones and tasks
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#363433] p-2 text-[#8c887e] hover:text-[#ffffff] hover:border-[#48473f] transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
        {/* Success Confirmation State */}
        {successResult ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-6 text-center space-y-4">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
            <div className="space-y-1">
              <h3 className="font-headline text-base font-bold text-[#ffffff]">
                Production Tasks Successfully Created!
              </h3>
              <p className="text-xs font-mono text-[#cac6bc]">
                Milestone &quot;{successResult.milestoneTitle}&quot; now tracks {successResult.taskCount} official production deliverables.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center max-h-36 overflow-y-auto pt-2">
              {successResult.tasks.map((t) => (
                <span
                  key={t.id}
                  className="rounded-lg border border-emerald-500/30 bg-[#141312] px-2.5 py-1 text-xs font-mono text-emerald-300"
                >
                  {t.taskCode}: {t.title}
                </span>
              ))}
            </div>

            <div className="pt-2">
              <Button variant="primary" size="sm" onClick={onClose} className="text-xs font-mono font-bold">
                Return to Narrative Studio
              </Button>
            </div>
          </div>
        ) : (
          /* Task Selection Form */
          <div className="space-y-5 overflow-y-auto max-h-[60vh] pr-1">
            {/* Target Milestone Inputs */}
            <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 space-y-3">
              <div>
                <label className="text-[10px] font-mono text-amber-300 uppercase font-semibold">
                  Target Production Milestone Title
                </label>
                <input
                  type="text"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  placeholder="e.g. Milestone 1: Narrative & Cinematic Alpha"
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-xs font-mono text-[#ffffff] focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#8c887e] uppercase">
                  Milestone Scope & Objectives
                </label>
                <textarea
                  rows={2}
                  value={milestoneDescription}
                  onChange={(e) => setMilestoneDescription(e.target.value)}
                  placeholder="Overview of production requirements..."
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-1.5 text-xs font-sans text-[#cac6bc] focus:outline-none"
                />
              </div>
            </div>

            {/* Candidate List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-300 font-semibold uppercase">
                  Select Deliverables to Author ({selectedCount} Selected)
                </span>
                <span className="text-[10px] text-[#8c887e]">
                  Creating drafts never auto-creates tasks
                </span>
              </div>

              <div className="space-y-2">
                {candidates.map((cand) => (
                  <div
                    key={cand.id}
                    onClick={() => toggleSelect(cand.id)}
                    className={`flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer transition-all ${
                      cand.selected
                        ? 'border-amber-500/50 bg-[#201f1e]'
                        : 'border-[#2b2a29] bg-[#141312] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <button type="button" className="mt-0.5 text-amber-400">
                      {cand.selected ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4 text-[#8c887e]" />
                      )}
                    </button>

                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 rounded-md border border-[#363433] bg-[#141312] px-1.5 py-0.5 text-[9px] font-mono uppercase text-[#cac6bc]">
                          {sourceIcon[cand.source]}
                          {cand.source}
                        </span>
                        <span className="font-headline text-xs font-bold text-[#ffffff] truncate">
                          {cand.title}
                        </span>
                      </div>
                      <p className="text-[11px] font-sans text-[#8c887e] line-clamp-1">
                        {cand.description}
                      </p>
                    </div>

                    <span className="rounded-full border border-[#48473f] bg-[#1c1b1a] px-2 py-0.5 text-[9px] font-mono text-amber-300">
                      {cand.discipline}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs font-mono text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
        </div>

        {/* Footer */}
        {!successResult && (
          <div className="flex items-center justify-between border-t border-[#2b2a29] px-6 py-4 shrink-0 bg-[#141312] flex-wrap gap-3">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs font-mono text-[#8c887e]">
              Cancel
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={
                isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#141312]" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#141312]" />
                )
              }
              onClick={handleApprove}
              disabled={isLoading || selectedCount === 0}
              className="text-xs font-mono font-bold"
            >
              {isLoading ? 'Creating Production Tasks...' : `Approve & Create ${selectedCount} Tasks`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
