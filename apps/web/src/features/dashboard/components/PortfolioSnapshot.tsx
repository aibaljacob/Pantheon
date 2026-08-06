import React from 'react';
import { BookOpenText, Eye, Upload, CalendarDays, ArrowRight } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import type { DashboardUser } from '../types';

interface PortfolioSnapshotProps {
  user: DashboardUser;
}

export const PortfolioSnapshot: React.FC<PortfolioSnapshotProps> = ({ user }) => {
  return (
    <section id="portfolio" className="space-y-4">
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.25em] text-[#8c887e]">Portfolio Snapshot</p>
        <h2 className="mt-2 font-headline text-2xl font-bold text-[#ffffff]">Your public presence</h2>
      </div>

      <Card className="p-0">
        <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-5 space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">Profile completion</div>
              <div className="mt-2 text-4xl font-headline font-bold text-[#ffffff]">{user.profileCompletion}%</div>
            </div>
            <Button variant="secondary" size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />}>
              Manage Portfolio
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#8c887e]">
              <span>Progress</span>
              <span>{user.portfolioCompletion}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#2b2a29]">
              <div className="h-full rounded-full bg-[#e6e2df]" style={{ width: `${user.portfolioCompletion}%` }} />
            </div>
          </div>

          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-3 rounded-2xl border border-[#2b2a29] bg-[#141312] p-3">
              <BookOpenText className="h-4 w-4 text-[#e6e2df]" />
              <span className="text-[#cac6bc]">Top skills: {user.skills.length > 0 ? user.skills.join(' · ') : 'No skills added yet'}</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[#2b2a29] bg-[#141312] p-3">
              <Upload className="h-4 w-4 text-[#e6e2df]" />
              <span className="text-[#cac6bc]">Created: {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[#2b2a29] bg-[#141312] p-3">
              <Eye className="h-4 w-4 text-[#e6e2df]" />
              <span className="text-[#cac6bc]">Founder status: {user.isFounder ? 'Active founder' : 'Creator profile'}</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[#2b2a29] bg-[#141312] p-3">
              <CalendarDays className="h-4 w-4 text-[#e6e2df]" />
              <span className="text-[#cac6bc]">Username: @{user.username}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">Account details</div>
            <div className="flex flex-wrap gap-2">
              {[user.firstName, user.lastName, user.role].map((piece) => (
                <span key={piece} className="rounded-full border border-[#48473f] bg-[#2A2724] px-3 py-1 text-xs font-mono text-[#e6e2df]">
                  {piece}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
};