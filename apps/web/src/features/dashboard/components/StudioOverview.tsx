import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ArrowRight, Users, UserRoundPlus, ShieldCheck, FolderKanban } from 'lucide-react';

export const StudioOverview: React.FC = () => {
  return (
    <section id="founder" className="space-y-4">
      <div><p className="text-xs font-mono uppercase tracking-[0.25em] text-[#8c887e]">Founder / Studio Section</p><h2 className="mt-2 font-headline text-2xl font-bold text-[#ffffff]">Studio overview</h2></div>
      <Card className="p-0"><div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 md:p-8"><Badge variant="bronze" className="mb-4"><ShieldCheck className="h-3.5 w-3.5" />Founder Active</Badge><div className="grid gap-3 md:grid-cols-4"><div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4"><div className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">Active Projects</div><div className="mt-2 text-2xl font-bold text-[#ffffff]">4</div></div><div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4"><div className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">Pending Applicants</div><div className="mt-2 text-2xl font-bold text-[#ffffff]">14</div></div><div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4"><div className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">Current Team Size</div><div className="mt-2 text-2xl font-bold text-[#ffffff]">31</div></div><div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4"><div className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">Recruitment Status</div><div className="mt-2 text-2xl font-bold text-[#ffffff]">Open</div></div></div><div className="mt-6 flex flex-wrap gap-3"><Button variant="primary" size="lg" icon={<ArrowRight className="h-4 w-4" />}>Studio Dashboard</Button><Button variant="secondary" size="lg" icon={<Users className="h-4 w-4" />}>Team Overview</Button><Button variant="secondary" size="lg" icon={<UserRoundPlus className="h-4 w-4" />}>Review Applicants</Button><Button variant="secondary" size="lg" icon={<FolderKanban className="h-4 w-4" />}>Manage Projects</Button></div></div></Card>
    </section>
  );
};