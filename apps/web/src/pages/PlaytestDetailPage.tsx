import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout';
import { useAuthStore } from '../features/auth/store/authStore';
import { ArrowLeft, Download, AlertCircle, MessageSquare, Plus, Target, Settings, GitCommit, CheckSquare } from 'lucide-react';
import { Button } from '../components/ui/Button';

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
  const { user } = useAuthStore();
  
  const [playtest, setPlaytest] = useState<PlaytestSession | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isProjectFounder, setIsProjectFounder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New feedback modal state
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDesc, setFeedbackDesc] = useState('');
  const [feedbackSeverity, setFeedbackSeverity] = useState<'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [projectId, playtestId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load Project to check if founder
      const projRes = await api.get(`/projects/${projectId}`);
      setIsProjectFounder(projRes.data.isFounder);

      const ptRes = await api.get(`/projects/${projectId}/playtests/${playtestId}`);
      setPlaytest(ptRes.data);

      if (projRes.data.isFounder) {
        const fbRes = await api.get(`/projects/${projectId}/playtests/${playtestId}/feedback`);
        setFeedback(fbRes.data);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load playtest details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!playtest) return;
    try {
      const res = await api.get(`/projects/${projectId}/playable-builds/${playtest.playableBuild.id}/download`);
      window.location.href = res.data.downloadUrl;
    } catch (err: any) {
      alert('Failed to generate download link');
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTitle.trim() || !feedbackDesc.trim()) return;
    try {
      setIsSubmitting(true);
      await api.post(`/projects/${projectId}/playtests/${playtestId}/feedback`, {
        title: feedbackTitle,
        description: feedbackDesc,
        severity: feedbackSeverity
      });
      setIsFeedbackModalOpen(false);
      setFeedbackTitle('');
      setFeedbackDesc('');
      setFeedbackSeverity('MEDIUM');
      if (isProjectFounder) {
        const fbRes = await api.get(`/projects/${projectId}/playtests/${playtestId}/feedback`);
        setFeedback(fbRes.data);
      } else {
        alert('Feedback submitted successfully! Thank you.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const convertToTask = async (feedbackId: string) => {
    try {
      setConvertingId(feedbackId);
      await api.post(`/projects/${projectId}/playtests/${playtestId}/feedback/${feedbackId}/convert-to-task`);
      // Reload feedback
      const fbRes = await api.get(`/projects/${projectId}/playtests/${playtestId}/feedback`);
      setFeedback(fbRes.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to convert to task');
    } finally {
      setConvertingId(null);
    }
  };

  if (!user || isLoading) return null;

  if (error || !playtest) {
    return (
      <DashboardLayout user={user}>
        <div className="max-w-4xl mx-auto py-8">
          <div className="text-center text-sm font-mono text-red-400">{error || 'Playtest not found'}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="max-w-5xl mx-auto py-8 space-y-8">
        <Link 
          to={`/projects/${projectId}?tab=playtests`} 
          className="inline-flex items-center gap-2 text-sm font-mono text-[#8c887e] hover:text-[#ffffff] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Project
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
                {playtest.playableBuild.buildJob?.commitHash?.substring(0, 7) || 'Unknown Commit'}
              </span>
            </div>
            
            <h1 className="font-headline text-3xl font-bold text-[#ffffff] mb-2">{playtest.title}</h1>
            <p className="text-sm font-mono text-[#8c887e] flex gap-3">
              <span>Build: {playtest.playableBuild.title} (v{playtest.playableBuild.version})</span>
              <span>•</span>
              <span>Platform: {playtest.playableBuild.platform}</span>
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            {playtest.isActive && (
              <>
                <Button variant="primary" icon={<Download className="h-4 w-4" />} onClick={handleDownload} className="w-full">
                  Download Build
                </Button>
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
                            Reported by @{fb.reporter.username}
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
                  onChange={e => setFeedbackSeverity(e.target.value as any)}
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
                <Button variant="primary" type="submit" isLoading={isSubmitting}>Submit</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
