import React from 'react';
import { ArrowRight, Sparkles, LayoutDashboard, Cpu, Users, UserSearch } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { InsightItem } from '../types';

interface AIInsightsPanelProps {
  insights: InsightItem[];
}

const iconMap: Record<InsightItem['icon'], React.ReactNode> = {
  spark: <Sparkles className="h-4 w-4" />,
  portfolio: <LayoutDashboard className="h-4 w-4" />,
  engine: <Cpu className="h-4 w-4" />,
  role: <UserSearch className="h-4 w-4" />,
  team: <Users className="h-4 w-4" />,
};

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ insights }) => {
  return (
    <section id="ai-insights" className="space-y-4">
      <div><p className="text-xs font-mono uppercase tracking-[0.25em] text-[#8c887e]">AI Insights</p><h2 className="mt-2 font-headline text-2xl font-bold text-[#ffffff]">High-signal recommendations</h2></div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {insights.map((insight) => (<Card key={insight.id} className="h-full p-0"><div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-5"><div className="flex items-start justify-between gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#48473f] bg-[#2A2724] text-[#e6e2df]">{iconMap[insight.icon]}</div>{insight.actionLabel ? <Button variant="ghost" size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />}>{insight.actionLabel}</Button> : null}</div><div className="mt-4 space-y-2"><h3 className="text-base font-semibold text-[#ffffff]">{insight.title}</h3><p className="text-sm leading-relaxed text-[#cac6bc]">{insight.description}</p></div></div></Card>))}
      </div>
    </section>
  );
};