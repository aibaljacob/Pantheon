import React, { useState } from 'react';
import { X, AlertCircle, Cpu, Monitor, Laptop, Terminal, Globe } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import type { BuildPlatform, CreateBuildInput, MilestoneItem } from '../../types';

interface CreateBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrigger: (input: CreateBuildInput) => Promise<any>;
  milestones: MilestoneItem[];
}

const PLATFORMS: Array<{ id: BuildPlatform; label: string; icon: React.ReactNode }> = [
  { id: 'WINDOWS', label: 'Windows (x64)', icon: <Monitor className="h-4 w-4" /> },
  { id: 'MAC', label: 'macOS (Universal)', icon: <Laptop className="h-4 w-4" /> },
  { id: 'LINUX', label: 'Linux (x86_64)', icon: <Terminal className="h-4 w-4" /> },
  { id: 'WEBGL', label: 'WebGL (Browser)', icon: <Globe className="h-4 w-4" /> },
];

export const CreateBuildModal: React.FC<CreateBuildModalProps> = ({
  isOpen,
  onClose,
  onTrigger,
  milestones,
}) => {
  const [targetPlatform, setTargetPlatform] = useState<BuildPlatform>('WINDOWS');
  const [branchName, setBranchName] = useState('main');
  const [commitHash, setCommitHash] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onTrigger({
        targetPlatform,
        branchName: branchName.trim() || undefined,
        commitHash: commitHash.trim() || undefined,
        milestoneId: milestoneId || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to trigger build.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl border border-[#363433] bg-[#141312] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-headline text-lg font-bold text-[#ffffff]">Trigger Build Job</h2>
              <p className="text-xs font-mono text-[#8c887e]">
                Queue a build targeting your selected platform.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#363433] text-[#8c887e] hover:text-[#ffffff] hover:border-[#48473f] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs font-mono text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Platform Selection */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-[#cac6bc]">
              Target Platform *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((p) => {
                const isSelected = targetPlatform === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setTargetPlatform(p.id)}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-amber-400/80 bg-amber-950/30 text-[#ffffff] shadow-sm'
                        : 'border-[#2b2a29] bg-[#1c1b1a] text-[#8c887e] hover:border-[#363433] hover:text-[#cac6bc]'
                    }`}
                  >
                    <div className={isSelected ? 'text-amber-400' : 'text-[#8c887e]'}>
                      {p.icon}
                    </div>
                    <span className="text-xs font-mono font-medium">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Branch Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-[#cac6bc]">
              Git Branch
            </label>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="main"
              className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2.5 text-xs font-mono text-[#ffffff] focus:border-[#cac6bc] focus:outline-none"
            />
          </div>

          {/* Commit Hash */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-[#cac6bc]">
              Commit Hash (Optional)
            </label>
            <input
              type="text"
              value={commitHash}
              onChange={(e) => setCommitHash(e.target.value)}
              placeholder="e.g. 7f8a9b2"
              className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2.5 text-xs font-mono text-[#ffffff] focus:border-[#cac6bc] focus:outline-none"
            />
          </div>

          {/* Associated Milestone */}
          {milestones.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-[#cac6bc]">
                Milestone (Optional)
              </label>
              <select
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2.5 text-xs font-mono text-[#ffffff] focus:border-[#cac6bc] focus:outline-none"
              >
                <option value="">No Milestone Attached</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} {m.isCompleted ? '(Completed)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#201f1e]">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Queueing...' : 'Trigger Build'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
