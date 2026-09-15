import React from 'react';
import { Link } from 'react-router-dom';
import { History, UserX } from 'lucide-react';
import type { ProjectFormerTeamMember } from '../types';

interface FormerMemberCardProps {
  member: ProjectFormerTeamMember;
}

export const FormerMemberCard: React.FC<FormerMemberCardProps> = ({ member }) => {
  const displayRole = member.projectRoleTitle || member.projectRoleName || 'General Member';

  const joinedFormatted = new Date(member.joinedAt).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });

  const leftFormatted = new Date(member.leftAt).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#201f1e] bg-[#141312]/60 p-3.5 transition-all opacity-85 hover:opacity-100">
      <div className="flex items-center gap-3">
        <Link to={`/u/${member.username}`} className="shrink-0">
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={member.displayName}
              className="h-10 w-10 rounded-full object-cover grayscale contrast-125 border border-[#363433]"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#363433] bg-[#1c1b1a] text-xs font-bold text-[#8c887e]">
              {member.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>

        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/u/${member.username}`}
              className="font-headline text-xs font-bold text-[#cac6bc] hover:text-[#ffffff] transition-colors"
            >
              {member.displayName}
            </Link>
            <span className="text-[11px] font-mono text-[#8c887e]">
              @{member.username}
            </span>

            {member.status === 'LEFT' ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#48473f] bg-[#201f1e] px-2 py-0.5 text-[9px] font-mono text-[#8c887e]">
                <History className="h-2.5 w-2.5" />
                Left Voluntarily
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-900/30 bg-amber-950/20 px-2 py-0.5 text-[9px] font-mono text-[#a89f91]">
                <UserX className="h-2.5 w-2.5" />
                Removed by Founder
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-[#8c887e]">
            <span>Role: {displayRole}</span>
            <span>·</span>
            <span>Active {joinedFormatted} – {leftFormatted}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
