import React, { useState } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Loader2,
  GitBranch,
  GitCommit,
  Flag,
  User,
  Terminal,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import type { BuildJobItem, BuildStatus } from '../../types';

interface BuildDetailModalProps {
  build: BuildJobItem;
  isOpen: boolean;
  onClose: () => void;
  onCancelBuild?: (buildId: string) => Promise<any>;
  canCancel: boolean;
}

const STATUS_CONFIG: Record<
  BuildStatus,
  { label: string; icon: React.ReactNode; badgeClass: string }
> = {
  QUEUED: {
    label: 'Queued',
    icon: <Clock className="h-3.5 w-3.5" />,
    badgeClass: 'border-amber-800/40 bg-amber-950/20 text-amber-300',
  },
  RUNNING: {
    label: 'Running',
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    badgeClass: 'border-blue-800/50 bg-blue-950/30 text-blue-300 font-semibold',
  },
  SUCCESS: {
    label: 'Success',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    badgeClass: 'border-emerald-800/40 bg-emerald-950/20 text-emerald-400',
  },
  FAILED: {
    label: 'Failed',
    icon: <XCircle className="h-3.5 w-3.5" />,
    badgeClass: 'border-red-800/50 bg-red-950/30 text-red-400 font-semibold',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: <MinusCircle className="h-3.5 w-3.5" />,
    badgeClass: 'border-[#48473f] bg-[#201f1e] text-[#8c887e]',
  },
};

function formatDuration(seconds?: number | null): string | null {
  if (seconds == null) return null;
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const remSecs = seconds % 60;
  return `${mins}m ${remSecs}s`;
}

export const BuildDetailModal: React.FC<BuildDetailModalProps> = ({
  build,
  isOpen,
  onClose,
  onCancelBuild,
  canCancel,
}) => {
  const [copied, setCopied] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen) return null;

  const statusCfg = STATUS_CONFIG[build.status] || STATUS_CONFIG.QUEUED;
  const durationStr = formatDuration(build.durationSeconds);
  const isTerminal =
    build.status === 'SUCCESS' ||
    build.status === 'FAILED' ||
    build.status === 'CANCELLED';

  const handleCopyLogs = () => {
    if (!build.buildLogs) return;
    navigator.clipboard.writeText(build.buildLogs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = async () => {
    if (!onCancelBuild) return;
    if (!window.confirm('Are you sure you want to cancel this build job?')) return;

    setIsCancelling(true);
    setActionError(null);
    try {
      await onCancelBuild(build.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel build.';
      setActionError(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-[#363433] bg-[#141312] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2b2a29] p-5 sm:p-6 bg-[#1c1b1a]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-amber-400">
                #{build.id.slice(0, 8)}
              </span>
              <span className="rounded-md border border-[#363433] bg-[#141312] px-2 py-0.5 text-xs font-mono text-[#cac6bc]">
                {build.targetPlatform}
              </span>
            </div>

            <span
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-mono font-medium ${statusCfg.badgeClass}`}
            >
              {statusCfg.icon}
              <span>{statusCfg.label}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isTerminal && canCancel && onCancelBuild && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancel}
                disabled={isCancelling}
                className="!border-red-900/40 text-red-400 hover:bg-red-950/20"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Build'}
              </Button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[#363433] text-[#8c887e] hover:text-[#ffffff] hover:border-[#48473f] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {actionError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs font-mono text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Failure banner if FAILED */}
          {build.status === 'FAILED' && build.errorMessage && (
            <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-4 space-y-1 text-red-300">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
                Failure Diagnostic
              </p>
              <p className="text-xs font-mono leading-relaxed">{build.errorMessage}</p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-[#2b2a29] bg-[#1c1b1a] p-3 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c887e]">
                Branch
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#ffffff]">
                <GitBranch className="h-3.5 w-3.5 text-amber-400" />
                <span className="truncate">{build.branchName || 'main'}</span>
              </div>
            </div>

            <div className="rounded-xl border border-[#2b2a29] bg-[#1c1b1a] p-3 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c887e]">
                Commit
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#cac6bc]">
                <GitCommit className="h-3.5 w-3.5 text-[#8c887e]" />
                <span>{build.commitHash ? build.commitHash.slice(0, 7) : 'HEAD'}</span>
              </div>
            </div>

            <div className="rounded-xl border border-[#2b2a29] bg-[#1c1b1a] p-3 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c887e]">
                Milestone
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono text-amber-300/90 truncate">
                <Flag className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{build.milestone?.title || 'None'}</span>
              </div>
            </div>

            <div className="rounded-xl border border-[#2b2a29] bg-[#1c1b1a] p-3 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c887e]">
                Duration
              </span>
              <p className="text-xs font-mono font-semibold text-amber-300">
                {durationStr || (build.status === 'RUNNING' ? 'In progress' : '—')}
              </p>
            </div>
          </div>

          {/* Timeline Details */}
          <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-[#8c887e]">
            <div>
              <span className="text-[10px] uppercase text-[#66645c] block mb-0.5">Created</span>
              <span className="text-[#cac6bc]">
                {new Date(build.createdAt).toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-[#66645c] block mb-0.5">Started</span>
              <span className="text-[#cac6bc]">
                {build.startedAt ? new Date(build.startedAt).toLocaleString() : 'Pending'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-[#66645c] block mb-0.5">Completed</span>
              <span className="text-[#cac6bc]">
                {build.completedAt ? new Date(build.completedAt).toLocaleString() : 'Pending'}
              </span>
            </div>
          </div>

          {/* Triggered By Info */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-3">
            {build.triggeredBy.avatarUrl ? (
              <img
                src={build.triggeredBy.avatarUrl}
                alt={build.triggeredBy.displayName}
                className="h-8 w-8 rounded-full object-cover border border-[#48473f]"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#201f1e] text-[#cac6bc] border border-[#363433]">
                <User className="h-4 w-4" />
              </div>
            )}
            <div>
              <span className="text-xs font-mono font-bold text-[#ffffff]">
                {build.triggeredBy.displayName}
              </span>
              <p className="text-[11px] font-mono text-[#8c887e]">
                Triggered by @{build.triggeredBy.username}
              </p>
            </div>
          </div>

          {/* Build Logs Terminal Console */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#cac6bc]">
                  Execution Logs
                </span>
              </div>
              {build.buildLogs && (
                <button
                  type="button"
                  onClick={handleCopyLogs}
                  className="flex items-center gap-1.5 text-xs font-mono text-[#8c887e] hover:text-[#ffffff] transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Logs</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-[#2b2a29] bg-[#0c0b0a] p-4 font-mono text-xs text-[#cac6bc] leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap select-text">
              {build.buildLogs ? (
                build.buildLogs
              ) : (
                <span className="text-[#66645c] italic">
                  No log output recorded yet for this build job.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
