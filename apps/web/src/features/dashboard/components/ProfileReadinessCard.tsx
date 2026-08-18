import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import type { DashboardUser } from '../types';
import type { ProfileData } from '../../profile/types';
import { fetchOwnProfile } from '../../profile/services/profileService';
import { useAuthStore } from '../../auth/store/authStore';

interface ProfileReadinessCardProps {
  user: DashboardUser;
}

export const ProfileReadinessCard: React.FC<ProfileReadinessCardProps> = ({ user }) => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (accessToken) {
      fetchOwnProfile(accessToken)
        .then((data) => setProfileData(data))
        .catch((err) => console.warn('Readiness profile fetch error:', err));
    }
  }, [accessToken]);

  const profilePercent = profileData
    ? profileData.stats.profileCompletion
    : (user.profileCompletion || 0);

  const portfolioPercent = profileData
    ? profileData.stats.portfolioCompletion
    : (user.portfolioCompletion || 0);

  const isHeadlineBioSet = profileData
    ? Boolean(profileData.user.headline?.trim() && profileData.user.bio?.trim())
    : Boolean(user.fullName);

  const isSkillsSet = profileData
    ? Boolean((profileData.professional.skills?.length ?? 0) > 0 || (profileData.professional.gameEngines?.length ?? 0) > 0)
    : Boolean(user.skills && user.skills.length > 0);

  const isResumeSet = profileData
    ? Boolean(profileData.resume)
    : profilePercent >= 80;

  const isPortfolioSet = profileData
    ? Boolean(profileData.portfolio && profileData.portfolio.length > 0)
    : portfolioPercent >= 60;

  const isExperienceSet = profileData
    ? Boolean((profileData.experiences?.length ?? 0) > 0 || (profileData.education?.length ?? 0) > 0)
    : false;

  const checklistItems = [
    { label: 'Set professional headline & bio', completed: isHeadlineBioSet },
    { label: 'Set game engines & technical skills', completed: isSkillsSet },
    { label: 'Upload or link official resume (PDF)', completed: isResumeSet },
    { label: 'Add portfolio showcase projects', completed: isPortfolioSet },
    { label: 'Add work experience or education', completed: isExperienceSet },
  ];

  return (
    <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-5 shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
        <div>
          <h2 className="font-headline text-lg font-bold text-[#ffffff]">
            Profile & Talent Readiness
          </h2>
          <p className="text-xs text-[#8c887e]">
            Live recruitment readiness & profile completion score
          </p>
        </div>
        <Link
          to={`/u/${user.username}`}
          className="inline-flex items-center gap-1 font-mono text-xs text-[#cac6bc] hover:text-[#ffffff] transition-colors"
        >
          <span>Manage Profile</span>
          <Edit3 className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 space-y-2">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-[#8c887e]">Profile Completion</span>
            <span className="font-bold text-[#ffffff]">{profilePercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#201f1e]">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${profilePercent}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 space-y-2">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-[#8c887e]">Portfolio Completion</span>
            <span className="font-bold text-[#ffffff]">{portfolioPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#201f1e]">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${portfolioPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <h3 className="font-mono text-xs uppercase tracking-wider text-[#8c887e]">
          Profile Readiness Checklist
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {checklistItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-[#cac6bc]">
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-[#8c887e] shrink-0" />
              )}
              <span className={item.completed ? 'line-through text-[#8c887e]' : 'text-[#e6e2df]'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <Link
          to={`/u/${user.username}`}
          className="inline-flex items-center gap-2 rounded-xl border border-[#48473f] bg-[#141312] px-4 py-2 font-mono text-xs text-[#e6e2df] hover:border-[#e6e2df] transition-colors"
        >
          <span>Manage Profile Details</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};
