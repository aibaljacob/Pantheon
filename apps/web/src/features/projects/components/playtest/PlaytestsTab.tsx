import { useState, useEffect } from 'react';
import { Gamepad2, Plus, Calendar, Play, CheckCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../auth/services/httpClient';
import { Button } from '../../../../components/ui/Button';
import { useWorkspaceStore, dedupeRequest } from '../../store/workspaceStore';
import type { PlaytestSession } from '../../types';

interface PlaytestsTabProps {
  projectId: string;
  isFounder: boolean;
  currentUser?: unknown;
}

export function PlaytestsTab({ projectId, isFounder }: PlaytestsTabProps) {
  const cachedPlaytests = useWorkspaceStore((state) => state.projects[projectId]?.playtests);
  const setCachedPlaytests = useWorkspaceStore((state) => state.setPlaytests);

  const invalidatePlaytests = useWorkspaceStore((state) => state.invalidatePlaytests);

  const [localPlaytests, setLocalPlaytests] = useState<PlaytestSession[]>([]);
  const [isLoading, setIsLoading] = useState(!cachedPlaytests);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const playtests = cachedPlaytests ?? localPlaytests;

  useEffect(() => {
    if (cachedPlaytests) return;
    let ignore = false;

    dedupeRequest(`playtests:${projectId}`, async () => {
      const res = await apiClient.get<PlaytestSession[]>(`/projects/${projectId}/playtests`);
      return res.data;
    })
      .then((data) => {
        if (!ignore) {
          setCachedPlaytests(projectId, data);
          setLocalPlaytests(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          console.error(err);
          const message = err instanceof Error ? err.message : 'Failed to load playtests';
          setError(message);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [projectId, cachedPlaytests, setCachedPlaytests, refreshTrigger]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    invalidatePlaytests(projectId);
    setRefreshTrigger((prev) => prev + 1);
  };

  const activePlaytests = playtests.filter((p) => p.isActive);
  const inactivePlaytests = playtests.filter((p) => !p.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#48473f] bg-[#201f1e] text-amber-400">
            <Gamepad2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-headline text-xl font-bold text-[#ffffff]">
              Playtests
            </h2>
            <p className="text-sm font-mono text-[#8c887e]">
              Coordinate testing sessions, distribute builds, and collect feedback.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            icon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
            title="Refresh playtests"
          >
            Refresh
          </Button>
          {isFounder && (
            <Link to={`/projects/${projectId}/playtests/new`}>
              <Button variant="primary" icon={<Plus className="h-4 w-4" />}>
                New Playtest
              </Button>
            </Link>
          )}
        </div>
      </div>

      {isLoading && !cachedPlaytests ? (
        <div className="text-center text-sm font-mono text-[#8c887e] py-12">Loading playtests...</div>
      ) : error && !cachedPlaytests ? (
        <div className="text-center text-sm font-mono text-red-400 py-12">{error}</div>
      ) : playtests.length === 0 ? (
        <div className="rounded-3xl border border-[#363433] bg-[#141312] py-20 text-center">
          <Gamepad2 className="mx-auto h-10 w-10 text-[#48473f] mb-4" />
          <h3 className="font-headline text-lg font-bold text-[#e6e2df]">No playtests yet</h3>
          <p className="text-sm font-mono text-[#8c887e] mt-2 max-w-sm mx-auto">
            Create a playtest session from a Playable Build to invite your team or external testers to provide feedback.
          </p>
          {isFounder && (
            <div className="mt-6">
              <Link to={`/projects/${projectId}/playtests/new`}>
                <Button variant="secondary" icon={<Plus className="h-4 w-4" />}>
                  Start First Playtest
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {activePlaytests.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                Active Sessions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePlaytests.map((pt) => (
                  <PlaytestCard key={pt.id} projectId={projectId} playtest={pt} />
                ))}
              </div>
            </div>
          )}

          {inactivePlaytests.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-mono font-bold text-[#8c887e] uppercase tracking-widest">
                Past Sessions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inactivePlaytests.map((pt) => (
                  <PlaytestCard key={pt.id} projectId={projectId} playtest={pt} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlaytestCard({ projectId, playtest }: { projectId: string, playtest: PlaytestSession }) {
  return (
    <Link 
      to={`/projects/${projectId}/playtests/${playtest.id}`}
      className="group block rounded-2xl border border-[#2b2a29] bg-[#141312] p-5 transition-all hover:border-[#48473f] hover:bg-[#1c1b1a] relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-headline text-lg font-bold text-[#ffffff] group-hover:text-amber-100 transition-colors">
            {playtest.title}
          </h4>
          <p className="text-xs font-mono text-[#8c887e] mt-1 flex items-center gap-1.5">
            {playtest.playableBuild ? (
              <>
                <span className="px-2 py-0.5 rounded-full border border-[#363433] bg-[#201f1e] text-[10px]">
                  {playtest.playableBuild.version}
                </span>
                <span className="px-2 py-0.5 rounded-full border border-[#363433] bg-[#201f1e] text-[10px]">
                  {playtest.playableBuild.platform}
                </span>
              </>
            ) : (
              <span className="px-2 py-0.5 rounded-full border border-[#363433] bg-[#201f1e] text-[10px] text-[#8c887e]">
                Build Removed
              </span>
            )}
          </p>
        </div>
        
        {playtest.isActive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-mono font-bold text-amber-400 border border-amber-500/20">
            <Play className="h-3 w-3" /> ACTIVE
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#201f1e] px-2.5 py-1 text-[10px] font-mono font-bold text-[#8c887e] border border-[#363433]">
            <CheckCircle className="h-3 w-3" /> ENDED
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#2b2a29]">
        <div className="flex items-center gap-2 text-xs font-mono text-[#8c887e]">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(playtest.createdAt).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#e6e2df]">
          <span className="bg-[#201f1e] rounded px-1.5 py-0.5 border border-[#363433]">
            {playtest._count.feedback}
          </span>
          <span className="text-[#8c887e]">Feedback</span>
        </div>
      </div>
    </Link>
  );
}
