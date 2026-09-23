import React from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Loader2,
  GitBranch,
  GitCommit,
  Flag,
  User,
  Monitor,
  Laptop,
  Terminal,
  Globe,
} from 'lucide-react';
import type { BuildJobItem, BuildPlatform, BuildStatus } from '../../types';

interface BuildCardProps {
  build: BuildJobItem;
  onClick: (build: BuildJobItem) => void;
}

const STATUS_CONFIG: Record<
  BuildStatus,
  { label: string; icon: React.ReactNode; badgeClass: string }
> = {
  QUEUED: {
    label: 'Queued',
    icon: <Clock className="h-3 w-3" />,
    badgeClass: 'border-amber-800/40 bg-amber-950/20 text-amber-300',
  },
  RUNNING: {
    label: 'Running',
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    badgeClass: 'border-blue-800/50 bg-blue-950/30 text-blue-300 font-semibold',
  },
  SUCCESS: {
    label: 'Success',
    icon: <CheckCircle2 className="h-3 w-3" />,
    badgeClass: 'border-emerald-800/40 bg-emerald-950/20 text-emerald-400',
  },
  FAILED: {
    label: 'Failed',
    icon: <XCircle className="h-3 w-3" />,
    badgeClass: 'border-red-800/50 bg-red-950/30 text-red-400 font-semibold',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: <MinusCircle className="h-3 w-3" />,
    badgeClass: 'border-[#48473f] bg-[#201f1e] text-[#8c887e]',
  },
};

function formatPlatformIcon(platform: BuildPlatform) {
  switch (platform) {
    case 'WINDOWS':
      return <Monitor className="h-3.5 w-3.5" />;
    case 'MAC':
      return <Laptop className="h-3.5 w-3.5" />;
    case 'LINUX':
      return <Terminal className="h-3.5 w-3.5" />;
    case 'WEBGL':
      return <Globe className="h-3.5 w-3.5" />;
  }
}

function formatDuration(seconds?: number | null): string | null {
  if (seconds == null) return null;
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const remSecs = seconds % 60;
  return `${mins}m ${remSecs}s`;
}

export const BuildCard: React.FC<BuildCardProps> = ({ build, onClick }) => {
  const statusCfg = STATUS_CONFIG[build.status] || STATUS_CONFIG.QUEUED;
  const durationStr = formatDuration(build.durationSeconds);

  return (
    <div
      onClick={() => onClick(build)}
      className="group relative cursor-pointer rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 transition-all hover:border-[#48473f] hover:bg-[#181716] space-y-3"
    >
      {/* Top Row: Build # / Platform / Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-amber-400">
            #{build.id.slice(0, 8)}
          </span>
          <span className="flex items-center gap-1 rounded-md border border-[#363433] bg-[#1c1b1a] px-2 py-0.5 text-[11px] font-mono text-[#cac6bc]">
            {formatPlatformIcon(build.targetPlatform)}
            <span>{build.targetPlatform}</span>
          </span>
        </div>

        <span
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-medium ${statusCfg.badgeClass}`}
        >
          {statusCfg.icon}
          <span>{statusCfg.label}</span>
        </span>
      </div>

      {/* Middle Row: Branch, Commit, Milestone */}
      <div className="flex items-center gap-3 text-xs font-mono text-[#8c887e] flex-wrap">
        {build.branchName && (
          <div className="flex items-center gap-1 text-[#e6e2df]">
            <GitBranch className="h-3.5 w-3.5 text-amber-400/80" />
            <span className="font-semibold">{build.branchName}</span>
          </div>
        )}

        {build.commitHash && (
          <div className="flex items-center gap-1 text-[#cac6bc]">
            <GitCommit className="h-3.5 w-3.5 text-[#8c887e]" />
            <span>{build.commitHash.slice(0, 7)}</span>
          </div>
        )}

        {build.milestone && (
          <div className="flex items-center gap-1 rounded border border-[#363433] bg-[#1c1b1a] px-1.5 py-0.5 text-[10px] text-amber-300/90">
            <Flag className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{build.milestone.title}</span>
          </div>
        )}
      </div>

      {/* Bottom Row: Triggered By, Created Time, Duration */}
      <div className="flex items-center justify-between border-t border-[#201f1e] pt-2.5 text-xs text-[#8c887e]">
        <div className="flex items-center gap-2">
          {build.triggeredBy.avatarUrl ? (
            <img
              src={build.triggeredBy.avatarUrl}
              alt={build.triggeredBy.displayName}
              className="h-5 w-5 rounded-full object-cover border border-[#363433]"
            />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#201f1e] text-[#cac6bc] text-[10px]">
              <User className="h-3 w-3" />
            </div>
          )}
          <span className="font-mono text-[11px] text-[#cac6bc]">
            @{build.triggeredBy.username}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          {durationStr && (
            <span className="rounded bg-[#201f1e] px-1.5 py-0.5 text-amber-300">
              {durationStr}
            </span>
          )}
          <span>{new Date(build.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};
