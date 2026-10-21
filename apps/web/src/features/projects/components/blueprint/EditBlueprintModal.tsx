import React, { useState } from 'react';
import {
  X,
  Compass,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  Monitor,
  Gamepad2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { useAuthStore } from '../../../auth/store/authStore';
import type {
  GameBlueprint,
  GamePillar,
  GameFeature,
  UpsertGameBlueprintInput,
} from '../../types';
import { upsertGameBlueprint } from '../../services/blueprintService';

interface EditBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  blueprint: GameBlueprint | null;
  onSaved: (saved: GameBlueprint) => void;
}

type ModalSection = 'CONCEPT' | 'SPECS' | 'PILLARS' | 'FEATURES';

export const EditBlueprintModal: React.FC<EditBlueprintModalProps> = ({
  isOpen,
  onClose,
  projectId,
  blueprint,
  onSaved,
}) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  const [activeSection, setActiveSection] = useState<ModalSection>('CONCEPT');

  const [tagline, setTagline] = useState(blueprint?.tagline || '');
  const [targetAudience, setTargetAudience] = useState(
    blueprint?.targetAudience || '',
  );
  const [cameraPerspective, setCameraPerspective] = useState(
    blueprint?.cameraPerspective || 'Third-Person',
  );
  const [artStyle, setArtStyle] = useState(blueprint?.artStyle || '');
  const [audioTone, setAudioTone] = useState(blueprint?.audioTone || '');
  const [networkModel, setNetworkModel] = useState(
    blueprint?.networkModel || 'Single-Player',
  );
  const [targetFps, setTargetFps] = useState<number>(
    blueprint?.targetFps || 60,
  );
  const [targetResolution, setTargetResolution] = useState(
    blueprint?.targetResolution || '1080p',
  );
  const [coreLoop, setCoreLoop] = useState(blueprint?.coreLoop || '');
  const [summary, setSummary] = useState(blueprint?.summary || '');

  const [pillars, setPillars] = useState<GamePillar[]>(() =>
    blueprint?.pillars && blueprint.pillars.length > 0
      ? [...blueprint.pillars]
      : [
          { title: 'Core Pillar 1', description: '' },
          { title: 'Core Pillar 2', description: '' },
        ],
  );
  const [keyFeatures, setKeyFeatures] = useState<GameFeature[]>(() =>
    blueprint?.keyFeatures ? [...blueprint.keyFeatures] : [],
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddPillar = () => {
    if (pillars.length >= 4) return;
    setPillars([...pillars, { title: '', description: '' }]);
  };

  const handleRemovePillar = (idx: number) => {
    setPillars(pillars.filter((_, i) => i !== idx));
  };

  const handlePillarChange = (
    idx: number,
    field: 'title' | 'description',
    val: string,
  ) => {
    const updated = [...pillars];
    updated[idx] = { ...updated[idx], [field]: val };
    setPillars(updated);
  };

  const handleAddFeature = () => {
    if (keyFeatures.length >= 12) return;
    setKeyFeatures([
      ...keyFeatures,
      { category: 'GAMEPLAY', title: '', description: '' },
    ]);
  };

  const handleRemoveFeature = (idx: number) => {
    setKeyFeatures(keyFeatures.filter((_, i) => i !== idx));
  };

  const handleFeatureChange = (
    idx: number,
    field: 'title' | 'description' | 'category',
    val: string,
  ) => {
    const updated = [...keyFeatures];
    updated[idx] = { ...updated[idx], [field]: val };
    setKeyFeatures(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const validPillars = pillars
        .map((p) => ({
          title: p.title.trim(),
          description: p.description.trim(),
        }))
        .filter((p) => p.title.length > 0);

      const validFeatures = keyFeatures
        .map((f) => ({
          category: f.category || 'GAMEPLAY',
          title: f.title.trim(),
          description: f.description.trim(),
        }))
        .filter((f) => f.title.length > 0);

      const payload: UpsertGameBlueprintInput = {
        tagline: tagline.trim() || undefined,
        targetAudience: targetAudience.trim() || undefined,
        cameraPerspective: cameraPerspective.trim() || undefined,
        artStyle: artStyle.trim() || undefined,
        audioTone: audioTone.trim() || undefined,
        networkModel: networkModel.trim() || undefined,
        targetFps: Number(targetFps) || 60,
        targetResolution: targetResolution.trim() || undefined,
        coreLoop: coreLoop.trim() || undefined,
        summary: summary.trim() || undefined,
        pillars: validPillars.length > 0 ? validPillars : undefined,
        keyFeatures: validFeatures.length > 0 ? validFeatures : undefined,
      };

      const saved = await upsertGameBlueprint(projectId, payload, accessToken);
      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to save game blueprint.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const SECTIONS: Array<{ id: ModalSection; label: string; count?: number }> = [
    { id: 'CONCEPT', label: 'High Concept' },
    { id: 'SPECS', label: 'Technical Specs' },
    { id: 'PILLARS', label: 'Design Pillars', count: pillars.length },
    { id: 'FEATURES', label: 'Key Deliverables', count: keyFeatures.length },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-4 flex min-h-full items-start justify-center sm:items-center">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[82vh] my-auto rounded-2xl border border-[#363433] bg-[#141312] shadow-2xl text-[#e6e2df] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Sticky Header: Always visible & reachable at top */}
        <div className="shrink-0 flex items-center justify-between border-b border-[#2b2a29] px-4 py-3 sm:px-5 sm:py-3.5 bg-[#171615]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-300">
              <Compass className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </div>
            <div>
              <h3 className="font-headline text-sm sm:text-base font-bold text-[#ffffff] leading-tight">
                {blueprint ? 'Edit Game Blueprint' : 'Create Game Blueprint'}
              </h3>
              <p className="text-[10px] sm:text-[11px] font-mono text-[#8c887e]">
                Creative logline, architectural specs, pillars, and features
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8c887e] hover:bg-[#201f1e] hover:text-[#ffffff] transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Section Tabs Switcher */}
        <div className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-1.5 border-b border-[#2b2a29] bg-[#1a1918] overflow-x-auto">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-mono font-medium transition-all ${
                activeSection === sec.id
                  ? 'bg-[#262524] text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-[#8c887e] hover:text-[#e6e2df] hover:bg-[#201f1e]'
              }`}
            >
              <span>{sec.label}</span>
              {typeof sec.count === 'number' && (
                <span className="rounded bg-[#141312] px-1.5 py-0.2 text-[10px] text-[#cac6bc]">
                  {sec.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="shrink-0 mx-4 mt-2.5 rounded-lg border border-red-500/30 bg-red-950/20 p-2 flex items-center gap-2 text-red-300 text-xs font-mono">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form Body: Contained within max-height with min-h-0 */}
        <form
          id="blueprint-form"
          onSubmit={handleSubmit}
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3.5"
        >
          {/* SECTION 1: HIGH CONCEPT */}
          {activeSection === 'CONCEPT' && (
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" /> High Concept & Audience
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-[#cac6bc] mb-1">
                    Tagline / Elevator Pitch
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Tactical extraction in a sunken dieselpunk metropolis"
                    maxLength={255}
                    className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2 text-sm text-[#ffffff] placeholder-[#8c887e] focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-[#cac6bc] mb-1">
                      Target Audience / Demographic
                    </label>
                    <input
                      type="text"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="e.g. Tactical shooter fans 18-35"
                      maxLength={255}
                      className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2 text-sm text-[#ffffff] placeholder-[#8c887e] focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#cac6bc] mb-1">
                      Camera Perspective
                    </label>
                    <input
                      type="text"
                      value={cameraPerspective}
                      onChange={(e) => setCameraPerspective(e.target.value)}
                      placeholder="e.g. Third-Person Over-the-Shoulder"
                      maxLength={100}
                      className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2 text-sm text-[#ffffff] placeholder-[#8c887e] focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#cac6bc] mb-1">
                    Concept Summary / Narrative Synopsis
                  </label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Expanded summary of the game narrative, setting, and studio vision..."
                    rows={4}
                    maxLength={5000}
                    className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] p-3 text-xs sm:text-sm text-[#ffffff] placeholder-[#8c887e] focus:border-amber-400 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: TECHNICAL & CREATIVE SPECS */}
          {activeSection === 'SPECS' && (
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                <Monitor className="h-3.5 w-3.5" /> Creative & Technical Specifications
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#cac6bc] mb-1">
                    Art Style Direction
                  </label>
                  <input
                    type="text"
                    value={artStyle}
                    onChange={(e) => setArtStyle(e.target.value)}
                    placeholder="e.g. Stylized Cel-shaded Noir"
                    maxLength={150}
                    className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2 text-sm text-[#ffffff] placeholder-[#8c887e] focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#cac6bc] mb-1">
                    Audio Tone
                  </label>
                  <input
                    type="text"
                    value={audioTone}
                    onChange={(e) => setAudioTone(e.target.value)}
                    placeholder="e.g. Dark industrial ambient synth"
                    maxLength={150}
                    className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2 text-sm text-[#ffffff] placeholder-[#8c887e] focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#cac6bc] mb-1">
                    Network Model
                  </label>
                  <input
                    type="text"
                    value={networkModel}
                    onChange={(e) => setNetworkModel(e.target.value)}
                    placeholder="e.g. Dedicated Server 4-Player Co-op"
                    maxLength={100}
                    className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2 text-sm text-[#ffffff] placeholder-[#8c887e] focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-mono text-[#cac6bc] mb-1">
                      FPS Target
                    </label>
                    <input
                      type="number"
                      value={targetFps}
                      min={15}
                      max={360}
                      onChange={(e) =>
                        setTargetFps(parseInt(e.target.value, 10) || 60)
                      }
                      className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2 text-sm text-[#ffffff] focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[#cac6bc] mb-1">
                      Resolution
                    </label>
                    <input
                      type="text"
                      value={targetResolution}
                      onChange={(e) => setTargetResolution(e.target.value)}
                      placeholder="e.g. 1080p / 1440p"
                      maxLength={50}
                      className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3 py-2 text-sm text-[#ffffff] focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#cac6bc] mb-1">
                  Core Gameplay Loop (Cycle)
                </label>
                <textarea
                  value={coreLoop}
                  onChange={(e) => setCoreLoop(e.target.value)}
                  placeholder="e.g. Dive into ruins → Fight hostiles → Salvage alloys → Upgrade equipment"
                  rows={2}
                  maxLength={5000}
                  className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] p-3 text-xs sm:text-sm text-[#ffffff] placeholder-[#8c887e] focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* SECTION 3: DESIGN PILLARS */}
          {activeSection === 'PILLARS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h4 className="flex items-center gap-2 text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                    <Layers className="h-3.5 w-3.5" /> Core Design Pillars (Max 4)
                  </h4>
                  <p className="text-[11px] font-mono text-[#8c887e]">
                    Guiding creative principles for all feature decisions
                  </p>
                </div>
                {pillars.length < 4 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="h-3.5 w-3.5" />}
                    onClick={handleAddPillar}
                  >
                    Add Pillar
                  </Button>
                )}
              </div>

              <div className="space-y-2.5">
                {pillars.map((pillar, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#2b2a29] bg-[#1c1b1a] p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold text-amber-400">
                        PILLAR #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePillar(idx)}
                        className="text-[#8c887e] hover:text-red-400 p-1"
                        title="Remove Pillar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={pillar.title}
                      onChange={(e) =>
                        handlePillarChange(idx, 'title', e.target.value)
                      }
                      placeholder="Pillar Name (e.g. Unforgiving Ballistics)"
                      maxLength={100}
                      className="w-full rounded-lg border border-[#363433] bg-[#141312] px-3 py-1.5 text-xs text-[#ffffff] focus:border-amber-400 focus:outline-none font-semibold"
                    />
                    <input
                      type="text"
                      value={pillar.description}
                      onChange={(e) =>
                        handlePillarChange(idx, 'description', e.target.value)
                      }
                      placeholder="Execution rule / rationale..."
                      maxLength={500}
                      className="w-full rounded-lg border border-[#363433] bg-[#141312] px-3 py-1.5 text-xs text-[#cac6bc] focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: KEY DELIVERABLES */}
          {activeSection === 'FEATURES' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h4 className="flex items-center gap-2 text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                    <Gamepad2 className="h-3.5 w-3.5" /> Key Deliverables & Features (Max 12)
                  </h4>
                  <p className="text-[11px] font-mono text-[#8c887e]">
                    Signature gameplay mechanics, technical systems, or art kits
                  </p>
                </div>
                {keyFeatures.length < 12 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="h-3.5 w-3.5" />}
                    onClick={handleAddFeature}
                  >
                    Add Feature
                  </Button>
                )}
              </div>

              <div className="space-y-2.5">
                {keyFeatures.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#2b2a29] bg-[#1c1b1a]/50 p-6 text-center text-xs font-mono text-[#8c887e]">
                    No custom features added yet. Click &quot;Add Feature&quot; to define signature deliverables.
                  </div>
                ) : (
                  keyFeatures.map((feat, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[#2b2a29] bg-[#1c1b1a] p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={feat.category || 'GAMEPLAY'}
                          onChange={(e) =>
                            handleFeatureChange(idx, 'category', e.target.value)
                          }
                          className="rounded-md border border-[#363433] bg-[#141312] px-2 py-0.5 text-[10px] font-mono text-amber-300 focus:outline-none"
                        >
                          <option value="GAMEPLAY">GAMEPLAY</option>
                          <option value="TECHNICAL">TECHNICAL</option>
                          <option value="ART">ART</option>
                          <option value="AUDIO">AUDIO</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-[#8c887e] hover:text-red-400 p-1"
                          title="Remove Feature"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={feat.title}
                        onChange={(e) =>
                          handleFeatureChange(idx, 'title', e.target.value)
                        }
                        placeholder="Feature Title (e.g. Locomotion Controller)"
                        maxLength={100}
                        className="w-full rounded-lg border border-[#363433] bg-[#141312] px-3 py-1.5 text-xs text-[#ffffff] focus:border-amber-400 focus:outline-none font-semibold"
                      />
                      <input
                        type="text"
                        value={feat.description}
                        onChange={(e) =>
                          handleFeatureChange(
                            idx,
                            'description',
                            e.target.value,
                          )
                        }
                        placeholder="Deliverable details and scope..."
                        maxLength={1000}
                        className="w-full rounded-lg border border-[#363433] bg-[#141312] px-3 py-1.5 text-xs text-[#cac6bc] focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </form>

        {/* Sticky Footer: Always visible & reachable at bottom */}
        <div className="shrink-0 flex items-center justify-between p-3.5 sm:p-4 border-t border-[#2b2a29] bg-[#171615]">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#8c887e]">
            {activeSection !== 'CONCEPT' && (
              <button
                type="button"
                onClick={() => {
                  const idx = SECTIONS.findIndex((s) => s.id === activeSection);
                  if (idx > 0) setActiveSection(SECTIONS[idx - 1].id);
                }}
                className="flex items-center gap-1 text-[#cac6bc] hover:text-white px-2 py-1 rounded hover:bg-[#201f1e]"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}
            {activeSection !== 'FEATURES' && (
              <button
                type="button"
                onClick={() => {
                  const idx = SECTIONS.findIndex((s) => s.id === activeSection);
                  if (idx < SECTIONS.length - 1)
                    setActiveSection(SECTIONS[idx + 1].id);
                }}
                className="flex items-center gap-1 text-amber-300 hover:text-amber-200 px-2 py-1 rounded hover:bg-[#201f1e]"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="blueprint-form"
              variant="primary"
              size="sm"
              disabled={isLoading}
              icon={
                isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#141312]" />
                ) : undefined
              }
            >
              {isLoading ? 'Saving...' : 'Save Blueprint'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
