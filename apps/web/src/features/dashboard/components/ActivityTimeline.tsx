import React from 'react';
import { Card } from '../../../components/ui/Card';
import type { ActivityItem } from '../types';

interface ActivityTimelineProps {
  activity: ActivityItem[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activity }) => {
  return (
    <section id="activity" className="space-y-4">
      <div><p className="text-xs font-mono uppercase tracking-[0.25em] text-[#8c887e]">Recent Activity</p><h2 className="mt-2 font-headline text-2xl font-bold text-[#ffffff]">Timeline</h2></div>
      <Card className="p-0"><div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-5"><div className="space-y-4">{activity.map((entry, index) => (<div key={entry.id} className="flex gap-4"><div className="flex flex-col items-center"><span className="mt-1 h-3 w-3 rounded-full border border-[#48473f] bg-[#e6e2df]" />{index < activity.length - 1 ? <span className="mt-2 h-full w-px bg-[#2b2a29]" /> : null}</div><article className="pb-4"><h3 className="text-sm font-semibold text-[#ffffff]">{entry.title}</h3><p className="mt-1 text-sm text-[#cac6bc]">{entry.description}</p><p className="mt-2 text-xs font-mono uppercase tracking-wider text-[#8c887e]">{entry.timestamp}</p></article></div>))}</div></div></Card>
    </section>
  );
};