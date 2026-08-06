import React from 'react';
import { ArrowRight, CircleCheckBig } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { DashboardProject } from '../types';

interface ContinueProjectCardProps {
  project: DashboardProject;
  memberName: string;
}

export const ContinueProjectCard: React.FC<ContinueProjectCardProps> = ({ project, memberName }) => {
  return (
    <Card className="p-0" glow>
      <div className="overflow-hidden rounded-3xl border border-[#363433] bg-[#1c1b1a]">
        <div className="grid gap-0 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="relative min-h-[18rem]"><img src={project.coverImage} alt={`${project.title} cover`} className="absolute inset-0 h-full w-full object-cover opacity-85" /><div className="absolute inset-0 bg-gradient-to-r from-[#141312] via-[#141312]/40 to-transparent" /><div className="relative z-10 flex h-full flex-col justify-between p-6 md:p-8"><div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.24em] text-[#cac6bc]"><CircleCheckBig className="h-4 w-4 text-[#e6e2df]" />Continue where you left off</div><div className="max-w-xl space-y-4"><div className="space-y-2"><p className="text-xs font-mono uppercase tracking-[0.25em] text-[#8c887e]">Featured Project</p><h3 className="font-headline text-3xl font-bold text-[#ffffff] md:text-4xl">{project.title}</h3><p className="text-sm text-[#cac6bc]">Current milestone: {project.milestone}</p></div><div className="grid grid-cols-3 gap-3 text-sm"><div className="rounded-2xl border border-[#363433] bg-[#141312]/75 p-3"><div className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">Progress</div><div className="mt-1 text-xl font-semibold text-[#ffffff]">{project.progress}%</div></div><div className="rounded-2xl border border-[#363433] bg-[#141312]/75 p-3"><div className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">Tasks</div><div className="mt-1 text-xl font-semibold text-[#ffffff]">{project.assignedTasks}</div></div><div className="rounded-2xl border border-[#363433] bg-[#141312]/75 p-3"><div className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">Online</div><div className="mt-1 text-xl font-semibold text-[#ffffff]">{project.onlineMembers.length}</div></div></div></div></div></div>
          <div className="flex flex-col justify-between gap-6 border-t border-[#363433] p-6 lg:border-l lg:border-t-0 md:p-8"><div className="space-y-4"><div><p className="text-xs font-mono uppercase tracking-[0.25em] text-[#8c887e]">Assigned to</p><p className="mt-1 text-lg font-semibold text-[#ffffff]">{memberName}</p></div><div className="space-y-3"><div className="flex items-center justify-between text-sm text-[#cac6bc]"><span>Team members online</span><span>{project.teamSize} total</span></div><div className="flex flex-wrap gap-2">{project.onlineMembers.map((member) => (<span key={member} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#48473f] bg-[#141312] font-mono text-xs font-semibold text-[#e6e2df]">{member}</span>))}</div></div></div><Button variant="primary" size="lg" icon={<ArrowRight className="h-4 w-4" />} className="w-full justify-center">Continue Project</Button></div>
        </div>
      </div>
    </Card>
  );
};