import React from 'react';
import { Edit2 } from 'lucide-react';
import type { ProfileUser } from '../types';

interface ProfileAboutProps {
  user: ProfileUser;
  isOwner?: boolean;
  onEditBasicProfile?: () => void;
}

export const ProfileAbout: React.FC<ProfileAboutProps> = ({
  user,
  isOwner,
  onEditBasicProfile,
}) => {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-2">
        <h2 className="font-headline text-xs font-mono uppercase tracking-[0.2em] text-[#8c887e]">
          About
        </h2>
        {isOwner && onEditBasicProfile && (
          <button
            type="button"
            onClick={onEditBasicProfile}
            className="inline-flex items-center gap-1 font-mono text-xs text-[#cac6bc] hover:text-[#ffffff] transition-colors"
          >
            <Edit2 className="h-3 w-3" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {user.bio ? (
        <p className="text-base leading-relaxed text-[#e6e2df] font-sans">
          {user.bio}
        </p>
      ) : (
        <p className="text-xs font-mono text-[#8c887e]">
          No bio added yet.{isOwner ? ' Click Edit to add your professional bio.' : ''}
        </p>
      )}

      {/* Compact metadata row with subtle dot separators */}
      <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs text-[#8c887e]">
        {typeof user.experienceYears === 'number' && user.experienceYears > 0 && (
          <>
            <span>{user.experienceYears} Years Experience</span>
            <span>·</span>
          </>
        )}
        {user.location && (
          <>
            <span>{user.location}</span>
            <span>·</span>
          </>
        )}
        {user.timezone && <span>{user.timezone}</span>}
      </div>
    </section>
  );
};
