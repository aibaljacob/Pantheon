import React from 'react';
import { FileText, Eye, RefreshCw, Trash2, Lock } from 'lucide-react';
import type { Resume } from '../types';

interface ResumeSectionProps {
  resume: Resume | null;
  isOwner: boolean;
  onOpenResumeModal?: () => void;
  onDeleteResume?: () => void;
  onToggleVisibility?: () => void;
}

export const ResumeSection: React.FC<ResumeSectionProps> = ({
  resume,
  isOwner,
  onOpenResumeModal,
  onDeleteResume,
  onToggleVisibility,
}) => {
  if (!resume) {
    if (!isOwner) return null;

    return (
      <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a]/60 p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#8c887e]">Resume / CV</span>
          <span className="text-[#8c887e]">No resume</span>
        </div>
        <button
          type="button"
          onClick={onOpenResumeModal}
          className="w-full py-2 border border-dashed border-[#363433] rounded-xl text-xs font-mono text-[#cac6bc] hover:border-[#e6e2df] hover:text-[#ffffff] transition-colors"
        >
          + Upload Resume (PDF)
        </button>
      </div>
    );
  }

  // Visitor viewing private resume
  if (!isOwner && resume.visibility === 'Private') {
    return (
      <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a]/40 p-3.5 flex items-center justify-between text-xs font-mono text-[#8c887e]">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5" />
          <span>Resume is set to Private</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a]/60 p-4 space-y-3">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-[#8c887e]">Resume</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#e6e2df] uppercase tracking-wider bg-[#201f1e] px-2 py-0.5 rounded border border-[#2b2a29]">
            {resume.visibility}
          </span>
          {isOwner && onToggleVisibility && (
            <button
              type="button"
              onClick={onToggleVisibility}
              className="text-[#8c887e] hover:text-[#e6e2df] text-[11px] underline"
            >
              Toggle
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText className="h-4 w-4 text-[#e6e2df] shrink-0" />
          <div className="min-w-0">
            <p className="truncate font-mono text-xs font-semibold text-[#ffffff]" title={resume.fileName}>
              {resume.fileName}
            </p>
            <p className="text-[10px] font-mono text-[#8c887e]">
              PDF · {resume.fileSize} · Updated {resume.updatedAt ? new Date(resume.updatedAt).toLocaleDateString() : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {resume.downloadUrl && (
            <a
              href={resume.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-[#48473f] bg-[#201f1e] px-2.5 py-1 font-mono text-xs text-[#e6e2df] hover:border-[#e6e2df] transition-colors"
            >
              <Eye className="h-3 w-3" />
              <span>View</span>
            </a>
          )}

          {isOwner && (
            <>
              {onOpenResumeModal && (
                <button
                  type="button"
                  onClick={onOpenResumeModal}
                  className="p-1 text-[#8c887e] hover:text-[#e6e2df]"
                  title="Manage Resume"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
              {onDeleteResume && (
                <button
                  type="button"
                  onClick={onDeleteResume}
                  className="p-1 text-[#8c887e] hover:text-red-400"
                  title="Delete Resume"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
