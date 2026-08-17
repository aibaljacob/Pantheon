import React, { useState, useEffect } from 'react';
import { X, Layers, Trash2, Loader2, AlertCircle, Upload } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { PortfolioItem, TaxonomyItem } from '../types';
import {
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  uploadPortfolioCover,
} from '../services/profileService';
import { TaxonomySingleSelect } from './TaxonomySingleSelect';
import { TaxonomyMultiSelect } from './TaxonomyMultiSelect';
import {
  searchRoles,
  searchGameEngines,
  searchGenres,
  searchPlatforms,
  searchTechnologies,
  searchTools,
} from '../services/taxonomyService';
import { useAuthStore } from '../../auth/store/authStore';

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: PortfolioItem | null;
  onSaved: (item: PortfolioItem) => void;
  onDeleted?: (id: string) => void;
}

export const PortfolioModal: React.FC<PortfolioModalProps> = ({
  isOpen,
  onClose,
  projectToEdit,
  onSaved,
  onDeleted,
}) => {
  const isEditing = Boolean(projectToEdit);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [title, setTitle] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const [description, setDescription] = useState('');
  const [role, setRole] = useState('');
  const [selectedTechItems, setSelectedTechItems] = useState<TaxonomyItem[]>([]);
  const [selectedToolItems, setSelectedToolItems] = useState<TaxonomyItem[]>([]);
  const [gameEngine, setGameEngine] = useState('');
  const [genre, setGenre] = useState('');
  const [platform, setPlatform] = useState('');
  const [status, setStatus] = useState<PortfolioItem['status']>('Prototype');
  const [projectUrl, setProjectUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectToEdit) {
      setTitle(projectToEdit.title || '');
      setCoverUrl(projectToEdit.coverUrl || '');
      setCoverFile(null);
      setCoverPreviewUrl(null);
      setDescription(projectToEdit.description || '');
      setRole(projectToEdit.role || '');
      setSelectedTechItems(
        projectToEdit.technologies
          ? projectToEdit.technologies.map((t) => ({ id: t, name: t }))
          : [],
      );
      setSelectedToolItems(
        projectToEdit.tools
          ? projectToEdit.tools.map((t) => ({ id: t, name: t }))
          : [],
      );
      setGameEngine(projectToEdit.gameEngine || '');
      setGenre(projectToEdit.genre || '');
      setPlatform(projectToEdit.platform || '');
      setStatus(projectToEdit.status || 'Prototype');
      setProjectUrl(projectToEdit.projectUrl || '');
    } else {
      setTitle('');
      setCoverUrl('');
      setCoverFile(null);
      setCoverPreviewUrl(null);
      setDescription('');
      setRole('');
      setSelectedTechItems([]);
      setSelectedToolItems([]);
      setGameEngine('');
      setGenre('');
      setPlatform('');
      setStatus('Prototype');
      setProjectUrl('');
    }
    setError(null);
  }, [projectToEdit, isOpen]);

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

    try {
      let finalCoverUrl = coverUrl;

      // If user uploaded a local image file, upload it first
      if (coverFile) {
        const uploadRes = await uploadPortfolioCover(accessToken, coverFile);
        finalCoverUrl = uploadRes.coverUrl;
      }

      const technologies = selectedTechItems.map((item) => item.name);
      const tools = selectedToolItems.map((item) => item.name);

      const dto = {
        title,
        coverUrl: finalCoverUrl || undefined,
        description,
        role,
        technologies,
        tools,
        gameEngine,
        genre,
        platform,
        status,
        projectUrl: projectUrl || undefined,
      };

      if (isEditing && projectToEdit) {
        const updated = await updatePortfolioItem(accessToken, projectToEdit.id, dto);
        onSaved(updated);
      } else {
        const created = await createPortfolioItem(accessToken, dto);
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save portfolio project.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !projectToEdit || !accessToken) return;
    setIsLoading(true);
    setError(null);

    try {
      await deletePortfolioItem(accessToken, projectToEdit.id);
      if (onDeleted) onDeleted(projectToEdit.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete portfolio project.');
    } finally {
      setIsLoading(false);
    }
  };

  const activeCoverDisplay = coverPreviewUrl || coverUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-[#363433] bg-[#1c1b1a] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2b2a29] px-6 py-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#e6e2df]" />
            <h2 className="font-headline text-lg font-bold text-[#ffffff]">
              {isEditing ? 'Edit Portfolio Project' : 'Add Portfolio Project'}
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

        {/* Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300 font-mono">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8c887e] mb-1">Project Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Project Chronos"
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
              />
            </div>
            <TaxonomySingleSelect
              label="Your Role"
              required
              value={role}
              onChange={setRole}
              fetchSearch={searchRoles}
              placeholder="Select role from taxonomy..."
            />
          </div>

          {/* Local Cover Image Upload Box */}
          <div className="space-y-2">
            <label className="block text-xs font-mono text-[#8c887e]">
              Project Cover Image (Local File)
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

          <div>
            <label className="block text-xs font-mono text-[#8c887e] mb-1">Description *</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Overview of the game concept, key engine features, gameplay systems..."
              className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TaxonomySingleSelect
              label="Game Engine"
              required
              value={gameEngine}
              onChange={setGameEngine}
              fetchSearch={searchGameEngines}
              placeholder="Select engine..."
            />
            <TaxonomySingleSelect
              label="Genre"
              required
              value={genre}
              onChange={setGenre}
              fetchSearch={searchGenres}
              placeholder="Select genre..."
            />
            <TaxonomySingleSelect
              label="Platform"
              required
              value={platform}
              onChange={setPlatform}
              fetchSearch={searchPlatforms}
              placeholder="Select platform..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8c887e] mb-1">Development Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PortfolioItem['status'])}
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
              >
                <option value="Prototype">Prototype</option>
                <option value="In Development">In Development</option>
                <option value="Alpha">Alpha</option>
                <option value="Beta">Beta</option>
                <option value="Released">Released</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8c887e] mb-1">External Demo / Repo URL</label>
              <input
                type="url"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="https://github.com/... or https://itch.io/..."
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
              />
            </div>
          </div>

          {/* TECHNOLOGIES USED */}
          <TaxonomyMultiSelect
            categoryLabel="TECHNOLOGIES USED"
            placeholder="Search recognized technologies..."
            selectedItems={selectedTechItems}
            onChange={setSelectedTechItems}
            fetchSearch={searchTechnologies}
            maxLimit={15}
          />

          {/* TOOLS USED */}
          <TaxonomyMultiSelect
            categoryLabel="TOOLS USED"
            placeholder="Search recognized tools..."
            selectedItems={selectedToolItems}
            onChange={setSelectedToolItems}
            fetchSearch={searchTools}
            maxLimit={10}
          />

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-[#2b2a29] pt-4">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="inline-flex items-center gap-1 text-xs font-mono text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isLoading}
                icon={isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : undefined}
              >
                {isEditing ? 'Save Changes' : 'Add Project'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
