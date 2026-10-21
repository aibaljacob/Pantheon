import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Users,
  Film,
  GitBranch,
  Sparkles,
  Save,
  Loader2,
  Check,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import type { GameBlueprint, NarrativeData, ProjectDetail } from '../../../types';
import { createDefaultNarrative } from './defaultNarrative';
import { StoryBibleView } from './StoryBibleView';
import { CharacterCodexView } from './CharacterCodexView';
import { ScreenplayEditorView } from './ScreenplayEditorView';
import { QuestBranchingView } from './QuestBranchingView';
import { NarrativeAiAssistantModal } from './NarrativeAiAssistantModal';
import { NarrativeTaskApprovalModal } from './NarrativeTaskApprovalModal';
import { saveNarrative } from '../../../services/blueprintService';
import { Button } from '../../../../../components/ui/Button';

interface NarrativeStudioProps {
  project: ProjectDetail;
  blueprint: GameBlueprint;
  token?: string;
  onBlueprintUpdated?: (updated: GameBlueprint) => void;
  className?: string;
}

export type NarrativeStudioTab = 'BIBLE' | 'CHARACTERS' | 'SCREENPLAY' | 'QUESTS';

export const NarrativeStudio: React.FC<NarrativeStudioProps> = ({
  project,
  blueprint,
  token,
  onBlueprintUpdated,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<NarrativeStudioTab>('SCREENPLAY');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTargetSection, setAiTargetSection] = useState<'STORY_BIBLE' | 'CHARACTERS' | 'SCENE' | 'QUEST'>('SCENE');
  const [aiPromptPreset, setAiPromptPreset] = useState<string>('');
  const [isTaskApprovalModalOpen, setIsTaskApprovalModalOpen] = useState(false);

  // Initialize or fallback to default narrative
  const [narrative, setNarrative] = useState<NarrativeData>(() => {
    if (blueprint.narrative && blueprint.narrative.storyBible) {
      return blueprint.narrative;
    }
    return createDefaultNarrative(project.name, project.genre);
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync if blueprint.narrative updates externally
  useEffect(() => {
    if (blueprint.narrative && blueprint.narrative.storyBible) {
      setNarrative(blueprint.narrative);
    }
  }, [blueprint.narrative]);

  const handleUpdateNarrative = (updated: Partial<NarrativeData>) => {
    setNarrative((prev) => ({
      ...prev,
      ...updated,
      updatedAt: new Date().toISOString(),
    }));
    setIsDirty(true);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!token) {
      setSaveError('Authentication token missing. Sign in to persist changes.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const saved = await saveNarrative(project.id, narrative, token);
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      if (onBlueprintUpdated) {
        onBlueprintUpdated({
          ...blueprint,
          narrative: saved,
        });
      }
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save narrative.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAiAssistant = (
    section: 'STORY_BIBLE' | 'CHARACTERS' | 'SCENE' | 'QUEST',
    promptPreset?: string,
  ) => {
    setAiTargetSection(section);
    setAiPromptPreset(promptPreset || '');
    setIsAiModalOpen(true);
  };

  const handleAcceptAiDraft = (
    section: 'STORY_BIBLE' | 'CHARACTERS' | 'SCENE' | 'QUEST',
    draft: any,
  ) => {
    if (section === 'STORY_BIBLE') {
      handleUpdateNarrative({
        storyBible: {
          ...narrative.storyBible,
          ...draft,
        },
      });
    } else if (section === 'CHARACTERS') {
      const draftList = Array.isArray(draft) ? draft : [draft];
      handleUpdateNarrative({
        characters: [...(narrative.characters || []), ...draftList],
      });
      setActiveTab('CHARACTERS');
    } else if (section === 'SCENE') {
      const sceneDraft = {
        ...draft,
        id: `scene-${Date.now()}`,
        sceneNumber: (narrative.scenes?.length || 0) + 1,
        isDraft: true,
      };
      handleUpdateNarrative({
        scenes: [...(narrative.scenes || []), sceneDraft],
      });
      setActiveTab('SCREENPLAY');
    } else if (section === 'QUEST') {
      const questList = Array.isArray(draft) ? draft : [draft];
      handleUpdateNarrative({
        quests: [...(narrative.quests || []), ...questList],
      });
      setActiveTab('QUESTS');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Writers' Room Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-[#363433] bg-[#141312] p-6 sm:p-8 shadow-2xl">
        {/* Atmospheric Film Noir Lighting */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-stone-700/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#2b2a29] pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full border border-amber-500/40 bg-amber-950/30 px-3 py-1 text-[11px] font-mono font-semibold tracking-wider text-amber-300">
                NARRATIVE STUDIO · WRITERS&apos; ROOM
              </span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-950/20 px-3 py-1 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Continuity Engine Online
              </span>
              <span className="rounded-full border border-[#48473f] bg-[#201f1e] px-3 py-1 text-[11px] font-mono text-[#cac6bc]">
                Collaborative Game Storytelling
              </span>
            </div>

            <h1 className="font-headline text-3xl sm:text-4xl font-extrabold tracking-tight text-[#ffffff]">
              Narrative Studio & Screenplay Suite
            </h1>

            <p className="max-w-3xl text-sm font-sans leading-relaxed text-[#cac6bc]">
              Collaboratively author world lore, character codices, formatted screenplay cutscenes, and divergent branching quest graphs. AI draft proposals remain strictly editable and never create production records automatically.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Button
              variant="secondary"
              size="md"
              icon={<Sparkles className="h-4 w-4 text-amber-400" />}
              onClick={() => handleOpenAiAssistant(activeTab === 'BIBLE' ? 'STORY_BIBLE' : activeTab === 'CHARACTERS' ? 'CHARACTERS' : activeTab === 'SCREENPLAY' ? 'SCENE' : 'QUEST')}
              className="text-xs font-mono font-bold"
            >
              AI Assistant
            </Button>

            {project.isFounder && (
              <Button
                variant="secondary"
                size="md"
                icon={<FileCheck2 className="h-4 w-4 text-emerald-400" />}
                onClick={() => setIsTaskApprovalModalOpen(true)}
                className="text-xs font-mono font-bold text-emerald-300 border-emerald-500/40 hover:bg-emerald-950/30"
              >
                Approve to Tasks
              </Button>
            )}

            <Button
              variant="primary"
              size="md"
              icon={
                isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#141312]" />
                ) : saveSuccess ? (
                  <Check className="h-4 w-4 text-[#141312]" />
                ) : (
                  <Save className="h-4 w-4 text-[#141312]" />
                )
              }
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="text-xs font-mono font-bold"
            >
              {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : isDirty ? 'Save Narrative' : 'Saved'}
            </Button>
          </div>
        </div>

        {saveError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs font-mono text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Studio Navigation Tabs */}
        <div className="relative z-10 pt-6">
          <div className="flex items-center gap-2 border-b border-[#2b2a29] pb-3 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('SCREENPLAY')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono font-bold transition-all ${
                activeTab === 'SCREENPLAY'
                  ? 'bg-[#201f1e] text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-[#8c887e] hover:text-[#e6e2df] hover:bg-[#1c1b1a]'
              }`}
            >
              <Film className="h-4 w-4" />
              <span>Screenplay Editor ({narrative.scenes?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CHARACTERS')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono font-bold transition-all ${
                activeTab === 'CHARACTERS'
                  ? 'bg-[#201f1e] text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-[#8c887e] hover:text-[#e6e2df] hover:bg-[#1c1b1a]'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Character Codex ({narrative.characters?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('BIBLE')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono font-bold transition-all ${
                activeTab === 'BIBLE'
                  ? 'bg-[#201f1e] text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-[#8c887e] hover:text-[#e6e2df] hover:bg-[#1c1b1a]'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Story Bible & Lore</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('QUESTS')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono font-bold transition-all ${
                activeTab === 'QUESTS'
                  ? 'bg-[#201f1e] text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-[#8c887e] hover:text-[#e6e2df] hover:bg-[#1c1b1a]'
              }`}
            >
              <GitBranch className="h-4 w-4" />
              <span>Quest & Branching Graph ({narrative.quests?.length || 0})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Viewport */}
      {activeTab === 'SCREENPLAY' && (
        <ScreenplayEditorView
          scenes={narrative.scenes || []}
          characters={narrative.characters || []}
          onChange={(scenes) => handleUpdateNarrative({ scenes })}
          onOpenAiAssistant={(sec, preset) => handleOpenAiAssistant(sec, preset)}
        />
      )}

      {activeTab === 'CHARACTERS' && (
        <CharacterCodexView
          characters={narrative.characters || []}
          onChange={(characters) => handleUpdateNarrative({ characters })}
          onOpenAiAssistant={(sec, preset) => handleOpenAiAssistant(sec, preset)}
        />
      )}

      {activeTab === 'BIBLE' && (
        <StoryBibleView
          bible={narrative.storyBible}
          onChange={(storyBible) => handleUpdateNarrative({ storyBible })}
          onOpenAiAssistant={(sec, preset) => handleOpenAiAssistant(sec, preset)}
        />
      )}

      {activeTab === 'QUESTS' && (
        <QuestBranchingView
          quests={narrative.quests || []}
          onChange={(quests) => handleUpdateNarrative({ quests })}
          onOpenAiAssistant={(sec, preset) => handleOpenAiAssistant(sec, preset)}
        />
      )}

      {/* AI Assistant Modal */}
      {isAiModalOpen && (
        <NarrativeAiAssistantModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          projectId={project.id}
          narrative={narrative}
          initialSection={aiTargetSection}
          initialPrompt={aiPromptPreset}
          onAcceptDraft={handleAcceptAiDraft}
          token={token}
        />
      )}

      {/* Explicit Founder Task Approval Modal */}
      {isTaskApprovalModalOpen && (
        <NarrativeTaskApprovalModal
          isOpen={isTaskApprovalModalOpen}
          onClose={() => setIsTaskApprovalModalOpen(false)}
          projectId={project.id}
          narrative={narrative}
          token={token}
          onTasksApproved={() => {
            // Task creation succeeded
          }}
        />
      )}
    </div>
  );
};
