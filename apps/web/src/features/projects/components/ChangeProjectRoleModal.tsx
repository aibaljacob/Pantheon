import React, { useState, useEffect } from 'react';
import { X, Briefcase, AlertCircle, CheckCircle2, Loader2, Check } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../auth/store/authStore';
import { assignProjectMemberRoles } from '../services/projectService';
import type { ProjectActiveTeamMember, ProjectRoleItem } from '../types';

interface ChangeProjectRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  member: ProjectActiveTeamMember | null;
  roles: ProjectRoleItem[];
  onSuccess: () => void;
}

export const ChangeProjectRoleModal: React.FC<ChangeProjectRoleModalProps> = ({
  isOpen,
  onClose,
  projectId,
  member,
  roles,
  onSuccess,
}) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const isRoleMatchingMember = (r: ProjectRoleItem) => {
    if (!member) return false;
    return (
      r.assignedMemberId === member.id ||
      r.assignedMemberId === member.userId ||
      (r.assignedMemberName && (r.assignedMemberName === member.displayName || r.assignedMemberName === member.username)) ||
      (r.status === 'FILLED' && member.role && member.role !== 'Member' && member.role !== 'Founder' &&
        (r.title?.toLowerCase() === member.role.toLowerCase() || r.roleName?.toLowerCase() === member.role.toLowerCase()))
    );
  };

  useEffect(() => {
    if (member) {
      const initialIds: string[] = [];
      (member.assignedRoles || []).forEach((r) => r.id && !initialIds.includes(r.id) && initialIds.push(r.id));
      if (member.projectRoleId && !initialIds.includes(member.projectRoleId)) initialIds.push(member.projectRoleId);
      roles.forEach((r) => isRoleMatchingMember(r) && !initialIds.includes(r.id) && initialIds.push(r.id));
      setSelectedRoleIds(initialIds);
      setError(null);
      setIsSuccess(false);
    }
  }, [member, isOpen, roles]);

  if (!isOpen || !member) return null;

  const assignableRoles = roles.filter((r) => {
    const isAssigned = selectedRoleIds.includes(r.id) ||
      member.assignedRoles?.some((ar) => ar.id === r.id) ||
      member.projectRoleId === r.id ||
      isRoleMatchingMember(r);
    if (isAssigned) return true;
    if (r.assignedMemberId && r.assignedMemberId !== member.id && r.assignedMemberId !== member.userId) return false;
    return r.status !== 'FILLED' && r.status !== 'CLOSED';
  });

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) => (prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return setError('You must be logged in as the project founder.');
    setLoading(true);
    setError(null);
    try {
      await assignProjectMemberRoles(projectId, member.id, selectedRoleIds, accessToken);
      setIsSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update member role assignments.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-mono">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#48473f] bg-[#201f1e] text-amber-400">
              <Briefcase className="h-4 w-4" />
            </div>
            <h3 className="font-headline text-lg font-bold text-[#ffffff]">Assign Project Roles</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#8c887e] hover:bg-[#201f1e] hover:text-[#ffffff] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Project roles assigned successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3 text-xs space-y-1">
            <p className="text-[#8c887e]">Team Member</p>
            <p className="font-bold text-[#ffffff]">{member.displayName} (@{member.username})</p>
            <p className="text-[11px] text-[#cac6bc]">
              Assigned: <span className="text-amber-300">{selectedRoleIds.length} {selectedRoleIds.length === 1 ? 'role' : 'roles'}</span>
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[#cac6bc] block">Select Roles to Assign to this Member:</label>
            {assignableRoles.length === 0 ? (
              <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-4 text-center space-y-1">
                <p className="text-xs text-[#cac6bc] font-semibold">No Available Roles to Assign</p>
                <p className="text-[11px] text-[#8c887e]">All other project roles are currently filled by team members or closed.</p>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {assignableRoles.map((r) => {
                  const isSelected = selectedRoleIds.includes(r.id);
                  return (
                    <div
                      key={r.id}
                      onClick={() => toggleRole(r.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-amber-500/50 bg-amber-950/20 text-[#ffffff]'
                          : 'border-[#2b2a29] bg-[#141312] text-[#cac6bc] hover:border-[#48473f]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                            isSelected
                              ? 'border-amber-400 bg-amber-400 text-black'
                              : 'border-[#48473f] bg-[#201f1e]'
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#ffffff]">{r.title || r.roleName}</p>
                          <p className="text-[10px] text-[#8c887e]">{r.roleName} · {r.experienceLevel} · {r.commitment}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#8c887e]">
                        {isSelected ? 'ASSIGNED' : r.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-[#8c887e] leading-relaxed">
              Checked roles will be marked as FILLED by this member. Unchecking will reopen the role for recruitment.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#2b2a29]">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={loading || isSuccess} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={loading || isSuccess}
              type="submit"
              icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {loading ? 'Saving...' : 'Save Assignments'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
