import React, { useState } from 'react';
import { playtestService } from '../../services/playtestService';
import type { PlaytestSession } from '../../services/playtestService';
import { Minimize2, Send, Gamepad2, AlertCircle } from 'lucide-react';

interface PlaytestWidgetProps {
  projectId: string;
  activeSession: PlaytestSession;
  onEndSession: () => void;
  buildVersion: string;
}

export const PlaytestWidget: React.FC<PlaytestWidgetProps> = ({ projectId, activeSession, onEndSession, buildVersion }) => {
  const [minimized, setMinimized] = useState(false);
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDesc, setFeedbackDesc] = useState('');
  const [type, setType] = useState<'BUG' | 'SUGGESTION' | 'GENERAL'>('BUG');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTitle || !feedbackDesc) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await playtestService.submitFeedback(projectId, activeSession.id, {
        title: feedbackTitle,
        description: feedbackDesc,
        type,
        severity: type === 'BUG' ? severity : undefined,
      });
      setSuccess('Feedback submitted successfully!');
      setFeedbackTitle('');
      setFeedbackDesc('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnd = async () => {
    try {
      await playtestService.endSession(projectId, activeSession.id);
      onEndSession();
    } catch (err) {
      console.error('Failed to end session', err);
    }
  };

  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <button
          onClick={() => setMinimized(false)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-amber-950 shadow-lg shadow-amber-900/20 transition-transform hover:scale-105"
          title="Restore Playtest Widget"
        >
          <Gamepad2 className="h-6 w-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 overflow-hidden rounded-2xl border border-amber-500/30 bg-[#141312] shadow-2xl shadow-black/80">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2b2a29] bg-[#1c1b1a] px-4 py-3">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-4 w-4 text-amber-400" />
          <h3 className="font-headline text-sm font-bold text-white">Active Playtest</h3>
        </div>
        <div className="flex items-center gap-1 text-[#8c887e]">
          <span className="text-[10px] font-mono border border-[#363433] rounded px-1.5 py-0.5">{buildVersion}</span>
          <button onClick={() => setMinimized(true)} className="rounded p-1 hover:bg-[#2b2a29] hover:text-white transition-colors">
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-950/40 p-3 text-red-400 border border-red-900/50 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-emerald-950/40 p-3 text-emerald-400 border border-emerald-900/50 text-xs text-center">
              {success}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-[#8c887e]">Feedback Type</label>
            <div className="flex gap-2">
              {(['BUG', 'SUGGESTION', 'GENERAL'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors ${
                    type === t
                      ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                      : 'border-[#363433] bg-[#1c1b1a] text-[#8c887e] hover:border-[#48473f] hover:text-white'
                  }`}
                >
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-[#8c887e]">Title</label>
            <input
              type="text"
              required
              value={feedbackTitle}
              onChange={(e) => setFeedbackTitle(e.target.value)}
              className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-2 text-sm text-white placeholder-[#66645c] focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              placeholder="Brief summary..."
            />
          </div>

          {type === 'BUG' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#8c887e]">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-[#8c887e]">Description</label>
            <textarea
              required
              rows={4}
              value={feedbackDesc}
              onChange={(e) => setFeedbackDesc(e.target.value)}
              className="w-full resize-none rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-2 text-sm text-white placeholder-[#66645c] focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50 custom-scrollbar"
              placeholder="What happened? Steps to reproduce..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !feedbackTitle || !feedbackDesc}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-amber-950 transition-colors hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : (
              <>
                <Send className="h-4 w-4" />
                Submit Feedback
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer / Actions */}
      <div className="border-t border-[#2b2a29] bg-[#1c1b1a] p-3 text-center">
        <button
          onClick={handleEnd}
          className="text-xs font-mono text-red-400 hover:text-red-300 transition-colors underline-offset-4 hover:underline"
        >
          End Playtest Session
        </button>
      </div>
    </div>
  );
};
