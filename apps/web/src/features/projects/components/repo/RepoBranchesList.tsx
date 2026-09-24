import React, { useState } from 'react';
import { GitBranch, GitCommit } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import type { RepoBranch } from '../../services/projectRepositoryService';

interface RepoBranchesListProps {
  branches: RepoBranch[];
  currentBranch: string;
  onSelectBranch: (branch: string) => void;
  onCreateBranch: (name: string, sourceBranch: string) => Promise<void>;
}

export const RepoBranchesList: React.FC<RepoBranchesListProps> = ({
  branches,
  currentBranch,
  onSelectBranch,
  onCreateBranch,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [sourceBranch, setSourceBranch] = useState(currentBranch || 'main');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    setIsCreating(true);
    setError(null);
    try {
      await onCreateBranch(newBranchName.trim(), sourceBranch);
      setIsModalOpen(false);
      setNewBranchName('');
    } catch (err: any) {
      setError(err.message || 'Failed to create branch.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3 text-xs text-[#8c887e]">
        <span>Repository Branches ({branches.length})</span>
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

      {/* Create Branch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4 shadow-2xl font-mono">
            <h4 className="font-headline text-base font-bold text-[#ffffff]">Create New Branch</h4>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-2.5 text-xs text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8c887e] mb-1">Branch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="feature/weapon-recoil"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#8c887e] mb-1">Source Branch</label>
                <select
                  value={sourceBranch}
                  onChange={(e) => setSourceBranch(e.target.value)}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
                >
                  {branches.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-[#2b2a29]">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Branch'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
