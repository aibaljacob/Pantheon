import React, { useState, useEffect } from 'react';
import { X, GraduationCap, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { EducationItem } from '../types';
import { createEducation, updateEducation, deleteEducation } from '../services/profileService';
import { useAuthStore } from '../../auth/store/authStore';

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  educationToEdit?: EducationItem | null;
  onSaved: (edu: EducationItem) => void;
  onDeleted?: (id: string) => void;
}

export const EducationModal: React.FC<EducationModalProps> = ({
  isOpen,
  onClose,
  educationToEdit,
  onSaved,
  onDeleted,
}) => {
  const isEditing = Boolean(educationToEdit);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (educationToEdit) {
      setInstitution(educationToEdit.institution || '');
      setDegree(educationToEdit.degree || '');
      setStartDate(educationToEdit.startDate || '');
      setEndDate(educationToEdit.endDate || '');
      setDescription(educationToEdit.description || '');
    } else {
      setInstitution('');
      setDegree('');
      setStartDate('');
      setEndDate('');
      setDescription('');
    }
    setError(null);
  }, [educationToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    const dto = {
      institution,
      degree,
      startDate,
      endDate: endDate || undefined,
      description: description || undefined,
    };

    try {
      if (isEditing && educationToEdit) {
        const updated = await updateEducation(accessToken, educationToEdit.id, dto);
        onSaved(updated);
      } else {
        const created = await createEducation(accessToken, dto);
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save education entry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !educationToEdit || !accessToken) return;
    setIsLoading(true);
    setError(null);

    try {
      await deleteEducation(accessToken, educationToEdit.id);
      if (onDeleted) onDeleted(educationToEdit.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete education entry.');
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
            <GraduationCap className="h-5 w-5 text-[#e6e2df]" />
            <h2 className="font-headline text-lg font-bold text-[#ffffff]">
              {isEditing ? 'Edit Education' : 'Add Education'}
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

          <div>
            <label className="block text-xs font-mono text-[#8c887e] mb-1">Institution / University *</label>
            <input
              type="text"
              required
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. Stanford University, DigiPen Institute of Technology"
              className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8c887e] mb-1">Degree / Field of Study *</label>
            <input
              type="text"
              required
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="e.g. B.S. in Computer Science & Game Development"
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
                placeholder="e.g. 2020"
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8c887e] mb-1">End Date</label>
              <input
                type="text"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="e.g. 2024 (or Present)"
                className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8c887e] mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key coursework, honors, research, or specialization emphasis..."
              className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none"
            />
          </div>

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
                {isEditing ? 'Save Changes' : 'Add Education'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
