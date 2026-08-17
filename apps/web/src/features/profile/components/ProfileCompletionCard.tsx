import React, { useState } from 'react';
import { Sparkles, ArrowRight, X, CheckCircle2, Circle } from 'lucide-react';
import type { ProfileStats } from '../types';

interface ProfileCompletionCardProps {
  stats: ProfileStats;
  onOpenEditModal: () => void;
}

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  stats,
  onOpenEditModal,
}) => {
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  const profileCompletionVal =
    typeof stats?.profileCompletion === 'number'
      ? stats.profileCompletion
      : typeof (stats?.profileCompletion as any)?.profile === 'number'
      ? (stats.profileCompletion as any).profile
      : 85;

  const portfolioCompletionVal =
    typeof stats?.portfolioCompletion === 'number'
      ? stats.portfolioCompletion
      : typeof (stats?.portfolioCompletion as any)?.portfolio === 'number'
      ? (stats.portfolioCompletion as any).portfolio
      : 75;

  const completionItems = [
    { label: 'Add professional headline', completed: true },
    { label: 'Add game engine experience', completed: true },
    { label: 'Add a work experience entry', completed: true },
    { label: 'Add a portfolio showcase project', completed: portfolioCompletionVal >= 60 },
    { label: 'Add external profile links (GitHub, ArtStation)', completed: true },
    { label: 'Upload your official CV / Resume', completed: profileCompletionVal >= 80 },
  ];

  const remainingCount = completionItems.filter((item) => !item.completed).length;

  return (
    <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a]/60 p-4 space-y-3">
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5 text-[#e6e2df]">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-semibold">Profile Completion</span>
        </div>
        {remainingCount > 0 && (
          <span className="text-[10px] text-[#8c887e]">{remainingCount} items remaining</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-2.5">
          <span className="text-[10px] text-[#8c887e]">Profile</span>
          <p className="font-bold text-[#ffffff] text-sm mt-0.5">{profileCompletionVal}%</p>
        </div>

        <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-2.5">
          <span className="text-[10px] text-[#8c887e]">Portfolio</span>
          <p className="font-bold text-[#ffffff] text-sm mt-0.5">{portfolioCompletionVal}%</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsChecklistOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-[#48473f] bg-[#141312] py-2 font-mono text-xs text-[#e6e2df] hover:border-[#e6e2df] hover:text-[#ffffff] transition-colors"
      >
        <span>Complete Profile</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>

      {/* Detailed Checklist Modal (Progressive Disclosure) */}
      {isChecklistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-6">
          <div className="relative w-full max-w-md rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
              <h3 className="font-headline text-base font-bold text-[#ffffff]">
                Profile Optimization Checklist
              </h3>
              <button
                type="button"
                onClick={() => setIsChecklistOpen(false)}
                className="text-[#8c887e] hover:text-[#ffffff]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {completionItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-[#cac6bc] py-1">
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

            <div className="pt-2 flex justify-end gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsChecklistOpen(false);
                  onOpenEditModal();
                }}
                className="rounded-xl border border-[#e6e2df] bg-[#e6e2df] px-4 py-2 font-semibold text-[#141312] hover:bg-[#ffffff]"
              >
                Edit Profile Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
