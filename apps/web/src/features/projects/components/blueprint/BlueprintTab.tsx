import React, { useState, useEffect } from 'react';
import {
  Compass,
  Edit3,
  Layers,
  Sparkles,
  Gamepad2,
  Monitor,
  Volume2,
  Users,
  Eye,
  Activity,
  Plus,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { useAuthStore } from '../../../auth/store/authStore';
import type { GameBlueprint, ProjectDetail } from '../../types';
import { fetchGameBlueprint } from '../../services/blueprintService';
import { EditBlueprintModal } from './EditBlueprintModal';

interface BlueprintTabProps {
  project: ProjectDetail;
}

export const BlueprintTab: React.FC<BlueprintTabProps> = ({ project }) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [blueprint, setBlueprint] = useState<GameBlueprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadBlueprint = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const bp = await fetchGameBlueprint(project.id, accessToken || undefined);
        if (!isCancelled) {
          setBlueprint(bp);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load game blueprint.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadBlueprint();

    return () => {
      isCancelled = true;
    };
  }, [project.id, accessToken]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-[#363433] bg-[#1c1b1a]">
        <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-950/20 p-6 text-center space-y-3">
        <AlertCircle className="mx-auto h-6 w-6 text-red-400" />
        <p className="text-sm font-mono text-red-300">{error}</p>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-8 sm:p-12 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-950/20 text-amber-400">
          <Compass className="h-7 w-7" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="font-headline text-lg font-bold text-[#ffffff]">
            No Game Blueprint Created
          </h3>
          <p className="text-xs font-mono text-[#8c887e]">
            A Game Blueprint defines the high concept, core gameplay loop, design pillars, and technical architecture for this production.
          </p>
        </div>

        {project.isFounder && (
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Create Game Blueprint
            </Button>
          </div>
        )}

        <EditBlueprintModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          projectId={project.id}
          blueprint={blueprint}
          onSaved={(saved) => setBlueprint(saved)}
        />
      </div>
    );
  }

  const pillars = blueprint.pillars || [];
  const keyFeatures = blueprint.keyFeatures || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#2b2a29] pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full border border-amber-500/40 bg-amber-950/20 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-amber-300">
                PRODUCTION BLUEPRINT
              </span>
              {blueprint.targetFps && (
                <span className="rounded-full border border-[#48473f] bg-[#201f1e] px-2.5 py-0.5 text-[10px] font-mono text-[#cac6bc]">
                  TARGET: {blueprint.targetFps} FPS {blueprint.targetResolution ? `@ ${blueprint.targetResolution}` : ''}
                </span>
              )}
            </div>

            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-[#ffffff] tracking-tight">
              {blueprint.tagline || project.name}
            </h2>

            {blueprint.summary && (
              <p className="text-sm leading-relaxed text-[#cac6bc] font-sans pt-1 max-w-4xl whitespace-pre-line">
                {blueprint.summary}
              </p>
            )}
          </div>

          {project.isFounder && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Edit3 className="h-3.5 w-3.5" />}
              onClick={() => setIsEditModalOpen(true)}
              className="shrink-0"
            >
              Edit Blueprint
            </Button>
          )}
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[#8c887e]">
              <Users className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Audience</span>
            </div>
            <p className="text-xs font-mono font-semibold text-[#ffffff] truncate" title={blueprint.targetAudience || 'Unspecified'}>
              {blueprint.targetAudience || 'Standard'}
            </p>
          </div>

          <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[#8c887e]">
              <Eye className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Perspective</span>
            </div>
            <p className="text-xs font-mono font-semibold text-[#ffffff] truncate" title={blueprint.cameraPerspective || 'Unspecified'}>
              {blueprint.cameraPerspective || 'Standard'}
            </p>
          </div>

          <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[#8c887e]">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Art Style</span>
            </div>
            <p className="text-xs font-mono font-semibold text-[#ffffff] truncate" title={blueprint.artStyle || 'Unspecified'}>
              {blueprint.artStyle || 'Standard'}
            </p>
          </div>

          <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[#8c887e]">
              <Volume2 className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Audio Tone</span>
            </div>
            <p className="text-xs font-mono font-semibold text-[#ffffff] truncate" title={blueprint.audioTone || 'Unspecified'}>
              {blueprint.audioTone || 'Standard'}
            </p>
          </div>

          <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[#8c887e]">
              <Activity className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Network Model</span>
            </div>
            <p className="text-xs font-mono font-semibold text-[#ffffff] truncate" title={blueprint.networkModel || 'Unspecified'}>
              {blueprint.networkModel || 'Single-Player'}
            </p>
          </div>

          <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[#8c887e]">
              <Monitor className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Engine / Target</span>
            </div>
            <p className="text-xs font-mono font-semibold text-[#ffffff] truncate">
              {project.gameEngine || 'Standard'}
            </p>
          </div>
        </div>
      </div>

      {/* Core Gameplay Loop */}
      {blueprint.coreLoop && (
        <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
            <Gamepad2 className="h-4 w-4" /> Core Gameplay Loop
          </div>
          <div className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 text-sm leading-relaxed text-[#ffffff] font-mono">
            {blueprint.coreLoop}
          </div>
        </div>
      )}

      {/* Design Pillars */}
      {pillars.length > 0 && (
        <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-400" />
            <h3 className="font-headline text-lg font-bold text-[#ffffff]">
              Core Design Pillars
            </h3>
          </div>
          <p className="text-xs font-mono text-[#8c887e]">
            Guiding creative and technical principles for all feature decisions
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {pillars.map((pillar, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-5 space-y-2 relative overflow-hidden transition-all hover:border-[#48473f]"
              >
                <div className="text-[10px] font-mono font-bold text-amber-400">
                  PILLAR #{idx + 1}
                </div>
                <h4 className="font-headline text-base font-bold text-[#ffffff]">
                  {pillar.title}
                </h4>
                {pillar.description && (
                  <p className="text-xs leading-relaxed text-[#cac6bc] font-sans">
                    {pillar.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Features & Deliverables */}
      {keyFeatures.length > 0 && (
        <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-amber-400" />
            <h3 className="font-headline text-lg font-bold text-[#ffffff]">
              Key Features & Deliverables
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {keyFeatures.map((feat, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 space-y-2 transition-all hover:border-[#363433]"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-[#363433] bg-[#1c1b1a] px-2 py-0.5 text-[10px] font-mono text-amber-300">
                    {feat.category || 'GAMEPLAY'}
                  </span>
                  <h4 className="font-headline text-sm font-bold text-[#ffffff]">
                    {feat.title}
                  </h4>
                </div>
                {feat.description && (
                  <p className="text-xs leading-relaxed text-[#cac6bc] font-sans">
                    {feat.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditBlueprintModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          projectId={project.id}
          blueprint={blueprint}
          onSaved={(saved) => setBlueprint(saved)}
        />
      )}
    </div>
  );
};
