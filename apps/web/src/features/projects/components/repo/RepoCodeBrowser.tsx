import React, { useState, useMemo } from 'react';
import {
  Folder,
  FileText,
  FileCode,
  FileSpreadsheet,
  GitBranch,
  Plus,
  ChevronRight,
  BookOpen,
  CornerLeftUp,
} from 'lucide-react';
import type { RepoFile, RepoCommit, RepoBranch } from '../../services/projectRepositoryService';

interface RepoCodeBrowserProps {
  files: RepoFile[];
  branches: RepoBranch[];
  currentBranch: string;
  onSelectBranch: (branch: string) => void;
  onOpenCreateBranch: () => void;

  onSelectFile: (file: RepoFile) => void;
  latestCommit?: RepoCommit;
  totalCommits: number;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['cpp', 'c', 'cs', 'h', 'hpp', 'hlsl', 'usf', 'shader', 'py', 'gd'].includes(ext || '')) {
    return <FileCode className="h-4 w-4 text-amber-400 shrink-0" />;
  }
  if (['json', 'ini', 'config', 'uproject'].includes(ext || '')) {
    return <FileSpreadsheet className="h-4 w-4 text-emerald-400 shrink-0" />;
  }
  return <FileText className="h-4 w-4 text-[#8c887e] shrink-0" />;
}

