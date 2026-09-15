import React, { useState, useEffect } from 'react';
import { Users, History, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../auth/store/authStore';
import { fetchProjectTeam } from '../services/projectService';
import type { ProjectActiveTeamMember, ProjectFormerTeamMember, ProjectRoleItem } from '../types';
import { ActiveMemberCard } from './ActiveMemberCard';
import { FormerMemberCard } from './FormerMemberCard';
import { ChangeProjectRoleModal } from './ChangeProjectRoleModal';
import { RemoveMemberModal } from './RemoveMemberModal';
import { LeaveProjectModal } from './LeaveProjectModal';

interface TeamSectionProps {
  projectId: string;
  projectName: string;
  isFounder: boolean;
  roles: ProjectRoleItem[];
  onTeamUpdated?: () => void;
}

export const TeamSection: React.FC<TeamSectionProps> = ({
  projectId,
  projectName,
  isFounder,
  roles,
  onTeamUpdated,
}) => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [activeMembers, setActiveMembers] = useState<ProjectActiveTeamMember[]>([]);
  const [formerMembers, setFormerMembers] = useState<ProjectFormerTeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reassigningMember, setReassigningMember] = useState<ProjectActiveTeamMember | null>(null);
  const [removingMember, setRemovingMember] = useState<ProjectActiveTeamMember | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  const loadTeam = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchProjectTeam(projectId, accessToken);
      setActiveMembers(data.activeMembers);
      setFormerMembers(data.formerMembers);
    } catch (err: any) {
      setError(err.message || 'Failed to load team members.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, [projectId, accessToken]);

  const handleActionSuccess = () => {
    loadTeam();
    onTeamUpdated?.();
  };

  return (
    <div className="space-y-8 font-mono">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#48473f] bg-[#201f1e] text-amber-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-headline text-xl font-bold text-[#ffffff]">Production Team Roster</h2>
            <p className="text-xs text-[#8c887e]">
              Manage active production contributors and review historical studio participation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full border border-emerald-500/30 bg-emerald-950/20 px-3 py-1 text-xs text-emerald-300">
            {activeMembers.length} Active {activeMembers.length === 1 ? 'Member' : 'Members'}
          </span>
          {formerMembers.length > 0 && (
            <span className="rounded-full border border-[#48473f] bg-[#201f1e] px-3 py-1 text-xs text-[#cac6bc]">
              {formerMembers.length} Former
            </span>
          )}
          <button
            onClick={loadTeam}
            disabled={isLoading}
            className="rounded-xl border border-[#363433] bg-[#201f1e] p-2 text-[#8c887e] hover:text-[#ffffff] hover:border-[#48473f] transition-colors"
            title="Refresh team roster"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-[#8c887e]">
          <Loader2 className="h-6 w-6 animate-spin mr-2 text-amber-400" />
          <span className="text-xs">Loading team roster...</span>
        </div>
      ) : (
        <>
          {/* Active Members Section */}
          <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4">
            <h3 className="font-headline text-base font-bold text-[#ffffff] border-b border-[#2b2a29] pb-3">
              Active Members ({activeMembers.length})
            </h3>
            {activeMembers.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#8c887e]">No active members found.</div>
            ) : (
              <div className="space-y-3">
                {activeMembers.map((member) => (
                  <ActiveMemberCard
                    key={member.id}
                    member={member}
                    isFounder={isFounder}
                    currentUserId={currentUser?.id}
                    onReassignRole={(m) => setReassigningMember(m)}
                    onRemoveMember={(m) => setRemovingMember(m)}
                    onLeaveProject={() => setIsLeaveModalOpen(true)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Former Members Section */}
          {formerMembers.length > 0 && (
            <div className="rounded-3xl border border-[#2b2a29] bg-[#1c1b1a]/80 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-[#8c887e]" />
                  <h3 className="font-headline text-base font-bold text-[#cac6bc]">
                    Former Members & Historical Participation ({formerMembers.length})
                  </h3>
                </div>
                <span className="text-[10px] text-[#8c887e]">Preserved for attribution</span>
              </div>
              <div className="space-y-2.5">
                {formerMembers.map((member) => (
                  <FormerMemberCard key={member.id} member={member} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <ChangeProjectRoleModal
        isOpen={Boolean(reassigningMember)}
        onClose={() => setReassigningMember(null)}
        projectId={projectId}
        member={reassigningMember}
        roles={roles}
        onSuccess={handleActionSuccess}
      />
      <RemoveMemberModal
        isOpen={Boolean(removingMember)}
        onClose={() => setRemovingMember(null)}
        projectId={projectId}
        member={removingMember}
        onSuccess={handleActionSuccess}
      />
      <LeaveProjectModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        projectId={projectId}
        projectName={projectName}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
};

