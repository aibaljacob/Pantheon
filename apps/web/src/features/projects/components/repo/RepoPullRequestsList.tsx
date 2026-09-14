import React, { useState } from 'react';
import {
  GitPullRequest,
  Plus,
  GitMerge,
  X,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import type { RepoPullRequest, RepoBranch } from '../../services/projectRepositoryService';

interface RepoPullRequestsListProps {
  pullRequests: RepoPullRequest[];
  branches: RepoBranch[];
  onCreatePullRequest: (
    title: string,
    description: string,
    sourceBranch: string,
    targetBranch: string,
  ) => Promise<void>;
  onMergePullRequest: (prNumber: number) => Promise<void>;
}

export const RepoPullRequestsList: React.FC<RepoPullRequestsListProps> = ({
  pullRequests,
  branches,
  onCreatePullRequest,
  onMergePullRequest,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'MERGED'>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPr, setSelectedPr] = useState<RepoPullRequest | null>(null);

  // New PR form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceBranch, setSourceBranch] = useState(
    branches.length > 1 ? branches[1].name : (branches[0]?.name || 'main'),
  );
  const [targetBranch, setTargetBranch] = useState(branches[0]?.name || 'main');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = pullRequests.filter((pr) => {
    if (filter === 'ALL') return true;
    return pr.status === filter;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (sourceBranch === targetBranch) {
      setError('Source branch and target branch must be different.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreatePullRequest(title.trim(), description.trim(), sourceBranch, targetBranch);
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Failed to create pull request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMerge = async (prNumber: number) => {
    if (!window.confirm(`Merge Pull Request #${prNumber}?`)) return;
    setIsMerging(true);
    try {
      await onMergePullRequest(prNumber);
      if (selectedPr && selectedPr.number === prNumber) {
        setSelectedPr((prev) => (prev ? { ...prev, status: 'MERGED' } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to merge pull request.');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Filter and New PR Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2b2a29] pb-3 text-xs">
        <div className="flex items-center gap-2">
          {(['ALL', 'OPEN', 'MERGED'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-xl text-xs transition-colors ${
                filter === f
                  ? 'bg-amber-950/40 border border-amber-500/40 text-amber-300 font-bold'
                  : 'text-[#8c887e] hover:text-[#ffffff]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          icon={<Plus className="h-3.5 w-3.5" />}
        >
          New Pull Request
        </Button>
      </div>

      {/* PR Cards List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-8 text-center text-xs text-[#8c887e]">
            No pull requests found matching the current filter.
          </div>
        ) : (
          filtered.map((pr) => (
            <div
              key={pr.id}
              onClick={() => setSelectedPr(pr)}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 transition-all hover:border-[#363433] cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-xl border p-2 shrink-0 ${
                    pr.status === 'OPEN'
                      ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400'
                      : pr.status === 'MERGED'
                      ? 'border-amber-500/30 bg-amber-950/20 text-amber-400'
                      : 'border-[#363433] bg-[#141312] text-[#8c887e]'
                  }`}
                >
                  <GitPullRequest className="h-4 w-4" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-[#ffffff] group-hover:text-amber-200 transition-colors">
                      #{pr.number} {pr.title}
                    </span>
                    <span
                      className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${
                        pr.status === 'OPEN'
                          ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-400'
                          : pr.status === 'MERGED'
                          ? 'border-amber-500/40 bg-amber-950/30 text-amber-300'
                          : 'border-[#48473f] bg-[#201f1e] text-[#8c887e]'
                      }`}
                    >
                      ● {pr.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8c887e]">
                    <span>@{pr.author.username}</span>
                    <span>wants to merge</span>
                    <span className="rounded bg-[#141312] px-1.5 py-0.2 text-amber-300">
                      {pr.sourceBranch}
                    </span>
                    <span>into</span>
                    <span className="rounded bg-[#141312] px-1.5 py-0.2 text-[#e6e2df]">
                      {pr.targetBranch}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-[#8c887e] shrink-0 self-end sm:self-auto">
                <span>{pr.changedFilesCount} files changed</span>
                <span>·</span>
                <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create PR Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
              <h4 className="font-headline text-base font-bold text-[#ffffff]">Open a Pull Request</h4>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl border border-[#363433] bg-[#141312] p-1.5 text-[#8c887e] hover:text-[#ffffff]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-2.5 text-xs text-red-300">
                {error}
              </div>
            )}

            {branches.length < 2 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-300">
                You currently have only one branch. To open a pull request, create a feature or development branch in the Branches tab first.
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#141312] border border-[#2b2a29] rounded-xl p-3">
                <div>
                  <label className="block text-[#8c887e] mb-1">Source Branch</label>
                  <select
                    value={sourceBranch}
                    onChange={(e) => setSourceBranch(e.target.value)}
                    className="w-full rounded-lg border border-[#363433] bg-[#1c1b1a] px-2.5 py-1.5 text-[#e6e2df] focus:outline-none"
                  >
                    {branches.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#8c887e] mb-1">Target Branch</label>
                  <select
                    value={targetBranch}
                    onChange={(e) => setTargetBranch(e.target.value)}
                    className="w-full rounded-lg border border-[#363433] bg-[#1c1b1a] px-2.5 py-1.5 text-[#e6e2df] focus:outline-none"
                  >
                    {branches.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#8c887e] mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="feat: Player movement and dash state machine"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2 text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#8c887e] mb-1">Description</label>
                <textarea
                  rows={4}
                  placeholder="Summary of changes and gameplay tests..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] p-3 text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-[#2b2a29]">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isSubmitting || branches.length < 2 || sourceBranch === targetBranch}
                >
                  {isSubmitting ? 'Opening PR...' : 'Create Pull Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PR Details Modal */}
      {selectedPr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
              <div>
                <h4 className="font-headline text-base font-bold text-[#ffffff]">
                  #{selectedPr.number} {selectedPr.title}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-[#8c887e]">
                  <span className="text-amber-300">{selectedPr.sourceBranch}</span>
                  <span>→</span>
                  <span className="text-[#e6e2df]">{selectedPr.targetBranch}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPr(null)}
                className="rounded-xl border border-[#363433] bg-[#141312] p-1.5 text-[#8c887e] hover:text-[#ffffff]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-[#2b2a29] bg-[#141312] p-4 space-y-2">
                <span className="text-[10px] uppercase text-[#8c887e]">Description</span>
                <p className="text-sm text-[#e6e2df] font-sans leading-relaxed">
                  {selectedPr.description || 'No description provided.'}
                </p>
                <div className="pt-2 text-[11px] text-[#8c887e] flex items-center gap-3">
                  <span>Opened by @{selectedPr.author.username}</span>
                  <span>·</span>
                  <span>{new Date(selectedPr.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {selectedPr.status === 'MERGED' && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-amber-300">
                  <GitMerge className="h-4 w-4" />
                  <span>Merged into {selectedPr.targetBranch}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#2b2a29]">
              {selectedPr.status === 'OPEN' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleMerge(selectedPr.number)}
                  disabled={isMerging}
                  icon={<GitMerge className="h-3.5 w-3.5" />}
                >
                  {isMerging ? 'Merging...' : 'Merge Pull Request'}
                </Button>
              ) : (
                <span className="text-xs text-[#8c887e]">Completed</span>
              )}
              <Button variant="secondary" size="sm" onClick={() => setSelectedPr(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
