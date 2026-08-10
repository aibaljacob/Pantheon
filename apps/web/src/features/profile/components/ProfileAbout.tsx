import React from 'react';
import type { ProfileUser } from '../types';

interface ProfileAboutProps {
  user: ProfileUser;
}

export const ProfileAbout: React.FC<ProfileAboutProps> = ({ user }) => {
  return (
    <section className="space-y-3">
      <h2 className="font-headline text-xs font-mono uppercase tracking-[0.2em] text-[#8c887e]">
        About
      </h2>

      <p className="text-base leading-relaxed text-[#e6e2df] font-sans">
        {user.bio}
      </p>

      {/* Compact metadata row with subtle dot separators */}
      <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs text-[#8c887e]">
        <span>{user.experienceYears} Years Experience</span>
        <span>·</span>
        <span>{user.location}</span>
        <span>·</span>
        <span>{user.timezone}</span>
      </div>
    </section>
  );
};
