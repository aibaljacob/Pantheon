import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Sparkles,
  Shield,
  Clock,
  ScrollText,
  Sliders,
} from 'lucide-react';
import type { StoryBible, StoryFaction, StoryTimelineEra } from '../../../types';
import { Button } from '../../../../../components/ui/Button';

interface StoryBibleViewProps {
  bible: StoryBible;
  onChange: (updated: StoryBible) => void;
  onOpenAiAssistant: (section: 'STORY_BIBLE', promptPreset?: string) => void;
}

export const StoryBibleView: React.FC<StoryBibleViewProps> = ({
  bible,
  onChange,
  onOpenAiAssistant,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'FACTIONS' | 'TIMELINE'>('OVERVIEW');
  const [newThemeInput, setNewThemeInput] = useState('');

  const handleAddTheme = () => {
    if (!newThemeInput.trim()) return;
    onChange({
      ...bible,
      themes: [...(bible.themes || []), newThemeInput.trim()],
    });
    setNewThemeInput('');
  };

  const handleRemoveTheme = (index: number) => {
    onChange({
      ...bible,
      themes: bible.themes.filter((_, idx) => idx !== index),
    });
  };

  const handleAddFaction = () => {
    const newFaction: StoryFaction = {
      id: `fac-${Date.now()}`,
      name: 'New Faction',
      description: 'Describe their purpose, territory, and influence in the world.',
      alignment: 'Neutral',
      leader: 'Faction Leader',
      ideals: 'Their core conviction or oath.',
    };
    onChange({
      ...bible,
      factions: [...(bible.factions || []), newFaction],
    });
  };

  const handleUpdateFaction = (index: number, updated: StoryFaction) => {
    const factions = [...(bible.factions || [])];
    factions[index] = updated;
    onChange({ ...bible, factions });
  };

  const handleRemoveFaction = (index: number) => {
    onChange({
      ...bible,
      factions: bible.factions.filter((_, idx) => idx !== index),
    });
  };

  const handleAddTimelineEra = () => {
    const newEra: StoryTimelineEra = {
      id: `era-${Date.now()}`,
      era: 'New Age / Epoch',
      title: 'Key Historical Event',
      description: 'Describe the catalyst that reshaped the realm.',
      impact: 'Consequence that reverberates into the current setting.',
    };
    onChange({
      ...bible,
      timeline: [...(bible.timeline || []), newEra],
    });
  };

  const handleUpdateTimelineEra = (index: number, updated: StoryTimelineEra) => {
    const timeline = [...(bible.timeline || [])];
    timeline[index] = updated;
    onChange({ ...bible, timeline });
  };

  const handleRemoveTimelineEra = (index: number) => {
    onChange({
      ...bible,
      timeline: bible.timeline.filter((_, idx) => idx !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation bar */}
      <div className="flex items-center justify-between gap-3 border-b border-[#2b2a29] pb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('OVERVIEW')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-mono font-bold transition-all ${
              activeSubTab === 'OVERVIEW'
                ? 'bg-[#201f1e] text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-[#8c887e] hover:text-[#e6e2df] hover:bg-[#1c1b1a]'
            }`}
          >
            <ScrollText className="h-3.5 w-3.5" />
            <span>Lore & Setting Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('FACTIONS')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-mono font-bold transition-all ${
              activeSubTab === 'FACTIONS'
                ? 'bg-[#201f1e] text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-[#8c887e] hover:text-[#e6e2df] hover:bg-[#1c1b1a]'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Factions ({bible.factions?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('TIMELINE')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-mono font-bold transition-all ${
              activeSubTab === 'TIMELINE'
                ? 'bg-[#201f1e] text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-[#8c887e] hover:text-[#e6e2df] hover:bg-[#1c1b1a]'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Historical Timeline ({bible.timeline?.length || 0})</span>
          </button>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<Sparkles className="h-3.5 w-3.5 text-amber-400" />}
          onClick={() => onOpenAiAssistant('STORY_BIBLE', 'Expand world lore, historical events, and faction ideals')}
          className="text-xs font-mono"
        >
          AI Propose Lore
        </Button>
      </div>

      {/* OVERVIEW TAB */}
      {activeSubTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Narrative Summary */}
          <div className="rounded-2xl border border-[#363433] bg-[#141312] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-amber-300 uppercase tracking-wider font-semibold">
                Narrative Logline & World Synopsis
              </label>
              <span className="text-[10px] font-mono text-[#8c887e]">
                Foundational narrative premise for the writers&apos; room
              </span>
            </div>
            <textarea
              rows={3}
              value={bible.summary || ''}
              onChange={(e) => onChange({ ...bible, summary: e.target.value })}
              placeholder="High-level narrative logline..."
              className="w-full rounded-xl border border-[#2b2a29] bg-[#1c1b1a] px-3.5 py-2.5 text-xs font-sans leading-relaxed text-[#ffffff] focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* World Lore */}
            <div className="rounded-2xl border border-[#363433] bg-[#141312] p-5 space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-amber-400" />
                <label className="text-xs font-mono text-amber-300 uppercase tracking-wider font-semibold">
                  World Lore & Origin Myth
                </label>
              </div>
              <textarea
                rows={6}
                value={bible.worldLore || ''}
                onChange={(e) => onChange({ ...bible, worldLore: e.target.value })}
                placeholder="The ancient history, cosmology, cataclysms, or divine myths..."
                className="w-full rounded-xl border border-[#2b2a29] bg-[#1c1b1a] px-3.5 py-2.5 text-xs font-sans leading-relaxed text-[#cac6bc] focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              />
            </div>

            {/* Setting Rules */}
            <div className="rounded-2xl border border-[#363433] bg-[#141312] p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-400" />
                <label className="text-xs font-mono text-amber-300 uppercase tracking-wider font-semibold">
                  Inviolable Setting Rules
                </label>
              </div>
              <textarea
                rows={6}
                value={bible.settingRules || ''}
                onChange={(e) => onChange({ ...bible, settingRules: e.target.value })}
                placeholder="Laws of magic, technology limits, curses, taboos, or survival constraints..."
                className="w-full rounded-xl border border-[#2b2a29] bg-[#1c1b1a] px-3.5 py-2.5 text-xs font-mono leading-relaxed text-[#cac6bc] focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
              />
            </div>
          </div>

          {/* Central Themes */}
          <div className="rounded-2xl border border-[#363433] bg-[#141312] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-amber-300 uppercase tracking-wider font-semibold">
                Core Narrative Themes
              </label>
              <span className="text-[10px] font-mono text-[#8c887e]">
                Philosophical and emotional pillars explored across all scenes
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {(bible.themes || []).map((theme, idx) => (
                <div
                  key={idx}
                  className="group flex items-center gap-2 rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs font-mono text-[#e6e2df] transition-all hover:border-amber-500/40"
                >
                  <span>{theme}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTheme(idx)}
                    className="text-[#8c887e] hover:text-red-400 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newThemeInput}
                onChange={(e) => setNewThemeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTheme();
                  }
                }}
                placeholder="Add thematic motif (e.g., Sacrifice vs. Preservation)..."
                className="flex-1 rounded-xl border border-[#2b2a29] bg-[#1c1b1a] px-3 py-2 text-xs font-mono text-[#ffffff] focus:border-amber-500/60 focus:outline-none"
              />
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={handleAddTheme}
                className="text-xs font-mono"
              >
                Add Theme
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FACTIONS TAB */}
      {activeSubTab === 'FACTIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-[#8c887e]">
              Major organizations, houses, or syndicates fighting over the world&apos;s resources.
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-3.5 w-3.5 text-[#141312]" />}
              onClick={handleAddFaction}
              className="text-xs font-mono font-bold"
            >
              Add Faction
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(bible.factions || []).map((faction, idx) => (
              <div
                key={faction.id || idx}
                className="rounded-2xl border border-[#363433] bg-[#1c1b1a] p-4 space-y-3 transition-all hover:border-[#48473f]"
              >
                <div className="flex items-center justify-between border-b border-[#2b2a29] pb-2">
                  <input
                    type="text"
                    value={faction.name}
                    onChange={(e) => handleUpdateFaction(idx, { ...faction, name: e.target.value })}
                    className="font-headline text-sm font-bold text-[#ffffff] bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                    placeholder="Faction Name"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFaction(idx)}
                    className="text-[#8c887e] hover:text-red-400 transition-colors p-1"
                    title="Remove faction"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] font-mono text-amber-400 uppercase">Alignment / Stance</label>
                    <input
                      type="text"
                      value={faction.alignment || ''}
                      onChange={(e) => handleUpdateFaction(idx, { ...faction, alignment: e.target.value })}
                      placeholder="e.g. Lawful Neutral, Fanatical Inquisitors"
                      className="w-full rounded-lg border border-[#2b2a29] bg-[#141312] px-2.5 py-1.5 text-xs font-mono text-[#cac6bc] focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-amber-400 uppercase">Leadership</label>
                    <input
                      type="text"
                      value={faction.leader || ''}
                      onChange={(e) => handleUpdateFaction(idx, { ...faction, leader: e.target.value })}
                      placeholder="e.g. Lord Commander Vaelin"
                      className="w-full rounded-lg border border-[#2b2a29] bg-[#141312] px-2.5 py-1.5 text-xs font-mono text-[#cac6bc] focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-amber-400 uppercase">Ideals & Core Vow</label>
                    <input
                      type="text"
                      value={faction.ideals || ''}
                      onChange={(e) => handleUpdateFaction(idx, { ...faction, ideals: e.target.value })}
                      placeholder="What principles do they fight to uphold?"
                      className="w-full rounded-lg border border-[#2b2a29] bg-[#141312] px-2.5 py-1.5 text-xs font-sans text-[#cac6bc] focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-amber-400 uppercase">Description & Influence</label>
                    <textarea
                      rows={3}
                      value={faction.description || ''}
                      onChange={(e) => handleUpdateFaction(idx, { ...faction, description: e.target.value })}
                      placeholder="Background lore and strategic status..."
                      className="w-full rounded-lg border border-[#2b2a29] bg-[#141312] px-2.5 py-1.5 text-xs font-sans text-[#cac6bc] focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TIMELINE TAB */}
      {activeSubTab === 'TIMELINE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-[#8c887e]">
              Chronological epochs defining key historical inflection points that created the current world state.
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-3.5 w-3.5 text-[#141312]" />}
              onClick={handleAddTimelineEra}
              className="text-xs font-mono font-bold"
            >
              Add Timeline Event
            </Button>
          </div>

          <div className="space-y-3">
            {(bible.timeline || []).map((era, idx) => (
              <div
                key={era.id || idx}
                className="relative flex items-start gap-4 rounded-2xl border border-[#363433] bg-[#1c1b1a] p-4 transition-all hover:border-[#48473f]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs font-mono font-bold text-amber-400">
                  {idx + 1}
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[10px] font-mono text-amber-400 uppercase">Era / Epoch</label>
                    <input
                      type="text"
                      value={era.era}
                      onChange={(e) => handleUpdateTimelineEra(idx, { ...era, era: e.target.value })}
                      className="w-full rounded-lg border border-[#2b2a29] bg-[#141312] px-2.5 py-1.5 text-xs font-mono text-[#cac6bc] focus:border-amber-500/50 focus:outline-none"
                      placeholder="e.g. The Shattered Bell"
                    />
                  </div>

                  <div className="md:col-span-4 space-y-1.5">
                    <label className="text-[10px] font-mono text-amber-400 uppercase">Event Title</label>
                    <input
                      type="text"
                      value={era.title}
                      onChange={(e) => handleUpdateTimelineEra(idx, { ...era, title: e.target.value })}
                      className="w-full rounded-lg border border-[#2b2a29] bg-[#141312] px-2.5 py-1.5 text-xs font-sans font-bold text-[#ffffff] focus:border-amber-500/50 focus:outline-none"
                      placeholder="Event name..."
                    />
                  </div>

                  <div className="md:col-span-5 space-y-1.5">
                    <label className="text-[10px] font-mono text-amber-400 uppercase">Long-term World Consequence</label>
                    <input
                      type="text"
                      value={era.impact || ''}
                      onChange={(e) => handleUpdateTimelineEra(idx, { ...era, impact: e.target.value })}
                      className="w-full rounded-lg border border-[#2b2a29] bg-[#141312] px-2.5 py-1.5 text-xs font-sans text-[#cac6bc] focus:border-amber-500/50 focus:outline-none"
                      placeholder="How this affects present day..."
                    />
                  </div>

                  <div className="md:col-span-12 space-y-1">
                    <label className="text-[10px] font-mono text-[#8c887e] uppercase">Narrative Description</label>
                    <textarea
                      rows={2}
                      value={era.description || ''}
                      onChange={(e) => handleUpdateTimelineEra(idx, { ...era, description: e.target.value })}
                      className="w-full rounded-lg border border-[#2b2a29] bg-[#141312] px-2.5 py-1.5 text-xs font-sans text-[#cac6bc] focus:border-amber-500/50 focus:outline-none"
                      placeholder="Detailed history of what transpired..."
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveTimelineEra(idx)}
                  className="text-[#8c887e] hover:text-red-400 transition-colors p-1"
                  title="Remove timeline event"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
