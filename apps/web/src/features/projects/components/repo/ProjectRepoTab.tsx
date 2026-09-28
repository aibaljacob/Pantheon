import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Code,
  GitCommit,
  GitBranch,
  Copy,
  Check,
  Terminal,
  Loader2,
  FolderGit2,
  Globe,
  Key,
  CheckSquare,
  ArrowRight,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import {
  fetchProjectRepo,
  type ProjectRepositoryData,
  type RepoFile,
} from '../../services/projectRepositoryService';
import { useWorkspaceStore, dedupeRequest } from '../../store/workspaceStore';
import { RepoCodeBrowser } from './RepoCodeBrowser';
import { RepoFileViewer } from './RepoFileViewer';
import { RepoCommitsList } from './RepoCommitsList';
import { RepoBranchesList } from './RepoBranchesList';

interface ProjectRepoTabProps {
  projectId: string;
  accessToken?: string | null;
}

type SubTab = 'commits' | 'branches' | 'code';

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
  const [activeTab, setActiveTab] = useState<SubTab>('commits');
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<RepoFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const branchKey = selectedBranch || '__default__';
  const cachedRepo = useWorkspaceStore((state) => state.projects[projectId]?.repository?.[branchKey]);
  const setRepositoryStore = useWorkspaceStore((state) => state.setRepository);
  const invalidateRepository = useWorkspaceStore((state) => state.invalidateRepository);

  const [localRepoData, setLocalRepoData] = useState<ProjectRepositoryData | null>(null);
  const repoData = cachedRepo || localRepoData;
  const [isFetching, setIsFetching] = useState<boolean>(!cachedRepo);
  const isLoading = !repoData && isFetching;

  // Copy feedback state
  const [copiedKind, setCopiedKind] = useState<'url' | 'cmd' | null>(null);

  useEffect(() => {
    if (cachedRepo && refreshTrigger === 0) {
      return;
    }

    let ignore = false;

    dedupeRequest(`${projectId}:repo:${branchKey}`, () =>
      fetchProjectRepo(projectId, selectedBranch, accessToken),
    )
      .then((data) => {
        if (!ignore) {
          setLocalRepoData(data);
          setRepositoryStore(projectId, branchKey, data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const message = err instanceof Error ? err.message : 'Failed to load project repository.';
          setError(message);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsFetching(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [projectId, selectedBranch, branchKey, accessToken, refreshTrigger, cachedRepo, setRepositoryStore]);

  const handleBranchChange = (branch: string) => {
    setSelectedBranch(branch);
    setSelectedFile(null);
  };

  const handleRetry = () => {
    setIsFetching(true);
    invalidateRepository(projectId, branchKey);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleCopy = (text: string, kind: 'url' | 'cmd') => {
    navigator.clipboard.writeText(text);
    setCopiedKind(kind);
    setTimeout(() => setCopiedKind(null), 2000);
  };

  if (isLoading && !repoData) {
    return (
      <div className="flex h-80 items-center justify-center font-mono">
        <Loader2 className="h-8 w-8 animate-spin text-[#8c887e]" />
      </div>
    );
  }

  if (error || !repoData) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-950/20 p-8 text-center space-y-3 font-mono">
        <p className="text-sm font-bold text-red-300">Repository Unavailable</p>
        <p className="text-xs text-[#8c887e]">{error || 'Failed to load repository.'}</p>
        <Button variant="secondary" size="sm" onClick={handleRetry}>
          Retry
        </Button>
      </div>
    );
  }

  const currentBranch = selectedBranch || repoData.currentBranch || repoData.defaultBranch || 'main';

  const cloneUrl = repoData.cloneUrls.https || `${window.location.origin}/repos/${repoData.slug}.git`;
  const cloneCmd = `git clone ${cloneUrl}`;

  return (
    <div className="space-y-6 font-mono">
      {/* 1. Header: Repo Identity & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 shadow-xl">
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
                <Globe className="h-3 w-3 text-amber-400" /> Native Git Repo
              </span>
              {repoData.gameEngine && (
                <span className="rounded-full border border-amber-500/30 bg-amber-950/20 px-2.5 py-0.5 text-[10px] text-amber-300 font-bold">
                  {repoData.gameEngine}
                </span>
              )}
              <span className="rounded-full border border-[#363433] bg-[#141312] px-2 py-0.5 text-[10px] text-[#8c887e]">
                Default: {repoData.defaultBranch}
              </span>
            </div>
            <p className="text-xs text-[#8c887e] mt-1">
              Pantheon Studio Source Control & Game Asset Monorepo
            </p>
          </div>
        </div>
      </div>

      {/* 2. "How Pantheon Git Works" Workflow Banner */}
      <div className="rounded-3xl border border-[#363433] bg-[#141312] p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#2b2a29] pb-3">
          <div className="flex items-center gap-2">
            <Workflow className="h-4 w-4 text-amber-400" />
            <h3 className="font-headline text-sm font-bold text-[#ffffff]">How Pantheon Git Works</h3>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 flex-wrap">
            <span>Clone</span>
            <span>→</span>
            <span>Develop Locally</span>
            <span>→</span>
            <span>Commit</span>
            <span>→</span>
            <span>Push</span>
            <span>→</span>
            <span>Build</span>
            <span>→</span>
            <span>Playtest</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#cac6bc] leading-relaxed">
          <p>
            Pantheon uses standard native Git repositories. Work on your game project locally using your preferred game engine (Godot, Unreal, Unity) and push commits directly back to Pantheon.
          </p>
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-3 text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Task ↔ Commit Linkage</span>
            </div>
            <p className="text-[#cac6bc]">
              Tag commit messages with <code className="text-amber-300 font-bold bg-[#1c1b1a] px-1 py-0.2 rounded border border-[#363433]">[TASK-X]</code> (e.g. <span className="text-[#ffffff]">&quot;feat: player jump physics [TASK-4]&quot;</span>) to automatically associate code changes with project tasks.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Primary Section: Clone & Connect Locally */}
      <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2b2a29] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <h3 className="font-headline text-base font-bold text-[#ffffff]">
                Clone &amp; Connect Locally
              </h3>
            </div>
            <p className="text-xs text-[#8c887e] mt-0.5">
              Clone this repository and work locally with Git. Pushes authenticate via Git Smart HTTP.
            </p>
          </div>
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 text-xs text-[#cac6bc] hover:text-[#ffffff] transition-colors self-start sm:self-auto"
          >
            <Key className="h-3.5 w-3.5 text-amber-400" />
            <span>Manage Access Tokens</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Clone Command Bar */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-wider text-[#8c887e] font-semibold block">
            Git Smart HTTP Clone Command
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl border border-[#2b2a29] bg-[#141312] p-2">
            <span className="text-xs text-amber-400 select-none pl-2 hidden sm:inline">$</span>
            <input
              type="text"
              readOnly
              value={cloneCmd}
              className="w-full bg-transparent px-2 py-1 text-xs text-[#e6e2df] focus:outline-none font-mono"
            />
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCopy(cloneCmd, 'cmd')}
                icon={copiedKind === 'cmd' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              >
                {copiedKind === 'cmd' ? 'Copied' : 'Copy Command'}
              </Button>
              <button
                type="button"
                onClick={() => handleCopy(cloneUrl, 'url')}
                className="rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs text-[#cac6bc] hover:text-[#ffffff] transition-colors"
                title="Copy raw URL"
              >
                {copiedKind === 'url' ? 'URL Copied' : 'Copy URL'}
              </button>
            </div>
          </div>
        </div>

        {/* Authentication Credentials Breakdown */}
        <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#ffffff]">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Git Authentication Credentials</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-[#8c887e]">Protocol</span>
              <p className="font-bold text-[#ffffff]">Smart HTTP (HTTPS)</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-[#8c887e]">Username</span>
              <p className="font-bold text-[#ffffff]">Your Pantheon username or email</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-[#8c887e]">Password</span>
              <p className="font-bold text-amber-300">Your Personal Access Token (PAT)</p>
            </div>
          </div>
          <p className="text-[11px] text-[#8c887e] pt-1 leading-relaxed">
            When your terminal or Git client prompts for credentials, provide your Pantheon username and paste your Personal Access Token as the password. Token requires <code className="text-amber-300 bg-[#1c1b1a] px-1 py-0.2 rounded border border-[#363433]">repo:read</code> to clone and <code className="text-amber-300 bg-[#1c1b1a] px-1 py-0.2 rounded border border-[#363433]">repo:write</code> to push.
          </p>
        </div>
      </div>

      {/* 4. Repository Metadata & Languages */}
      {Object.keys(repoData.languages).length > 0 && (
        <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-[#8c887e]">
            <span>Languages &amp; Assets</span>
            <span>{repoData.stats.totalFiles} files · {repoData.stats.totalCommits} commits</span>
          </div>
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

      {/* 5. Repository Inspection Navigation (Commits, Branches, Source) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-[#2b2a29] pb-3 text-xs">
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
            <span>Recent Commits</span>
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
            <span>Browse Source</span>
            <span className="text-[10px] text-[#8c887e] font-normal">
              ({repoData.stats.totalFiles})
            </span>
          </button>
        </div>

        {/* 6. Sub-View Content */}
        {activeTab === 'commits' && (
          <RepoCommitsList commits={repoData.recentCommits} />
        )}

        {activeTab === 'branches' && (
          <RepoBranchesList
            branches={repoData.branches}
            currentBranch={currentBranch}
            onSelectBranch={handleBranchChange}
          />
        )}

        {activeTab === 'code' && (
          selectedFile ? (
            <RepoFileViewer
              file={selectedFile}
              branch={currentBranch}
              onBack={() => setSelectedFile(null)}
            />
          ) : (
            <RepoCodeBrowser
              files={repoData.files}
              branches={repoData.branches}
              currentBranch={currentBranch}
              onSelectBranch={handleBranchChange}
              onSelectFile={(f) => setSelectedFile(f)}
              latestCommit={repoData.recentCommits[0]}
              totalCommits={repoData.stats.totalCommits}
            />
          )
        )}
      </div>
    </div>
  );
};
