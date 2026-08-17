import React from 'react';
import { ShieldCheck, Calendar, MapPin, Globe, Mail, Edit3, Camera, Image } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import type { ProfileUser } from '../types';

interface AdminProfileViewProps {
  user: ProfileUser;
  isOwner: boolean;
  onEditBasicProfile: () => void;
  onEditAvatar: () => void;
  onEditBanner: () => void;
}

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({
  user,
  isOwner,
  onEditBasicProfile,
  onEditAvatar,
  onEditBanner,
}) => {
  const fullName =
    user.displayName ||
    `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
    user.username;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Admin Profile Header Banner & Avatar */}
      <div className="relative rounded-3xl border border-[#363433] bg-[#1c1b1a] overflow-hidden shadow-2xl">
        {/* Banner Image */}
        <div className="relative h-48 sm:h-64 bg-gradient-to-r from-[#201f1e] to-[#141312] border-b border-[#2b2a29]">
          {user.bannerUrl ? (
            <img src={user.bannerUrl} alt="Banner" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2b2a29] via-[#1c1b1a] to-[#141312]" />
          )}

          {isOwner && (
            <button
              type="button"
              onClick={onEditBanner}
              className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full border border-[#48473f] bg-[#141312]/80 backdrop-blur-md px-3 py-1.5 text-xs font-mono text-[#e6e2df] hover:border-[#e6e2df] transition-colors"
            >
              <Image className="h-3.5 w-3.5" />
              Change Banner
            </button>
          )}
        </div>

        {/* Profile Info Header */}
        <div className="p-6 sm:p-8 space-y-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-20 sm:-mt-24">
            <div className="relative group shrink-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={fullName}
                  className="h-28 w-28 sm:h-36 sm:w-36 rounded-full border-4 border-[#1c1b1a] object-cover bg-[#141312] shadow-xl"
                />
              ) : (
                <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-full border-4 border-[#1c1b1a] bg-[#201f1e] flex items-center justify-center font-bold text-3xl text-[#e6e2df] shadow-xl">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}

              {isOwner && (
                <button
                  type="button"
                  onClick={onEditAvatar}
                  className="absolute bottom-1 right-1 rounded-full border border-[#48473f] bg-[#141312] p-2 text-[#e6e2df] hover:border-[#e6e2df] transition-colors shadow-lg"
                  title="Change avatar photo"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>

            {isOwner && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onEditBasicProfile}
                icon={<Edit3 className="h-3.5 w-3.5" />}
              >
                Edit Account Profile
              </Button>
            )}
          </div>

          {/* User Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-headline text-3xl font-bold text-[#ffffff]">{fullName}</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/40 px-3 py-1 text-xs font-mono font-semibold text-amber-300">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                Platform Administrator
              </span>
            </div>

            <p className="text-sm font-mono text-[#8c887e]">@{user.username}</p>
            {user.headline && <p className="text-sm text-[#cac6bc]">{user.headline}</p>}
          </div>
        </div>
      </div>

      {/* Account Identity Details Card */}
      <Card className="p-6 sm:p-8 space-y-6 border-[#363433] bg-[#1c1b1a]">
        <div className="border-b border-[#2b2a29] pb-4">
          <h3 className="font-headline text-xl font-bold text-[#ffffff]">
            Account Overview
          </h3>
          <p className="text-xs text-[#8c887e] font-mono mt-0.5">
            Administrative account details and system properties
          </p>
        </div>

        {/* Bio */}
        {user.bio ? (
          <div className="space-y-1.5">
            <span className="text-xs font-mono text-[#8c887e] uppercase">About / Bio</span>
            <p className="text-sm text-[#e6e2df] leading-relaxed whitespace-pre-wrap">{user.bio}</p>
          </div>
        ) : (
          <p className="text-xs text-[#8c887e] italic">No bio specified.</p>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#2b2a29] pt-5 text-xs font-mono">
          <div className="flex items-center gap-3 rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
            <Mail className="h-4 w-4 text-[#8c887e]" />
            <div>
              <span className="text-[10px] text-[#8c887e] block">Email Address</span>
              <span className="text-[#e6e2df] font-semibold">{user.email || 'Administrator Account'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
            <Calendar className="h-4 w-4 text-[#8c887e]" />
            <div>
              <span className="text-[10px] text-[#8c887e] block">Account Created</span>
              <span className="text-[#e6e2df] font-semibold">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Member'}
              </span>
            </div>
          </div>

          {user.location && (
            <div className="flex items-center gap-3 rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
              <MapPin className="h-4 w-4 text-[#8c887e]" />
              <div>
                <span className="text-[10px] text-[#8c887e] block">Location</span>
                <span className="text-[#e6e2df] font-semibold">{user.location}</span>
              </div>
            </div>
          )}

          {user.timezone && (
            <div className="flex items-center gap-3 rounded-2xl border border-[#2b2a29] bg-[#141312] p-4">
              <Globe className="h-4 w-4 text-[#8c887e]" />
              <div>
                <span className="text-[10px] text-[#8c887e] block">Timezone</span>
                <span className="text-[#e6e2df] font-semibold">{user.timezone}</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
