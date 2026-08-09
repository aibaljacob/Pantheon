import React, { useState } from 'react';
import { Share2, Edit3, UserPlus, UserCheck, MapPin, CheckCircle2, CopyCheck } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import type { ProfileUser, ProfileStats } from '../types';

interface ProfileHeaderProps {
  user: ProfileUser;
  stats: ProfileStats;
  isOwner: boolean;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onOpenEditModal: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  stats,
  isOwner,
  isFollowing,
  onToggleFollow,
  onOpenEditModal,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/u/${user.username}`;
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const fullName = user.displayName || `${user.firstName} ${user.lastName}`;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#363433] bg-[#1c1b1a] shadow-2xl">
      {/* Banner / Cover Image with Atmospheric Vignette */}
      <div className="relative h-48 w-full sm:h-60 md:h-72 overflow-hidden bg-[#201f1e]">
        {user.bannerUrl ? (
          <img
            src={user.bannerUrl}
            alt={`${fullName}'s profile banner`}
            className="h-full w-full object-cover object-center brightness-90"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#363433] via-[#201f1e] to-[#141312]">
            <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:32px_32px]" />
          </div>
        )}
        {/* Soft Volumetric Shadow gradient over bottom of banner */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c1b1a] via-[#1c1b1a]/40 to-transparent" />
      </div>

      {/* Header Content Container */}
      <div className="relative px-6 pb-6 pt-0 sm:px-8 sm:pb-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          {/* Avatar & User Core Details */}
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
            <div className="-mt-16 sm:-mt-20 relative h-28 w-28 sm:h-36 sm:w-36 rounded-3xl border-4 border-[#1c1b1a] bg-[#2b2a29] shadow-xl overflow-hidden group">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#2b2a29] text-3xl sm:text-4xl font-headline font-bold text-[#e6e2df]">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
              )}
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-headline text-2xl sm:text-3xl font-bold text-[#ffffff] tracking-tight">
                  {fullName}
                </h1>
                {user.isFounder && (
                  <Badge variant="accent" className="normal-case tracking-normal">
                    Founder
                  </Badge>
                )}
              </div>
              <p className="font-mono text-sm text-[#8c887e]">@{user.username}</p>
              <p className="text-base text-[#e6e2df] font-medium leading-snug">
                {user.headline}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2 sm:pt-0">
            {isOwner ? (
              <Button
                variant="primary"
                size="md"
                onClick={onOpenEditModal}
                icon={<Edit3 className="h-4 w-4" />}
                iconPosition="left"
              >
                Edit Profile
              </Button>
            ) : (
              <Button
                variant={isFollowing ? 'secondary' : 'primary'}
                size="md"
                onClick={onToggleFollow}
                icon={isFollowing ? <UserCheck className="h-4 w-4 text-[#e6e2df]" /> : <UserPlus className="h-4 w-4" />}
                iconPosition="left"
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}

            <Button
              variant="secondary"
              size="md"
              onClick={handleShareProfile}
              icon={copied ? <CopyCheck className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
              iconPosition="left"
            >
              {copied ? 'Copied Link' : 'Share'}
            </Button>
          </div>
        </div>

        {/* Copy Banner Toast Notification */}
        {copied && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-2 text-xs font-mono text-emerald-300 transition-all animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Profile link copied: /u/{user.username}</span>
          </div>
        )}

        {/* Metadata Row: Location, Availability & Follower Counts */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#2b2a29] pt-6 text-sm text-[#cac6bc]">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 text-xs font-mono">
              <MapPin className="h-4 w-4 text-[#8c887e]" />
              <span>{user.location}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-[#e6e2df]">{user.availability}</span>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs font-mono">
            <div>
              <span className="font-bold text-[#ffffff]">{stats.followersCount.toLocaleString()}</span>{' '}
              <span className="text-[#8c887e]">Followers</span>
            </div>
            <div className="h-3 w-[1px] bg-[#363433]" />
            <div>
              <span className="font-bold text-[#ffffff]">{stats.followingCount.toLocaleString()}</span>{' '}
              <span className="text-[#8c887e]">Following</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
