import React, { useState, useEffect } from 'react';
import {
  Code,
  GitCommit,
  GitBranch,
  GitPullRequest,
  Tag,
  Copy,
  Check,
  Download,
  Terminal,
  Loader2,
  FolderGit2,
  Globe,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import {
  fetchProjectRepo,
  commitRepoFile,
  deleteRepoFile,
  createRepoBranch,
  createRepoPullRequest,
  mergeRepoPullRequest,
  createRepoRelease,
  type ProjectRepositoryData,
  type RepoFile,
} from '../../services/projectRepositoryService';
import { RepoCodeBrowser } from './RepoCodeBrowser';
import { RepoFileViewer } from './RepoFileViewer';
import { RepoCommitsList } from './RepoCommitsList';
import { RepoBranchesList } from './RepoBranchesList';
import { RepoPullRequestsList } from './RepoPullRequestsList';
import { RepoReleasesList } from './RepoReleasesList';
import { CreateFileModal } from './CreateFileModal';

interface ProjectRepoTabProps {
  projectId: string;
  accessToken?: string | null;
}

type SubTab = 'code' | 'commits' | 'branches' | 'pulls' | 'releases';

const LANGUAGE_COLORS: Record<string, string> = {
  'C++': '#f34b7d',
  'C/C++ Header': '#e34c26',
  'C#': '#178600',
  'HLSL / Shaders': '#563d7c',
  'Configuration': '#6e5494',
  'JSON / Meta': '#cb171e',
  'Markdown': '#083fa1',
  'GDScript': '#355570',
  'Python': '#3572A5',
  'Other': '#8c887e',
};

export const ProjectRepoTab: React.FC<ProjectRepoTabProps> = ({
  projectId,
  accessToken,
}) => {
  const [activeTab, setActiveTab] = useState<SubTab>('code');
  const [repoData, setRepoData] = useState<ProjectRepositoryData | null>(null);
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  const [selectedFile, setSelectedFile] = useState<RepoFile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Clone Dropdown state
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [cloneProtocol, setCloneProtocol] = useState<'https' | 'ssh'>('https');
  const [isCopied, setIsCopied] = useState(false);

  // Create File modal state
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false);

  const loadRepo = async (branch?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchProjectRepo(projectId, branch, accessToken);
      setRepoData(data);
      setCurrentBranch(data.currentBranch);
    } catch (err: any) {
      setError(err.message || 'Failed to load project repository.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRepo(currentBranch);
  }, [projectId, accessToken]);

  const handleBranchChange = (branch: string) => {
    setCurrentBranch(branch);
    setSelectedFile(null);
    loadRepo(branch);
  };

  const handleCopyClone = () => {
    if (!repoData) return;
    const url = cloneProtocol === 'https' ? repoData.cloneUrls.https : repoData.cloneUrls.ssh;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCommitNewFile = async (path: string, content: string, commitMessage: string) => {
    if (!accessToken) throw new Error('Authentication required to commit code.');
    await commitRepoFile(
      projectId,
      {
        path,
        content,
        commitMessage,
        branch: currentBranch,
      },
      accessToken,
    );
    await loadRepo(currentBranch);
  };

  const handleCommitEdit = async (content: string, commitMessage: string) => {
    if (!selectedFile || !accessToken) return;
    const res = await commitRepoFile(
      projectId,
      {
        path: selectedFile.path,
        content,
        commitMessage,
        branch: currentBranch,
      },
      accessToken,
    );
    setSelectedFile(res.file);
    await loadRepo(currentBranch);
  };

  const handleDeleteFile = async (commitMessage: string) => {
    if (!selectedFile || !accessToken) return;
    await deleteRepoFile(
      projectId,
      {
        path: selectedFile.path,
        commitMessage,
        branch: currentBranch,
      },
      accessToken,
    );
    setSelectedFile(null);
    await loadRepo(currentBranch);
  };

  const handleCreateBranch = async (name: string, sourceBranch: string) => {
    if (!accessToken) throw new Error('Authentication required to create branch.');
    await createRepoBranch(projectId, { name, sourceBranch }, accessToken);
    await loadRepo(name);
  };

  const handleCreatePullRequest = async (
    title: string,
    description: string,
    sourceBranch: string,
    targetBranch: string,
  ) => {
    if (!accessToken) throw new Error('Authentication required to create pull request.');
    await createRepoPullRequest(
      projectId,
      { title, description, sourceBranch, targetBranch },
      accessToken,
    );
    await loadRepo(currentBranch);
  };

  const handleMergePullRequest = async (prNumber: number) => {
    if (!accessToken) throw new Error('Authentication required to merge pull request.');
    await mergeRepoPullRequest(projectId, prNumber, accessToken);
    await loadRepo(currentBranch);
  };

  const handleCreateRelease = async (
    tagName: string,
    title: string,
    description: string,
    targetBranch: string,
  ) => {
    if (!accessToken) throw new Error('Authentication required to create release.');
    await createRepoRelease(
      projectId,
      { tagName, title, description, targetBranch },
      accessToken,
    );
    await loadRepo(currentBranch);
  };

  if (isLoading && !repoData) {
    return (
      <div className="flex h-80 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8c887e]" />
      </div>
    );
  }

  if (error || !repoData) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-950/20 p-8 text-center space-y-3 font-mono">
        <p className="text-sm font-bold text-red-300">Repository Unavailable</p>
        <p className="text-xs text-[#8c887e]">{error || 'Failed to load repository.'}</p>
        <Button variant="secondary" size="sm" onClick={() => loadRepo(currentBranch)}>
          Retry
        </Button>
      </div>
    );
  }

  const openPrsCount = repoData.pullRequests.filter((p) => p.status === 'OPEN').length;

  return (
    <div className="space-y-6 font-mono">
      {/* Top Bar: Repo Slug, Badges, and Clone Dropdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3 text-amber-400">
            <FolderGit2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-headline text-xl font-bold text-[#ffffff]">
                studio / {repoData.slug}
              </h2>
              <span className="rounded-full border border-[#48473f] bg-[#141312] px-2.5 py-0.5 text-[10px] text-[#cac6bc] flex items-center gap-1 font-semibold">
                <Globe className="h-3 w-3 text-amber-400" /> Public Game Repo
              </span>
              {repoData.gameEngine && (
                <span className="rounded-full border border-amber-500/30 bg-amber-950/20 px-2.5 py-0.5 text-[10px] text-amber-300 font-bold">
                  {repoData.gameEngine}
                </span>
              )}
            </div>
            <p className="text-xs text-[#8c887e] mt-1">
              Pantheon Studio Source Control & Game Asset Monorepo
            </p>
          </div>
        </div>

        {/* Clone Dropdown Action */}
        <div className="relative self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsCloneOpen(!isCloneOpen)}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition-colors shadow-lg"
          >
            <Terminal className="h-4 w-4" />
            <span>Code / Clone</span>
            <span className="text-[10px]">▾</span>
          </button>

          {isCloneOpen && (
            <div className="absolute right-0 top-full mt-2 z-30 w-80 sm:w-96 rounded-2xl border border-[#363433] bg-[#141312] p-4 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#2b2a29] pb-2">
                <span className="text-xs font-bold text-[#ffffff]">Clone Repository</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCloneProtocol('https')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      cloneProtocol === 'https'
                        ? 'bg-amber-950/50 text-amber-300 border border-amber-500/40'
                        : 'text-[#8c887e]'
                    }`}
                  >
                    HTTPS
                  </button>
                  <button
                    type="button"
                    onClick={() => setCloneProtocol('ssh')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      cloneProtocol === 'ssh'
                        ? 'bg-amber-950/50 text-amber-300 border border-amber-500/40'
                        : 'text-[#8c887e]'
                    }`}
                  >
                    SSH
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-[#2b2a29] bg-[#1c1b1a] p-2">
                <input
                  type="text"
                  readOnly
                  value={
                    cloneProtocol === 'https'
                      ? repoData.cloneUrls.https
                      : repoData.cloneUrls.ssh
                  }
                  className="w-full bg-transparent text-[11px] text-[#e6e2df] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyClone}
                  className="rounded-lg border border-[#363433] bg-[#141312] p-1.5 text-[#cac6bc] hover:text-[#ffffff] transition-colors"
                  title="Copy clone URL"
                >
                  {isCopied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Download archive initiated for production build tree.');
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#363433] bg-[#1c1b1a] py-2 text-xs text-[#e6e2df] hover:border-[#48473f] hover:text-[#ffffff] transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-amber-400" />
                <span>Download ZIP (Snapshot)</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Languages Distribution Bar */}
      {Object.keys(repoData.languages).length > 0 && (
        <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 space-y-2.5">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#141312]">
            {Object.entries(repoData.languages).map(([lang, pct]) => (
              <div
                key={lang}
                style={{
                  width: `${pct}%`,
                  backgroundColor: LANGUAGE_COLORS[lang] || '#8c887e',
                }}
                title={`${lang}: ${pct}%`}
              />
            ))}
          </div>
          <div className="flex items-center gap-4 flex-wrap text-[11px] text-[#8c887e]">
            {Object.entries(repoData.languages).map(([lang, pct]) => (
              <div key={lang} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: LANGUAGE_COLORS[lang] || '#8c887e' }}
                />
                <span className="font-semibold text-[#cac6bc]">{lang}</span>
                <span>{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repository Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[#2b2a29] pb-3 text-xs">
        <button
          type="button"
          onClick={() => {
            setActiveTab('code');
            setSelectedFile(null);
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all ${
            activeTab === 'code'
              ? 'bg-[#1c1b1a] border border-[#48473f] text-[#ffffff] font-bold shadow-md'
              : 'text-[#8c887e] hover:text-[#ffffff] hover:bg-[#1c1b1a]/40'
          }`}
        >
          <Code className="h-3.5 w-3.5 text-amber-400" />
          <span>Code</span>
          <span className="text-[10px] text-[#8c887e] font-normal">
            ({repoData.stats.totalFiles})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('commits')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all ${
            activeTab === 'commits'
              ? 'bg-[#1c1b1a] border border-[#48473f] text-[#ffffff] font-bold shadow-md'
              : 'text-[#8c887e] hover:text-[#ffffff] hover:bg-[#1c1b1a]/40'
          }`}
        >
          <GitCommit className="h-3.5 w-3.5 text-amber-400" />
          <span>Commits</span>
          <span className="text-[10px] text-[#8c887e] font-normal">
            ({repoData.stats.totalCommits})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('branches')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all ${
            activeTab === 'branches'
              ? 'bg-[#1c1b1a] border border-[#48473f] text-[#ffffff] font-bold shadow-md'
              : 'text-[#8c887e] hover:text-[#ffffff] hover:bg-[#1c1b1a]/40'
          }`}
        >
          <GitBranch className="h-3.5 w-3.5 text-amber-400" />
          <span>Branches</span>
          <span className="text-[10px] text-[#8c887e] font-normal">
            ({repoData.stats.totalBranches})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pulls')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all ${
            activeTab === 'pulls'
              ? 'bg-[#1c1b1a] border border-[#48473f] text-[#ffffff] font-bold shadow-md'
              : 'text-[#8c887e] hover:text-[#ffffff] hover:bg-[#1c1b1a]/40'
          }`}
        >
          <GitPullRequest className="h-3.5 w-3.5 text-amber-400" />
          <span>Pull Requests</span>
          {openPrsCount > 0 && (
            <span className="rounded-full bg-amber-500/30 text-amber-300 px-1.5 py-0.2 text-[9px] font-bold">
              {openPrsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('releases')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all ${
            activeTab === 'releases'
              ? 'bg-[#1c1b1a] border border-[#48473f] text-[#ffffff] font-bold shadow-md'
              : 'text-[#8c887e] hover:text-[#ffffff] hover:bg-[#1c1b1a]/40'
          }`}
        >
          <Tag className="h-3.5 w-3.5 text-amber-400" />
          <span>Releases</span>
          <span className="text-[10px] text-[#8c887e] font-normal">
            ({repoData.stats.totalReleases})
          </span>
        </button>
      </div>

      {/* Sub-View Content */}
      {activeTab === 'code' && (
        selectedFile ? (
          <RepoFileViewer
            file={selectedFile}
            branch={currentBranch}
            onBack={() => setSelectedFile(null)}
            onCommitEdit={handleCommitEdit}
            onDeleteFile={handleDeleteFile}
          />
        ) : (
          <RepoCodeBrowser
            files={repoData.files}
            branches={repoData.branches}
            currentBranch={currentBranch}
            onSelectBranch={handleBranchChange}
            onOpenCreateBranch={() => setActiveTab('branches')}
            onOpenCreateFile={() => setIsCreateFileOpen(true)}
            onSelectFile={(f) => setSelectedFile(f)}
            latestCommit={repoData.recentCommits[0]}
            totalCommits={repoData.stats.totalCommits}
          />
        )
      )}

      {activeTab === 'commits' && (
        <RepoCommitsList commits={repoData.recentCommits} />
      )}

      {activeTab === 'branches' && (
        <RepoBranchesList
          branches={repoData.branches}
          currentBranch={currentBranch}
          onSelectBranch={handleBranchChange}
          onCreateBranch={handleCreateBranch}
        />
      )}

      {activeTab === 'pulls' && (
        <RepoPullRequestsList
          pullRequests={repoData.pullRequests}
          branches={repoData.branches}
          onCreatePullRequest={handleCreatePullRequest}
          onMergePullRequest={handleMergePullRequest}
        />
      )}

      {activeTab === 'releases' && (
        <RepoReleasesList
          releases={repoData.releases}
          branches={repoData.branches}
          onCreateRelease={handleCreateRelease}
        />
      )}

      {/* In-Browser Create File Modal */}
      <CreateFileModal
        isOpen={isCreateFileOpen}
        onClose={() => setIsCreateFileOpen(false)}
        branch={currentBranch}
        onCommitFile={handleCommitNewFile}
      />
    </div>
  );
};
