import React, { useState } from 'react';
import {
  GitCommit,
  Copy,
  Check,
  FileCode,
  X,
} from 'lucide-react';
import type { RepoCommit } from '../../services/projectRepositoryService';

interface RepoCommitsListProps {
  commits: RepoCommit[];
}

export const RepoCommitsList: React.FC<RepoCommitsListProps> = ({ commits }) => {
  const [selectedCommit, setSelectedCommit] = useState<RepoCommit | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3 text-xs text-[#8c887e]">
        <span>Commit History ({commits.length} commits)</span>
      </div>

      <div className="space-y-3">
        {commits.map((c) => (
          <div
            key={c.hash}
            onClick={() => setSelectedCommit(c)}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 transition-all hover:border-[#363433] cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-2 text-amber-400 shrink-0">
                <GitCommit className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-xs text-[#ffffff] group-hover:text-amber-200 transition-colors">
                  {c.message}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8c887e]">
                  <span>@{c.author.username}</span>
                  <span>·</span>
                  <span>{new Date(c.date).toLocaleDateString()}</span>
                  {c.branch && (
                    <>
                      <span>·</span>
                      <span className="rounded-md border border-[#363433] bg-[#141312] px-1.5 py-0.2 text-[9px] text-amber-300">
                        {c.branch}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={(e) => handleCopy(c.hash, e)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#363433] bg-[#141312] px-2.5 py-1 text-xs text-[#cac6bc] hover:text-[#ffffff] transition-colors"
                title="Copy SHA"
              >
                {copiedHash === c.hash ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>{c.hash}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Commit Detail & Diff Modal */}
      {selectedCommit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4 shadow-2xl overflow-hidden font-mono">
            <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-2 text-amber-400">
                  <GitCommit className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#ffffff]">Commit Details</h4>
                  <span className="text-xs text-[#8c887e]">{selectedCommit.hash}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCommit(null)}
                className="rounded-xl border border-[#363433] bg-[#141312] p-1.5 text-[#8c887e] hover:text-[#ffffff]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3 space-y-1">
                <p className="font-bold text-sm text-[#ffffff]">{selectedCommit.message}</p>
                <p className="text-[11px] text-[#8c887e]">
                  Committed by @{selectedCommit.author.username} on{' '}
                  {new Date(selectedCommit.date).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] text-[#8c887e] uppercase">
                  Changed Files ({selectedCommit.changedFiles.length})
                </span>
                <div className="space-y-2">
                  {selectedCommit.changedFiles.map((file) => (
                    <div
                      key={file}
                      className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-[#e6e2df] flex items-center gap-1.5">
                          <FileCode className="h-3.5 w-3.5 text-amber-400" />
                          {file}
                        </span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          +18 -2 lines
                        </span>
                      </div>
                      <div className="bg-[#1c1b1a] rounded-lg p-2 text-[11px] text-[#cac6bc] leading-relaxed overflow-x-auto">
                        <p className="text-emerald-400">+ // Optimized rendering passes and memory buffer</p>
                        <p className="text-emerald-400">+ SetReplicatedLifetime(true);</p>
                        <p className="text-red-400">- // Legacy fallback implementation</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
