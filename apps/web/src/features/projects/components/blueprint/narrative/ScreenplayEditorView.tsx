import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  MessageSquare,
  Clapperboard,
  Eye,
  Edit3,
} from 'lucide-react';
import type { ScreenplayScene, ScreenplayDialogueLine, CharacterCodexEntry } from '../../../types';
import { Button } from '../../../../../components/ui/Button';

interface ScreenplayEditorViewProps {
  scenes: ScreenplayScene[];
  characters: CharacterCodexEntry[];
  onChange: (updated: ScreenplayScene[]) => void;
  onOpenAiAssistant: (section: 'SCENE', promptPreset?: string) => void;
}

export const ScreenplayEditorView: React.FC<ScreenplayEditorViewProps> = ({
  scenes,
  characters,
  onChange,
  onOpenAiAssistant,
}) => {
  const [selectedSceneId, setSelectedSceneId] = useState<string>(scenes[0]?.id || '');
  const [viewMode, setViewMode] = useState<'WRITER' | 'SCRIPT_PREVIEW'>('WRITER');

  const activeIndex = scenes.findIndex((s) => s.id === selectedSceneId);
  const activeScene = activeIndex !== -1 ? scenes[activeIndex] : scenes[0];

  const handleAddScene = () => {
    const nextNumber = scenes.length + 1;
    const newScene: ScreenplayScene = {
      id: `scene-${Date.now()}`,
      sceneNumber: nextNumber,
      title: `Scene ${nextNumber}: New Encounter`,
      slugline: {
        intExt: 'INT',
        location: 'SANCTUM PERIPHERY - SECTOR 4',
        timeOfDay: 'NIGHT',
      },
      summary: 'Summary of narrative stakes and scene conflict...',
      actionDirections: 'Atmospheric action and camera framing notes...',
      dialogueLines: [
        {
          id: `line-${Date.now()}-1`,
          characterName: characters[0]?.name?.toUpperCase() || 'PROTAGONIST',
          parenthetical: 'whispering, scanning the perimeter',
          dialogue: 'We only have until the fourth bell tolls.',
        },
      ],
      notes: 'Creative intentions and cutscene pacing.',
      isDraft: true,
    };
    const updated = [...scenes, newScene];
    onChange(updated);
    setSelectedSceneId(newScene.id);
  };

  const handleUpdateActiveScene = (updated: ScreenplayScene) => {
    if (activeIndex === -1) return;
    const list = [...scenes];
    list[activeIndex] = updated;
    onChange(list);
  };

  const handleRemoveActiveScene = () => {
    if (scenes.length <= 1) return;
    const remaining = scenes.filter((s) => s.id !== activeScene?.id);
    const renumbered = remaining.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    onChange(renumbered);
    setSelectedSceneId(renumbered[0]?.id || '');
  };

  const handleMoveScene = (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === scenes.length - 1) return;

    const list = [...scenes];
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const renumbered = list.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    onChange(renumbered);
  };

  const handleAddDialogueLine = () => {
    if (!activeScene) return;
    const newLine: ScreenplayDialogueLine = {
      id: `line-${Date.now()}`,
      characterName: characters[0]?.name?.toUpperCase() || 'SPEAKER',
      parenthetical: '',
      dialogue: 'Dialogue line spoken in scene...',
    };
    handleUpdateActiveScene({
      ...activeScene,
      dialogueLines: [...(activeScene.dialogueLines || []), newLine],
    });
  };

  const handleUpdateDialogueLine = (lineIdx: number, updatedLine: ScreenplayDialogueLine) => {
    if (!activeScene) return;
    const lines = [...(activeScene.dialogueLines || [])];
    lines[lineIdx] = updatedLine;
    handleUpdateActiveScene({ ...activeScene, dialogueLines: lines });
  };

  const handleRemoveDialogueLine = (lineIdx: number) => {
    if (!activeScene) return;
    handleUpdateActiveScene({
      ...activeScene,
      dialogueLines: activeScene.dialogueLines.filter((_, idx) => idx !== lineIdx),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Clapperboard className="h-5 w-5 text-amber-400" />
          <h3 className="font-headline text-base font-bold text-[#ffffff]">
            Screenplay Studio & Dialogue Editor ({scenes.length} Scenes)
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-[#363433] bg-[#141312] p-1">
            <button
              type="button"
              onClick={() => setViewMode('WRITER')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-mono font-medium transition-all ${
                viewMode === 'WRITER'
                  ? 'bg-[#201f1e] text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-[#8c887e] hover:text-[#e6e2df]'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Writer</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('SCRIPT_PREVIEW')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-mono font-medium transition-all ${
                viewMode === 'SCRIPT_PREVIEW'
                  ? 'bg-[#201f1e] text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-[#8c887e] hover:text-[#e6e2df]'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Cinematic Script</span>
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={<Sparkles className="h-3.5 w-3.5 text-amber-400" />}
            onClick={() => onOpenAiAssistant('SCENE', 'Author high-tension screenplay dialogue between key characters')}
            className="text-xs font-mono"
          >
            AI Draft Scene
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-3.5 w-3.5 text-[#141312]" />}
            onClick={handleAddScene}
            className="text-xs font-mono font-bold"
          >
            Add Scene
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Scene List Sidebar */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-[10px] font-mono uppercase text-[#8c887e] tracking-wider px-1">
            Scene Sequence & Ordering
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {scenes.map((scene, idx) => {
              const isSelected = scene.id === activeScene?.id;
              return (
                <div
                  key={scene.id}
                  className={`group relative rounded-2xl border p-3.5 transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'border-amber-500/50 bg-[#201f1e] shadow-md'
                      : 'border-[#2b2a29] bg-[#141312] hover:border-[#363433] hover:bg-[#1c1b1a]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedSceneId(scene.id)}
                    className="flex-1 text-left space-y-1 min-w-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-amber-400">
                        SCENE #{scene.sceneNumber}
                      </span>
                      {scene.isDraft && (
                        <span className="rounded bg-amber-950/60 border border-amber-500/30 px-1 py-0.2 text-[9px] font-mono text-amber-300">
                          DRAFT
                        </span>
                      )}
                    </div>
                    <div className="font-headline text-sm font-bold text-[#ffffff] truncate">
                      {scene.title}
                    </div>
                    <div className="text-[10px] font-mono text-[#8c887e] truncate">
                      {scene.slugline.intExt}. {scene.slugline.location} - {scene.slugline.timeOfDay}
                    </div>
                  </button>

                  {/* Ordering Controls */}
                  <div className="flex flex-col items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveScene(idx, 'UP')}
                      className="p-1 rounded text-[#8c887e] hover:text-[#ffffff] disabled:opacity-20"
                      title="Move Scene Up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === scenes.length - 1}
                      onClick={() => handleMoveScene(idx, 'DOWN')}
                      className="p-1 rounded text-[#8c887e] hover:text-[#ffffff] disabled:opacity-20"
                      title="Move Scene Down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scene Main Workspace */}
        {activeScene ? (
          <div className="lg:col-span-8 space-y-6">
            {viewMode === 'WRITER' ? (
              /* WRITER VIEW: Structured Fields */
              <div className="space-y-6 rounded-3xl border border-[#363433] bg-[#141312] p-6 shadow-xl">
                {/* Scene Header */}
                <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4 flex-wrap gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                        SCENE #{activeScene.sceneNumber}
                      </span>
                      {activeScene.isDraft && (
                        <span className="rounded bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-mono text-amber-300">
                          EDITABLE DRAFT
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={activeScene.title}
                      onChange={(e) => handleUpdateActiveScene({ ...activeScene, title: e.target.value })}
                      className="w-full font-headline text-xl font-bold text-[#ffffff] bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                      placeholder="Scene Title..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateActiveScene({ ...activeScene, isDraft: !activeScene.isDraft })
                      }
                      className="rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs font-mono text-[#cac6bc] hover:text-white"
                    >
                      {activeScene.isDraft ? 'Mark as Approved' : 'Mark as Draft'}
                    </button>

                    {scenes.length > 1 && (
                      <button
                        type="button"
                        onClick={handleRemoveActiveScene}
                        className="rounded-xl border border-[#363433] bg-[#1c1b1a] p-2 text-[#8c887e] hover:text-red-400 hover:border-red-500/40 transition-colors"
                        title="Delete Scene"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Slugline Bar (INT/EXT - LOCATION - TIME) */}
                <div className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 space-y-2">
                  <label className="text-[10px] font-mono text-amber-300 uppercase tracking-wider font-semibold">
                    Screenplay Slugline (Scene Heading)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-3">
                      <select
                        value={activeScene.slugline.intExt}
                        onChange={(e) =>
                          handleUpdateActiveScene({
                            ...activeScene,
                            slugline: {
                              ...activeScene.slugline,
                              intExt: e.target.value as any,
                            },
                          })
                        }
                        className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-xs font-mono font-bold text-[#ffffff] focus:outline-none"
                      >
                        <option value="INT">INT.</option>
                        <option value="EXT">EXT.</option>
                        <option value="INT/EXT">INT./EXT.</option>
                      </select>
                    </div>

                    <div className="sm:col-span-6">
                      <input
                        type="text"
                        value={activeScene.slugline.location}
                        onChange={(e) =>
                          handleUpdateActiveScene({
                            ...activeScene,
                            slugline: {
                              ...activeScene.slugline,
                              location: e.target.value.toUpperCase(),
                            },
                          })
                        }
                        placeholder="LOCATION SPECIFIER"
                        className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-xs font-mono font-bold text-[#ffffff] uppercase focus:border-amber-500/50 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <select
                        value={activeScene.slugline.timeOfDay}
                        onChange={(e) =>
                          handleUpdateActiveScene({
                            ...activeScene,
                            slugline: {
                              ...activeScene.slugline,
                              timeOfDay: e.target.value as any,
                            },
                          })
                        }
                        className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-2 text-xs font-mono font-bold text-[#ffffff] focus:outline-none"
                      >
                        <option value="DAY">DAY</option>
                        <option value="NIGHT">NIGHT</option>
                        <option value="DUSK">DUSK</option>
                        <option value="DAWN">DAWN</option>
                        <option value="CONTINUOUS">CONTINUOUS</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Action Directions */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-amber-300 uppercase tracking-wider font-semibold">
                      Action & Stage Directions
                    </label>
                    <span className="text-[10px] font-mono text-[#8c887e]">
                      Visual choreography, cinematography cues, and physical behavior
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={activeScene.actionDirections}
                    onChange={(e) =>
                      handleUpdateActiveScene({ ...activeScene, actionDirections: e.target.value })
                    }
                    placeholder="Volumetric ash falls like gray snow over the shattered stone ramparts..."
                    className="w-full rounded-xl border border-[#2b2a29] bg-[#1c1b1a] px-3.5 py-2.5 text-xs font-sans leading-relaxed text-[#ffffff] focus:border-amber-500/60 focus:outline-none"
                  />
                </div>

                {/* Dialogue Lines Editor */}
                <div className="space-y-4 pt-2 border-t border-[#2b2a29]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono text-amber-300 uppercase tracking-wider font-semibold">
                      <MessageSquare className="h-4 w-4" />
                      <span>Character Dialogue Blocks ({activeScene.dialogueLines?.length || 0})</span>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Plus className="h-3 w-3" />}
                      onClick={handleAddDialogueLine}
                      className="text-xs font-mono"
                    >
                      Add Dialogue Line
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {(activeScene.dialogueLines || []).map((line, lIdx) => (
                      <div
                        key={line.id || lIdx}
                        className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-4 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            {/* Autocomplete / Select from Cast or free text */}
                            <input
                              type="text"
                              value={line.characterName}
                              onChange={(e) =>
                                handleUpdateDialogueLine(lIdx, {
                                  ...line,
                                  characterName: e.target.value.toUpperCase(),
                                })
                              }
                              placeholder="CHARACTER NAME"
                              className="rounded-lg border border-[#363433] bg-[#141312] px-2.5 py-1 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider focus:outline-none"
                            />

                            <input
                              type="text"
                              value={line.parenthetical || ''}
                              onChange={(e) =>
                                handleUpdateDialogueLine(lIdx, {
                                  ...line,
                                  parenthetical: e.target.value,
                                })
                              }
                              placeholder="(parenthetical / delivery direction)"
                              className="rounded-lg border border-[#363433] bg-[#141312] px-2.5 py-1 text-xs font-sans italic text-[#8c887e] flex-1 focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveDialogueLine(lIdx)}
                            className="text-[#8c887e] hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <textarea
                          rows={2}
                          value={line.dialogue}
                          onChange={(e) =>
                            handleUpdateDialogueLine(lIdx, { ...line, dialogue: e.target.value })
                          }
                          placeholder="Character spoken dialogue..."
                          className="w-full rounded-xl border border-[#2b2a29] bg-[#141312] px-3 py-2 text-xs font-sans text-[#e6e2df] focus:border-amber-500/60 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* SCRIPT PREVIEW: Industry Screenplay Layout */
              <div className="rounded-3xl border border-[#363433] bg-[#0f0e0d] p-8 sm:p-12 shadow-2xl font-mono text-xs text-[#e6e2df] space-y-6">
                <div className="text-center border-b border-[#2b2a29] pb-4">
                  <div className="text-[10px] uppercase text-[#8c887e] tracking-widest">
                    PANTHEON SCREENPLAY FORMAT · SCENE {activeScene.sceneNumber}
                  </div>
                  <h2 className="font-bold text-sm text-[#ffffff] uppercase tracking-wider mt-1">
                    {activeScene.title}
                  </h2>
                </div>

                {/* Screenplay Slugline */}
                <div className="font-bold uppercase tracking-wider text-amber-300">
                  {activeScene.slugline.intExt}. {activeScene.slugline.location} - {activeScene.slugline.timeOfDay}
                </div>

                {/* Action Paragraph */}
                <div className="leading-relaxed text-[#cac6bc] whitespace-pre-wrap max-w-2xl">
                  {activeScene.actionDirections}
                </div>

                {/* Dialogue Blocks */}
                <div className="space-y-6 pt-4">
                  {(activeScene.dialogueLines || []).map((line, idx) => (
                    <div key={idx} className="max-w-md mx-auto text-center space-y-1">
                      <div className="font-bold text-[#ffffff] tracking-wider">
                        {line.characterName}
                      </div>
                      {line.parenthetical && (
                        <div className="italic text-[#8c887e] text-[11px]">
                          ({line.parenthetical.replace(/^\(|\)$/g, '')})
                        </div>
                      )}
                      <div className="text-left text-[#e6e2df] leading-relaxed px-4">
                        {line.dialogue}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-8 rounded-3xl border border-[#363433] bg-[#141312] p-8 text-center text-xs font-mono text-[#8c887e]">
            No scenes available. Click &quot;Add Scene&quot; to begin your screenplay.
          </div>
        )}
      </div>
    </div>
  );
};
