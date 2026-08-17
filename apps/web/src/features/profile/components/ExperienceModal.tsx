import React, { useState, useEffect } from 'react';
import { X, Briefcase, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { ExperienceItem, TaxonomyItem } from '../types';
import { createExperience, updateExperience, deleteExperience } from '../services/profileService';
import { TaxonomySingleSelect } from './TaxonomySingleSelect';
import { TaxonomyMultiSelect } from './TaxonomyMultiSelect';
import { searchRoles, searchSkills } from '../services/taxonomyService';
import { useAuthStore } from '../../auth/store/authStore';

interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  experienceToEdit?: ExperienceItem | null;
  onSaved: (exp: ExperienceItem) => void;
  onDeleted?: (id: string) => void;
}

export const ExperienceModal: React.FC<ExperienceModalProps> = ({
  isOpen,
  onClose,
  experienceToEdit,
  onSaved,
  onDeleted,
}) => {
  const isEditing = Boolean(experienceToEdit);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [position, setPosition] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedTechItems, setSelectedTechItems] = useState<TaxonomyItem[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (experienceToEdit) {
      setPosition(experienceToEdit.position || '');
      setCompany(experienceToEdit.company || '');
      setLocation(experienceToEdit.location || '');
      setStartDate(experienceToEdit.startDate || '');
      setEndDate(experienceToEdit.endDate || '');
      setIsCurrent(Boolean(experienceToEdit.isCurrent));
      setDescription(experienceToEdit.description || '');
      setSelectedTechItems(
        experienceToEdit.technologies
          ? experienceToEdit.technologies.map((t) => ({ id: t, name: t }))
          : [],
      );
    } else {
      setPosition('');
      setCompany('');
      setLocation('');
      setStartDate('');
      setEndDate('');
      setIsCurrent(false);
      setDescription('');
      setSelectedTechItems([]);
    }
    setError(null);
  }, [experienceToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    const technologies = selectedTechItems.map((item) => item.name);

    const dto = {
      position,
      company,
      location: location || undefined,
      startDate,
      endDate: isCurrent ? undefined : endDate || undefined,
      isCurrent,
      description,
      technologies,
    };

    try {
      if (isEditing && experienceToEdit) {
        const updated = await updateExperience(accessToken, experienceToEdit.id, dto);
        onSaved(updated);
      } else {
        const created = await createExperience(accessToken, dto);
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save experience entry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !experienceToEdit || !accessToken) return;
    setIsLoading(true);
    setError(null);

    try {
      await deleteExperience(accessToken, experienceToEdit.id);
      if (onDeleted) onDeleted(experienceToEdit.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete experience entry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-[#363433] bg-[#1c1b1a] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2b2a29] px-6 py-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-[#e6e2df]" />
            <h2 className="font-headline text-lg font-bold text-[#ffffff]">
              {isEditing ? 'Edit Experience' : 'Add Experience'}
            </h2>
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
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300 font-mono">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TaxonomySingleSelect
              label="Position / Role"
              required
              value={position}
              onChange={setPosition}
              fetchSearch={searchRoles}
              placeholder="Select role from taxonomy..."
            />
            <div>
              <label className="block text-xs font-mono text-[#8c887e] mb-1">Company / Studio *</label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Ubisoft, Pantheon Games"
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8c887e] mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Remote, Montreal, QC"
              className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[#8c887e] mb-1">Start Date *</label>
              <input
                type="text"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="e.g. Jan 2022"
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8c887e] mb-1">End Date</label>
              <input
                type="text"
                disabled={isCurrent}
                value={isCurrent ? 'Present' : endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="e.g. Dec 2024"
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="expIsCurrent"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              className="rounded border-[#363433] bg-[#141312] text-amber-500 focus:ring-0"
            />
            <label htmlFor="expIsCurrent" className="text-xs font-mono text-[#e6e2df] cursor-pointer">
              I currently work here
            </label>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8c887e] mb-1">Description *</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your key responsibilities, systemic gameplay achievements, or architecture contributions..."
              className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
            />
          </div>

          <TaxonomyMultiSelect
            categoryLabel="Technologies & Tools"
            placeholder="Search recognized skills and tools from taxonomy..."
            selectedItems={selectedTechItems}
            onChange={setSelectedTechItems}
            fetchSearch={searchSkills}
            maxLimit={15}
          />

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-[#2b2a29] pt-4">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="inline-flex items-center gap-1 text-xs font-mono text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
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
                {isEditing ? 'Save Changes' : 'Add Experience'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
