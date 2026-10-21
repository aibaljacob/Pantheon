import React, { useState } from "react";
import { GitCommit, Copy, Check, CheckSquare } from "lucide-react";
import type { RepoCommit } from "../../services/projectRepositoryService";
import { RepoCommitDetailModal } from "./RepoCommitDetailModal";

interface RepoCommitsListProps {
  commits: RepoCommit[];
  projectId?: string;
  accessToken?: string | null;
}

export const RepoCommitsList: React.FC<RepoCommitsListProps> = ({
  commits,
  projectId,
  accessToken,
}) => {
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
        {commits.map((c) => {
          const linkedTasks = c.linkedTasks ?? [];
          return (
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
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#8c887e] flex-wrap">
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
                    <span>·</span>
                    {linkedTasks.length > 0 ? (
                      linkedTasks.map((t) => (
                        <span
                          key={t.id || t.taskNumber}
                          className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-300"
                          title={t.title || undefined}
                        >
                          <CheckSquare className="h-3 w-3 text-amber-400" />
                          {t.taskCode || `TASK-${t.taskNumber}`}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-[#8c887e]/60">
                        No task linked
                      </span>
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
          );
        })}
      </div>

      <RepoCommitDetailModal
        commit={selectedCommit}
        onClose={() => setSelectedCommit(null)}
        projectId={projectId}
        accessToken={accessToken}
      />
    </div>
  );
};
