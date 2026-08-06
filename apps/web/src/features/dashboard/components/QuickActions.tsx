import React from 'react';
import { BriefcaseBusiness, FolderKanban, Mail, Upload, UserPlus } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export const QuickActions: React.FC = () => {
  return (
    <section aria-label="Quick actions" className="space-y-4">
      <div><p className="text-xs font-mono uppercase tracking-[0.25em] text-[#8c887e]">Quick Actions</p><h2 className="mt-2 font-headline text-2xl font-bold text-[#ffffff]">Move faster</h2></div>
      <Card className="p-0"><div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"><Button variant="secondary" size="md" icon={<BriefcaseBusiness className="h-4 w-4" />} className="justify-start">Browse Projects</Button><Button variant="secondary" size="md" icon={<Mail className="h-4 w-4" />} className="justify-start">View Messages</Button><Button variant="secondary" size="md" icon={<FolderKanban className="h-4 w-4" />} className="justify-start">Manage Portfolio</Button><Button variant="secondary" size="md" icon={<Upload className="h-4 w-4" />} className="justify-start">Upload Resume</Button><Button variant="secondary" size="md" icon={<UserPlus className="h-4 w-4" />} className="justify-start sm:col-span-2 lg:col-span-1 xl:col-span-2">Invite Friends</Button></div></div></Card>
    </section>
  );
};