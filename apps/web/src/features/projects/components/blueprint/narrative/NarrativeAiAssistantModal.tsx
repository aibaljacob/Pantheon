import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Loader2,
  Check,
  AlertCircle,
  BookOpen,
  Users,
  Film,
  GitBranch,
  ShieldCheck,
} from 'lucide-react';
import type { NarrativeData, NarrativeAiProposal } from '../../../types';
import { aiProposeNarrative } from '../../../services/blueprintService';
import { Button } from '../../../../../components/ui/Button';

interface NarrativeAiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  narrative: NarrativeData;
  initialSection?: 'STORY_BIBLE' | 'CHARACTERS' | 'SCENE' | 'QUEST';
  initialPrompt?: string;
  onAcceptDraft: (section: 'STORY_BIBLE' | 'CHARACTERS' | 'SCENE' | 'QUEST', draft: any) => void;
  token?: string;
}

export const NarrativeAiAssistantModal: React.FC<NarrativeAiAssistantModalProps> = ({
  isOpen,
  onClose,
  projectId,
  narrative,
  initialSection = 'SCENE',
  initialPrompt = '',
  onAcceptDraft,
  token,
}) => {
  const [section, setSection] = useState<'STORY_BIBLE' | 'CHARACTERS' | 'SCENE' | 'QUEST'>(
    initialSection,
  );
  const [userPrompt, setUserPrompt] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<NarrativeAiProposal | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await aiProposeNarrative(
        projectId,
        section,
        userPrompt.trim() || undefined,
        {
          storyBible: narrative.storyBible,
          characters: narrative.characters,
          scenes: narrative.scenes,
          quests: narrative.quests,
        },
        token,
      );
      setProposal(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate proposal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!proposal) return;
    onAcceptDraft(proposal.section, proposal.draft);
    onClose();
  };

  const sectionOptions: Array<{
    id: 'STORY_BIBLE' | 'CHARACTERS' | 'SCENE' | 'QUEST';
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: 'STORY_BIBLE', label: 'Story Bible', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'CHARACTERS', label: 'Character Codex', icon: <Users className="h-4 w-4" /> },
    { id: 'SCENE', label: 'Screenplay Scene', icon: <Film className="h-4 w-4" /> },
    { id: 'QUEST', label: 'Quest & Branches', icon: <GitBranch className="h-4 w-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-3xl rounded-3xl border border-[#363433] bg-[#141312] shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#2b2a29] px-6 py-4 shrink-0 bg-[#141312]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-950/20 text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-headline text-lg font-bold text-[#ffffff]">
                AI Writers&apos; Room Assistant
              </h2>
              <p className="text-xs font-mono text-[#8c887e]">
                Generates editable drafts adhering to established lore, characters, and continuity
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#363433] p-2 text-[#8c887e] hover:text-[#ffffff] hover:border-[#48473f] transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
        {/* Continuity Context Badge */}
        <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-300 font-semibold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Active Continuity Context Referenced</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-[#cac6bc]">
            <div className="rounded-lg bg-[#141312] px-2.5 py-1.5 border border-[#2b2a29]">
              <span className="text-[#8c887e] block text-[9px]">LORE ENTRIES</span>
              {narrative.storyBible.factions?.length || 0} Factions, {narrative.storyBible.themes?.length || 0} Themes
            </div>
            <div className="rounded-lg bg-[#141312] px-2.5 py-1.5 border border-[#2b2a29]">
              <span className="text-[#8c887e] block text-[9px]">CAST ROSTER</span>
              {narrative.characters?.length || 0} Saved Characters
            </div>
            <div className="rounded-lg bg-[#141312] px-2.5 py-1.5 border border-[#2b2a29]">
              <span className="text-[#8c887e] block text-[9px]">EXISTING SCENES</span>
              {narrative.scenes?.length || 0} Sequenced Scenes
            </div>
            <div className="rounded-lg bg-[#141312] px-2.5 py-1.5 border border-[#2b2a29]">
              <span className="text-[#8c887e] block text-[9px]">QUEST GRAPH</span>
              {narrative.quests?.length || 0} Branch Points
            </div>
          </div>
        </div>

        {/* Section Target Selector */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-amber-300 uppercase tracking-wider font-semibold">
            Draft Target Section
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {sectionOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setSection(opt.id);
                  setProposal(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-mono font-bold transition-all ${
                  section === opt.id
                    ? 'border-amber-500/50 bg-[#201f1e] text-amber-300 shadow-md'
                    : 'border-[#2b2a29] bg-[#141312] text-[#8c887e] hover:border-[#363433] hover:text-[#cac6bc]'
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-amber-300 uppercase tracking-wider font-semibold">
            Creative Direction & Prompt (Optional)
          </label>
          <textarea
            rows={2}
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Specific dramatic dilemma, dialogue tone, conflict, or setting..."
            className="w-full rounded-xl border border-[#2b2a29] bg-[#1c1b1a] px-3.5 py-2.5 text-xs font-sans leading-relaxed text-[#ffffff] focus:border-amber-500/60 focus:outline-none"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs font-mono text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Proposal Result Area */}
        {proposal && (
          <div className="rounded-2xl border border-amber-500/30 bg-[#1c1b1a] p-4 space-y-3 overflow-y-auto max-h-56">
            <div className="flex items-center justify-between border-b border-[#2b2a29] pb-2">
              <span className="rounded bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-300 font-bold uppercase">
                [PROPOSED DRAFT · 100% EDITABLE]
              </span>
              <span className="text-[10px] font-mono text-[#8c887e]">
                {new Date(proposal.generatedAt).toLocaleTimeString()}
              </span>
            </div>

            {/* Continuity Notes */}
            {proposal.continuityNotes && proposal.continuityNotes.length > 0 && (
              <div className="rounded-xl border border-[#363433] bg-[#141312] p-3 space-y-1">
                <div className="text-[10px] font-mono text-amber-400 uppercase font-semibold">
                  Continuity Integrity Notes
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] font-mono text-[#cac6bc]">
                  {proposal.continuityNotes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick Preview summary */}
            <div className="text-xs font-mono text-[#e6e2df] max-h-32 overflow-y-auto whitespace-pre-wrap bg-[#141312] p-3 rounded-xl border border-[#2b2a29]">
              {typeof proposal.draft === 'object'
                ? JSON.stringify(proposal.draft, null, 2)
                : String(proposal.draft)}
            </div>
          </div>
        )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#2b2a29] px-6 py-4 shrink-0 bg-[#141312] flex-wrap gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs font-mono text-[#8c887e]">
            Cancel
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={
                isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                )
              }
              onClick={handleGenerate}
              disabled={isLoading}
              className="text-xs font-mono"
            >
              {isLoading ? 'Synthesizing Draft...' : 'Generate Proposal'}
            </Button>

            {proposal && (
              <Button
                variant="primary"
                size="sm"
                icon={<Check className="h-3.5 w-3.5 text-[#141312]" />}
                onClick={handleApply}
                className="text-xs font-mono font-bold"
              >
                Insert Draft into Studio
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
