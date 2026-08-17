import React, { useState } from 'react';
import { X, FileText, Upload, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { Resume } from '../types';
import { uploadResume, updateResumeVisibility, deleteResume } from '../services/profileService';
import { useAuthStore } from '../../auth/store/authStore';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: Resume | null;
  onSaved: (resume: Resume | null) => void;
}

export const ResumeModal: React.FC<ResumeModalProps> = ({
  isOpen,
  onClose,
  resume,
  onSaved,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<'Public' | 'Private'>(
    resume?.visibility || 'Public',
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const accessToken = useAuthStore((state) => state.accessToken);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Resume must be a PDF document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Resume PDF file must be smaller than 10MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const resultResume = await uploadResume(accessToken, selectedFile);
      // Also update visibility if user changed it
      if (resultResume && resultResume.visibility !== visibility) {
        const updatedVis = await updateResumeVisibility(accessToken, visibility);
        onSaved(updatedVis);
      } else {
        onSaved(resultResume);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload resume PDF.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!resume || !accessToken) return;

    setIsLoading(true);
    setError(null);

    const nextVis = visibility === 'Public' ? 'Private' : 'Public';
    try {
      const updated = await updateResumeVisibility(accessToken, nextVis);
      setVisibility(nextVis);
      onSaved(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle visibility.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!resume || !accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      await deleteResume(accessToken);
      onSaved(null);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete resume.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#e6e2df]" />
            <h2 className="font-headline text-lg font-bold text-[#ffffff]">
              {resume ? 'Manage Resume' : 'Upload Resume'}
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

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300 font-mono">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Existing Resume Display */}
        {resume && (
          <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#8c887e]">Current Document</span>
              <span className="rounded bg-[#201f1e] px-2 py-0.5 text-[10px] text-[#e6e2df] uppercase border border-[#2b2a29]">
                {resume.visibility}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-xs font-semibold text-[#ffffff]">{resume.fileName}</p>
                <p className="text-[10px] font-mono text-[#8c887e]">
                  {resume.fileSize} · Updated {resume.updatedAt}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleVisibility}
                  disabled={isLoading}
                  className="rounded-lg border border-[#363433] bg-[#201f1e] px-2.5 py-1 text-xs font-mono text-[#e6e2df] hover:border-[#e6e2df] transition-colors"
                >
                  Make {visibility === 'Public' ? 'Private' : 'Public'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File Upload Selector */}
        <div className="space-y-3">
          <label className="block text-xs font-mono text-[#8c887e]">
            {resume ? 'Replace Resume PDF' : 'Upload New Resume PDF'}
          </label>
          <label className="cursor-pointer flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-[#363433] bg-[#141312] hover:border-[#48473f] transition-colors text-center">
            <Upload className="h-8 w-8 text-[#8c887e] mb-2" />
            <span className="font-mono text-xs text-[#e6e2df]">
              {selectedFile ? selectedFile.name : 'Click to browse PDF document'}
            </span>
            <span className="text-[10px] text-[#8c887e] mt-1 font-mono">Max size 10MB (PDF format only)</span>
            <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#2b2a29] pt-4">
          {resume ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="inline-flex items-center gap-1 text-xs font-mono text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Resume</span>
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
              onClick={handleUpload}
              disabled={!selectedFile || isLoading}
              icon={isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : undefined}
            >
              {resume ? 'Replace Resume' : 'Upload Resume'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
