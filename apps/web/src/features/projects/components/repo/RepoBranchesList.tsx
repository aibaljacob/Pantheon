import React from 'react';
import { GitBranch, GitCommit } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import type { RepoBranch } from '../../services/projectRepositoryService';

interface RepoBranchesListProps {
  branches: RepoBranch[];
  currentBranch: string;
  onSelectBranch: (branch: string) => void;
}

export const RepoBranchesList: React.FC<RepoBranchesListProps> = ({
  branches,
  currentBranch,
  onSelectBranch,
}) => {
  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3 text-xs text-[#8c887e]">
        <span>Repository Branches ({branches.length})</span>
      </div>

      {/* Git Branch Management Guidance */}
      <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 text-xs space-y-1.5">
        <p className="font-bold text-[#ffffff] flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-amber-400" />
          Native Git Branch Workflow
        </p>
        <p className="text-[#8c887e] text-[11px] leading-relaxed">
          Branches are managed using your local Git client and synchronized when you push. To create and publish a new branch, run:
        </p>
        <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
          <code className="rounded-lg border border-[#363433] bg-[#1c1b1a] px-2.5 py-1 text-amber-300">
            git checkout -b &lt;branch-name&gt;
          </code>
          <code className="rounded-lg border border-[#363433] bg-[#1c1b1a] px-2.5 py-1 text-amber-300">
            git push -u origin &lt;branch-name&gt;
          </code>
        </div>
      </div>

      <div className="space-y-3">
        {branches.map((b) => (
          <div
            key={b.name}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 transition-all hover:border-[#363433]"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-[#363433] bg-[#141312] p-2 text-amber-400">
                <GitBranch className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#ffffff]">{b.name}</span>
                  {b.isDefault && (
                    <span className="rounded-full border border-amber-500/40 bg-amber-950/30 px-2 py-0.2 text-[9px] text-amber-300 font-bold">
                      default
                    </span>
                  )}
                  {b.name === currentBranch && (
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-950/30 px-2 py-0.2 text-[9px] text-emerald-400 font-bold">
                      active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8c887e]">
                  <span className="flex items-center gap-1">
                    <GitCommit className="h-3 w-3 text-amber-400" /> {b.lastCommitHash}
                  </span>
                  <span>·</span>
                  <span>Updated {new Date(b.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {b.name !== currentBranch && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSelectBranch(b.name)}
              >
                Switch to Branch
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
