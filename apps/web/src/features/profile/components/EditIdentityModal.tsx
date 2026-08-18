import React, { useState, useEffect } from 'react';
import { X, Tag, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { ProfessionalIdentity, TaxonomyItem } from '../types';
import { TaxonomyMultiSelect } from './TaxonomyMultiSelect';
import {
  searchRoles,
  searchSpecializations,
  searchSkills,
  searchTools,
  searchGameEngines,
  searchGenres,
  searchPlatforms,
  updateIdentity,
} from '../services/taxonomyService';
import { useAuthStore } from '../../auth/store/authStore';

interface EditIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity?: ProfessionalIdentity | null;
  onUpdated: (updatedIdentity: ProfessionalIdentity) => void;
}

const normalizeTaxonomyArray = (items: (TaxonomyItem | string)[] = []): TaxonomyItem[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => (typeof item === 'string' ? { id: item, name: item } : item));
};

export const EditIdentityModal: React.FC<EditIdentityModalProps> = ({
  isOpen,
  onClose,
  identity,
  onUpdated,
}) => {
  const [formData, setFormData] = useState<ProfessionalIdentity>({
    roles: [],
    specializations: [],
    skills: [],
    tools: [],
    gameEngines: [],
    genres: [],
    platforms: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (identity) {
      setFormData({
        roles: normalizeTaxonomyArray(identity.roles),
        specializations: normalizeTaxonomyArray(identity.specializations),
        skills: normalizeTaxonomyArray(identity.skills),
        tools: normalizeTaxonomyArray(identity.tools),
        gameEngines: normalizeTaxonomyArray(identity.gameEngines),
        genres: normalizeTaxonomyArray(identity.genres),
        platforms: normalizeTaxonomyArray(identity.platforms),
      });
    }
  }, [identity]);

  if (!isOpen) return null;

  const handleCategoryChange = (category: keyof ProfessionalIdentity, items: TaxonomyItem[]) => {
    setFormData((prev) => ({ ...prev, [category]: items }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    const extractIds = (items: (TaxonomyItem | string)[] = []) =>
      normalizeTaxonomyArray(items)
        .map((i) => i.id)
        .filter((id) => Boolean(id) && id.trim().length > 0);

    const payload = {
      roleIds: extractIds(formData.roles),
      specializationIds: extractIds(formData.specializations),
      skillIds: extractIds(formData.skills),
      toolIds: extractIds(formData.tools),
      gameEngineIds: extractIds(formData.gameEngines),
      genreIds: extractIds(formData.genres),
      platformIds: extractIds(formData.platforms),
    };

    try {
      const updatedBackendIdentity = await updateIdentity(accessToken, payload);
      onUpdated(updatedBackendIdentity);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update professional identity.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-[#363433] bg-[#1c1b1a] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2b2a29] px-6 py-4">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-[#e6e2df]" />
            <div>
              <h2 className="font-headline text-lg font-bold text-[#ffffff]">Edit Professional Identity</h2>
              <p className="text-xs text-[#8c887e]">Select taxonomy-recognized roles, skills, and tools</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#363433] bg-[#141312] p-1.5 text-[#8c887e] hover:text-[#ffffff]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300 font-mono">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-xl border border-[#363433] bg-[#141312] p-3.5 flex items-center gap-2 text-xs font-mono text-[#cac6bc]">
            <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Search recognized taxonomy values from Pantheon database. Arbitrary text entries are disabled.</span>
          </div>

          <TaxonomyMultiSelect
            categoryLabel="Primary Roles"
            placeholder="Search recognized roles (e.g. Gameplay Programmer, Technical Artist)..."
            selectedItems={normalizeTaxonomyArray(formData.roles)}
            onChange={(items) => handleCategoryChange('roles', items)}
            fetchSearch={searchRoles}
            maxLimit={5}
          />

          <TaxonomyMultiSelect
            categoryLabel="Specializations"
            placeholder="Search specializations (e.g. Gameplay Systems, Shader Development)..."
            selectedItems={normalizeTaxonomyArray(formData.specializations)}
            onChange={(items) => handleCategoryChange('specializations', items)}
            fetchSearch={searchSpecializations}
            maxLimit={10}
          />

          <TaxonomyMultiSelect
            categoryLabel="Game Engines"
            placeholder="Search game engines (e.g. Unreal Engine 5, Unity, Godot)..."
            selectedItems={normalizeTaxonomyArray(formData.gameEngines)}
            onChange={(items) => handleCategoryChange('gameEngines', items)}
            fetchSearch={searchGameEngines}
            maxLimit={10}
          />

          <TaxonomyMultiSelect
            categoryLabel="Technical & Creative Skills"
            placeholder="Search skills (e.g. C++, Shader Programming, Game AI)..."
            selectedItems={normalizeTaxonomyArray(formData.skills)}
            onChange={(items) => handleCategoryChange('skills', items)}
            fetchSearch={searchSkills}
            maxLimit={30}
          />

          <TaxonomyMultiSelect
            categoryLabel="Tools & Software"
            placeholder="Search tools (e.g. Blender, Maya, Visual Studio)..."
            selectedItems={normalizeTaxonomyArray(formData.tools)}
            onChange={(items) => handleCategoryChange('tools', items)}
            fetchSearch={searchTools}
            maxLimit={30}
          />

          <TaxonomyMultiSelect
            categoryLabel="Platform Experience"
            placeholder="Search platforms (e.g. PC, PlayStation 5, Xbox Series X/S)..."
            selectedItems={normalizeTaxonomyArray(formData.platforms)}
            onChange={(items) => handleCategoryChange('platforms', items)}
            fetchSearch={searchPlatforms}
            maxLimit={10}
          />

          <TaxonomyMultiSelect
            categoryLabel="Genres"
            placeholder="Search genres (e.g. Action RPG, Tactical Multiplayer)..."
            selectedItems={normalizeTaxonomyArray(formData.genres)}
            onChange={(items) => handleCategoryChange('genres', items)}
            fetchSearch={searchGenres}
            maxLimit={10}
          />

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-[#2b2a29] pt-4">
            <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isLoading}
              icon={isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : undefined}
            >
              Save Identity
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
