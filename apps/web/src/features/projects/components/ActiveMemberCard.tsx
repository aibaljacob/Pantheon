import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Briefcase, UserCheck, LogOut, UserMinus } from 'lucide-react';
import type { ProjectActiveTeamMember } from '../types';

interface ActiveMemberCardProps {
  member: ProjectActiveTeamMember;
  isFounder: boolean;
  currentUserId?: string;
  onReassignRole: (member: ProjectActiveTeamMember) => void;
  onRemoveMember: (member: ProjectActiveTeamMember) => void;
  onLeaveProject: () => void;
}

export const ActiveMemberCard: React.FC<ActiveMemberCardProps> = ({
  member,
  isFounder,
  currentUserId,
  onReassignRole,
  onRemoveMember,
  onLeaveProject,
}) => {
  const isMe = currentUserId === member.userId;

  const joinedFormatted = new Date(member.joinedAt).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 transition-all hover:border-[#363433]">
      <div className="flex items-center gap-3.5">
        <Link to={`/u/${member.username}`} className="shrink-0">
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={member.displayName}
              className="h-11 w-11 rounded-full object-cover border border-[#48473f]"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#48473f] bg-[#201f1e] text-sm font-bold text-[#ffffff]">
              {member.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>

        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/u/${member.username}`}
              className="font-headline text-sm font-bold text-[#ffffff] hover:text-amber-200 transition-colors"
            >
              {member.displayName}
            </Link>
            <span className="text-xs font-mono text-[#8c887e]">
              @{member.username}
            </span>

            {member.isFounder ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-950/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-amber-300">
                <Crown className="h-3 w-3 text-amber-400" />
                Founder
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                <UserCheck className="h-3 w-3" />
                Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {member.assignedRoles && member.assignedRoles.length > 0 ? (
              member.assignedRoles.map((r) => (
                <span
                  key={r.id}
                  className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-950/20 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-200"
                >
                  <Briefcase className="h-2.5 w-2.5 text-amber-400" />
                  {r.title || r.roleName}
                </span>
              ))
            ) : member.projectRoleTitle || member.projectRoleName || (member.role && member.role !== 'Member') ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-950/20 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-200">
                <Briefcase className="h-2.5 w-2.5 text-amber-400" />
                {member.projectRoleTitle || member.projectRoleName || member.role}
              </span>
            ) : (
              <span className="text-[11px] font-mono text-amber-200/80">
                {member.isFounder ? 'Studio Founder' : 'General Member'}
              </span>
            )}
            <span className="text-[#48473f] text-xs">·</span>
            <span className="text-[#8c887e] text-[11px] font-mono">Joined {joinedFormatted}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center font-mono">
        {isFounder && !member.isFounder && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onReassignRole(member)}
              className="flex items-center gap-1.5 rounded-lg border border-[#48473f] bg-[#1c1b1a] px-3 py-1.5 text-xs text-[#cac6bc] hover:border-[#cac6bc] hover:text-[#ffffff] transition-colors"
              title="Assign or update project roles"
            >
              <Briefcase className="h-3.5 w-3.5 text-amber-400" />
              <span>Assign Roles</span>
            </button>

            <button
              onClick={() => onRemoveMember(member)}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-1.5 text-xs text-red-300 hover:bg-red-900/30 transition-colors"
              title="Remove member from project"
            >
              <UserMinus className="h-3.5 w-3.5" />
              <span>Remove</span>
            </button>
          </div>
        )}

        {isMe && !member.isFounder && (
          <button
            onClick={onLeaveProject}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-1.5 text-xs text-red-300 hover:bg-red-900/30 transition-colors"
            title="Step down and leave this project team"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Leave Project</span>
          </button>
        )}
      </div>
    </div>
  );
};
