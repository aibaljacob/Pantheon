import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import type {
  CreateTaskInput,
  MilestoneItem,
  ProjectTaskMember,
  TaskItem,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '../../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: CreateTaskInput) => Promise<TaskItem>;
  members: ProjectTaskMember[];
  milestones: MilestoneItem[];
  defaultMilestoneId?: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  members,
  milestones,
  defaultMilestoneId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('FEATURE');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [dueDate, setDueDate] = useState<string>('');
  const [blockedReason, setBlockedReason] = useState<string>('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [milestoneId, setMilestoneId] = useState<string>(defaultMilestoneId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        blockedReason:
          status === 'BLOCKED' && blockedReason.trim()
            ? blockedReason.trim()
            : undefined,
        assigneeId: assigneeId || undefined,
        milestoneId: milestoneId || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
          <h3 className="font-headline text-lg font-bold text-[#ffffff]">
            Create New Task
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#363433] bg-[#141312] p-1.5 text-[#8c887e] hover:text-[#ffffff] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-2.5 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-[#8c887e]">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement character dash mechanic"
              className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-xs text-[#ffffff] focus:border-amber-400 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-[#8c887e]">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide implementation details, dependencies, or acceptance criteria..."
              className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-xs text-[#cac6bc] focus:border-amber-400 focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-[#8c887e]">
                Task Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-xs text-[#e6e2df] focus:border-amber-400 focus:outline-none"
              >
                <option value="FEATURE">Feature</option>
                <option value="BUG">Bug</option>
                <option value="ART">Art</option>
                <option value="AUDIO">Audio</option>
                <option value="CODE">Code</option>
                <option value="DESIGN">Design</option>
                <option value="TEST">Test</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-[#8c887e]">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-xs text-[#e6e2df] focus:border-amber-400 focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-[#8c887e]">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-xs text-[#e6e2df] focus:border-amber-400 focus:outline-none"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="BLOCKED">Blocked</option>
                <option value="BACKLOG">Backlog</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-[#8c887e]">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-xs text-[#e6e2df] focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {status === 'BLOCKED' && (
            <div className="space-y-1 animate-fadeIn">
              <label className="text-[10px] uppercase tracking-wider text-red-400 font-semibold">
                Blocked Reason
              </label>
              <input
                type="text"
                value={blockedReason}
                onChange={(e) => setBlockedReason(e.target.value)}
                placeholder="Why is this task blocked? (e.g. waiting for asset approval)"
                className="w-full rounded-xl border border-red-900/50 bg-[#141312] px-3 py-2 text-xs text-red-200 focus:border-red-400 focus:outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-[#8c887e]">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-xs text-[#e6e2df] focus:border-amber-400 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.displayName} (@{m.username})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-[#8c887e]">
                Milestone
              </label>
              <select
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-xs text-[#e6e2df] focus:border-amber-400 focus:outline-none"
              >
                <option value="">No Milestone</option>
                {milestones.map((ms) => (
                  <option key={ms.id} value={ms.id}>
                    {ms.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2b2a29]">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
