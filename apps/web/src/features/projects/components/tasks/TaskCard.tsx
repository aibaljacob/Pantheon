import React from 'react';
import {
  Flag,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertOctagon,
  Circle,
  HelpCircle,
  Calendar,
  Link2,
} from 'lucide-react';
import type { TaskItem, TaskPriority, TaskStatus, TaskType } from '../../types';

interface TaskCardProps {
  task: TaskItem;
  onClick: (task: TaskItem) => void;
}

const TYPE_CONFIG: Record<
  TaskType,
  { label: string; badgeClass: string }
> = {
  FEATURE: {
    label: 'Feature',
    badgeClass: 'border-[#48473f] bg-[#201f1e] text-[#e6e2df]',
  },
  BUG: {
    label: 'Bug',
    badgeClass: 'border-red-900/40 bg-red-950/20 text-red-300',
  },
  ART: {
    label: 'Art',
    badgeClass: 'border-[#4c4941] bg-[#2b2a29] text-[#cac6bc]',
  },
  AUDIO: {
    label: 'Audio',
    badgeClass: 'border-[#48473f] bg-[#1c1b1a] text-[#cac6bc]',
  },
  CODE: {
    label: 'Code',
    badgeClass: 'border-[#59554b] bg-[#201f1e] text-amber-200/90',
  },
  DESIGN: {
    label: 'Design',
    badgeClass: 'border-[#4c4941] bg-[#262422] text-[#e6e2df]',
  },
  TEST: {
    label: 'Test',
    badgeClass: 'border-[#363433] bg-[#1c1b1a] text-[#cac6bc]',
  },
  OTHER: {
    label: 'Other',
    badgeClass: 'border-[#363433] bg-[#141312] text-[#8c887e]',
  },
};

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; badgeClass: string }
> = {
  LOW: {
    label: 'Low',
    badgeClass: 'border-[#48473f] bg-[#201f1e] text-[#cac6bc]',
  },
  MEDIUM: {
    label: 'Medium',
    badgeClass: 'border-amber-900/40 bg-amber-950/20 text-amber-300',
  },
  HIGH: {
    label: 'High',
    badgeClass: 'border-orange-800/40 bg-orange-950/30 text-orange-300',
  },
  CRITICAL: {
    label: 'Critical',
    badgeClass: 'border-red-800/50 bg-red-950/40 text-red-300 font-bold',
  },
};

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; icon: React.ReactNode; badgeClass: string }
> = {
  BACKLOG: {
    label: 'Backlog',
    icon: <Circle className="h-3 w-3 text-[#8c887e]" />,
    badgeClass: 'border-[#363433] bg-[#141312] text-[#8c887e]',
  },
  TODO: {
    label: 'To Do',
    icon: <Circle className="h-3 w-3 text-amber-400/70" />,
    badgeClass: 'border-[#48473f] bg-[#201f1e] text-[#cac6bc]',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: <Clock className="h-3 w-3 text-amber-400" />,
    badgeClass: 'border-amber-500/40 bg-amber-950/30 text-amber-300',
  },
  IN_REVIEW: {
    label: 'In Review',
    icon: <AlertCircle className="h-3 w-3 text-sky-400" />,
    badgeClass: 'border-sky-500/40 bg-sky-950/30 text-sky-300',
  },
  BLOCKED: {
    label: 'Blocked',
    icon: <AlertOctagon className="h-3 w-3 text-red-400" />,
    badgeClass: 'border-red-500/40 bg-red-950/30 text-red-300',
  },
  DONE: {
    label: 'Done',
    icon: <CheckCircle2 className="h-3 w-3 text-emerald-400" />,
    badgeClass: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300',
  },
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const statusInfo = STATUS_CONFIG[task.status] || {
    label: task.status,
    icon: <HelpCircle className="h-3 w-3" />,
    badgeClass: 'border-[#363433] bg-[#141312] text-[#8c887e]',
  };

  const priorityInfo = PRIORITY_CONFIG[task.priority] || {
    label: task.priority,
    badgeClass: 'border-[#363433] text-[#8c887e]',
  };

  const typeInfo = (task.type && TYPE_CONFIG[task.type]) || TYPE_CONFIG.OTHER;

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'DONE';

  return (
    <div
      onClick={() => onClick(task)}
      className="group flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 transition-all duration-200 hover:border-[#48473f] hover:bg-[#201f1e] cursor-pointer"
    >
      <div className="flex items-start md:items-center gap-3 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 shrink-0">
          <span className="shrink-0 rounded-lg border border-[#363433] bg-[#141312] px-2 py-1 font-mono text-[11px] font-bold tracking-wider text-amber-300">
            {task.taskCode}
          </span>
          <span
            className={`shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider font-semibold ${typeInfo.badgeClass}`}
          >
            {typeInfo.label}
          </span>
        </div>

        <div className="min-w-0 space-y-1">
          <h4 className="text-sm font-semibold text-[#ffffff] group-hover:text-amber-100 transition-colors truncate">
            {task.title}
          </h4>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[#8c887e]">
            {task.milestone && (
              <span className="flex items-center gap-1 rounded-md border border-[#363433] bg-[#141312] px-2 py-0.5 text-[10px] font-mono text-[#cac6bc]">
                <Flag className="h-2.5 w-2.5 text-amber-400/80" />
                {task.milestone.title}
              </span>
            )}

            {task.dueDate && (
              <span
                className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-mono ${
                  isOverdue
                    ? 'border-red-800/50 bg-red-950/30 text-red-300'
                    : 'border-[#363433] bg-[#141312] text-[#cac6bc]'
                }`}
              >
                <Calendar className="h-2.5 w-2.5 text-amber-400/80" />
                Due {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}

            {task.dependencies && task.dependencies.length > 0 && (
              <span
                className="flex items-center gap-1 rounded-md border border-[#363433] bg-[#141312] px-2 py-0.5 text-[10px] font-mono text-[#cac6bc]"
                title={`Depends on ${task.dependencies.map((d) => d.taskCode).join(', ')}`}
              >
                <Link2 className="h-2.5 w-2.5 text-amber-400/80" />
                {task.dependencies.length}{' '}
                {task.dependencies.length === 1 ? 'prereq' : 'prereqs'}
              </span>
            )}

            {task.status === 'BLOCKED' && task.blockedReason && (
              <span
                className="flex items-center gap-1 rounded-md border border-red-900/40 bg-red-950/20 px-2 py-0.5 text-[10px] font-mono text-red-300 truncate max-w-[220px]"
                title={task.blockedReason}
              >
                <AlertOctagon className="h-2.5 w-2.5 text-red-400 shrink-0" />
                <span className="truncate">{task.blockedReason}</span>
              </span>
            )}

            <span className="text-[10px] font-mono text-[#8c887e]">
              Updated {new Date(task.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#2b2a29]">
        {/* Status Badge */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono font-medium ${statusInfo.badgeClass}`}
        >
          {statusInfo.icon}
          {statusInfo.label}
        </span>

        {/* Priority Badge */}
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${priorityInfo.badgeClass}`}
        >
          {priorityInfo.label}
        </span>

        {/* Assignee Avatar / Name */}
        <div className="flex items-center gap-1.5 min-w-[100px] justify-end">
          {task.assignee ? (
            <>
              {task.assignee.avatarUrl ? (
                <img
                  src={task.assignee.avatarUrl}
                  alt={task.assignee.displayName}
                  className="h-6 w-6 rounded-full object-cover border border-[#48473f]"
                  title={task.assignee.displayName}
                />
              ) : (
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-[#201f1e] border border-[#48473f] text-[10px] font-bold text-[#e6e2df]"
                  title={task.assignee.displayName}
                >
                  {task.assignee.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-mono text-[#cac6bc] truncate max-w-[80px]">
                {task.assignee.displayName}
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-mono text-[#8c887e]">
              <User className="h-3 w-3" />
              Unassigned
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
