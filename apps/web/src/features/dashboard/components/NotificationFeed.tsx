import React from 'react';
import { BellRing, UserRoundPlus, MessageSquareText, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import type { NotificationItem } from '../types';

interface NotificationFeedProps {
  notifications: NotificationItem[];
}

const iconMap: Record<string, React.ReactNode> = {
  Invitation: <UserRoundPlus className="h-4 w-4" />,
  Task: <CheckCircle2 className="h-4 w-4" />,
  Portfolio: <BellRing className="h-4 w-4" />,
  Comment: <MessageSquareText className="h-4 w-4" />,
  AI: <Sparkles className="h-4 w-4" />,
};

export const NotificationFeed: React.FC<NotificationFeedProps> = ({ notifications }) => {
  return (
    <section id="notifications" className="space-y-4">
      <div><p className="text-xs font-mono uppercase tracking-[0.25em] text-[#8c887e]">Notifications & Invitations</p><h2 className="mt-2 font-headline text-2xl font-bold text-[#ffffff]">Activity that needs your attention</h2></div>
      <Card className="p-0">
        <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-5">
          <div className="space-y-3">{notifications.map((item) => (<article key={item.id} className={`flex items-start gap-4 rounded-2xl border p-4 transition-colors ${item.unread ? 'border-[#48473f] bg-[#141312]' : 'border-[#2b2a29] bg-[#1c1b1a]'}`} aria-label={`${item.category} notification`}><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.unread ? 'border-[#48473f] bg-[#2A2724] text-[#e6e2df]' : 'border-[#363433] bg-[#141312] text-[#cac6bc]'}`}>{iconMap[item.category] ?? <BellRing className="h-4 w-4" />}</div><div className="min-w-0 flex-1 space-y-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-[#ffffff]">{item.title}</h3>{item.unread ? <Badge variant="accent" className="text-[10px]">Unread</Badge> : null}</div><p className="text-sm text-[#cac6bc]">{item.description}</p><p className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">{item.timestamp}</p></div></article>))}</div>
        </div>
      </Card>
    </section>
  );
};