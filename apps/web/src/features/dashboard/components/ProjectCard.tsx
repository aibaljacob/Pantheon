import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { DashboardProject } from '../types';

interface ProjectCardProps {
  project: DashboardProject;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <Card className="min-w-[18rem] p-0 sm:min-w-[20rem] lg:min-w-[22rem]">
      <div className="overflow-hidden rounded-2xl border border-[#363433] bg-[#1c1b1a]">
        <div className="relative h-44 overflow-hidden"><img src={project.coverImage} alt={project.title} className="h-full w-full object-cover opacity-85" /><div className="absolute inset-0 bg-gradient-to-t from-[#141312] via-[#141312]/20 to-transparent" /><div className="absolute left-4 top-4 rounded-full border border-[#48473f] bg-[#141312]/80 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#e6e2df]">{project.stage}</div></div>
        <div className="space-y-4 p-5">
          <div className="space-y-1"><h3 className="font-headline text-xl font-bold text-[#ffffff]">{project.title}</h3><p className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">{project.genre} · {project.engine}</p></div>
          <div className="space-y-3"><div className="flex items-center justify-between text-xs font-mono text-[#8c887e]"><span>Progress</span><span>{project.progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#2b2a29]"><div className="h-full rounded-full bg-[#e6e2df]" style={{ width: `${project.progress}%` }} /></div></div>
          <div className="grid grid-cols-2 gap-3 text-xs text-[#cac6bc]"><div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3"><div className="font-mono uppercase tracking-wider text-[#8c887e]">Team Size</div><div className="mt-1 text-base font-semibold text-[#ffffff]">{project.teamSize}</div></div><div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3"><div className="font-mono uppercase tracking-wider text-[#8c887e]">Open Tasks</div><div className="mt-1 text-base font-semibold text-[#ffffff]">{project.openTasks}</div></div></div>
          <div className="flex items-center justify-between gap-3 text-xs font-mono text-[#8c887e]"><span>Online: {project.onlineMembers.join(' · ')}</span><Button variant="secondary" size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />}>Continue</Button></div>
        </div>
      </div>
    </Card>
  );
};