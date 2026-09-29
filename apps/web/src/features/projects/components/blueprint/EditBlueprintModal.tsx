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

export const EditBlueprintModal: React.FC<EditBlueprintModalProps> = ({
  isOpen,
  onClose,
  projectId,
  blueprint,
  onSaved,
}) => {
  const accessToken = useAuthStore((state) => state.accessToken);

  const [tagline, setTagline] = useState(blueprint?.tagline || '');
  const [targetAudience, setTargetAudience] = useState(blueprint?.targetAudience || '');
  const [cameraPerspective, setCameraPerspective] = useState(blueprint?.cameraPerspective || 'Third-Person');
  const [artStyle, setArtStyle] = useState(blueprint?.artStyle || '');
  const [audioTone, setAudioTone] = useState(blueprint?.audioTone || '');
  const [networkModel, setNetworkModel] = useState(blueprint?.networkModel || 'Single-Player');
  const [targetFps, setTargetFps] = useState<number>(blueprint?.targetFps || 60);
  const [targetResolution, setTargetResolution] = useState(blueprint?.targetResolution || '1080p');
  const [coreLoop, setCoreLoop] = useState(blueprint?.coreLoop || '');
  const [summary, setSummary] = useState(blueprint?.summary || '');

  const [pillars, setPillars] = useState<GamePillar[]>(() =>
    blueprint?.pillars && blueprint.pillars.length > 0
      ? [...blueprint.pillars]
      : [
          { title: 'Core Pillar 1', description: '' },
          { title: 'Core Pillar 2', description: '' },
        ]
  );
  const [keyFeatures, setKeyFeatures] = useState<GameFeature[]>(() =>
    blueprint?.keyFeatures ? [...blueprint.keyFeatures] : []
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
        .map((p) => ({ title: p.title.trim(), description: p.description.trim() }))
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
      setError(err instanceof Error ? err.message : 'Failed to save game blueprint.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 rounded-3xl border border-[#363433] bg-[#141312] p-6 sm:p-8 shadow-2xl text-[#e6e2df]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-950/30 text-amber-300">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-headline text-xl font-bold text-[#ffffff]">
                {blueprint ? 'Edit Game Blueprint' : 'Create Game Blueprint'}
              </h3>
              <p className="text-xs font-mono text-[#8c887e]">
                Define high concept, creative pillars, core loop, and architecture specifications
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#8c887e] hover:bg-[#1c1b1a] hover:text-[#ffffff] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/20 p-3 flex items-center gap-2 text-red-300 text-xs font-mono">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Section 1: Concept & Logline */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> High Concept & Audience
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono text-[#cac6bc] mb-1">
                  Tagline / Elevator Pitch
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Tactical extraction in a sunken dieselpunk metropolis"
                  maxLength={255}
                  className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2.5 text-sm text-[#ffffff] placeholder-[#8c887e] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#cac6bc] mb-1">
                  Target Audience / Demographic
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. Core RPG fans, 18-35, fans of Disco Elysium"
                  maxLength={255}
                  className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2.5 text-sm text-[#ffffff] placeholder-[#8c887e] focus:border-amber-400 focus:outline-none"
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
                  placeholder="e.g. Third-Person Over-the-Shoulder, Isometric, First-Person"
                  maxLength={100}
                  className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2.5 text-sm text-[#ffffff] placeholder-[#8c887e] focus:border-amber-400 focus:outline-none"
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
                rows={3}
                maxLength={5000}
                className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] p-3 text-sm text-[#ffffff] placeholder-[#8c887e] focus:border-amber-400 focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Creative & Technical Direction */}
          <div className="space-y-4 pt-4 border-t border-[#2b2a29]">
            <h4 className="flex items-center gap-2 text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
              <Monitor className="h-3.5 w-3.5" /> Creative & Technical Specifications
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#cac6bc] mb-1">
                  Art Style Direction
                </label>
                <input
                  type="text"
                  value={artStyle}
                  onChange={(e) => setArtStyle(e.target.value)}
                  placeholder="e.g. Stylized Cel-shaded, Photorealistic, Low-Poly"
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
                  placeholder="e.g. Dark industrial synthwave with reactive Foley"
                  maxLength={150}
                  className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2 text-sm text-[#ffffff] placeholder-[#8c887e] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#cac6bc] mb-1">
                  Network / Multiplayer Model
                </label>
                <input
                  type="text"
                  value={networkModel}
                  onChange={(e) => setNetworkModel(e.target.value)}
                  placeholder="e.g. Dedicated Server 4-Player Co-op, Single-Player"
                  maxLength={100}
                  className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2 text-sm text-[#ffffff] placeholder-[#8c887e] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#cac6bc] mb-1">
                  Target Framerate (FPS)
                </label>
                <input
                  type="number"
                  value={targetFps}
                  min={15}
                  max={360}
                  onChange={(e) => setTargetFps(parseInt(e.target.value, 10) || 60)}
                  className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2 text-sm text-[#ffffff] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-mono text-[#cac6bc] mb-1">
                  Target Resolution / Performance Profile
                </label>
                <input
                  type="text"
                  value={targetResolution}
                  onChange={(e) => setTargetResolution(e.target.value)}
                  placeholder="e.g. 1080p / 1440p (Steam Deck 40 FPS target)"
                  maxLength={50}
                  className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] px-3.5 py-2 text-sm text-[#ffffff] placeholder-[#8c887e] focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#cac6bc] mb-1">
                Core Gameplay Loop
              </label>
              <textarea
                value={coreLoop}
                onChange={(e) => setCoreLoop(e.target.value)}
                placeholder="e.g. Scavenge submerged ruins -> Extract via sub -> Upgrade bunker -> Craft weapons"
                rows={2}
                maxLength={5000}
                className="w-full rounded-xl border border-[#363433] bg-[#1c1b1a] p-3 text-sm text-[#ffffff] placeholder-[#8c887e] focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: Design Pillars */}
          <div className="space-y-3 pt-4 border-t border-[#2b2a29]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="flex items-center gap-2 text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                  <Layers className="h-3.5 w-3.5" /> Core Design Pillars (Max 4)
                </h4>
                <p className="text-[11px] font-mono text-[#8c887e]">
                  Non-negotiable principles that guide every feature and art decision
                </p>
              </div>
              {pillars.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddPillar}
                  className="inline-flex items-center gap-1 text-xs font-mono text-amber-300 hover:text-amber-200"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Pillar
                </button>
              )}
            </div>

            <div className="space-y-3">
              {pillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-amber-400">
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
                    onChange={(e) => handlePillarChange(idx, 'title', e.target.value)}
                    placeholder="Pillar Name (e.g. Visceral Tactical Ballistics)"
                    maxLength={100}
                    className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-1.5 text-xs text-[#ffffff] focus:border-amber-400 focus:outline-none font-semibold"
                  />
                  <input
                    type="text"
                    value={pillar.description}
                    onChange={(e) =>
                      handlePillarChange(idx, 'description', e.target.value)
                    }
                    placeholder="Pillar rationale / execution rule..."
                    maxLength={500}
                    className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-1.5 text-xs text-[#cac6bc] focus:border-amber-400 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Key Features / Deliverables */}
          <div className="space-y-3 pt-4 border-t border-[#2b2a29]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="flex items-center gap-2 text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                  <Gamepad2 className="h-3.5 w-3.5" /> Key Deliverables & Features (Max 12)
                </h4>
                <p className="text-[11px] font-mono text-[#8c887e]">
                  Signature mechanics, technical systems, or art deliverables
                </p>
              </div>
              {keyFeatures.length < 12 && (
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="inline-flex items-center gap-1 text-xs font-mono text-amber-300 hover:text-amber-200"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Feature
                </button>
              )}
            </div>

            <div className="space-y-3">
              {keyFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#2b2a29] bg-[#1c1b1a] p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <select
                      value={feat.category || 'GAMEPLAY'}
                      onChange={(e) =>
                        handleFeatureChange(idx, 'category', e.target.value)
                      }
                      className="rounded-lg border border-[#363433] bg-[#141312] px-2.5 py-1 text-[11px] font-mono text-amber-300 focus:outline-none"
                    >
                      <option value="GAMEPLAY">Gameplay</option>
                      <option value="TECHNICAL">Technical</option>
                      <option value="ART">Art & Animation</option>
                      <option value="AUDIO">Audio & Music</option>
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
                    onChange={(e) => handleFeatureChange(idx, 'title', e.target.value)}
                    placeholder="Feature Title (e.g. Procedural Dungeon Generator)"
                    maxLength={100}
                    className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-1.5 text-xs text-[#ffffff] focus:border-amber-400 focus:outline-none font-semibold"
                  />
                  <input
                    type="text"
                    value={feat.description}
                    onChange={(e) =>
                      handleFeatureChange(idx, 'description', e.target.value)
                    }
                    placeholder="Brief description of the deliverable..."
                    maxLength={1000}
                    className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3 py-1.5 text-xs text-[#cac6bc] focus:border-amber-400 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#2b2a29]">
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
              variant="primary"
              size="sm"
              disabled={isLoading}
              icon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {isLoading ? 'Saving...' : 'Save Blueprint'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
