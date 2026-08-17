import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { ProfileLink } from '../types';
import { createLink, updateLink, deleteLink } from '../services/profileService';
import { useAuthStore } from '../../auth/store/authStore';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkToEdit?: ProfileLink | null;
  onSaved: (link: ProfileLink) => void;
  onDeleted?: (id: string) => void;
}

export const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  onClose,
  linkToEdit,
  onSaved,
  onDeleted,
}) => {
  const isEditing = Boolean(linkToEdit);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [platform, setPlatform] = useState<ProfileLink['platform']>('website');
  const [displayName, setDisplayName] = useState('');
  const [url, setUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (linkToEdit) {
      setPlatform(linkToEdit.platform || 'website');
      setDisplayName(linkToEdit.displayName || '');
      setUrl(linkToEdit.url || '');
    } else {
      setPlatform('github');
      setDisplayName('');
      setUrl('');
    }
    setError(null);
  }, [linkToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    const dto = {
      platform,
      displayName,
      url,
    };

    try {
      if (isEditing && linkToEdit) {
        const updated = await updateLink(accessToken, linkToEdit.id, dto);
        onSaved(updated);
      } else {
        const created = await createLink(accessToken, dto);
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !linkToEdit || !accessToken) return;
    setIsLoading(true);
    setError(null);

    try {
      await deleteLink(accessToken, linkToEdit.id);
      if (onDeleted) onDeleted(linkToEdit.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl border border-[#363433] bg-[#1c1b1a] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2b2a29] px-6 py-4">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-[#e6e2df]" />
            <h2 className="font-headline text-lg font-bold text-[#ffffff]">
              {isEditing ? 'Edit Professional Link' : 'Add Professional Link'}
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

          <div>
            <label className="block text-xs font-mono text-[#8c887e] mb-1">Platform *</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as ProfileLink['platform'])}
              className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
            >
              <option value="github">GitHub</option>
              <option value="linkedin">LinkedIn</option>
              <option value="artstation">ArtStation</option>
              <option value="itchio">Itch.io</option>
              <option value="steam">Steam Store / Community</option>
              <option value="website">Personal Portfolio / Website</option>
              <option value="custom">Custom Link</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8c887e] mb-1">Display Label *</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. GitHub Repository, ArtStation Portfolio"
              className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8c887e] mb-1">URL *</label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
            />
          </div>

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
                {isEditing ? 'Save Link' : 'Add Link'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
