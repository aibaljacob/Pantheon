import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { DashboardProject } from '../types';
import { ProjectCard } from './ProjectCard';

interface ProjectCarouselProps {
  projects: DashboardProject[];
}

export const ProjectCarousel: React.FC<ProjectCarouselProps> = ({ projects }) => {
  return (
    <section id="projects" className="space-y-4">
      <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-mono uppercase tracking-[0.25em] text-[#8c887e]">My Projects</p><h2 className="mt-2 font-headline text-2xl font-bold text-[#ffffff]">Projects in motion</h2></div><Button variant="ghost" size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />}>View All</Button></div>
      <div className="flex gap-4 overflow-x-auto pb-2 pr-2">{projects.map((project) => (<ProjectCard key={project.id} project={project} />))}</div>
    </section>
  );
};