import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { GitCommit, FileCode, X, CheckSquare, Loader2 } from "lucide-react";
import {
  fetchRepoCommit,
  type RepoCommit,
  type RepoCommitDetail,
  type RepoCommitFileChange,
} from "../../services/projectRepositoryService";

interface RepoCommitDetailModalProps {
  commit: RepoCommit | null;
  onClose: () => void;
  projectId?: string;
  accessToken?: string | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; text: string; style: string }
> = {
  ADDED: {
    label: "A",
    text: "added",
    style: "border-emerald-500/40 bg-emerald-950/40 text-emerald-300",
  },
  MODIFIED: {
    label: "M",
    text: "modified",
    style: "border-amber-500/40 bg-amber-950/40 text-amber-300",
  },
  DELETED: {
    label: "D",
    text: "deleted",
    style: "border-rose-500/40 bg-rose-950/40 text-rose-300",
  },
  RENAMED: {
    label: "R",
    text: "renamed",
    style: "border-cyan-500/40 bg-cyan-950/40 text-cyan-300",
  },
};

export const RepoCommitDetailModal: React.FC<RepoCommitDetailModalProps> = ({
  commit,
  onClose,
  projectId,
  accessToken,
}) => {
  const { id: routeProjectId } = useParams<{ id: string }>();
  const effectiveProjectId = projectId || routeProjectId;

  const [detail, setDetail] = useState<RepoCommitDetail | null>(null);

  useEffect(() => {
    if (!commit || !effectiveProjectId) {
      return;
    }

    let ignore = false;

    fetchRepoCommit(effectiveProjectId, commit.hash, accessToken)
      .then((data) => {
        if (!ignore) setDetail(data);
      })
      .catch((err) => {
        if (!ignore) console.error("Failed to load commit details:", err);
      });

    return () => {
      ignore = true;
    };
  }, [commit, effectiveProjectId, accessToken]);

  if (!commit) return null;

  const isCurrentDetail = detail?.hash === commit.hash;
  const isLoading = Boolean(effectiveProjectId && !isCurrentDetail);
  const activeDetail = isCurrentDetail ? detail : null;

  const fileChanges: RepoCommitFileChange[] =
    activeDetail?.fileChanges ??
    commit.changedFiles.map((path) => ({
      path,
      status: "MODIFIED",
    }));
  const linkedTasks = activeDetail?.linkedTasks ?? commit.linkedTasks ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4 shadow-2xl overflow-hidden font-mono">
        <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-2 text-amber-400">
              <GitCommit className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#ffffff]">
                Commit Details
              </h4>
              <span className="text-xs text-[#8c887e]">{commit.hash}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#363433] bg-[#141312] p-1.5 text-[#8c887e] hover:text-[#ffffff]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3 space-y-2">
            <p className="font-bold text-sm text-[#ffffff]">{commit.message}</p>
            <div className="flex items-center gap-3 text-[11px] text-[#8c887e] flex-wrap">
              <span>Committed by @{commit.author.username}</span>
              <span>·</span>
              <span>{new Date(commit.date).toLocaleString()}</span>
              {linkedTasks.length > 0 && (
                <>
                  <span>·</span>
                  <div className="inline-flex items-center gap-1.5 flex-wrap">
                    {linkedTasks.map((t) => (
                      <span
                        key={t.id || t.taskNumber}
                        className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-950/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-300"
                        title={t.title || undefined}
                      >
                        <CheckSquare className="h-3 w-3 text-amber-400" />
                        {t.taskCode || `TASK-${t.taskNumber}`}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] text-[#8c887e] uppercase">
              Changed Files ({fileChanges.length})
            </span>
            {isLoading ? (
              <div className="flex items-center gap-2 py-4 text-xs text-[#8c887e]">
                <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                <span>Loading changed files...</span>
              </div>
            ) : fileChanges.length === 0 ? (
              <p className="text-xs text-[#8c887e]">
                No file changes recorded for this commit.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {fileChanges.map((file) => {
                  const cfg =
                    STATUS_CONFIG[file.status] ?? STATUS_CONFIG.MODIFIED;
                  return (
                    <div
                      key={file.path}
                      className="flex items-center justify-between rounded-xl border border-[#2b2a29] bg-[#141312] px-3 py-2 text-xs"
                    >
                      <span className="font-semibold text-xs text-[#e6e2df] flex items-center gap-2 truncate">
                        <FileCode className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        {file.oldPath ? (
                          <span className="truncate">
                            <span className="text-[#8c887e] line-through mr-1.5">
                              {file.oldPath}
                            </span>
                            <span>{file.path}</span>
                          </span>
                        ) : (
                          <span className="truncate">{file.path}</span>
                        )}
                      </span>
                      <span
                        className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${cfg.style}`}
                      >
                        {cfg.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
