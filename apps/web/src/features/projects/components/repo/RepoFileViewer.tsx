import React, { useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  Edit3,
  Trash2,
  Loader2,
  GitCommit,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import type { RepoFile } from '../../services/projectRepositoryService';

interface RepoFileViewerProps {
  file: RepoFile;
  branch: string;
  onBack: () => void;
  onCommitEdit: (content: string, commitMessage: string) => Promise<void>;
  onDeleteFile: (commitMessage: string) => Promise<void>;
}

export const RepoFileViewer: React.FC<RepoFileViewerProps> = ({
  file,
  branch,
  onBack,
  onCommitEdit,
  onDeleteFile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(file.content);
  const [commitMessage, setCommitMessage] = useState(
    `fix(code): update ${file.path.split('/').pop()}`,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lines = file.content.split('\n');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(file.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveEdit = async () => {
    if (!commitMessage.trim()) {
      setError('Please provide a commit message.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onCommitEdit(editedContent, commitMessage.trim());
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const msg = prompt(
      `Enter commit message to delete '${file.path}':`,
      `refactor: remove ${file.path.split('/').pop()}`,
    );
    if (!msg) return;

    if (!window.confirm(`Are you sure you want to delete ${file.path}?`)) return;

    try {
      await onDeleteFile(msg);
      onBack();
    } catch (err: any) {
      alert(err.message || 'Failed to delete file.');
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* File Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#363433] bg-[#1c1b1a] p-4">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-[#363433] bg-[#141312] p-2 text-[#8c887e] hover:text-[#ffffff] transition-colors"
            title="Back to file explorer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1.5 text-xs text-[#8c887e] flex-wrap">
            <span className="text-[#cac6bc] font-semibold">{branch}</span>
            <span>/</span>
            <span className="text-[#ffffff] font-bold">{file.path}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#363433] bg-[#141312] px-3 py-1.5 text-xs text-[#cac6bc] hover:text-[#ffffff] transition-colors"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditedContent(file.content);
                  setIsEditing(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-950/40 transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl border border-red-950/40 bg-red-950/20 p-2 text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-colors"
                title="Delete file"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" /> Committing...
                  </span>
                ) : (
                  'Commit Changes'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Commit metadata strip */}
      <div className="flex items-center justify-between rounded-xl border border-[#2b2a29] bg-[#141312] px-4 py-2.5 text-xs text-[#8c887e]">
        <div className="flex items-center gap-2 truncate">
          <GitCommit className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span className="truncate text-[#cac6bc]">{file.lastCommit.message}</span>
          <span className="hidden sm:inline">by @{file.lastCommit.author}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[11px]">
          <span>{lines.length} lines</span>
          <span>·</span>
          <span>{file.size} bytes</span>
        </div>
      </div>

      {/* Editor or Viewer */}
      {isEditing ? (
        <div className="space-y-3 rounded-2xl border border-[#363433] bg-[#1c1b1a] p-4">
          <div>
            <label className="block text-[11px] text-[#8c887e] mb-1">Commit Message *</label>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-xs text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
            />
          </div>
          <textarea
            rows={18}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full rounded-xl border border-[#2b2a29] bg-[#141312] p-4 text-xs font-mono text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none leading-relaxed"
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#363433] bg-[#141312]">
          <table className="w-full text-left text-xs">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-[#1c1b1a]/50 transition-colors">
                  <td className="w-12 select-none border-r border-[#2b2a29] py-0.5 pr-3 text-right text-[11px] text-[#55524c]">
                    {idx + 1}
                  </td>
                  <td className="py-0.5 pl-4 pr-4 font-mono text-[#e6e2df] whitespace-pre">
                    {line || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
