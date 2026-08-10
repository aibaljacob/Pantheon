import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Briefcase, Edit3, ArrowRight } from 'lucide-react';
import type { DashboardUser } from '../types';

interface UserProfileCardProps {
  user: DashboardUser;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ user }) => {
  return (
    <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-5 shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
        <div>
          <h2 className="font-headline text-lg font-bold text-[#ffffff]">
            Developer Profile Details
          </h2>
          <p className="text-xs text-[#8c887e]">
            Data mapped directly from <code className="font-mono text-[#e6e2df]">UserProfile</code> database table
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

      {/* Headline & Bio */}
      <div className="space-y-2">
        <h3 className="font-headline text-base font-semibold text-[#ffffff]">
          {user.fullName}
        </h3>
        <p className="text-xs font-mono text-[#8c887e]">
          {user.skills && user.skills.length > 0 ? user.skills.join(' · ') : 'Gameplay Developer'}
        </p>
      </div>

      {/* Database Fields Grid: location, timezone, experienceYears */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3.5 flex items-center gap-3">
          <div className="rounded-lg bg-[#201f1e] p-2 text-[#8c887e]">
            <Briefcase className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#8c887e]">Experience</p>
            <p className="text-xs font-bold text-[#ffffff]">4 Years</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3.5 flex items-center gap-3">
          <div className="rounded-lg bg-[#201f1e] p-2 text-[#8c887e]">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#8c887e]">Location</p>
            <p className="text-xs font-bold text-[#ffffff]">Kerala, India</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3.5 flex items-center gap-3">
          <div className="rounded-lg bg-[#201f1e] p-2 text-[#8c887e]">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#8c887e]">Timezone</p>
            <p className="text-xs font-bold text-[#ffffff]">UTC+05:30</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#2b2a29] pt-4 text-xs font-mono">
        <span className="text-[#8c887e]">Table: UserProfile (userId: {user.id.slice(0, 8)}...)</span>
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
