import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, GitCommit } from 'lucide-react';
import type { RepoFile } from '../../services/projectRepositoryService';

interface RepoFileViewerProps {
  file: RepoFile;
  branch: string;
  onBack: () => void;
}

export const RepoFileViewer: React.FC<RepoFileViewerProps> = ({
  file,
  branch,
  onBack,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const lines = file.content.split('\n');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(file.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#363433] bg-[#141312] px-3 py-1.5 text-xs text-[#cac6bc] hover:text-[#ffffff] transition-colors"
          >
            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

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

      {/* Viewer */}
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
    </div>
  );
};
