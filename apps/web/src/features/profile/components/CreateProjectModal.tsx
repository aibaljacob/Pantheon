import React, { useState } from 'react';
import { X, Crown, Loader2, AlertCircle, Upload, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { DashboardProjectItem } from '../../projects/types';
import { createProject } from '../../projects/services/projectService';
import { uploadPortfolioCover } from '../services/profileService';
import { TaxonomySingleSelect } from './TaxonomySingleSelect';
import {
  searchGameEngines,
  searchGenres,
  searchPlatforms,
} from '../services/taxonomyService';
import { useAuthStore } from '../../auth/store/authStore';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (project: DashboardProjectItem) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const [gameEngine, setGameEngine] = useState('');
  const [genre, setGenre] = useState('');
  const [platform, setPlatform] = useState('');
  const [status, setStatus] = useState<string>('IN_DEVELOPMENT');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, WebP, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Cover image file size must be smaller than 10MB.');
      return;
    }

    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let finalCoverUrl = coverUrl;

      // Upload local cover image if selected
      if (coverFile) {
        const uploadRes = await uploadPortfolioCover(accessToken, coverFile);
        finalCoverUrl = uploadRes.coverUrl;
      }

      const payload = {
        name: name.trim(),
        description: description.trim(),
        coverUrl: finalCoverUrl || undefined,
        genre: genre || undefined,
        platform: platform || undefined,
        gameEngine: gameEngine || undefined,
        status,
      };

      const created = await createProject(accessToken, payload);
      setSuccessMessage('Your project has been submitted for administrator review.');
      
      setTimeout(() => {
        onCreated(created);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setIsLoading(false);
    }
  };

  const activeCoverDisplay = coverPreviewUrl || coverUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-[#363433] bg-[#1c1b1a] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#2b2a29] px-6 py-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-400" />
            <h2 className="font-headline text-lg font-bold text-[#ffffff]">
              Become a Founder — Launch Game Project
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#363433] bg-[#141312] p-1.5 text-[#8c887e] hover:text-[#ffffff]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300 font-mono">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300 font-mono">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-[#8c887e] mb-1">Project Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Neon Horizon"
              className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8c887e] mb-1">Description & Vision *</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Overview of the studio project, game concept, target audience, and key production milestones..."
              className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
            />
          </div>

          {/* Local Cover Image Upload Box */}
          <div className="space-y-2">
            <label className="block text-xs font-mono text-[#8c887e]">
              Project Key Art / Cover Image
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-[#363433] bg-[#141312] p-3">
              <div className="relative h-24 w-36 rounded-xl border border-[#2b2a29] bg-[#201f1e] overflow-hidden shrink-0">
                {activeCoverDisplay ? (
                  <img src={activeCoverDisplay} alt="Cover preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-mono text-[#8c887e] text-center p-2">
                    No Cover Image
                  </div>
                )}
              </div>

              <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-[#48473f] bg-[#201f1e] px-4 py-2 text-xs font-mono text-[#e6e2df] hover:border-[#e6e2df] transition-colors">
                <Upload className="h-4 w-4" />
                <span>{coverFile ? coverFile.name : 'Choose Cover Image'}</span>
                <input type="file" accept="image/*" onChange={handleCoverFileChange} className="hidden" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TaxonomySingleSelect
              label="Game Engine"
              value={gameEngine}
              onChange={setGameEngine}
              fetchSearch={searchGameEngines}
              placeholder="Select engine..."
            />
            <TaxonomySingleSelect
              label="Genre"
              value={genre}
              onChange={setGenre}
              fetchSearch={searchGenres}
              placeholder="Select genre..."
            />
            <TaxonomySingleSelect
              label="Platform"
              value={platform}
              onChange={setPlatform}
              fetchSearch={searchPlatforms}
              placeholder="Select platform..."
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8c887e] mb-1">Development Phase</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
            >
              <option value="PLANNING">Planning</option>
              <option value="PRE_PRODUCTION">Pre-Production</option>
              <option value="PROTOTYPE">Prototype</option>
              <option value="IN_DEVELOPMENT">In Development</option>
              <option value="ALPHA">Alpha</option>
              <option value="BETA">Beta</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-[#2b2a29] pt-4">
            <div className="text-[11px] font-mono text-amber-400/90">
              * Requires Administrator Review before public visibility
            </div>

            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isLoading || Boolean(successMessage)}
                icon={isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : undefined}
              >
                Submit Project
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
