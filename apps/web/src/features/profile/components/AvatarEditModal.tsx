import React, { useState } from 'react';
import { X, Upload, Trash2, Loader2, AlertCircle, Camera } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { uploadAvatar, deleteAvatar } from '../services/profileService';
import { useAuthStore } from '../../auth/store/authStore';

interface AvatarEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string;
  onAvatarUpdated: (newAvatarUrl: string | undefined) => void;
}

export const AvatarEditModal: React.FC<AvatarEditModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  onAvatarUpdated,
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

    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar image must be smaller than 5MB.');
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
      const result = await uploadAvatar(accessToken, selectedFile);
      onAvatarUpdated(result.avatarUrl);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);

    try {
      await deleteAvatar(accessToken);
      onAvatarUpdated(undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to remove avatar.');
    } finally {
      setIsLoading(false);
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-[#e6e2df]" />
            <h2 className="font-headline text-lg font-bold text-[#ffffff]">Edit Profile Picture</h2>
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

        <div className="flex flex-col items-center gap-4">
          <div className="relative h-32 w-32 rounded-3xl border-4 border-[#2b2a29] bg-[#201f1e] overflow-hidden shadow-inner">
            {displayUrl ? (
              <img src={displayUrl} alt="Avatar preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-mono text-[#8c887e]">
                No Avatar
              </div>
            )}
          </div>

          <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-[#48473f] bg-[#201f1e] px-4 py-2 text-xs font-mono text-[#e6e2df] hover:border-[#e6e2df] transition-colors">
            <Upload className="h-4 w-4" />
            <span>Choose Image</span>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-[#2b2a29] pt-4">
          {currentAvatarUrl ? (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>Remove</span>
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
              Save Avatar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
