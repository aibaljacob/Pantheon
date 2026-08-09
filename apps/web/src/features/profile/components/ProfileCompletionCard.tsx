import React from 'react';
import { Card } from '../../../components/ui/Card';
import { CheckCircle2, Circle, Sparkles, ArrowRight } from 'lucide-react';
import type { ProfileStats } from '../types';

interface ProfileCompletionCardProps {
  stats: ProfileStats;
  onOpenEditModal: () => void;
}

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  stats,
  onOpenEditModal,
}) => {
  const completionItems = [
    { label: 'Add professional headline', completed: true },
    { label: 'Add game engine experience', completed: true },
    { label: 'Add a work experience entry', completed: true },
    { label: 'Add a portfolio showcase project', completed: stats.portfolioCompletion >= 60 },
    { label: 'Add external profile links (GitHub, ArtStation)', completed: true },
    { label: 'Upload your official CV / Resume', completed: stats.profileCompletion >= 80 },
  ];

  return (
    <Card className="space-y-5 bg-gradient-to-b from-[#201f1e] to-[#1c1b1a] border-[#48473f]/60">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <h2 className="font-headline text-base font-bold text-[#ffffff]">Profile Optimization</h2>
        </div>
        <span className="font-mono text-xs text-[#8c887e]">Owner Dashboard</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#8c887e]">
            <span>Profile</span>
            <span className="font-bold text-[#ffffff]">{stats.profileCompletion}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#201f1e]">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${stats.profileCompletion}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#8c887e]">
            <span>Portfolio</span>
            <span className="font-bold text-[#ffffff]">{stats.portfolioCompletion}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#201f1e]">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${stats.portfolioCompletion}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-mono uppercase tracking-wider text-[#8c887e]">
          Recommended Actions for 100% Visibility
        </p>
        <div className="space-y-1.5">
          {completionItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs text-[#cac6bc]">
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-[#8c887e] shrink-0" />
              )}
              <span className={item.completed ? 'line-through text-[#8c887e]' : 'font-medium text-[#e6e2df]'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenEditModal}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#48473f] bg-[#141312] py-2.5 text-xs font-mono font-semibold text-[#e6e2df] hover:border-[#e6e2df] hover:text-[#ffffff] transition-colors"
      >
        <span>Complete Remaining Details</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
};
