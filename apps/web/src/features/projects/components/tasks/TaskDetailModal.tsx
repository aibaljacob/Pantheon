import React, { useState } from 'react';
import {
  X,
  Trash2,
  Edit3,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import type {
  MilestoneItem,
  ProjectTaskMember,
  TaskItem,
  TaskPriority,
  TaskStatus,
} from '../../types';

interface TaskDetailModalProps {
  task: TaskItem;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: (updatedTask: TaskItem) => void;
  onTaskDeleted: (taskId: string) => void;
  isFounderOrAdmin: boolean;
  canUpdate: boolean;
  members: ProjectTaskMember[];
  milestones: MilestoneItem[];
  onUpdateStatus: (taskId: string, status: TaskStatus) => Promise<TaskItem>;
  onUpdateAssignee: (taskId: string, assigneeId: string | null) => Promise<TaskItem>;
  onUpdateMilestone: (taskId: string, milestoneId: string | null) => Promise<TaskItem>;
  onUpdateDetails: (taskId: string, title: string, description: string, priority: TaskPriority) => Promise<TaskItem>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

const ALL_STATUSES: Array<{ value: TaskStatus; label: string }> = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DONE', label: 'Done' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'BACKLOG', label: 'Backlog' },
];

const ALL_PRIORITIES: Array<{ value: TaskPriority; label: string }> = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
  isFounderOrAdmin,
  canUpdate,
  members,
  milestones,
  onUpdateStatus,
  onUpdateAssignee,
  onUpdateMilestone,
  onUpdateDetails,
  onDeleteTask,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await onUpdateStatus(task.id, newStatus);
      onTaskUpdated(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update status.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssigneeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAssigneeId = e.target.value ? e.target.value : null;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await onUpdateAssignee(task.id, newAssigneeId);
      onTaskUpdated(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update assignee.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMilestoneChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMilestoneId = e.target.value ? e.target.value : null;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await onUpdateMilestone(task.id, newMilestoneId);
      onTaskUpdated(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update milestone.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      const updated = await onUpdateDetails(task.id, title.trim(), description.trim(), priority);
      onTaskUpdated(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${task.taskCode}? This action cannot be undone.`)) {
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      await onDeleteTask(task.id);
      onTaskDeleted(task.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete task.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#2b2a29] pb-4">
          <div className="flex items-center gap-3">
            <span className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-3 py-1 font-mono text-sm font-bold text-amber-300">
              {task.taskCode}
            </span>
            {!isEditing && (
              <h3 className="font-headline text-lg font-bold text-[#ffffff] leading-snug">
                {task.title}
              </h3>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canUpdate && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-xl border border-[#363433] bg-[#141312] p-2 text-[#8c887e] hover:text-[#ffffff] transition-colors"
                title="Edit task details"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}

            {isFounderOrAdmin && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-xl border border-red-900/30 bg-[#141312] p-2 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
                title="Delete task"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#363433] bg-[#141312] p-2 text-[#8c887e] hover:text-[#ffffff] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Attribute Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 text-xs font-mono">
          {/* Status Selector */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#8c887e]">Status</span>
            <select
              value={task.status}
              onChange={handleStatusChange}
              disabled={!canUpdate || isSaving}
              className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs text-[#e6e2df] focus:border-amber-400 focus:outline-none transition-colors"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Selector */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#8c887e]">Assignee</span>
            {isFounderOrAdmin ? (
              <select
                value={task.assigneeId || ''}
                onChange={handleAssigneeChange}
                disabled={isSaving}
                className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs text-[#e6e2df] focus:border-amber-400 focus:outline-none transition-colors"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.displayName} (@{m.username})
                  </option>
                ))}
              </select>
            ) : (
              <div className="py-1.5 text-[#cac6bc]">
                {task.assignee ? task.assignee.displayName : 'Unassigned'}
              </div>
            )}
          </div>

          {/* Milestone Selector */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#8c887e]">Milestone</span>
            {isFounderOrAdmin ? (
              <select
                value={task.milestoneId || ''}
                onChange={handleMilestoneChange}
                disabled={isSaving}
                className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs text-[#e6e2df] focus:border-amber-400 focus:outline-none transition-colors"
              >
                <option value="">No Milestone</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            ) : (
              <div className="py-1.5 text-[#cac6bc]">
                {task.milestone ? task.milestone.title : 'None'}
              </div>
            )}
          </div>
        </div>

        {/* Edit Form or View Body */}
        {isEditing ? (
          <form onSubmit={handleSaveDetails} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">
                Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-sm text-[#ffffff] focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-xs text-[#e6e2df] focus:border-amber-400 focus:outline-none"
              >
                {ALL_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label} Priority
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">
                Description & Notes
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-xs text-[#cac6bc] focus:border-amber-400 focus:outline-none"
                placeholder="Add implementation notes, expected behavior, or acceptance criteria..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">
                Description
              </span>
              {task.description ? (
                <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 text-xs leading-relaxed text-[#cac6bc] whitespace-pre-line font-sans">
                  {task.description}
                </div>
              ) : (
                <p className="text-xs font-mono text-[#8c887e] italic">
                  No description provided for this task.
                </p>
              )}
            </div>

            {/* Metadata Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2b2a29] pt-4 text-[11px] font-mono text-[#8c887e]">
              <div>
                Created {new Date(task.createdAt).toLocaleString()}
              </div>
              <div>
                Last Updated {new Date(task.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
