import React, { useState } from 'react';
import { X, Upload, Trash2, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { uploadBanner, deleteBanner } from '../services/profileService';
import { useAuthStore } from '../../auth/store/authStore';

interface BannerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBannerUrl?: string;
  onBannerUpdated: (newBannerUrl: string | undefined) => void;
}

export const BannerEditModal: React.FC<BannerEditModalProps> = ({
  isOpen,
  onClose,
  currentBannerUrl,
  onBannerUpdated,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const accessToken = useAuthStore((state) => state.accessToken);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, WebP, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Banner image must be smaller than 10MB.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!selectedFile || !accessToken) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await uploadBanner(accessToken, selectedFile);
      onBannerUpdated(result.bannerUrl);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload banner.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);

    try {
      await deleteBanner(accessToken);
      onBannerUpdated(undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to remove banner.');
    } finally {
      setIsLoading(false);
    }
  };

  const displayUrl = previewUrl || currentBannerUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-[#e6e2df]" />
            <h2 className="font-headline text-lg font-bold text-[#ffffff]">Edit Profile Banner</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#363433] bg-[#141312] p-1.5 text-[#8c887e] hover:text-[#ffffff]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300 font-mono">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Banner Preview */}
        <div className="space-y-4">
          <div className="relative h-40 w-full rounded-2xl border-2 border-[#2b2a29] bg-[#201f1e] overflow-hidden">
            {displayUrl ? (
              <img src={displayUrl} alt="Banner preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-mono text-[#8c887e]">
                Default Atmospheric Vignette Banner
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-[#48473f] bg-[#201f1e] px-4 py-2 text-xs font-mono text-[#e6e2df] hover:border-[#e6e2df] transition-colors">
              <Upload className="h-4 w-4" />
              <span>Choose Banner Image</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#2b2a29] pt-4">
          {currentBannerUrl ? (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>Reset to Default</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!selectedFile || isLoading}
              icon={isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : undefined}
            >
              Save Banner
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
