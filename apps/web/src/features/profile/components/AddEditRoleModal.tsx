import React, { useState, useEffect } from 'react';
import { X, Briefcase, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../auth/store/authStore';
import { TaxonomySingleSelect } from './TaxonomySingleSelect';
import { TaxonomyMultiSelect } from './TaxonomyMultiSelect';
import {
  searchRoles,
  searchSkills,
  searchTools,
} from '../services/taxonomyService';
import {
  createProjectRole,
  updateProjectRole,
} from '../../projects/services/projectService';
import type {
  ProjectRoleItem,
  ProjectRoleExperienceLevel,
  ProjectRoleCommitment,
  ProjectRoleStatus,
} from '../../projects/types';
import type { TaxonomyItem } from '../types';

interface AddEditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  roleToEdit?: ProjectRoleItem | null;
  onRoleSaved: (savedRole: ProjectRoleItem) => void;
}

export const AddEditRoleModal: React.FC<AddEditRoleModalProps> = ({
  isOpen,
  onClose,
  projectId,
  roleToEdit,
  onRoleSaved,
}) => {
  const { accessToken } = useAuthStore();

  const [roleId, setRoleId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [experienceLevel, setExperienceLevel] =
    useState<ProjectRoleExperienceLevel>('MID');
  const [commitment, setCommitment] =
    useState<ProjectRoleCommitment>('PART_TIME');
  const [status, setStatus] = useState<ProjectRoleStatus>('OPEN');
  const [selectedSkills, setSelectedSkills] = useState<TaxonomyItem[]>([]);
  const [selectedTools, setSelectedTools] = useState<TaxonomyItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (roleToEdit) {
        setRoleId(roleToEdit.roleId);
        setTitle(roleToEdit.title || '');
        setDescription(roleToEdit.description || '');
        setExperienceLevel(roleToEdit.experienceLevel);
        setCommitment(roleToEdit.commitment);
        setStatus(roleToEdit.status);
        setSelectedSkills(
          roleToEdit.requiredSkills.map((s) => ({ id: s.id, name: s.name })),
        );
        setSelectedTools(
          roleToEdit.requiredTools.map((t) => ({ id: t.id, name: t.name })),
        );
      } else {
        setRoleId('');
        setTitle('');
        setDescription('');
        setExperienceLevel('MID');
        setCommitment('PART_TIME');
        setStatus('OPEN');
        setSelectedSkills([]);
        setSelectedTools([]);
      }
    }
  }, [isOpen, roleToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleId) {
      setError('Please select a recognized Professional Role from taxonomy.');
      return;
    }
    if (!accessToken) {
      setError('Authentication required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        roleId,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        experienceLevel,
        commitment,
        status,
        skillIds: selectedSkills.map((s) => s.id),
        toolIds: selectedTools.map((t) => t.id),
      };

      let result: ProjectRoleItem;
      if (roleToEdit && roleToEdit.id) {
        result = await updateProjectRole(
          accessToken,
          projectId,
          roleToEdit.id,
          payload,
        );
      } else {
        result = await createProjectRole(accessToken, projectId, payload);
      }

      onRoleSaved(result);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save project role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 rounded-3xl border border-[#363433] bg-[#141312] p-6 sm:p-8 shadow-2xl space-y-6 text-[#e6e2df]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#48473f] bg-[#201f1e] text-[#e6e2df]">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-headline text-xl font-bold text-[#ffffff]">
                {roleToEdit && roleToEdit.id
                  ? 'Edit Open Role'
                  : 'Create Open Role'}
              </h2>
              <p className="text-xs font-mono text-[#8c887e]">
                Define recruitment requirements using recognized studio taxonomy
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#363433] p-2 text-[#8c887e] hover:border-[#e6e2df] hover:text-[#ffffff] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-950/30 p-4 text-xs font-mono text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Professional Role Taxonomy Single Select */}
          <TaxonomySingleSelect
            label="Professional Role (Taxonomy)"
            value={roleId}
            onChange={(val) => setRoleId(val)}
            fetchSearch={searchRoles}
            placeholder="Select recognized role (e.g. Gameplay Programmer)..."
            required
            valueBy="id"
          />

          {/* Custom Display Title */}
          <div className="space-y-2">
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-[#cac6bc]">
              Custom Role Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Character & Creature Modeler"
              maxLength={150}
              className="w-full rounded-2xl border border-[#363433] bg-[#1c1b1a] px-4 py-2.5 font-sans text-xs text-[#e6e2df] placeholder-[#8c887e] focus:border-[#e6e2df] focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-[#8c887e] font-sans">
              Overrides default taxonomy display name on project listings.
            </p>
          </div>

          {/* Role Description */}
          <div className="space-y-2">
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-[#cac6bc]">
              Role Responsibilities & Overview
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe tasks, responsibilities, and expected deliverables for this position..."
              maxLength={2000}
              className="w-full rounded-2xl border border-[#363433] bg-[#1c1b1a] px-4 py-2.5 font-sans text-xs text-[#e6e2df] placeholder-[#8c887e] focus:border-[#e6e2df] focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Grid Selects: Experience, Commitment, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-[#cac6bc]">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) =>
                  setExperienceLevel(
                    e.target.value as ProjectRoleExperienceLevel,
                  )
                }
                className="w-full rounded-2xl border border-[#363433] bg-[#1c1b1a] px-3 py-2.5 font-mono text-xs text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none transition-colors"
              >
                <option value="JUNIOR">Junior</option>
                <option value="MID">Mid-Level</option>
                <option value="SENIOR">Senior</option>
                <option value="LEAD">Lead / Director</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-[#cac6bc]">
                Commitment
              </label>
              <select
                value={commitment}
                onChange={(e) =>
                  setCommitment(e.target.value as ProjectRoleCommitment)
                }
                className="w-full rounded-2xl border border-[#363433] bg-[#1c1b1a] px-3 py-2.5 font-mono text-xs text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none transition-colors"
              >
                <option value="FULL_TIME">Full-Time</option>
                <option value="PART_TIME">Part-Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="REV_SHARE">Rev-Share / Equity</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-[#cac6bc]">
                Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as ProjectRoleStatus)
                }
                className="w-full rounded-2xl border border-[#363433] bg-[#1c1b1a] px-3 py-2.5 font-mono text-xs text-[#e6e2df] focus:border-[#e6e2df] focus:outline-none transition-colors"
              >
                <option value="OPEN">Open</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="FILLED">Filled</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          {/* Required Skills Taxonomy Multi-Select */}
          <TaxonomyMultiSelect
            categoryLabel="Required Skills (Taxonomy)"
            selectedItems={selectedSkills}
            onChange={setSelectedSkills}
            fetchSearch={searchSkills}
            placeholder="Search recognized skills (e.g. C++, Shader Graph)..."
          />

          {/* Required Tools Taxonomy Multi-Select */}
          <TaxonomyMultiSelect
            categoryLabel="Required Tools & Engines (Taxonomy)"
            selectedItems={selectedTools}
            onChange={setSelectedTools}
            fetchSearch={searchTools}
            placeholder="Search recognized software (e.g. Blender, Unreal Engine 5)..."
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-[#2b2a29] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-[#363433] bg-transparent px-5 py-2.5 font-mono text-xs font-medium text-[#cac6bc] hover:bg-[#201f1e] hover:text-[#ffffff] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#e6e2d7] bg-[#e6e2df] px-6 py-2.5 font-mono text-xs font-semibold text-[#141312] hover:bg-[#ffffff] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Role...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>{roleToEdit ? 'Update Role' : 'Publish Role'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
