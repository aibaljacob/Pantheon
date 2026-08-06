import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import type { TaskItem } from '../types';
import { TaskCard } from './TaskCard';

interface TaskSectionProps {
  tasks: TaskItem[];
}

const buckets: Array<TaskItem['bucket']> = ['Due Today', 'Upcoming', 'Overdue'];

export const TaskSection: React.FC<TaskSectionProps> = ({ tasks }) => {
  return (
    <section id="tasks" className="space-y-4">
      <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-mono uppercase tracking-[0.25em] text-[#8c887e]">My Tasks</p><h2 className="mt-2 font-headline text-2xl font-bold text-[#ffffff]">Work in motion</h2></div><Badge variant="outline">Drag and drop ready later</Badge></div>
      <div className="grid gap-4 xl:grid-cols-3">
        {buckets.map((bucket) => {
          const bucketTasks = tasks.filter((task) => task.bucket === bucket);
          return (
            <Card key={bucket} className="h-full p-0">
              <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-5">
                <div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-headline text-lg font-semibold text-[#ffffff]">{bucket}</h3><span className="rounded-full border border-[#363433] bg-[#141312] px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#cac6bc]">{bucketTasks.length}</span></div>
                <div className="space-y-3">{bucketTasks.map((task) => (<TaskCard key={task.id} task={task} />))}{bucketTasks.length === 0 ? <div className="rounded-2xl border border-dashed border-[#363433] bg-[#141312] p-6 text-sm text-[#8c887e]">No tasks in this section.</div> : null}</div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};