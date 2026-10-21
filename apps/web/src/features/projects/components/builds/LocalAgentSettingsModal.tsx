import React, { useState, useEffect } from 'react';
import { X, Server, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { localRunnerAgent } from '../../../../lib/localRunnerAgent';

interface LocalAgentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const LocalAgentSettingsModal: React.FC<LocalAgentSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const existing = localRunnerAgent.getToken() || '';
      setToken(existing);
      setFeedback(null);

      // Probe agent reachability on open
      if (existing) {
        localRunnerAgent.getStatus(existing)
          .then(() => setIsConnected(true))
          .catch(() => setIsConnected(false));
      } else {
        localRunnerAgent.getStatus(null)
          .then(() => setIsConnected(true))
          .catch(() => setIsConnected(false));
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setFeedback(null);

    const trimmed = token.trim();
    if (trimmed) {
      localRunnerAgent.setToken(trimmed);
    } else {
      localRunnerAgent.clearToken();
    }

    try {
      await localRunnerAgent.getStatus(trimmed || null);
      setIsConnected(true);
      setFeedback({
        type: 'success',
        message: 'Local Runner Agent connected.',
      });
      onSaved?.();
    } catch {
      setIsConnected(false);
      setFeedback({
        type: 'error',
        message: 'Local Runner Agent not detected.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-[#363433] bg-[#141312] p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-400">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-headline text-base font-bold text-[#ffffff]">
                Local Build Runner
              </h2>
              <p className="text-xs font-mono text-[#8c887e]">
                Configure local 127.0.0.1:35414 runner agent.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#363433] text-[#8c887e] hover:text-[#ffffff] hover:border-[#48473f] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-between rounded-xl border border-[#2b2a29] bg-[#1c1b1a] px-4 py-3">
          <span className="text-xs font-mono text-[#cac6bc]">Agent Status</span>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected === true
                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                  : 'bg-[#66645c]'
              }`}
            />
            <span
              className={`text-xs font-mono font-medium ${
                isConnected === true ? 'text-emerald-400' : 'text-[#8c887e]'
              }`}
            >
              {isConnected === true ? 'Connected' : 'Not Connected'}
            </span>
          </div>
        </div>

        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-mono ${
              feedback.type === 'success'
                ? 'border-emerald-800/40 bg-emerald-950/20 text-emerald-300'
                : 'border-amber-800/40 bg-amber-950/20 text-amber-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSaveAndTest} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-[#cac6bc]">
              Local Agent Token
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token generated by tools/pantheon-runner/agent.js"
                className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2.5 pr-10 text-xs font-mono text-[#ffffff] focus:border-[#cac6bc] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c887e] hover:text-[#ffffff] transition-colors"
                title={showToken ? 'Hide token' : 'Show token'}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] font-mono text-[#66645c]">
              Stored only in browser localStorage. Never sent to the Pantheon backend.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#201f1e]">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isTesting}
            >
              {isTesting ? 'Testing...' : 'Save & Test'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
