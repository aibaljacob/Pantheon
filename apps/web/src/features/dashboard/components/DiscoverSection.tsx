import React from 'react';
import { ArrowRight, UserRound, Building2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { recommendedDevelopers, recommendedProjects, trendingStudios } from '../mockDashboardData';

interface HorizontalSectionProps {
  title: string;
  description: string;
  actionLabel: string;
  children: React.ReactNode;
}

const HorizontalSection: React.FC<HorizontalSectionProps> = ({ title, description, actionLabel, children }) => (
  <div className="space-y-4">
    <div className="flex items-end justify-between gap-4"><div><h3 className="font-headline text-xl font-semibold text-[#ffffff]">{title}</h3><p className="mt-1 text-sm text-[#8c887e]">{description}</p></div><Button variant="ghost" size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />}>{actionLabel}</Button></div>
    <div className="flex gap-4 overflow-x-auto pb-2 pr-2">{children}</div>
  </div>
);

export const DiscoverSection: React.FC = () => {
  return (
    <section id="discover" className="space-y-6">
      <div><p className="text-xs font-mono uppercase tracking-[0.25em] text-[#8c887e]">Discover</p><h2 className="mt-2 font-headline text-2xl font-bold text-[#ffffff]">Curated recommendations</h2></div>
      <div className="space-y-6 rounded-3xl border border-[#363433] bg-[#1c1b1a] p-5">
        <HorizontalSection title="Recommended Projects" description="Projects aligned to your current stack and interests." actionLabel="View All">{recommendedProjects.map((project) => (<Card key={project.title} className="min-w-[15rem] p-0"><div className="rounded-2xl border border-[#363433] bg-[#141312] p-4"><Badge variant="accent" className="text-[10px]">Project Match</Badge><h4 className="mt-4 text-base font-semibold text-[#ffffff]">{project.title}</h4><p className="mt-1 text-sm text-[#cac6bc]">{project.tag}</p><p className="mt-4 text-xs font-mono uppercase tracking-wider text-[#8c887e]">{project.engine}</p><div className="mt-4 text-sm font-mono text-[#e6e2df]">{project.match}</div></div></Card>))}</HorizontalSection>
        <HorizontalSection title="Recommended Developers" description="Creators with a strong fit for your project needs." actionLabel="View All">{recommendedDevelopers.map((developer) => (<Card key={developer.name} className="min-w-[15rem] p-0"><div className="rounded-2xl border border-[#363433] bg-[#141312] p-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#48473f] bg-[#2A2724] text-[#e6e2df]"><UserRound className="h-5 w-5" /></div><h4 className="mt-4 text-base font-semibold text-[#ffffff]">{developer.name}</h4><p className="mt-1 text-sm text-[#cac6bc]">{developer.role}</p><p className="mt-4 text-xs font-mono uppercase tracking-wider text-[#8c887e]">{developer.specialty}</p><div className="mt-4 text-sm font-mono text-[#e6e2df]">{developer.fit}</div></div></Card>))}</HorizontalSection>
        <HorizontalSection title="Trending Studios" description="Studios actively recruiting creators this week." actionLabel="View All">{trendingStudios.map((studio) => (<Card key={studio.name} className="min-w-[15rem] p-0"><div className="rounded-2xl border border-[#363433] bg-[#141312] p-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#48473f] bg-[#2A2724] text-[#e6e2df]"><Building2 className="h-5 w-5" /></div><h4 className="mt-4 text-base font-semibold text-[#ffffff]">{studio.name}</h4><p className="mt-1 text-sm text-[#cac6bc]">{studio.focus}</p><p className="mt-4 text-xs font-mono uppercase tracking-wider text-[#8c887e]">Openings</p><div className="mt-4 text-sm font-mono text-[#e6e2df]">{studio.openings} roles</div></div></Card>))}</HorizontalSection>
      </div>
    </section>
  );
};