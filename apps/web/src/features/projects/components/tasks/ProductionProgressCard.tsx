import React, { useEffect, useState } from 'react';
import { CheckSquare, Flag, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { taskService } from '../../services/taskService';
import type { MilestoneItem, TaskItem } from '../../types';

interface ProductionProgressCardProps {
  projectId: string;
  accessToken?: string | null;
  onNavigateTasks: () => void;
}

export const ProductionProgressCard: React.FC<ProductionProgressCardProps> = ({
  projectId,
  accessToken,
  onNavigateTasks,
}) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMetrics() {
      setIsLoading(true);
      setError(null);
      try {
        const [taskData, milestoneData] = await Promise.all([
          taskService.getTasks(projectId, {}),
          taskService.getMilestones(projectId),
        ]);
        if (isMounted) {
          setTasks(taskData);
          setMilestones(milestoneData);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load progress';
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (projectId) {
      loadMetrics();
    }

    return () => {
      isMounted = false;
    };
  }, [projectId, accessToken]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW').length;
  const todoTasks = tasks.filter((t) => t.status === 'TODO' || t.status === 'BACKLOG').length;

  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const activeMilestone = milestones.find((m) => !m.isCompleted);

  return (
    <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-amber-400" />
          <h3 className="font-headline text-base font-bold text-[#ffffff]">
            Production Velocity
          </h3>
        </div>
        <button
          type="button"
          onClick={onNavigateTasks}
          className="flex items-center gap-1 text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors"
        >
          <span>Tasks Tab</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[#8c887e]" />
        </div>
      ) : error ? (
        <p className="text-xs font-mono text-[#8c887e]">Production telemetry offline.</p>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-[#cac6bc]">Overall Sprint Completion</span>
              <span className="font-bold text-[#e6e2df]">{overallProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#201f1e] border border-[#2b2a29]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-2.5">
              <p className="font-mono text-lg font-bold text-[#ffffff]">{todoTasks}</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#8c887e]">To Do</p>
            </div>
            <div className="rounded-xl border border-amber-900/30 bg-amber-950/20 p-2.5">
              <p className="font-mono text-lg font-bold text-amber-300">{inProgressTasks}</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400/80">In Flight</p>
            </div>
            <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-2.5">
              <p className="font-mono text-lg font-bold text-emerald-400">{completedTasks}</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/80">Done</p>
            </div>
          </div>

          {activeMilestone ? (
            <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Flag className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="font-mono font-bold text-[#e6e2df] truncate">
                    {activeMilestone.title}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-amber-300 shrink-0 ml-2">
                  {activeMilestone.progressPercentage}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#201f1e]">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${activeMilestone.progressPercentage}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-[#2b2a29] bg-[#141312] p-3 text-xs text-[#8c887e]">
              <Sparkles className="h-3.5 w-3.5 text-amber-400/70 shrink-0" />
              <span>No active milestone scheduled.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
