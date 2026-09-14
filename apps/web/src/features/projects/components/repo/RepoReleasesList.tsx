import React, { useState } from 'react';
import { Tag, Plus, Download, Package, X } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import type { RepoRelease, RepoBranch } from '../../services/projectRepositoryService';

interface RepoReleasesListProps {
  releases: RepoRelease[];
  branches: RepoBranch[];
  onCreateRelease: (
    tagName: string,
    title: string,
    description: string,
    targetBranch: string,
  ) => Promise<void>;
}

export const RepoReleasesList: React.FC<RepoReleasesListProps> = ({
  releases,
  branches,
  onCreateRelease,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [tagName, setTagName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetBranch, setTargetBranch] = useState('main');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim() || !title.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreateRelease(tagName.trim(), title.trim(), description.trim(), targetBranch);
      setIsCreateOpen(false);
      setTagName('');
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Failed to create release.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3 text-xs text-[#8c887e]">
        <span>Releases & Builds ({releases.length})</span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          icon={<Plus className="h-3.5 w-3.5" />}
        >
          Draft a New Release
        </Button>
      </div>

      <div className="space-y-4">
        {releases.length === 0 ? (
          <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-8 text-center text-xs text-[#8c887e]">
            No releases or milestone builds published yet.
          </div>
        ) : (
          releases.map((rel) => (
            <div
              key={rel.id}
              className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2b2a29] pb-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-3 py-1 text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    {rel.tagName}
                  </span>
                  <h4 className="font-headline text-base font-bold text-[#ffffff]">{rel.title}</h4>
                </div>
                <span className="text-xs text-[#8c887e]">
                  Published {new Date(rel.publishedAt).toLocaleDateString()} by @{rel.author.username}
                </span>
              </div>

              {rel.description && (
                <p className="text-xs text-[#cac6bc] leading-relaxed font-sans whitespace-pre-line">
                  {rel.description}
                </p>
              )}

              {/* Assets / Builds Download Section */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] text-[#8c887e] uppercase font-semibold">
                  Build Artifacts & Assets ({rel.assets.length})
                </span>
                <div className="space-y-1.5">
                  {rel.assets.map((asset) => (
                    <div
                      key={asset.name}
                      className="flex items-center justify-between rounded-xl border border-[#2b2a29] bg-[#141312] px-4 py-2.5 text-xs"
                    >
                      <span className="text-[#e6e2df] flex items-center gap-2 font-semibold">
                        <Package className="h-4 w-4 text-amber-400" />
                        {asset.name}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[#8c887e]">{asset.size}</span>
                        <a
                          href={asset.downloadUrl}
                          download
                          className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Draft Release Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
              <h4 className="font-headline text-base font-bold text-[#ffffff]">Draft New Release</h4>
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

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#8c887e] mb-1">Tag Version *</label>
                  <input
                    type="text"
                    required
                    placeholder="v0.2.0-beta"
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2 text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#8c887e] mb-1">Target Branch</label>
                  <select
                    value={targetBranch}
                    onChange={(e) => setTargetBranch(e.target.value)}
                    className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2 text-[#e6e2df] focus:outline-none"
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
                <label className="block text-[#8c887e] mb-1">Release Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Combat Sandbox & Ability Prototype"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2 text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#8c887e] mb-1">Release Notes</label>
                <textarea
                  rows={4}
                  placeholder="Describe the milestone features, key bug fixes, and playtest instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] p-3 text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-[#2b2a29]">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Publishing...' : 'Publish Release'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
