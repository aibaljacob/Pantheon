import React, { useState } from 'react';
import {
  X,
  Trash2,
  Edit3,
  AlertCircle,
  AlertOctagon,
  Calendar,
  Link2,
  Plus,
  Loader2,
  GitCommit,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { taskService } from '../../services/taskService';
import type {
  MilestoneItem,
  ProjectTaskMember,
  TaskCommitItem,
  TaskItem,
  TaskPriority,
  TaskStatus,
  TaskType,
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
  allProjectTasks?: TaskItem[];
  onUpdateStatus: (
    taskId: string,
    status: TaskStatus,
    blockedReason?: string | null,
  ) => Promise<TaskItem>;
  onUpdateAssignee: (
    taskId: string,
    assigneeId: string | null,
  ) => Promise<TaskItem>;
  onUpdateMilestone: (
    taskId: string,
    milestoneId: string | null,
  ) => Promise<TaskItem>;
  onUpdateDetails: (
    taskId: string,
    title: string,
    description: string,
    priority: TaskPriority,
    type?: TaskType,
    dueDate?: string | null,
    blockedReason?: string | null,
  ) => Promise<TaskItem>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onAddDependency?: (
    taskId: string,
    dependsOnTaskId: string,
  ) => Promise<TaskItem>;
  onRemoveDependency?: (
    taskId: string,
    dependsOnTaskId: string,
  ) => Promise<TaskItem>;
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

const ALL_TYPES: Array<{ value: TaskType; label: string }> = [
  { value: 'FEATURE', label: 'Feature' },
  { value: 'BUG', label: 'Bug' },
  { value: 'ART', label: 'Art' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'CODE', label: 'Code' },
  { value: 'DESIGN', label: 'Design' },
  { value: 'TEST', label: 'Test' },
  { value: 'OTHER', label: 'Other' },
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
  allProjectTasks = [],
  onUpdateStatus,
  onUpdateAssignee,
  onUpdateMilestone,
  onUpdateDetails,
  onDeleteTask,
  onAddDependency,
  onRemoveDependency,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [type, setType] = useState<TaskType>(task.type || 'FEATURE');
  const [dueDate, setDueDate] = useState<string>(
    task.dueDate ? task.dueDate.split('T')[0] : '',
  );
  const [blockedReason, setBlockedReason] = useState<string>(
    task.blockedReason || '',
  );

  const [selectedDepId, setSelectedDepId] = useState<string>('');
  const [isDepLoading, setIsDepLoading] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [commits, setCommits] = useState<TaskCommitItem[]>([]);
  const [loadedCommitsTaskId, setLoadedCommitsTaskId] = useState<string | null>(null);

  React.useEffect(() => {
    let ignore = false;
    if (isOpen && task.id) {
      taskService
        .getTaskCommits(task.projectId, task.id)
        .then((data) => {
          if (!ignore) {
            setCommits(data);
            setLoadedCommitsTaskId(task.id);
          }
        })
        .catch((err) => {
          if (!ignore) {
            console.error('Failed to load commits', err);
            setLoadedCommitsTaskId(task.id);
          }
        });
    }
    return () => {
      ignore = true;
    };
  }, [isOpen, task.id, task.projectId]);

  const isLoadingCommits = isOpen && Boolean(task.id) && loadedCommitsTaskId !== task.id;

  if (!isOpen) return null;

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newStatus = e.target.value as TaskStatus;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await onUpdateStatus(
        task.id,
        newStatus,
        newStatus === 'BLOCKED'
          ? blockedReason.trim() || task.blockedReason
          : null,
      );
      onTaskUpdated(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssigneeChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newAssigneeId = e.target.value ? e.target.value : null;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await onUpdateAssignee(task.id, newAssigneeId);
      onTaskUpdated(updated);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to update assignee.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleMilestoneChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newMilestoneId = e.target.value ? e.target.value : null;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await onUpdateMilestone(task.id, newMilestoneId);
      onTaskUpdated(updated);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to update milestone.',
      );
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
      const updated = await onUpdateDetails(
        task.id,
        title.trim(),
        description.trim(),
        priority,
        type,
        dueDate ? new Date(dueDate).toISOString() : null,
        blockedReason.trim() || null,
      );
      onTaskUpdated(updated);
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${task.taskCode}? This action cannot be undone.`,
      )
    ) {
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      await onDeleteTask(task.id);
      onTaskDeleted(task.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete task.');
      setIsDeleting(false);
    }
  };

  const handleAddDep = async () => {
    if (!selectedDepId || !onAddDependency) return;
    setIsDepLoading(true);
    setError(null);
    try {
      const updated = await onAddDependency(task.id, selectedDepId);
      onTaskUpdated(updated);
      setSelectedDepId('');
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to add dependency.',
      );
    } finally {
      setIsDepLoading(false);
    }
  };

  const handleRemoveDep = async (depTaskId: string) => {
    if (!onRemoveDependency) return;
    setIsDepLoading(true);
    setError(null);
    try {
      const updated = await onRemoveDependency(task.id, depTaskId);
      onTaskUpdated(updated);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to remove dependency.',
      );
    } finally {
      setIsDepLoading(false);
    }
  };

  const availablePrereqs = allProjectTasks.filter(
    (t) =>
      t.id !== task.id &&
      !(task.dependencies || []).some((d) => d.id === t.id),
  );

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'DONE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto text-[#e6e2df]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#2b2a29] pb-4">
          <div className="flex items-center gap-3">
            <span className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-3 py-1 font-mono text-sm font-bold text-amber-300">
              {task.taskCode}
            </span>
            <span className="rounded-md border border-[#48473f] bg-[#201f1e] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#cac6bc]">
              {task.type || 'FEATURE'}
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
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
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

        {/* Blocked State Banner */}
        {task.status === 'BLOCKED' && (
          <div className="rounded-2xl border border-red-900/60 bg-red-950/30 p-3.5 flex items-start gap-3">
            <AlertOctagon className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1 min-w-0">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-300">
                Task is Blocked
              </h4>
              <p className="text-xs text-red-200/90 font-mono">
                {task.blockedReason || 'No specific blocked reason provided.'}
              </p>
            </div>
          </div>
        )}

        {/* Quick Attribute Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 text-xs font-mono">
          {/* Status Selector */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#8c887e]">
              Status
            </span>
            <select
              value={task.status}
              onChange={handleStatusChange}
              disabled={!canUpdate || isSaving}
              className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-2.5 py-1.5 text-xs text-[#e6e2df] focus:border-amber-400 focus:outline-none transition-colors"
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
            <span className="text-[10px] uppercase tracking-wider text-[#8c887e]">
              Assignee
            </span>
            {isFounderOrAdmin ? (
              <select
                value={task.assigneeId || ''}
                onChange={handleAssigneeChange}
                disabled={isSaving}
                className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-2.5 py-1.5 text-xs text-[#e6e2df] focus:border-amber-400 focus:outline-none transition-colors"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.displayName} (@{m.username})
                  </option>
                ))}
              </select>
            ) : (
              <div className="py-1.5 text-[#cac6bc] truncate">
                {task.assignee ? task.assignee.displayName : 'Unassigned'}
              </div>
            )}
          </div>

          {/* Milestone Selector */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#8c887e]">
              Milestone
            </span>
            {isFounderOrAdmin ? (
              <select
                value={task.milestoneId || ''}
                onChange={handleMilestoneChange}
                disabled={isSaving}
                className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-2.5 py-1.5 text-xs text-[#e6e2df] focus:border-amber-400 focus:outline-none transition-colors"
              >
                <option value="">No Milestone</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            ) : (
              <div className="py-1.5 text-[#cac6bc] truncate">
                {task.milestone ? task.milestone.title : 'None'}
              </div>
            )}
          </div>

          {/* Due Date Indicator */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#8c887e]">
              Due Date
            </span>
            <div
              className={`py-1.5 text-xs font-mono flex items-center gap-1.5 truncate ${
                isOverdue ? 'text-red-300 font-bold' : 'text-[#cac6bc]'
              }`}
            >
              <Calendar className="h-3 w-3 text-amber-400/80 shrink-0" />
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString()
                : 'Not Set'}
            </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">
                  Task Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TaskType)}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-xs text-[#e6e2df] focus:border-amber-400 focus:outline-none"
                >
                  {ALL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
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

            {task.status === 'BLOCKED' && (
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase tracking-wider text-red-400">
                  Blocked Reason
                </label>
                <input
                  type="text"
                  value={blockedReason}
                  onChange={(e) => setBlockedReason(e.target.value)}
                  placeholder="Reason why this task is blocked..."
                  className="w-full rounded-xl border border-red-900/50 bg-[#141312] px-3 py-2 text-xs text-red-200 focus:border-red-400 focus:outline-none"
                />
              </div>
            )}

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
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
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

            {/* Dependencies & Blockers Section */}
            <div className="space-y-3 rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-amber-400" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#e6e2df]">
                  Task Dependencies
                </h4>
              </div>

              {/* Prerequisites (Depends on) */}
              <div className="space-y-2 pt-2 border-t border-[#201f1e]">
                <div className="text-[11px] font-mono text-[#8c887e] uppercase tracking-wider">
                  Prerequisites (Must be completed first)
                </div>

                {task.dependencies && task.dependencies.length > 0 ? (
                  <div className="space-y-1.5">
                    {task.dependencies.map((dep) => (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between rounded-xl border border-[#2b2a29] bg-[#1c1b1a] px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] font-bold text-amber-300 shrink-0">
                            {dep.taskCode}
                          </span>
                          <span className="text-[#cac6bc] truncate">
                            {dep.title}
                          </span>
                          <span className="rounded-full border border-[#363433] bg-[#141312] px-2 py-0.5 text-[9px] font-mono text-[#8c887e]">
                            {dep.status}
                          </span>
                        </div>

                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDep(dep.id)}
                            disabled={isDepLoading}
                            className="text-[#8c887e] hover:text-red-400 transition-colors p-1"
                            title="Remove dependency"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] font-mono text-[#8c887e] italic">
                    No prerequisites. This task can be started anytime.
                  </p>
                )}

                {canUpdate && availablePrereqs.length > 0 && (
                  <div className="flex items-center gap-2 pt-2">
                    <select
                      value={selectedDepId}
                      onChange={(e) => setSelectedDepId(e.target.value)}
                      disabled={isDepLoading}
                      className="flex-1 rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs text-[#e6e2df] focus:border-amber-400 focus:outline-none"
                    >
                      <option value="">Select a task to depend on...</option>
                      {availablePrereqs.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.taskCode}: {t.title}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleAddDep}
                      disabled={!selectedDepId || isDepLoading}
                      icon={<Plus className="h-3.5 w-3.5" />}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>

              {/* Dependents (Blocks) */}
              <div className="space-y-2 pt-2 border-t border-[#201f1e]">
                <div className="text-[11px] font-mono text-[#8c887e] uppercase tracking-wider">
                  Dependents (Tasks waiting on this task)
                </div>

                {task.dependents && task.dependents.length > 0 ? (
                  <div className="space-y-1.5">
                    {task.dependents.map((dep) => (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between rounded-xl border border-[#2b2a29] bg-[#1c1b1a] px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] font-bold text-amber-300 shrink-0">
                            {dep.taskCode}
                          </span>
                          <span className="text-[#cac6bc] truncate">
                            {dep.title}
                          </span>
                          <span className="rounded-full border border-[#363433] bg-[#141312] px-2 py-0.5 text-[9px] font-mono text-[#8c887e]">
                            {dep.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] font-mono text-[#8c887e] italic">
                    No other tasks depend on this task.
                  </p>
                )}
              </div>
            </div>

            {/* Commits Section */}
            <div className="space-y-3 pt-4 border-t border-[#2b2a29]">
              <div className="flex items-center gap-2">
                <GitCommit className="h-4 w-4 text-[#8c887e]" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">
                  Linked Commits
                </span>
              </div>

              {isLoadingCommits ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-[#8c887e]" />
                </div>
              ) : commits.length > 0 ? (
                <div className="space-y-2">
                  {commits.map((commit) => (
                    <div
                      key={commit.id}
                      className="flex flex-col gap-1 rounded-xl border border-[#2b2a29] bg-[#141312] p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {commit.author?.avatarUrl ? (
                            <img
                              src={commit.author.avatarUrl}
                              alt={commit.authorName}
                              className="h-5 w-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-[#363433] flex items-center justify-center text-[9px] text-[#e6e2df]">
                              {commit.authorName.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs font-medium text-[#e6e2df]">
                            {commit.authorName}
                          </span>
                          <span className="text-[10px] text-[#8c887e] font-mono">
                            {commit.commitHash.substring(0, 7)}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#8c887e]">
                          {new Date(commit.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#cac6bc] pl-7 whitespace-pre-wrap">
                        {commit.commitMsg}
                      </p>
                      {commit.branchName && (
                        <div className="pl-7 mt-1">
                          <span className="inline-flex items-center rounded bg-[#201f1e] px-1.5 py-0.5 text-[10px] font-mono text-[#8c887e]">
                            {commit.branchName}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-[#8c887e] italic text-center py-4 bg-[#141312] rounded-xl border border-[#2b2a29] border-dashed">
                  No commits linked to this task.
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
