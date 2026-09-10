import React, { useState } from 'react';
import { X, Send, UserCheck, Briefcase, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useAuthStore } from '../../auth/store/authStore';
import { formatApiAssetUrl } from '../../profile/services/profileService';
import type { ProjectRoleItem } from '../types';
import { sendProjectRoleInvitation } from '../services/talentMatchingService';
import type { CandidateProfileSummary } from '../services/talentMatchingService';

interface InviteCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  role: ProjectRoleItem;
  candidate: CandidateProfileSummary;
  onSuccess: () => void;
}

export const InviteCandidateModal: React.FC<InviteCandidateModalProps> = ({
  isOpen,
  onClose,
  projectId,
  role,
  candidate,
  onSuccess,
}) => {
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const accessToken = useAuthStore((state) => state.accessToken);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await sendProjectRoleInvitation(
        accessToken,
        projectId,
        role.id,
        candidate.id,
        message.trim() || undefined,
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-emerald-400" />
            <h2 className="font-headline text-lg font-bold text-[#ffffff]">Invite Candidate</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#363433] bg-[#141312] p-1.5 text-[#8c887e] hover:text-[#ffffff] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Candidate & Role Review Card */}
        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 space-y-4 font-mono text-xs">
          {/* Candidate Summary */}
          <div className="flex items-center gap-3">
            {candidate.avatarUrl ? (
              <img
                src={formatApiAssetUrl(candidate.avatarUrl)}
                alt={candidate.displayName}
                className="h-10 w-10 rounded-full object-cover border border-[#48473f]"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-[#201f1e] border border-[#48473f] flex items-center justify-center font-bold text-xs text-[#ffffff]">
                {candidate.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-bold text-[#ffffff]">{candidate.displayName}</p>
              <p className="text-[#8c887e]">@{candidate.username} · {candidate.headline || 'Game Developer'}</p>
            </div>
          </div>

          {/* Role Summary */}
          <div className="flex items-center justify-between border-t border-[#2b2a29] pt-3 text-[11px]">
            <div className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-[#8c887e]" />
              <span className="text-[#8c887e]">Target Role:</span>
              <span className="font-bold text-[#ffffff]">{role.title || role.roleName}</span>
            </div>
            <Badge variant="accent" className="text-[9px]">
              {role.commitment.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block font-mono text-xs text-[#cac6bc]">
              Personalized Invitation Message <span className="text-[#8c887e]">(Optional)</span>
            </label>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="e.g. Hi! Your Unreal 5 and C++ background is a great fit for our upcoming RPG prototype..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-2xl border border-[#363433] bg-[#141312] p-3 text-xs text-[#e6e2df] placeholder-[#8c887e] focus:border-[#e6e2df] focus:outline-none"
            />
            <p className="text-[10px] font-mono text-right text-[#8c887e]">
              {message.length} / 500 characters
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3 text-[11px] font-mono text-[#8c887e] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Sending this invitation notifies the candidate. Team membership is confirmed only upon candidate acceptance.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              icon={isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            >
              {isSubmitting ? 'Sending Invitation...' : 'Send Official Invitation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
