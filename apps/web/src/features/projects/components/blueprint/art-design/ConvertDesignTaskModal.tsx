import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, X, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../../../../../components/ui/Button';
import type { ArtProposalItem, DesignAssetItem, TaskPriority, TaskType } from '../../../types';
import { convertProposalToTask, convertAssetToTask } from '../../../services/artDesignService';

interface ConvertDesignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  source: { type: 'PROPOSAL'; item: ArtProposalItem } | { type: 'ASSET'; item: DesignAssetItem };
  token?: string;
  onSuccess: (taskId: string, taskCode: string) => void;
}

export const ConvertDesignTaskModal: React.FC<ConvertDesignTaskModalProps> = ({
  isOpen,
  onClose,
  projectId,
  source,
  token,
  onSuccess,
}) => {
  const isProposal = source.type === 'PROPOSAL';
  const item = source.item;

  const defaultTitle = isProposal
    ? `[Art] ${item.title}`
    : `[Asset] ${item.title}`;

  const defaultDesc = isProposal
    ? `${(item as ArtProposalItem).rationale}\n\n**Design Notes:**\n${(item as ArtProposalItem).designNotes || 'None'}\n\n**Source Art Proposal:** ${item.title} (ID: ${item.id})`
    : `${(item as DesignAssetItem).description || 'Production reference asset.'}\n\n**File Link:** ${(item as DesignAssetItem).fileUrl}\n**Category:** ${(item as DesignAssetItem).category}\n**Source / Creator:** ${(item as DesignAssetItem).creatorDetails || (item as DesignAssetItem).sourceDetails || 'Internal Studio'}\n\n**Source Asset ID:** ${item.id}`;

  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDesc);
  const [taskType, setTaskType] = useState<TaskType>('ART');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!token) {
      setError('You must be signed in to create a production task.');
      return;
    }
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isProposal) {
        const res = await convertProposalToTask(
          projectId,
          item.id,
          {
            title: title.trim(),
            description: description.trim(),
            type: taskType,
            priority,
          },
          token,
        );
        onSuccess(res.taskId, res.taskCode);
      } else {
        const res = await convertAssetToTask(
          projectId,
          item.id,
          {
            title: title.trim(),
            description: description.trim(),
            type: taskType,
            priority,
          },
          token,
        );
        onSuccess(res.taskId, res.taskCode);
      }
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to convert approved design to production task.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border border-[#363433] bg-[#141312] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2b2a29] px-6 py-5 shrink-0 bg-[#171615]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-[#ffffff]">
                Create Production Task
              </h3>
              <p className="text-xs font-mono text-[#8c887e]">
                Convert approved design into a trackable production task
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8c887e] hover:bg-[#201f1e] hover:text-[#e6e2df]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs font-mono text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Source info pill */}
          <div className="rounded-xl border border-[#2b2a29] bg-[#1c1b1a] p-3 text-xs font-mono text-[#cac6bc] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-amber-400">
                Source:
              </span>
              <span className="text-[#ffffff] font-semibold">{item.title}</span>
            </div>
            <span className="text-[10px] text-[#8c887e]">
              {isProposal ? 'Approved Art Proposal' : 'Approved Design Asset'}
            </span>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-[#8c887e] mb-1">
                Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2.5 text-sm font-sans text-[#ffffff] focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#8c887e] mb-1">
                  Discipline Type
                </label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value as TaskType)}
                  className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-2 text-xs font-mono text-[#ffffff] focus:border-amber-400 focus:outline-none"
                >
                  <option value="ART">ART (Visual & Concept)</option>
                  <option value="DESIGN">DESIGN (System & Level)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#8c887e] mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-2 text-xs font-mono text-[#ffffff] focus:border-amber-400 focus:outline-none"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8c887e] mb-1">
                Description & Design Specifications
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] p-3 text-xs font-mono text-[#cac6bc] focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#2b2a29] px-6 py-4 shrink-0 bg-[#141312]">
          <p className="text-[11px] font-mono text-[#8c887e]">
            Links back to this approved design will be preserved.
          </p>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={
                isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#141312]" />
                ) : (
                  <ArrowRight className="h-4 w-4 text-[#141312]" />
                )
              }
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Task...' : 'Confirm & Create Task'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
