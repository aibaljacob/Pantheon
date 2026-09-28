import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Briefcase, Edit3, ArrowRight } from 'lucide-react';
import type { DashboardUser } from '../types';
import type { ProfileData } from '../../profile/types';
import { fetchOwnProfile } from '../../profile/services/profileService';
import { useAuthStore } from '../../auth/store/authStore';
import { UserAvatar } from '../../auth/components/UserAvatar';

interface UserProfileCardProps {
  user: DashboardUser;
  profile?: ProfileData | null;
  isLoading?: boolean;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ user, profile, isLoading = false }) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [localProfile, setLocalProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (profile === undefined && accessToken) {
      let ignore = false;
      fetchOwnProfile(accessToken)
        .then((data) => {
          if (!ignore) setLocalProfile(data);
        })
        .catch((err: unknown) => console.warn('Failed to load profile details for user card:', err));

      return () => {
        ignore = true;
      };
    }
  }, [profile, accessToken]);

  const profileData = profile !== undefined ? profile : localProfile;

  const experienceYears = profileData?.user.experienceYears ?? null;
  const experienceDisplay =
    experienceYears !== null && experienceYears !== undefined && experienceYears > 0
      ? `${experienceYears} ${experienceYears === 1 ? 'Year' : 'Years'}`
      : 'Not specified';

  const locationDisplay = profileData?.user.location?.trim() || 'Not specified';
  const timezoneDisplay = profileData?.user.timezone?.trim() || 'Not specified';

  const headlineDisplay =
    profileData?.user.headline?.trim() ||
    (user.skills && user.skills.length > 0 ? user.skills.slice(0, 3).join(' · ') : 'Game Developer');

  return (
    <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-5 shadow-2xl flex flex-col justify-between">
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
          <div>
            <h2 className="font-headline text-lg font-bold text-[#ffffff]">
              Developer Profile Details
            </h2>
            <p className="text-xs text-[#8c887e] flex items-center gap-2">
              <span>Overview of your public developer profile and credentials</span>
              {isLoading && !profileData && (
                <span className="text-[10px] text-amber-400/80 animate-pulse">· Syncing...</span>
              )}
            </p>
          </div>
          <Link
            to={`/u/${user.username}`}
            className="inline-flex items-center gap-1.5 font-mono text-xs text-[#cac6bc] hover:text-[#ffffff] transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Profile</span>
          </Link>
        </div>

        {/* Headline, Avatar & Bio */}
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size="lg" />
          <div className="space-y-1 min-w-0">
            <h3 className="font-headline text-base font-semibold text-[#ffffff] truncate">
              {user.fullName}
            </h3>
            <p className="text-xs font-mono text-[#8c887e] truncate" title={headlineDisplay}>
              {headlineDisplay}
            </p>
          </div>
        </div>

        {/* Real Profile Fields Grid: location, timezone, experienceYears */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3.5 flex items-center gap-3">
            <div className="rounded-lg bg-[#201f1e] p-2 text-[#8c887e] shrink-0">
              <Briefcase className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#8c887e]">Experience</p>
              <p
                className={`text-xs font-bold truncate ${
                  experienceDisplay === 'Not specified' ? 'text-[#8c887e] font-normal italic' : 'text-[#ffffff]'
                }`}
              >
                {experienceDisplay}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3.5 flex items-center gap-3">
            <div className="rounded-lg bg-[#201f1e] p-2 text-[#8c887e] shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#8c887e]">Location</p>
              <p
                className={`text-xs font-bold truncate ${
                  locationDisplay === 'Not specified' ? 'text-[#8c887e] font-normal italic' : 'text-[#ffffff]'
                }`}
                title={locationDisplay}
              >
                {locationDisplay}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3.5 flex items-center gap-3">
            <div className="rounded-lg bg-[#201f1e] p-2 text-[#8c887e] shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#8c887e]">Timezone</p>
              <p
                className={`text-xs font-bold truncate ${
                  timezoneDisplay === 'Not specified' ? 'text-[#8c887e] font-normal italic' : 'text-[#ffffff]'
                }`}
                title={timezoneDisplay}
              >
                {timezoneDisplay}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end border-t border-[#2b2a29] pt-4 text-xs font-mono">
        <Link
          to={`/u/${user.username}`}
          className="inline-flex items-center gap-1.5 text-[#e6e2df] hover:text-[#ffffff] transition-colors"
        >
          <span>View Public Profile</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};
