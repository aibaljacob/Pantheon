import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Flag,
  Loader2,
  AlertCircle,
  FolderKanban,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { taskService } from '../../services/taskService';
import type {
  CreateMilestoneInput,
  CreateTaskInput,
  MilestoneItem,
  ProjectTaskMember,
  TaskItem,
  TaskPriority,
  TaskStatus,
  UpdateMilestoneInput,
} from '../../types';
import { TaskCard } from './TaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import { CreateMilestoneModal } from './CreateMilestoneModal';
import { TaskDetailModal } from './TaskDetailModal';
import { MilestoneSection } from './MilestoneSection';

interface TasksTabProps {
  projectId: string;
  projectName: string;
  isFounder: boolean;
  members: ProjectTaskMember[];
  currentUser: {
    id: string;
    username: string;
    displayName?: string;
    fullName?: string;
    role?: string;
  } | null;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  projectId,
  projectName: _projectName,
  isFounder,
  members,
  currentUser,
}) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | undefined>(undefined);

  // Modals
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState<boolean>(false);
  const [isCreateMilestoneOpen, setIsCreateMilestoneOpen] = useState<boolean>(false);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);

  const isFounderOrAdmin = isFounder || currentUser?.role === 'Administrator';
  const isMember = isFounderOrAdmin || members.some((m) => m.userId === currentUser?.id);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedTasks, fetchedMilestones] = await Promise.all([
        taskService.getTasks(projectId, {}),
        taskService.getMilestones(projectId),
      ]);
      setTasks(fetchedTasks);
      setMilestones(fetchedMilestones);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load task board.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Task Mutators
  const handleCreateTask = async (input: CreateTaskInput): Promise<TaskItem> => {
    const created = await taskService.createTask(projectId, input);
    await loadData();
    return created;
  };

  const handleUpdateStatus = async (taskId: string, status: TaskStatus): Promise<TaskItem> => {
    const updated = await taskService.updateTaskStatus(projectId, taskId, status);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    if (activeTask && activeTask.id === taskId) setActiveTask(updated);
    taskService.getMilestones(projectId).then(setMilestones).catch(() => {});
    return updated;
  };

  const handleUpdateAssignee = async (
    taskId: string,
    assigneeId: string | null,
  ): Promise<TaskItem> => {
    const updated = await taskService.updateTaskAssignee(projectId, taskId, assigneeId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    if (activeTask && activeTask.id === taskId) setActiveTask(updated);
    return updated;
  };

  const handleUpdateMilestoneForTask = async (
    taskId: string,
    milestoneId: string | null,
  ): Promise<TaskItem> => {
    const updated = await taskService.updateTaskMilestone(projectId, taskId, milestoneId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    if (activeTask && activeTask.id === taskId) setActiveTask(updated);
    taskService.getMilestones(projectId).then(setMilestones).catch(() => {});
    return updated;
  };

  const handleUpdateDetails = async (
    taskId: string,
    title: string,
    description: string,
    priority: TaskPriority,
  ): Promise<TaskItem> => {
    const updated = await taskService.updateTask(projectId, taskId, {
      title,
      description: description || undefined,
      priority,
    });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    if (activeTask && activeTask.id === taskId) setActiveTask(updated);
    return updated;
  };

  const handleDeleteTask = async (taskId: string): Promise<void> => {
    await taskService.deleteTask(projectId, taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (activeTask && activeTask.id === taskId) setActiveTask(null);
    taskService.getMilestones(projectId).then(setMilestones).catch(() => {});
  };

  // Milestone Mutators
  const handleCreateMilestone = async (input: CreateMilestoneInput): Promise<MilestoneItem> => {
    const created = await taskService.createMilestone(projectId, input);
    await loadData();
    return created;
  };

  const handleUpdateMilestone = async (
    milestoneId: string,
    input: UpdateMilestoneInput,
  ): Promise<MilestoneItem> => {
    const updated = await taskService.updateMilestone(projectId, milestoneId, input);
    setMilestones((prev) => prev.map((m) => (m.id === milestoneId ? updated : m)));
    return updated;
  };

  const handleDeleteMilestone = async (milestoneId: string): Promise<void> => {
    await taskService.deleteMilestone(projectId, milestoneId);
    setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
    if (selectedMilestoneId === milestoneId) setSelectedMilestoneId(undefined);
    await loadData();
  };

  // Filter computation
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedMilestoneId && t.milestoneId !== selectedMilestoneId) return false;
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (assigneeFilter === 'ME') {
        if (!currentUser || t.assigneeId !== currentUser.id) return false;
      } else if (assigneeFilter !== 'ALL') {
        if (t.assigneeId !== assigneeFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q) ?? false;
        const matchesNumber = t.taskNumber.toString().includes(q) || t.taskCode.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesNumber) return false;
      }
      return true;
    });
  }, [tasks, selectedMilestoneId, statusFilter, priorityFilter, assigneeFilter, searchQuery, currentUser]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-950/20 text-amber-400">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline text-xl font-bold text-[#ffffff]">
                Tasks & Milestones
              </h2>
              <span className="rounded-full border border-[#48473f] bg-[#201f1e] px-2.5 py-0.5 text-xs font-mono font-semibold text-[#cac6bc]">
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            <p className="text-xs font-mono text-[#8c887e]">
              Coordinate production deliverables, track sprints, and hit release milestones.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {isFounderOrAdmin && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Flag className="h-4 w-4" />}
              onClick={() => setIsCreateMilestoneOpen(true)}
            >
              Add Milestone
            </Button>
          )}

          {isMember && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setIsCreateTaskOpen(true)}
            >
              New Task
            </Button>
          )}
        </div>
      </div>

      {/* Milestones Roadmaps Section */}
      <MilestoneSection
        milestones={milestones}
        selectedMilestoneId={selectedMilestoneId}
        onSelectMilestone={(mId) => setSelectedMilestoneId(mId)}
        onOpenCreateMilestone={() => setIsCreateMilestoneOpen(true)}
        onUpdateMilestone={handleUpdateMilestone}
        onDeleteMilestone={handleDeleteMilestone}
        isFounderOrAdmin={isFounderOrAdmin}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c887e]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, description or TASK-#"
            className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] pl-10 pr-4 py-2 text-xs font-mono text-[#ffffff] placeholder-[#8c887e] focus:border-[#cac6bc] focus:outline-none"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'ALL')}
            className="rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-2 text-xs font-mono text-[#e6e2df] focus:border-[#cac6bc] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="BACKLOG">Backlog</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
            <option value="BLOCKED">Blocked</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'ALL')}
            className="rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-2 text-xs font-mono text-[#e6e2df] focus:border-[#cac6bc] focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-2 text-xs font-mono text-[#e6e2df] focus:border-[#cac6bc] focus:outline-none"
          >
            <option value="ALL">All Assignees</option>
            {currentUser && <option value="ME">Assigned to Me</option>}
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.displayName}
              </option>
            ))}
          </select>

          {(searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || assigneeFilter !== 'ALL' || selectedMilestoneId) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
                setAssigneeFilter('ALL');
                setSelectedMilestoneId(undefined);
              }}
              className="text-xs font-mono text-amber-400 hover:text-amber-300 px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Task List / Grid Display */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#8c887e]" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-950/20 p-5 text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-xs font-mono">{error}</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-3xl border border-[#2b2a29] bg-[#1c1b1a] p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#363433] bg-[#141312] text-[#8c887e]">
            <FolderKanban className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold text-[#ffffff]">No Tasks Found</h3>
            <p className="mt-1 text-xs font-mono text-[#8c887e]">
              {tasks.length === 0
                ? 'No production tasks have been logged yet for this game project.'
                : 'No tasks match the active filters or search terms.'}
            </p>
          </div>
          {isMember && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setIsCreateTaskOpen(true)}
            >
              Create First Task
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={(t) => setActiveTask(t)} />
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onCreate={handleCreateTask}
        members={members}
        milestones={milestones}
        defaultMilestoneId={selectedMilestoneId}
      />

      {/* Create Milestone Modal */}
      <CreateMilestoneModal
        isOpen={isCreateMilestoneOpen}
        onClose={() => setIsCreateMilestoneOpen(false)}
        onCreate={handleCreateMilestone}
      />

      {/* Task Detail Modal */}
      {activeTask && (
        <TaskDetailModal
          task={activeTask}
          isOpen={!!activeTask}
          onClose={() => setActiveTask(null)}
          onTaskUpdated={(updated) => {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            setActiveTask(updated);
          }}
          onTaskDeleted={(taskId) => {
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
            setActiveTask(null);
          }}
          isFounderOrAdmin={isFounderOrAdmin}
          canUpdate={isMember}
          members={members}
          milestones={milestones}
          onUpdateStatus={handleUpdateStatus}
          onUpdateAssignee={handleUpdateAssignee}
          onUpdateMilestone={handleUpdateMilestoneForTask}
          onUpdateDetails={handleUpdateDetails}
          onDeleteTask={handleDeleteTask}
        />
      )}
    </div>
  );
};
