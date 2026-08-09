import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Briefcase, Globe2, Clock } from 'lucide-react';
import type { ProfileUser } from '../types';

interface ProfileAboutProps {
  user: ProfileUser;
}

export const ProfileAbout: React.FC<ProfileAboutProps> = ({ user }) => {
  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
        <h2 className="font-headline text-lg font-bold text-[#ffffff] tracking-wide">
          About
        </h2>
        <span className="text-xs font-mono text-[#8c887e]">Overview</span>
      </div>

      <p className="text-sm sm:text-base leading-relaxed text-[#cac6bc] whitespace-pre-line font-sans">
        {user.bio}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3.5 flex items-center gap-3">
          <div className="rounded-lg bg-[#201f1e] p-2 text-[#8c887e]">
            <Briefcase className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#8c887e]">Experience</p>
            <p className="text-sm font-bold text-[#ffffff]">{user.experienceYears} Years</p>
          </div>
        </div>

        <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3.5 flex items-center gap-3">
          <div className="rounded-lg bg-[#201f1e] p-2 text-[#8c887e]">
            <Globe2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#8c887e]">Location</p>
            <p className="text-sm font-bold text-[#ffffff] truncate">{user.location}</p>
          </div>
        </div>

        <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3.5 flex items-center gap-3">
          <div className="rounded-lg bg-[#201f1e] p-2 text-[#8c887e]">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#8c887e]">Timezone</p>
            <p className="text-sm font-bold text-[#ffffff]">{user.timezone}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
