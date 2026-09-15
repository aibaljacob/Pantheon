import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  UserCheck,
  Briefcase,
  Search,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../auth/store/authStore';
import type { ProjectDetail, ProjectRoleItem } from '../types';
import { fetchRecommendedTalent, rescanRecommendedTalent } from '../services/talentMatchingService';
import type { RankedCandidatesResponse, CandidateProfileSummary } from '../services/talentMatchingService';
import { assignRoleToUser } from '../services/projectService';
import { InviteCandidateModal } from './InviteCandidateModal';
import { CandidateMatchCard } from './CandidateMatchCard';

interface RecommendedTalentSectionProps {
  project: ProjectDetail;
  roles: ProjectRoleItem[];
  onRoleAssigned?: () => void;
}

export const RecommendedTalentSection: React.FC<RecommendedTalentSectionProps> = ({
  project,
  roles,
  onRoleAssigned,
}) => {
  const openRoles = roles.filter((r) => r.status === 'OPEN' || r.status === 'IN_REVIEW');
  const [selectedRoleId, setSelectedRoleId] = useState<string>(openRoles[0]?.id || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RankedCandidatesResponse | null>(null);
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);
  const [inviteModalCandidate, setInviteModalCandidate] = useState<CandidateProfileSummary | null>(null);
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [isRescanning, setIsRescanning] = useState<boolean>(false);

  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (openRoles.length > 0 && !openRoles.some((r) => r.id === selectedRoleId)) {
      setSelectedRoleId(openRoles[0].id);
    }
  }, [openRoles, selectedRoleId]);

  const loadCandidates = useCallback(async () => {
    if (!accessToken || !selectedRoleId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchRecommendedTalent(accessToken, project.id, selectedRoleId, {
        search: search.trim() || undefined,
        limit: 10,
      });
      setData(response);
    } catch (err: any) {
      setError(err.message || 'Unable to load candidate recommendations.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, project.id, selectedRoleId, search]);

  const handleRescanTalent = async () => {
    if (!accessToken || !selectedRoleId || isRescanning) return;
    setIsRescanning(true);
    setError(null);
    try {
      const response = await rescanRecommendedTalent(accessToken, project.id, selectedRoleId);
      setData(response);
    } catch (err: any) {
      setError(err.message || 'Unable to rescan candidate recommendations.');
    } finally {
      setIsRescanning(false);
    }
  };

  const handleAssignRole = async (userId: string) => {
    if (!accessToken || !selectedRoleId || assigningUserId) return;
    setAssigningUserId(userId);
    setError(null);
    try {
      await assignRoleToUser(project.id, selectedRoleId, userId, accessToken);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          candidates: prev.candidates.map((c) =>
            c.candidate.id === userId ? { ...c, isAssignedToThisRole: true } : c,
          ),
        };
      });
      if (onRoleAssigned) {
        onRoleAssigned();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assign role to member.');
    } finally {
      setAssigningUserId(null);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  if (openRoles.length === 0) {
    return (
      <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#363433] bg-[#141312] text-[#8c887e]">
          <UserCheck className="h-6 w-6" />
        </div>
        <h3 className="font-headline text-base font-semibold text-[#ffffff]">Recommended Talent Engine</h3>
        <p className="text-xs text-[#8c887e] max-w-md mx-auto">
          Add an open project role to generate real-time candidate recommendations ranked by role, skills, tools, experience, and domain synergy.
        </p>
      </div>
    );
  }

  const selectedRole = openRoles.find((r) => r.id === selectedRoleId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2b2a29] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h2 className="font-headline text-xl font-bold text-[#ffffff]">Recommended Talent</h2>
            <Badge variant="accent" className="normal-case text-[10px]">Deterministic AI Match</Badge>
          </div>
          <p className="mt-1 text-xs text-[#8c887e]">
            Ranked candidate recommendations based on verified role taxonomy, skills, tools, experience, and team member capabilities.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRescanTalent}
            disabled={isRescanning || loading}
            icon={isRescanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          >
            {isRescanning ? 'Rescanning...' : 'Rescan Candidates'}
          </Button>

          {openRoles.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#2b2a29] bg-[#141312] p-1.5">
              {openRoles.map((roleItem) => (
                <button
                  key={roleItem.id}
                  type="button"
                  onClick={() => {
                    setSelectedRoleId(roleItem.id);
                    setExpandedCandidateId(null);
                  }}
                  className={`rounded-xl px-3 py-1.5 font-mono text-xs transition-colors ${
                    selectedRoleId === roleItem.id
                      ? 'bg-[#201f1e] font-bold text-[#ffffff] shadow-md border border-[#363433]'
                      : 'text-[#8c887e] hover:text-[#e6e2df]'
                  }`}
                >
                  {roleItem.title || roleItem.roleName}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Role Summary Banner */}
      {selectedRole && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <Briefcase className="h-4 w-4 text-[#8c887e]" />
            <span className="font-bold text-[#ffffff]">{selectedRole.title || selectedRole.roleName}</span>
            <span className="text-[#8c887e]">·</span>
            <span className="text-[#cac6bc]">{selectedRole.experienceLevel}</span>
            <span className="text-[#8c887e]">·</span>
            <span className="text-[#cac6bc]">{selectedRole.commitment.replace('_', ' ')}</span>
          </div>

          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8c887e]" />
            <input
              type="text"
              placeholder="Search candidate name or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] pl-8 pr-3 py-1.5 text-xs text-[#e6e2df] placeholder-[#8c887e] focus:border-[#e6e2df] focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Candidate List Container */}
      {loading ? (
        <div className="py-12 text-center font-mono text-xs text-[#8c887e] animate-pulse">
          Computing candidate compatibility scores & taxonomy intersections...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">
          {error}
        </div>
      ) : !data || data.candidates.length === 0 ? (
        <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-8 text-center space-y-2">
          <p className="font-headline text-sm font-semibold text-[#ffffff]">No Matching Candidates Found</p>
          <p className="text-xs text-[#8c887e]">
            {search
              ? 'No candidates match your current search query.'
              : 'No available developers or team members currently meet the minimum criteria for this role.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.candidates.map((item) => (
            <CandidateMatchCard
              key={item.candidate.id}
              item={item}
              isExpanded={expandedCandidateId === item.candidate.id}
              onToggleExpand={() =>
                setExpandedCandidateId(
                  expandedCandidateId === item.candidate.id ? null : item.candidate.id,
                )
              }
              onInvite={() => setInviteModalCandidate(item.candidate)}
              onAssignRole={() => handleAssignRole(item.candidate.id)}
              isAssigning={assigningUserId === item.candidate.id}
            />
          ))}
        </div>
      )}

      {/* Invite Candidate Modal */}
      {inviteModalCandidate && selectedRole && (
        <InviteCandidateModal
          isOpen={Boolean(inviteModalCandidate)}
          onClose={() => setInviteModalCandidate(null)}
          projectId={project.id}
          role={selectedRole}
          candidate={inviteModalCandidate}
          onSuccess={() => {
            setData((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                candidates: prev.candidates.map((c) =>
                  c.candidate.id === inviteModalCandidate.id
                    ? { ...c, invitationStatus: 'PENDING' }
                    : c,
                ),
              };
            });
          }}
        />
      )}
    </div>
  );
};
