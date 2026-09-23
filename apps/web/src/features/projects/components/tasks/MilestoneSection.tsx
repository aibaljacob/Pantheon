import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Flag,
  Plus,
  Trash2,
  Filter,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import type { MilestoneItem, UpdateMilestoneInput } from '../../types';

interface MilestoneSectionProps {
  milestones: MilestoneItem[];
  selectedMilestoneId?: string;
  onSelectMilestone: (milestoneId?: string) => void;
  onOpenCreateMilestone: () => void;
  onUpdateMilestone: (milestoneId: string, input: UpdateMilestoneInput) => Promise<MilestoneItem>;
  onDeleteMilestone: (milestoneId: string) => Promise<void>;
  isFounderOrAdmin: boolean;
}

export const MilestoneSection: React.FC<MilestoneSectionProps> = ({
  milestones,
  selectedMilestoneId,
  onSelectMilestone,
  onOpenCreateMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  isFounderOrAdmin,
}) => {
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCompleted, setEditCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (m: MilestoneItem) => {
    setEditingMilestoneId(m.id);
    setEditTitle(m.title);
    setEditDescription(m.description || '');
    setEditCompleted(m.isCompleted);
  };

  const handleSaveEdit = async (milestoneId: string) => {
    if (!editTitle.trim()) return;
    setIsSaving(true);
    try {
      await onUpdateMilestone(milestoneId, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        isCompleted: editCompleted,
      });
      setEditingMilestoneId(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (milestone: MilestoneItem) => {
    if (
      !window.confirm(
        `Are you sure you want to delete milestone "${milestone.title}"? Associated tasks will be unlinked, not deleted.`,
      )
    ) {
      return;
    }
    await onDeleteMilestone(milestone.id);
    if (selectedMilestoneId === milestone.id) {
      onSelectMilestone(undefined);
    }
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3 text-xs">
        <div className="flex items-center gap-2 text-[#8c887e]">
          <Flag className="h-3.5 w-3.5 text-amber-400" />
          <span>Production Milestones ({milestones.length})</span>
          {selectedMilestoneId && (
            <button
              type="button"
              onClick={() => onSelectMilestone(undefined)}
              className="ml-2 text-[11px] text-amber-400 hover:text-amber-300 underline"
            >
              Clear Filter
            </button>
          )}
        </div>

        {isFounderOrAdmin && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenCreateMilestone}
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            New Milestone
          </Button>
        )}
      </div>

      {milestones.length === 0 ? (
        <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-8 text-center text-xs text-[#8c887e]">
          No milestones defined yet. Plan major production goals to track sprint velocity.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {milestones.map((m) => {
            const isSelected = selectedMilestoneId === m.id;
            const isEditingThis = editingMilestoneId === m.id;

            return (
              <div
                key={m.id}
                className={`rounded-3xl border p-5 transition-all space-y-4 ${
                  isSelected
                    ? 'border-amber-400/80 bg-[#201f1e] shadow-lg shadow-amber-950/20'
                    : 'border-[#363433] bg-[#1c1b1a] hover:border-[#48473f]'
                }`}
              >
                {isEditingThis ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-1.5 text-xs text-[#ffffff]"
                    />
                    <textarea
                      rows={2}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-1.5 text-xs text-[#cac6bc]"
                      placeholder="Description"
                    />
                    <label className="flex items-center gap-2 text-xs text-[#e6e2df]">
                      <input
                        type="checkbox"
                        checked={editCompleted}
                        onChange={(e) => setEditCompleted(e.target.checked)}
                      />
                      Mark as Completed
                    </label>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingMilestoneId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isSaving}
                        onClick={() => handleSaveEdit(m.id)}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-headline text-base font-bold text-[#ffffff]">
                            {m.title}
                          </h4>
                          {m.isCompleted ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" /> Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-950/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                              <Clock className="h-3 w-3" /> In Progress
                            </span>
                          )}
                        </div>

                        {m.description && (
                          <p className="text-xs text-[#cac6bc] leading-relaxed font-sans line-clamp-2">
                            {m.description}
                          </p>
                        )}
                      </div>

                      {isFounderOrAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEdit(m)}
                            className="rounded-lg border border-[#363433] bg-[#141312] p-1.5 text-[#8c887e] hover:text-[#ffffff]"
                            title="Edit Milestone"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(m)}
                            className="rounded-lg border border-red-950/40 bg-[#141312] p-1.5 text-red-400 hover:text-red-300"
                            title="Delete Milestone"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar & Metrics */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-[#8c887e]">
                        <span>
                          {m.completedTasks} / {m.totalTasks} tasks complete
                        </span>
                        <span className="font-bold text-[#e6e2df]">
                          {m.progressPercentage}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#141312] border border-[#2b2a29]">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-300"
                          style={{ width: `${m.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#2b2a29] text-[11px] text-[#8c887e]">
                      <div className="flex items-center gap-1">
                        {m.dueDate ? (
                          <>
                            <Calendar className="h-3 w-3 text-[#cac6bc]" />
                            <span>Due {new Date(m.dueDate).toLocaleDateString()}</span>
                          </>
                        ) : (
                          <span>No due date</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onSelectMilestone(isSelected ? undefined : m.id)
                        }
                        className={`inline-flex items-center gap-1 font-bold transition-colors ${
                          isSelected
                            ? 'text-amber-300'
                            : 'text-[#e6e2df] hover:text-amber-200'
                        }`}
                      >
                        <Filter className="h-3 w-3" />
                        <span>{isSelected ? 'Showing Tasks' : 'Filter Tasks'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
