import React, { useState } from 'react';
import { X, AlertCircle, Package } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import type {
  BuildPlatform,
  CreatePlayableBuildInput,
  MilestoneItem,
  PlayableBuildItem,
} from '../../types';

interface CreatePlayableBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: CreatePlayableBuildInput) => Promise<PlayableBuildItem>;
  milestones: MilestoneItem[];
}

export const CreatePlayableBuildModal: React.FC<CreatePlayableBuildModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  milestones,
}) => {
  const [version, setVersion] = useState('v0.1.0');
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<BuildPlatform>('WINDOWS');
  const [milestoneId, setMilestoneId] = useState('');
  const [storagePath, setStoragePath] = useState('');
  const [fileSizeBytes, setFileSizeBytes] = useState<string>('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim() || !title.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreate({
        version: version.trim(),
        title: title.trim(),
        platform,
        milestoneId: milestoneId || undefined,
        storagePath: storagePath.trim() || undefined,
        fileSizeBytes: fileSizeBytes ? Number(fileSizeBytes) : undefined,
        releaseNotes: releaseNotes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register playable build.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl border border-[#363433] bg-[#141312] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-headline text-lg font-bold text-[#ffffff]">
                Register Playable Build
              </h2>
              <p className="text-xs font-mono text-[#8c887e]">
                Publish a playable game package or release checkpoint.
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-[#cac6bc]">
                Version *
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v0.1.0"
                className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2.5 text-xs font-mono text-[#ffffff] focus:border-[#cac6bc] focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-[#cac6bc]">
                Platform *
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as BuildPlatform)}
                className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2.5 text-xs font-mono text-[#ffffff] focus:border-[#cac6bc] focus:outline-none"
              >
                <option value="WINDOWS">Windows</option>
                <option value="MAC">macOS</option>
                <option value="LINUX">Linux</option>
                <option value="WEBGL">WebGL</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-[#cac6bc]">
              Build Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Combat Vertical Slice"
              className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2.5 text-xs font-mono text-[#ffffff] focus:border-[#cac6bc] focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-[#cac6bc]">
              Storage Path / Download URI
            </label>
            <input
              type="text"
              value={storagePath}
              onChange={(e) => setStoragePath(e.target.value)}
              placeholder="e.g. builds/cyber-odyssey/v0.1.0.zip"
              className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2.5 text-xs font-mono text-[#ffffff] focus:border-[#cac6bc] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-[#cac6bc]">
                Size in Bytes (Optional)
              </label>
              <input
                type="number"
                value={fileSizeBytes}
                onChange={(e) => setFileSizeBytes(e.target.value)}
                placeholder="250000000"
                className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2.5 text-xs font-mono text-[#ffffff] focus:border-[#cac6bc] focus:outline-none"
              />
            </div>

            {milestones.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-[#cac6bc]">
                  Milestone
                </label>
                <select
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2.5 text-xs font-mono text-[#ffffff] focus:border-[#cac6bc] focus:outline-none"
                >
                  <option value="">No Milestone</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-[#cac6bc]">
              Release Notes
            </label>
            <textarea
              rows={3}
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              placeholder="Summary of changes, new mechanics, or bug fixes..."
              className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] p-3 text-xs font-mono text-[#ffffff] focus:border-[#cac6bc] focus:outline-none"
            />
          </div>

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
              {isSubmitting ? 'Registering...' : 'Register Release'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
