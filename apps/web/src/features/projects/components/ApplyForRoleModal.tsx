import React, { useState } from 'react';
import { Send, X, Briefcase, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../auth/store/authStore';
import { applyToProjectRole } from '../services/projectApplicationService';
import type { ProjectRoleItem } from '../types';

interface ApplyForRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  role: ProjectRoleItem;
  onSuccess: () => void;
}

export const ApplyForRoleModal: React.FC<ApplyForRoleModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  role,
  onSuccess,
}) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const accessToken = useAuthStore((state) => state.accessToken);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setError('You must be logged in to apply for this role.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await applyToProjectRole(accessToken, projectId, role.id, message.trim() || undefined);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn font-mono">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-2.5 text-amber-400">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-headline text-base font-bold text-[#ffffff]">
                Apply for Position
              </h3>
              <p className="text-xs text-[#8c887e]">
                {projectName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#363433] bg-[#141312] p-2 text-[#8c887e] hover:text-[#ffffff] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Role Brief Summary */}
        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-bold text-sm text-[#ffffff]">
              {role.title || role.roleName}
            </span>
            <span className="rounded-full border border-amber-500/30 bg-amber-950/20 px-2.5 py-0.5 text-[10px] text-amber-300">
              {role.roleName}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#8c887e] flex-wrap">
            <span>{role.experienceLevel}</span>
            <span>·</span>
            <span>{role.commitment.replace('_', ' ')}</span>
          </div>

          {role.requiredSkills.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {role.requiredSkills.map((s) => (
                <span
                  key={s.id}
                  className="rounded-md border border-[#363433] bg-[#1c1b1a] px-2 py-0.5 text-[10px] text-[#cac6bc]"
                >
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Application submitted successfully! The founder will review your profile.</span>
          </div>
        )}

        {/* Form */}
        {!isSuccess && (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block text-[#cac6bc] font-semibold">
                Pitch / Cover Note (Optional)
              </label>
              <textarea
                rows={4}
                maxLength={1000}
                placeholder="Introduce yourself, highlight your engine and gameplay experience, and share why you want to contribute to this production..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-2xl border border-[#363433] bg-[#141312] p-3 text-[#e6e2df] placeholder-[#8c887e] focus:border-[#e6e2df] focus:outline-none"
              />
              <span className="block text-right text-[10px] text-[#8c887e]">
                {message.length} / 1000
              </span>
            </div>

            <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3 text-[11px] text-[#8c887e] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Your verified skills, portfolio pieces, and CV will be shared automatically with the founder.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#2b2a29]">
              <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={loading}
                icon={<Send className="h-3.5 w-3.5" />}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