export const RepoCodeBrowser: React.FC<RepoCodeBrowserProps> = ({
  files,
  branches,
  currentBranch,
  onSelectBranch,
  onOpenCreateBranch,

  onSelectFile,
  latestCommit,
  totalCommits,
}) => {
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [branchSearch, setBranchSearch] = useState('');

  // Extract folder hierarchy for currentFolder
  const { folderItems, fileItems } = useMemo(() => {
    const foldersSet = new Set<string>();
    const matchedFiles: RepoFile[] = [];

    const prefix = currentFolder ? `${currentFolder}/` : '';

    files.forEach((f) => {
      if (currentFolder) {
        if (!f.path.startsWith(prefix)) return;
        const relative = f.path.slice(prefix.length);
        const parts = relative.split('/');
        if (parts.length > 1) {
          foldersSet.add(parts[0]);
        } else {
          matchedFiles.push(f);
        }
      } else {
        const parts = f.path.split('/');
        if (parts.length > 1) {
          foldersSet.add(parts[0]);
        } else {
          matchedFiles.push(f);
        }
      }
    });

    return {
      folderItems: Array.from(foldersSet).sort(),
      fileItems: matchedFiles.sort((a, b) => a.path.localeCompare(b.path)),
    };
  }, [files, currentFolder]);

  // Find README file for bottom preview
  const readmeFile = files.find(
    (f) => f.path.toLowerCase() === 'readme.md' || f.path.endsWith('/README.md'),
  );

  const handleGoUp = () => {
    if (!currentFolder) return;
    const parts = currentFolder.split('/');
    parts.pop();
    setCurrentFolder(parts.join('/'));
  };

  const breadcrumbParts = currentFolder ? currentFolder.split('/') : [];

  return (
    <div className="space-y-5 font-mono">
      {/* Top Bar: Branch Selector & Add File Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Branch Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2 text-xs font-bold text-[#ffffff] hover:border-[#48473f] transition-colors"
          >
            <GitBranch className="h-3.5 w-3.5 text-amber-400" />
            <span>{currentBranch}</span>
            <span className="text-[10px] text-[#8c887e]">▾</span>
          </button>

          {isBranchDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 z-30 w-64 rounded-2xl border border-[#363433] bg-[#141312] p-2 shadow-2xl space-y-2">
              <div className="px-2 pt-1 pb-1 border-b border-[#2b2a29] flex items-center justify-between">
                <span className="text-[10px] uppercase text-[#8c887e] font-semibold">Switch Branch</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsBranchDropdownOpen(false);
                    onOpenCreateBranch();
                  }}
                  className="inline-flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300"
                >
                  <Plus className="h-3 w-3" /> New
                </button>
              </div>
              <input
                type="text"
                placeholder="Filter branches..."
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                className="w-full rounded-lg border border-[#2b2a29] bg-[#1c1b1a] px-2.5 py-1 text-xs text-[#e6e2df] focus:outline-none"
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {branches
                  .filter((b) => b.name.toLowerCase().includes(branchSearch.toLowerCase()))
                  .map((b) => (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => {
                        onSelectBranch(b.name);
                        setIsBranchDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        b.name === currentBranch
                          ? 'bg-amber-950/40 text-amber-300 font-bold border border-amber-500/30'
                          : 'text-[#cac6bc] hover:bg-[#1c1b1a] hover:text-[#ffffff]'
                      }`}
                    >
                      <span className="truncate">{b.name}</span>
                      {b.isDefault && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded border border-[#48473f] text-[#8c887e]">
                          default
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>


      </div>

      {/* Latest Commit Header Strip */}
      {latestCommit && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#363433] bg-[#1c1b1a] p-4 text-xs">
          <div className="flex items-center gap-3">
            {latestCommit.author.avatarUrl ? (
              <img
                src={latestCommit.author.avatarUrl}
                alt={latestCommit.author.username}
                className="h-7 w-7 rounded-full object-cover border border-[#48473f]"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-[#201f1e] border border-[#48473f] flex items-center justify-center text-[10px] font-bold text-[#ffffff]">
                {latestCommit.author.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <span className="font-bold text-[#ffffff]">@{latestCommit.author.username}</span>
              <span className="ml-2 text-[#cac6bc]">{latestCommit.message}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[#8c887e] shrink-0">
            <span className="rounded-lg border border-[#2b2a29] bg-[#141312] px-2 py-0.5 font-bold text-amber-300">
              {latestCommit.hash}
            </span>
            <span>{new Date(latestCommit.date).toLocaleDateString()}</span>
            <span>·</span>
            <span className="text-[#e6e2df] font-semibold">{totalCommits} commits</span>
          </div>
        </div>
      )}

      {/* Breadcrumb Path & Folder Drilling */}
      <div className="flex items-center gap-1.5 text-xs text-[#8c887e] px-1">
        <button
          type="button"
          onClick={() => setCurrentFolder('')}
          className="text-[#ffffff] hover:underline font-bold"
        >
          root
        </button>
        {breadcrumbParts.map((part, index) => {
          const pathUpTo = breadcrumbParts.slice(0, index + 1).join('/');
          return (
            <React.Fragment key={pathUpTo}>
              <ChevronRight className="h-3 w-3 text-[#48473f]" />
              <button
                type="button"
                onClick={() => setCurrentFolder(pathUpTo)}
                className="text-[#cac6bc] hover:underline"
              >
                {part}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* File Tree Table */}
      <div className="overflow-x-auto rounded-3xl border border-[#363433] bg-[#1c1b1a]">
        <table className="w-full text-left text-xs font-mono">
          <thead className="border-b border-[#2b2a29] bg-[#141312] text-[#8c887e]">
            <tr>
              <th className="p-3.5 font-normal">Name</th>
              <th className="p-3.5 font-normal">Last Commit</th>
              <th className="p-3.5 font-normal text-right">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2b2a29]">
            {currentFolder && (
              <tr
                onClick={handleGoUp}
                className="cursor-pointer hover:bg-[#141312]/60 transition-colors text-amber-300"
              >
                <td className="p-3.5 flex items-center gap-2.5 font-semibold" colSpan={3}>
                  <CornerLeftUp className="h-4 w-4" />
                  <span>.. (Up to parent folder)</span>
                </td>
              </tr>
            )}

            {/* Folder rows */}
            {folderItems.map((folder) => {
              const fullFolderPath = currentFolder ? `${currentFolder}/${folder}` : folder;
              return (
                <tr
                  key={folder}
                  onClick={() => setCurrentFolder(fullFolderPath)}
                  className="cursor-pointer hover:bg-[#141312]/60 transition-colors group"
                >
                  <td className="p-3.5 flex items-center gap-2.5 text-[#ffffff] group-hover:text-amber-300 font-semibold">
                    <Folder className="h-4 w-4 text-amber-400" />
                    <span>{folder}</span>
                  </td>
                  <td className="p-3.5 text-[#8c887e] truncate max-w-xs">Directory</td>
                  <td className="p-3.5 text-right text-[#8c887e]">-</td>
                </tr>
              );
            })}

            {/* File rows */}
            {fileItems.map((file) => {
              const fileName = file.path.split('/').pop() || file.path;
              return (
                <tr
                  key={file.path}
                  onClick={() => onSelectFile(file)}
                  className="cursor-pointer hover:bg-[#141312]/60 transition-colors group"
                >
                  <td className="p-3.5 flex items-center gap-2.5 text-[#e6e2df] group-hover:text-[#ffffff]">
                    {getFileIcon(fileName)}
                    <span className="group-hover:underline">{fileName}</span>
                  </td>
                  <td className="p-3.5 text-[#8c887e] truncate max-w-md">
                    {file.lastCommit?.message || 'Updated file'}
                  </td>
                  <td className="p-3.5 text-right text-[#8c887e] whitespace-nowrap">
                    {file.lastCommit?.date
                      ? new Date(file.lastCommit.date).toLocaleDateString()
                      : 'Recent'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stylized In-Repo README Preview */}
      {readmeFile && (
        <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#2b2a29] pb-3 text-xs text-[#cac6bc]">
            <BookOpen className="h-4 w-4 text-amber-400" />
            <span className="font-bold text-[#ffffff]">README.md</span>
          </div>
          <div className="prose prose-invert max-w-none text-xs leading-relaxed text-[#cac6bc] whitespace-pre-wrap font-sans">
            {readmeFile.content}
          </div>
        </div>
      )}
    </div>
  );
};
