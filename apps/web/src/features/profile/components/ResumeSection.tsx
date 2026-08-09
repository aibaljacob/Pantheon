import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { FileText, Eye, RefreshCw, Trash2, Lock, EyeOff } from 'lucide-react';
import type { Resume } from '../types';

interface ResumeSectionProps {
  resume: Resume | null;
  isOwner: boolean;
  onReplaceResume?: () => void;
  onDeleteResume?: () => void;
  onToggleVisibility?: () => void;
}

export const ResumeSection: React.FC<ResumeSectionProps> = ({
  resume,
  isOwner,
  onReplaceResume,
  onDeleteResume,
  onToggleVisibility,
}) => {
  if (!resume) {
    if (!isOwner) return null;

    return (
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
          <h2 className="font-headline text-base font-bold text-[#ffffff]">Resume</h2>
          <Badge variant="outline">Missing</Badge>
        </div>
        <div className="rounded-xl border border-dashed border-[#363433] p-6 text-center">
          <FileText className="mx-auto h-8 w-8 text-[#8c887e]/60" />
          <p className="mt-2 text-xs text-[#8c887e]">No resume uploaded yet.</p>
          <Button variant="secondary" size="sm" onClick={onReplaceResume} className="mt-3">
            Upload Resume (PDF)
          </Button>
        </div>
      </Card>
    );
  }

  // Visitor viewing private resume
  if (!isOwner && resume.visibility === 'Private') {
    return (
      <Card className="space-y-3 opacity-75">
        <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
          <h2 className="font-headline text-base font-bold text-[#ffffff]">Resume</h2>
          <Badge variant="outline" className="flex items-center gap-1">
            <Lock className="h-3 w-3" /> Private
          </Badge>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-[#141312] p-4 text-xs text-[#8c887e]">
          <EyeOff className="h-4 w-4" />
          <span>The user has set their resume to private.</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-headline text-base font-bold text-[#ffffff]">Resume</h2>
          <span className="text-[10px] font-mono text-[#8c887e]">Official CV</span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={resume.visibility === 'Public' ? 'accent' : 'outline'}>
            {resume.visibility}
          </Badge>

          {isOwner && onToggleVisibility && (
            <button
              type="button"
              onClick={onToggleVisibility}
              className="text-xs font-mono text-[#8c887e] hover:text-[#e6e2df] underline"
              title="Toggle visibility"
            >
              Toggle
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-[#2b2a29] bg-[#141312] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-[#363433] bg-[#201f1e] p-3 text-[#e6e2df]">
            <FileText className="h-6 w-6 text-[#e6e2df]" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-mono text-sm font-semibold text-[#ffffff]" title={resume.fileName}>
              {resume.fileName}
            </p>
            <p className="text-xs font-mono text-[#8c887e]">
              {resume.fileType} · {resume.fileSize} · Updated {resume.updatedAt}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={resume.downloadUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#48473f] bg-[#201f1e] px-3 py-1.5 font-mono text-xs font-medium text-[#e6e2df] hover:border-[#e6e2df] hover:text-[#ffffff] transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View Resume</span>
          </a>

          {isOwner && (
            <>
              {onReplaceResume && (
                <button
                  type="button"
                  onClick={onReplaceResume}
                  className="p-2 text-[#8c887e] hover:text-[#e6e2df] transition-colors"
                  title="Replace Resume"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
              {onDeleteResume && (
                <button
                  type="button"
                  onClick={onDeleteResume}
                  className="p-2 text-[#8c887e] hover:text-red-400 transition-colors"
                  title="Delete Resume"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
