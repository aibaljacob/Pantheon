import React, { useState } from 'react';
import { X, UserMinus, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../auth/store/authStore';
import { removeProjectMember } from '../services/projectService';
import type { ProjectActiveTeamMember } from '../types';

interface RemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  member: ProjectActiveTeamMember | null;
  onSuccess: () => void;
}

export const RemoveMemberModal: React.FC<RemoveMemberModalProps> = ({
  isOpen,
  onClose,
  projectId,
  member,
  onSuccess,
}) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !member) return null;

  const handleConfirm = async () => {
    if (!accessToken) {
      setError('You must be logged in as the project founder.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await removeProjectMember(projectId, member.id, accessToken);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-mono">
      <div className="relative w-full max-w-md rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 bg-red-950/20 text-red-400">
              <UserMinus className="h-4 w-4" />
            </div>
            <h3 className="font-headline text-lg font-bold text-[#ffffff]">
              Remove Member
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8c887e] hover:bg-[#201f1e] hover:text-[#ffffff] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Member removed from active team.</span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          <p className="text-[#cac6bc] leading-relaxed">
            Are you sure you want to remove <span className="font-bold text-[#ffffff]">{member.displayName}</span> (@{member.username}) from the project?
          </p>

          <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-3 space-y-2 text-[#cac6bc]">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>What happens next:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-[#8c887e]">
              <li>Membership status changes to <span className="text-[#cac6bc] font-mono">REMOVED</span> (no hard delete).</li>
              {member.projectRoleId ? (
                <li>Occupied role (<span className="text-amber-300 font-mono">{member.projectRoleTitle || member.projectRoleName}</span>) will reopen for recruitment.</li>
              ) : (
                <li>General membership access will be revoked.</li>
              )}
              <li>Historical participation and credit remain preserved.</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#2b2a29]">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={loading || isSuccess}
            type="button"
          >
            Cancel
          </Button>
          <button
            onClick={handleConfirm}
            disabled={loading || isSuccess}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-950/30 px-3.5 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-900/40 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {loading ? 'Removing...' : 'Confirm Removal'}
          </button>
        </div>
      </div>
    </div>
  );
};
