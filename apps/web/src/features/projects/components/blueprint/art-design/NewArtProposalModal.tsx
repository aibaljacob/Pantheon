import React, { useState } from 'react';
import {
  X,
  Upload,
  AlertCircle,
  Loader2,
  Check,
  Trash2,
  ImageIcon,
} from 'lucide-react';
import { Button } from '../../../../../components/ui/Button';
import type { ArtProposalCategory } from '../../../types';
import { formatApiAssetUrl } from '../../../../profile/services/profileService';
import {
  createArtProposal,
  uploadArtDesignReference,
} from '../../../services/artDesignService';

interface NewArtProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  token?: string;
  onCreated: () => void;
}

export const NewArtProposalModal: React.FC<NewArtProposalModalProps> = ({
  isOpen,
  onClose,
  projectId,
  token,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] =
    useState<ArtProposalCategory>('ENVIRONMENTS_ARCHITECTURE');
  const [notes, setNotes] = useState('');
  const [referenceImages, setReferenceImages] = useState<
    Array<{ url: string; name?: string; size?: string }>
  >([]);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !token) return;

    setIsUploading(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploaded = await uploadArtDesignReference(projectId, file, token);
        setReferenceImages((prev) => [
          ...prev,
          {
            url: uploaded.fileUrl,
            name: uploaded.fileName,
            size: uploaded.fileSize,
          },
        ]);
        if (!title.trim() && i === 0) {
          setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to upload reference image.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('You must be signed in to upload an art reference.');
      return;
    }
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (referenceImages.length === 0) {
      setError('Please upload at least one reference image.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createArtProposal(
        projectId,
        {
          title: title.trim(),
          category,
          rationale: notes.trim() || title.trim(),
          designNotes: notes.trim() || undefined,
          referenceImages,
        },
        token,
      );
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to submit proposal. Check role permissions.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl border border-[#363433] bg-[#141312] shadow-2xl overflow-hidden">
        {/* Fixed Header */}
        <div className="flex items-center justify-between border-b border-[#2b2a29] px-6 py-4 shrink-0 bg-[#171615]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-400">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-headline text-base font-bold text-[#ffffff]">
                Upload Art Reference
              </h3>
              <p className="text-xs font-mono text-[#8c887e]">
                Share visual references for team voting
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8c887e] hover:bg-[#201f1e] hover:text-[#e6e2df]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs font-mono text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="new-art-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-[#8c887e] mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cathedral Ramparts Silhouette"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2.5 text-sm font-sans text-[#ffffff] focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8c887e] mb-1">
                Category *
              </label>
              <select
                required
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as ArtProposalCategory)
                }
                className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-2.5 text-xs font-mono text-[#ffffff] focus:border-amber-400 focus:outline-none"
              >
                <option value="ENVIRONMENTS_ARCHITECTURE">Environments & Architecture</option>
                <option value="CHARACTERS_COSTUMES">Characters & Costumes</option>
                <option value="PROPS_WEAPONS">Props & Weapons</option>
                <option value="UI_ICONS">UI & Icons</option>
                <option value="LIGHTING_COLOR">Lighting & Colors</option>
              </select>
            </div>

            {/* Reference Image Upload */}
            <div>
              <label className="block text-xs font-mono text-[#8c887e] mb-1">
                Reference Image *
              </label>

              <label className="flex flex-col items-center justify-center h-32 rounded-2xl border-2 border-dashed border-[#363433] bg-[#1c1b1a] hover:border-amber-400 cursor-pointer p-4 transition-colors">
                {isUploading ? (
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading image...
                  </div>
                ) : (
                  <div className="text-center space-y-1">
                    <Upload className="mx-auto h-6 w-6 text-[#8c887e]" />
                    <span className="text-xs font-mono text-[#e6e2df] block">
                      Click to choose image (PNG, JPG, WEBP)
                    </span>
                    <span className="text-[10px] font-mono text-[#8c887e]">
                      Supports multiple references
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              {referenceImages.length > 0 && (
                <div className="grid grid-cols-3 gap-3 pt-3">
                  {referenceImages.map((ref, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-xl border border-[#2b2a29] bg-[#141312] overflow-hidden"
                    >
                      <img
                        src={formatApiAssetUrl(ref.url)}
                        alt={ref.name || `Reference ${idx + 1}`}
                        className="h-24 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setReferenceImages((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="absolute top-1 right-1 rounded bg-black/75 p-1 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8c887e] mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Optional design notes, lighting details, or style direction..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] p-3 text-xs font-sans text-[#cac6bc] focus:border-amber-400 focus:outline-none leading-relaxed"
              />
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="flex items-center justify-between border-t border-[#2b2a29] px-6 py-4 shrink-0 bg-[#141312]">
          <span className="text-[11px] font-mono text-[#8c887e]">
            {referenceImages.length} image{referenceImages.length === 1 ? '' : 's'} attached
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={
                isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#141312]" />
                ) : (
                  <Check className="h-4 w-4 text-[#141312]" />
                )
              }
              type="submit"
              form="new-art-form"
              disabled={isSubmitting || isUploading || referenceImages.length === 0 || !title.trim()}
            >
              {isSubmitting ? 'Uploading...' : 'Upload Reference'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
