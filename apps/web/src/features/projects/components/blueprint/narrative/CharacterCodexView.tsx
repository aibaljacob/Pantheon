import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Sparkles,
  UserCheck,
  HeartHandshake,
  Crosshair,
  Compass,
  ArrowRight,
} from 'lucide-react';
import type { CharacterCodexEntry, CharacterRelationship } from '../../../types';
import { Button } from '../../../../../components/ui/Button';

interface CharacterCodexViewProps {
  characters: CharacterCodexEntry[];
  onChange: (updated: CharacterCodexEntry[]) => void;
  onOpenAiAssistant: (section: 'CHARACTERS', promptPreset?: string) => void;
}

export const CharacterCodexView: React.FC<CharacterCodexViewProps> = ({
  characters,
  onChange,
  onOpenAiAssistant,
}) => {
  const [selectedCharId, setSelectedCharId] = useState<string>(characters[0]?.id || '');

  const activeCharIndex = characters.findIndex((c) => c.id === selectedCharId);
  const activeChar = activeCharIndex !== -1 ? characters[activeCharIndex] : characters[0];

  const handleAddCharacter = () => {
    const newChar: CharacterCodexEntry = {
      id: `char-${Date.now()}`,
      name: 'New Character',
      archetype: 'The Reluctant Wanderer',
      role: 'SUPPORTING',
      backstory: 'Historical origins and formative trauma...',
      motivation: 'What drives their actions each day...',
      goal: 'Immediate tangible objective in the narrative...',
      conflict: 'The emotional or physical obstacle blocking their goal...',
      arc: 'How they evolve over the course of the story...',
      relationships: [],
    };
    const updated = [...characters, newChar];
    onChange(updated);
    setSelectedCharId(newChar.id);
  };

  const handleUpdateActiveCharacter = (updated: CharacterCodexEntry) => {
    if (activeCharIndex === -1) return;
    const list = [...characters];
    list[activeCharIndex] = updated;
    onChange(list);
  };

  const handleRemoveActiveCharacter = () => {
    if (characters.length <= 1) return;
    const remaining = characters.filter((c) => c.id !== activeChar?.id);
    onChange(remaining);
    setSelectedCharId(remaining[0]?.id || '');
  };

  const handleAddRelationship = () => {
    if (!activeChar) return;
    const otherChars = characters.filter((c) => c.id !== activeChar.id);
    const target = otherChars[0];

    const newRel: CharacterRelationship = {
      targetCharacterId: target ? target.id : '',
      targetCharacterName: target ? target.name : 'Unknown Character',
      relationshipType: 'Allied Bond',
      details: 'Nature of their trust, rivalry, or shared history...',
    };

    handleUpdateActiveCharacter({
      ...activeChar,
      relationships: [...(activeChar.relationships || []), newRel],
    });
  };

  const handleUpdateRelationship = (relIdx: number, updatedRel: CharacterRelationship) => {
    if (!activeChar) return;
    const rels = [...(activeChar.relationships || [])];
    rels[relIdx] = updatedRel;
    handleUpdateActiveCharacter({ ...activeChar, relationships: rels });
  };

  const handleRemoveRelationship = (relIdx: number) => {
    if (!activeChar) return;
    handleUpdateActiveCharacter({
      ...activeChar,
      relationships: activeChar.relationships.filter((_, idx) => idx !== relIdx),
    });
  };

  const roleBadgeColors: Record<string, string> = {
    PROTAGONIST: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40',
    ANTAGONIST: 'bg-red-950/40 text-red-300 border-red-500/40',
    SUPPORTING: 'bg-amber-950/40 text-amber-300 border-amber-500/40',
    FACTION_LEADER: 'bg-purple-950/40 text-purple-300 border-purple-500/40',
    NPC: 'bg-stone-800 text-stone-300 border-stone-600',
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-amber-400" />
          <h3 className="font-headline text-base font-bold text-[#ffffff]">
            Character Codex & Dramatic Arcs ({characters.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Sparkles className="h-3.5 w-3.5 text-amber-400" />}
            onClick={() => onOpenAiAssistant('CHARACTERS', 'Generate compelling protagonist, antagonist, and tragic mentor profiles')}
            className="text-xs font-mono"
          >
            AI Draft Characters
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-3.5 w-3.5 text-[#141312]" />}
            onClick={handleAddCharacter}
            className="text-xs font-mono font-bold"
          >
            New Character
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Character List Sidebar */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-[10px] font-mono uppercase text-[#8c887e] tracking-wider px-1">
            Cast Directory
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {characters.map((char) => {
              const isSelected = char.id === activeChar?.id;
              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => setSelectedCharId(char.id)}
                  className={`w-full text-left rounded-2xl border p-3.5 transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'border-amber-500/50 bg-[#201f1e] shadow-md'
                      : 'border-[#2b2a29] bg-[#141312] hover:border-[#363433] hover:bg-[#1c1b1a]'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="font-headline text-sm font-bold text-[#ffffff] truncate">
                      {char.name}
                    </div>
                    <div className="text-[11px] font-mono text-[#8c887e] truncate">
                      {char.archetype}
                    </div>
                  </div>

                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider shrink-0 ${
                      roleBadgeColors[char.role] || roleBadgeColors.NPC
                    }`}
                  >
                    {char.role.replace('_', ' ')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Character Dossier */}
        {activeChar ? (
          <div className="lg:col-span-8 space-y-6 rounded-3xl border border-[#363433] bg-[#141312] p-6 shadow-xl">
            {/* Header with Name, Role, Archetype */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2b2a29] pb-4">
              <div className="space-y-1 flex-1">
                <input
                  type="text"
                  value={activeChar.name}
                  onChange={(e) => handleUpdateActiveCharacter({ ...activeChar, name: e.target.value })}
                  className="w-full font-headline text-2xl font-extrabold text-[#ffffff] bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                  placeholder="Character Name"
                />
                <input
                  type="text"
                  value={activeChar.archetype}
                  onChange={(e) => handleUpdateActiveCharacter({ ...activeChar, archetype: e.target.value })}
                  className="w-full text-xs font-mono text-amber-300 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                  placeholder="Archetype (e.g., The Tragic Zealot)"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={activeChar.role}
                  onChange={(e) =>
                    handleUpdateActiveCharacter({
                      ...activeChar,
                      role: e.target.value as CharacterCodexEntry['role'],
                    })
                  }
                  className="rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs font-mono text-[#cac6bc] focus:border-amber-500/50 focus:outline-none"
                >
                  <option value="PROTAGONIST">Protagonist</option>
                  <option value="ANTAGONIST">Antagonist</option>
                  <option value="SUPPORTING">Supporting</option>
                  <option value="FACTION_LEADER">Faction Leader</option>
                  <option value="NPC">NPC</option>
                </select>

                {characters.length > 1 && (
                  <button
                    type="button"
                    onClick={handleRemoveActiveCharacter}
                    className="rounded-xl border border-[#363433] bg-[#1c1b1a] p-2 text-[#8c887e] hover:text-red-400 hover:border-red-500/40 transition-colors"
                    title="Delete character dossier"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Backstory & Motivation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
                  <UserCheck className="h-3.5 w-3.5" />
                  <span className="uppercase">Origin & Backstory</span>
                </div>
                <textarea
                  rows={4}
                  value={activeChar.backstory}
                  onChange={(e) => handleUpdateActiveCharacter({ ...activeChar, backstory: e.target.value })}
                  className="w-full rounded-xl border border-[#2b2a29] bg-[#1c1b1a] px-3 py-2 text-xs font-sans leading-relaxed text-[#cac6bc] focus:border-amber-500/60 focus:outline-none"
                  placeholder="Formative past events, allegiances, scars, or upbringing..."
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
                  <Compass className="h-3.5 w-3.5" />
                  <span className="uppercase">Core Motivation</span>
                </div>
                <textarea
                  rows={4}
                  value={activeChar.motivation}
                  onChange={(e) => handleUpdateActiveCharacter({ ...activeChar, motivation: e.target.value })}
                  className="w-full rounded-xl border border-[#2b2a29] bg-[#1c1b1a] px-3 py-2 text-xs font-sans leading-relaxed text-[#cac6bc] focus:border-amber-500/60 focus:outline-none"
                  placeholder="Why do they keep moving forward? What psychological need drives them?"
                />
              </div>
            </div>

            {/* Goal, Conflict, and Arc */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
                  <Crosshair className="h-3.5 w-3.5" />
                  <span className="uppercase">Immediate Goal</span>
                </div>
                <textarea
                  rows={3}
                  value={activeChar.goal}
                  onChange={(e) => handleUpdateActiveCharacter({ ...activeChar, goal: e.target.value })}
                  className="w-full rounded-xl border border-[#2b2a29] bg-[#1c1b1a] px-3 py-2 text-xs font-sans text-[#cac6bc] focus:border-amber-500/60 focus:outline-none"
                  placeholder="Concrete objective in the scene/game..."
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
                  <span className="uppercase">Dramatic Conflict</span>
                </div>
                <textarea
                  rows={3}
                  value={activeChar.conflict}
                  onChange={(e) => handleUpdateActiveCharacter({ ...activeChar, conflict: e.target.value })}
                  className="w-full rounded-xl border border-[#2b2a29] bg-[#1c1b1a] px-3 py-2 text-xs font-sans text-[#cac6bc] focus:border-amber-500/60 focus:outline-none"
                  placeholder="Internal fear, tragic flaw, or opposing adversary..."
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
                  <span className="uppercase">Character Arc</span>
                </div>
                <textarea
                  rows={3}
                  value={activeChar.arc}
                  onChange={(e) => handleUpdateActiveCharacter({ ...activeChar, arc: e.target.value })}
                  className="w-full rounded-xl border border-[#2b2a29] bg-[#1c1b1a] px-3 py-2 text-xs font-sans text-[#cac6bc] focus:border-amber-500/60 focus:outline-none"
                  placeholder="How does this character transform by the conclusion?"
                />
              </div>
            </div>

            {/* Cross-Character Relationships */}
            <div className="space-y-3 pt-2 border-t border-[#2b2a29]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-300 uppercase tracking-wider font-semibold">
                  <HeartHandshake className="h-4 w-4" />
                  <span>Interpersonal Relationships & Tensions ({activeChar.relationships?.length || 0})</span>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Plus className="h-3 w-3" />}
                  onClick={handleAddRelationship}
                  className="text-xs font-mono"
                >
                  Add Relationship
                </Button>
              </div>

              {(!activeChar.relationships || activeChar.relationships.length === 0) && (
                <div className="rounded-xl border border-[#2b2a29] bg-[#1c1b1a] p-4 text-center text-xs font-mono text-[#8c887e]">
                  No cross-character bonds defined yet. Add a link to connect with other cast members.
                </div>
              )}

              <div className="space-y-3">
                {(activeChar.relationships || []).map((rel, rIdx) => {
                  return (
                    <div
                      key={rIdx}
                      className="rounded-xl border border-[#2b2a29] bg-[#1c1b1a] p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                          <span className="font-bold text-[#ffffff]">{activeChar.name}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                          <select
                            value={rel.targetCharacterId}
                            onChange={(e) => {
                              const targetId = e.target.value;
                              const match = characters.find((c) => c.id === targetId);
                              handleUpdateRelationship(rIdx, {
                                ...rel,
                                targetCharacterId: targetId,
                                targetCharacterName: match ? match.name : 'Unknown',
                              });
                            }}
                            className="rounded-lg border border-[#363433] bg-[#141312] px-2 py-1 text-xs font-mono text-amber-300 focus:outline-none"
                          >
                            {characters
                              .filter((c) => c.id !== activeChar.id)
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({c.role})
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={rel.relationshipType}
                            onChange={(e) =>
                              handleUpdateRelationship(rIdx, { ...rel, relationshipType: e.target.value })
                            }
                            placeholder="e.g. Estranged Daughter & Arch-Nemesis"
                            className="rounded-lg border border-[#363433] bg-[#141312] px-2.5 py-1 text-xs font-mono text-[#cac6bc] focus:border-amber-500/50 focus:outline-none"
                          />

                          <button
                            type="button"
                            onClick={() => handleRemoveRelationship(rIdx)}
                            className="text-[#8c887e] hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={2}
                        value={rel.details}
                        onChange={(e) =>
                          handleUpdateRelationship(rIdx, { ...rel, details: e.target.value })
                        }
                        placeholder="Details of their shared history, tension, or conflict..."
                        className="w-full rounded-lg border border-[#2b2a29] bg-[#141312] px-2.5 py-1.5 text-xs font-sans text-[#cac6bc] focus:border-amber-500/50 focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 rounded-3xl border border-[#363433] bg-[#141312] p-8 text-center text-xs font-mono text-[#8c887e]">
            No character selected. Add a character to start drafting dossiers.
          </div>
        )}
      </div>
    </div>
  );
};
