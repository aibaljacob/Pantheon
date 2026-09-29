import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../features/auth/services/httpClient';
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout';
import { useAuthStore } from '../features/auth/store/authStore';
import { ArrowLeft, Download, MessageSquare, GitCommit, CheckSquare, Target, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useWorkspaceStore } from '../features/projects/store/workspaceStore';

interface PlaytestSession {
  id: string;
  title: string;
  instructions: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  playableBuild: {
    id: string;
    version: string;
    platform: string;
    title: string;
    buildJob: {
      commitHash: string | null;
    } | null;
  };
}

interface Feedback {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CONVERTED_TO_TASK';
  reporter: { id: string; username: string };
  convertedTask: { id: string; taskNumber: number } | null;
  createdAt: string;
}

export function PlaytestDetailPage() {
  const { projectId, playtestId } = useParams<{ projectId: string; playtestId: string }>();
  const { currentUser } = useAuthStore();
  
  const [playtest, setPlaytest] = useState<PlaytestSession | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isProjectFounder, setIsProjectFounder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // New feedback modal state
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDesc, setFeedbackDesc] = useState('');
  const [feedbackSeverity, setFeedbackSeverity] = useState<'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || !playtestId) return;
    let ignore = false;

    Promise.all([
      apiClient.get(`/projects/${projectId}`),
      apiClient.get(`/projects/${projectId}/playtests/${playtestId}`),
    ])
      .then(([projRes, ptRes]) => {
        if (!ignore) {
          setIsProjectFounder(projRes.data.isFounder);
          setPlaytest(ptRes.data);
          setError(null);
          if (projRes.data.isFounder) {
            apiClient
              .get(`/projects/${projectId}/playtests/${playtestId}/feedback`)
              .then((fbRes) => {
                if (!ignore) setFeedback(fbRes.data);
              })
              .catch(() => {});
          }
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          console.error(err);
          const message = err instanceof Error ? err.message : 'Failed to load playtest details.';
          setError(message);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [projectId, playtestId, refreshTrigger]);

  const handleRetry = () => {
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!playtest || !playtest.playableBuild || !projectId) return;
    try {
      setIsDownloading(true);
      const res = await apiClient.get(
        `/projects/${projectId}/builds/${playtest.playableBuild.id}/download`,
        { responseType: 'blob' },
      );
      const blob = new Blob([res.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `build-${playtest.playableBuild.version || playtest.playableBuild.id}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to download build artifact.';
      alert(message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTitle.trim() || !feedbackDesc.trim()) return;
    try {
      setIsSubmitting(true);
      await apiClient.post(`/projects/${projectId}/playtests/${playtestId}/feedback`, {
        title: feedbackTitle,
        description: feedbackDesc,
        severity: feedbackSeverity
      });
      if (projectId) {
        useWorkspaceStore.getState().invalidatePlaytests(projectId);
      }
      setIsFeedbackModalOpen(false);
      setFeedbackTitle('');
      setFeedbackDesc('');
      setFeedbackSeverity('MEDIUM');
      if (isProjectFounder) {
        setRefreshTrigger((prev) => prev + 1);
      } else {
        alert('Feedback submitted successfully! Thank you.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit feedback.';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const convertToTask = async (feedbackId: string) => {
    try {
      setConvertingId(feedbackId);
      await apiClient.post(`/projects/${projectId}/playtests/${playtestId}/feedback/${feedbackId}/convert-to-task`);
      if (projectId) {
        useWorkspaceStore.getState().invalidateTasks(projectId);
      }
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to convert feedback to task.';
      alert(message);
    } finally {
      setConvertingId(null);
    }
  };

  if (!currentUser) return null;

  if (isLoading) {
    return (
      <DashboardLayout user={currentUser}>
        <div className="flex h-80 items-center justify-center font-mono">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !playtest) {
    return (
      <DashboardLayout user={currentUser}>
        <div className="max-w-xl mx-auto py-12 text-center space-y-4 font-mono">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-950/20 text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-headline text-lg font-bold text-[#ffffff]">Playtest Unavailable</h2>
            <p className="text-xs text-[#8c887e] mt-1">{error || 'This playtest session does not exist or has expired.'}</p>
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" size="sm" onClick={handleRetry}>
              Retry
            </Button>
            <Link to={`/projects/${projectId}?tab=playtests`}>
              <Button variant="primary" size="sm" icon={<ArrowLeft className="h-3.5 w-3.5" />}>
                Back to Playtests
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={currentUser}>
      <div className="max-w-5xl mx-auto py-8 space-y-8">
        <Link 
          to={`/projects/${projectId}?tab=playtests`} 
          className="inline-flex items-center gap-2 text-sm font-mono text-[#8c887e] hover:text-[#ffffff] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Playtests
        </Link>

        {/* Header */}
        <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-8 flex flex-col md:flex-row gap-6 justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2 py-0.5 rounded border text-xs font-mono font-bold uppercase tracking-wider ${
                playtest.isActive ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-[#2b2a29] border-[#48473f] text-[#8c887e]'
              }`}>
                {playtest.isActive ? 'Active' : 'Ended'}
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#363433] bg-[#141312] text-xs font-mono text-[#cac6bc]">
                <GitCommit className="h-3.5 w-3.5" />
                {playtest.playableBuild?.buildJob?.commitHash?.substring(0, 7) || 'Unknown Commit'}
              </span>
            </div>
            
            <h1 className="font-headline text-3xl font-bold text-[#ffffff] mb-2">{playtest.title}</h1>
            {playtest.playableBuild ? (
              <p className="text-sm font-mono text-[#8c887e] flex gap-3">
                <span>Build: {playtest.playableBuild.title} (v{playtest.playableBuild.version})</span>
                <span>•</span>
                <span>Platform: {playtest.playableBuild.platform}</span>
              </p>
            ) : (
              <p className="text-sm font-mono text-[#8c887e]">
                <span>Build: Build Removed</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            {playtest.isActive && (
              <>
                {playtest.playableBuild && (
                  <Button
                    variant="primary"
                    icon={
                      <Download
                        className={`h-4 w-4 ${isDownloading ? 'animate-bounce' : ''}`}
                      />
                    }
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full"
                  >
                    {isDownloading ? 'Downloading...' : 'Download Build'}
                  </Button>
                )}
                <Button variant="secondary" icon={<MessageSquare className="h-4 w-4" />} onClick={() => setIsFeedbackModalOpen(true)} className="w-full">
                  Submit Feedback
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Area: Instructions & Feedback List (if founder) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Instructions */}
            {playtest.instructions && (
              <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4">
                <h3 className="font-headline text-lg font-bold text-[#ffffff] flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-400" />
                  Testing Instructions
                </h3>
                <div className="text-sm text-[#cac6bc] whitespace-pre-wrap leading-relaxed">
                  {playtest.instructions}
                </div>
              </div>
            )}

            {/* Feedback List (Founders only) */}
            {isProjectFounder && (
              <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
                  <h3 className="font-headline text-lg font-bold text-[#ffffff] flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-amber-400" />
                    Tester Feedback
                  </h3>
                  <span className="text-xs font-mono text-[#8c887e] bg-[#2b2a29] px-2 py-0.5 rounded">
                    {feedback.length} total
                  </span>
                </div>

                <div className="space-y-4">
                  {feedback.length === 0 ? (
                    <div className="text-center text-sm font-mono text-[#8c887e] py-8">
                      No feedback submitted yet.
                    </div>
                  ) : (
                    feedback.map(fb => (
                      <div key={fb.id} className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-5 relative">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-[#ffffff]">{fb.title}</h4>
                          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${
                            fb.severity === 'CRITICAL' ? 'bg-red-900/20 text-red-400 border-red-900/50' :
                            fb.severity === 'HIGH' ? 'bg-orange-900/20 text-orange-400 border-orange-900/50' :
                            'bg-[#201f1e] text-[#cac6bc] border-[#363433]'
                          }`}>
                            {fb.severity}
                          </span>
                        </div>
                        <p className="text-sm text-[#8c887e] whitespace-pre-wrap mb-4">{fb.description}</p>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-[#2b2a29]">
                          <div className="text-xs font-mono text-[#66645c]">
                            Reported by @{fb.reporter?.username || 'Deleted User'}
                          </div>
                          
                          {fb.status === 'CONVERTED_TO_TASK' && fb.convertedTask ? (
                            <span className="flex items-center gap-1 text-xs font-mono text-amber-400">
                              <CheckSquare className="h-3.5 w-3.5" />
                              Converted: TASK-{fb.convertedTask.taskNumber}
                            </span>
                          ) : (
                            <button
                              onClick={() => convertToTask(fb.id)}
                              disabled={convertingId === fb.id}
                              className="text-xs font-mono font-bold text-amber-400 hover:text-amber-300 disabled:opacity-50"
                            >
                              Convert to Task →
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4">
              <h3 className="font-headline text-lg font-bold text-[#ffffff]">
                Playtest Details
              </h3>
              
              <div className="space-y-3 text-sm font-mono">
                <div>
                  <span className="text-[#8c887e] block mb-1">Status</span>
                  <span className="text-[#cac6bc]">{playtest.isActive ? 'Accepting Feedback' : 'Closed'}</span>
                </div>
                <div>
                  <span className="text-[#8c887e] block mb-1">Start Date</span>
                  <span className="text-[#cac6bc]">{playtest.startDate ? new Date(playtest.startDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#8c887e] block mb-1">End Date</span>
                  <span className="text-[#cac6bc]">{playtest.endDate ? new Date(playtest.endDate).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f0e0d]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-[#363433] bg-[#1c1b1a] shadow-2xl p-6">
            <h2 className="font-headline text-xl font-bold text-[#ffffff] mb-4">Submit Feedback</h2>
            
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#cac6bc] mb-1">Issue/Feedback Title</label>
                <input 
                  type="text" 
                  value={feedbackTitle}
                  onChange={e => setFeedbackTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#48473f] bg-[#141312] px-4 py-2 text-sm text-[#ffffff]" 
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-mono text-[#cac6bc] mb-1">Severity</label>
                <select 
                  value={feedbackSeverity}
                  onChange={e => setFeedbackSeverity(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')}
                  className="w-full rounded-xl border border-[#48473f] bg-[#141312] px-4 py-2 text-sm text-[#ffffff]" 
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical / Crash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#cac6bc] mb-1">Description & Steps to Reproduce</label>
                <textarea 
                  value={feedbackDesc}
                  onChange={e => setFeedbackDesc(e.target.value)}
                  className="w-full min-h-[120px] rounded-xl border border-[#48473f] bg-[#141312] px-4 py-2 text-sm text-[#ffffff]" 
                  required
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#2b2a29]">
                <Button variant="ghost" type="button" onClick={() => setIsFeedbackModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
