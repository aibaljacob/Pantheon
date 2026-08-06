import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import type { TaskItem } from '../types';

interface TaskCardProps {
  task: TaskItem;
}

const priorityVariantMap: Record<TaskItem['priority'], 'accent' | 'bronze' | 'outline'> = { High: 'accent', Medium: 'bronze', Low: 'outline' };

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  return (
    <Card className="p-0">
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-[#363433] bg-[#1c1b1a] p-4">
        <div className="space-y-2"><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-semibold text-[#ffffff]">{task.title}</h4><Badge variant={priorityVariantMap[task.priority]} className="text-[10px]">{task.priority}</Badge></div><p className="text-xs text-[#8c887e]">{task.projectName}</p></div>
        <div className="space-y-1 text-right text-xs text-[#cac6bc]"><div>{task.dueDate}</div><div className="font-mono uppercase tracking-wider text-[#8c887e]">{task.status}</div></div>
      </div>
    </Card>
  );
};