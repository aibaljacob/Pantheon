import React, { useEffect, useState } from 'react';
import { playtestService } from '../../services/playtestService';
import type { PlaytestFeedback } from '../../services/playtestService';
import { Gamepad2, Loader2, AlertCircle, Plus, CheckCircle2, CheckSquare } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
interface PlaytestFeedbackSectionProps {
  projectId: string;
  isFounderOrAdmin: boolean;
  onTaskCreated: () => void;
}

export const PlaytestFeedbackSection: React.FC<PlaytestFeedbackSectionProps> = ({
  projectId,
  isFounderOrAdmin,
  onTaskCreated,
}) => {
  const [feedback, setFeedback] = useState<PlaytestFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [convertingId, setConvertingId] = useState<string | null>(null);

  const loadFeedback = async () => {
    setIsLoading(true);
    try {
      const data = await playtestService.getFeedback(projectId);
      setFeedback(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [projectId]);

  const handleConvertToTask = async (id: string) => {
    if (!isFounderOrAdmin) return;
    setConvertingId(id);
    try {
      await playtestService.convertToTask(projectId, id);
      await loadFeedback();
      onTaskCreated();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to convert to task');
    } finally {
      setConvertingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#8c887e]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-red-400">
        <AlertCircle className="mb-2 h-5 w-5" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (feedback.length === 0) {
    return (
      <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-8 text-center space-y-2">
        <Gamepad2 className="mx-auto h-8 w-8 text-[#66645c]" />
        <p className="text-xs font-mono text-[#cac6bc] font-semibold">No playtest feedback yet.</p>
        <p className="text-[11px] font-mono text-[#8c887e]">Feedback submitted during active playtest sessions will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedback.map(item => (
        <div key={item.id} className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`rounded border px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                  item.type === 'BUG' ? 'border-red-500/40 bg-red-950/30 text-red-400' :
                  item.type === 'SUGGESTION' ? 'border-blue-500/40 bg-blue-950/30 text-blue-400' :
                  'border-gray-500/40 bg-gray-950/30 text-gray-400'
                }`}>
                  {item.type}
                </span>
                {item.severity && (
                  <span className="rounded border border-amber-500/40 bg-amber-950/30 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400 uppercase">
                    {item.severity}
                  </span>
                )}
                {item.status === 'CONVERTED_TO_TASK' && (
                  <span className="rounded border border-emerald-500/40 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Converted
                  </span>
                )}
              </div>
              <h4 className="font-headline text-base font-bold text-white">{item.title}</h4>
              <p className="text-sm text-[#cac6bc] leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </div>

            <div className="flex flex-col items-end gap-2 text-right">
              {item.status === 'OPEN' && isFounderOrAdmin && (
                <Button 
                  size="sm" 
                  variant="primary" 
                  onClick={() => handleConvertToTask(item.id)}
                  disabled={convertingId === item.id}
                  icon={convertingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                >
                  Convert to Task
                </Button>
              )}
              {item.status === 'CONVERTED_TO_TASK' && item.task && (
                <div className="flex items-center gap-1 text-xs font-mono text-emerald-400">
                  <CheckSquare className="h-3.5 w-3.5" />
                  Task {item.task.taskNumber}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-[#201f1e] pt-3 text-[11px] font-mono text-[#8c887e]">
            {item.playtestSession?.playableBuild && (
              <div className="flex items-center gap-1">
                <Gamepad2 className="h-3.5 w-3.5 text-amber-500/70" />
                Build {item.playtestSession.playableBuild.version}
              </div>
            )}
            <div>
              By {item.author?.username || 'Unknown'}
            </div>
            <div>
              {new Date(item.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
