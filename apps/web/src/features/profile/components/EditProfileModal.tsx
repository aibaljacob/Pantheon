import React, { useState } from 'react';
import { X, User, Tag, Briefcase, GraduationCap, Layers, FileText, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { ProfileData, ExperienceItem, EducationItem, PortfolioItem, ProfileLink, TaxonomyItem } from '../types';
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
import {
  updateBasicProfile,
  createExperience,
  updateExperience,
  deleteExperience,
  createEducation,
  updateEducation,
  deleteEducation,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  createLink,
  updateLink,
  deleteLink,
} from '../services/profileService';
import { useAuthStore } from '../../auth/store/authStore';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: ProfileData;
  onSave: (updatedProfile: ProfileData) => void;
}

type TabType = 'basic' | 'identity' | 'experience' | 'education' | 'portfolio' | 'resume_links';

const normalizeTaxonomyArray = (items: (TaxonomyItem | string)[] = []): TaxonomyItem[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => (typeof item === 'string' ? { id: item, name: item } : item));
};

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profileData,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [formData, setFormData] = useState<ProfileData>(profileData);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const accessToken = useAuthStore((state) => state.accessToken);

  if (!isOpen) return null;

  const professional = formData.professional || {
    roles: [],
    specializations: [],
    skills: [],
    tools: [],
    gameEngines: [],
    genres: [],
    platforms: [],
  };

  const handleSave = async () => {
    setIsSaving(true);

    // Collect taxonomy UUIDs
    const extractIds = (items: (TaxonomyItem | string)[] = []) =>
      normalizeTaxonomyArray(items)
        .map((i) => i.id)
        .filter((id) => Boolean(id) && id.length > 10);

    const payload = {
      roleIds: extractIds(professional.roles),
      specializationIds: extractIds(professional.specializations),
      skillIds: extractIds(professional.skills),
      toolIds: extractIds(professional.tools),
      gameEngineIds: extractIds(professional.gameEngines),
      genreIds: extractIds(professional.genres),
      platformIds: extractIds(professional.platforms),
    };

    try {
      if (accessToken) {
        // 1 & 2. Basic Profile + Taxonomy Identity (Parallel)
        await Promise.all([
          updateBasicProfile(accessToken, {
            firstName: formData.user.firstName || '',
            lastName: formData.user.lastName || '',
            displayName: formData.user.displayName || '',
            headline: formData.user.headline || '',
            bio: formData.user.bio || '',
            location: formData.user.location || '',
            timezone: formData.user.timezone || '',
            experienceYears: formData.user.experienceYears || 0,
            availability: formData.user.availability || 'Available for collaboration',
          }),
          updateIdentity(accessToken, payload),
        ]);

        // 3. Experiences CRUD Sync
        const currentExpIds = new Set((formData.experiences || []).map((e) => e.id));
        const deletedExpIds = (profileData.experiences || [])
          .filter((e) => !currentExpIds.has(e.id))
          .map((e) => e.id);

        for (const id of deletedExpIds) {
          await deleteExperience(accessToken, id).catch((err) => console.warn('Delete exp error:', err));
        }

        for (const exp of formData.experiences || []) {
          const dto = {
            position: exp.position || 'Developer',
            company: exp.company || 'Studio',
            location: exp.location || '',
            startDate: exp.startDate || '2024',
            endDate: exp.endDate || '',
            isCurrent: Boolean(exp.isCurrent),
            description: exp.description || '',
            technologies: exp.technologies || [],
          };
          if (exp.id.startsWith('exp-')) {
            await createExperience(accessToken, dto).catch((err) => console.warn('Create exp error:', err));
          } else {
            await updateExperience(accessToken, exp.id, dto).catch((err) => console.warn('Update exp error:', err));
          }
        }

        // 4. Education CRUD Sync
        const currentEduIds = new Set((formData.education || []).map((e) => e.id));
        const deletedEduIds = (profileData.education || [])
          .filter((e) => !currentEduIds.has(e.id))
          .map((e) => e.id);

        for (const id of deletedEduIds) {
          await deleteEducation(accessToken, id).catch((err) => console.warn('Delete edu error:', err));
        }

        for (const edu of formData.education || []) {
          const dto = {
            institution: edu.institution || 'University',
            degree: edu.degree || 'Degree',
            startDate: edu.startDate || '2020',
            endDate: edu.endDate || '',
            description: edu.description || '',
          };
          if (edu.id.startsWith('edu-')) {
            await createEducation(accessToken, dto).catch((err) => console.warn('Create edu error:', err));
          } else {
            await updateEducation(accessToken, edu.id, dto).catch((err) => console.warn('Update edu error:', err));
          }
        }

        // 5. Portfolio CRUD Sync
        const currentProjIds = new Set((formData.portfolio || []).map((p) => p.id));
        const deletedProjIds = (profileData.portfolio || [])
          .filter((p) => !currentProjIds.has(p.id))
          .map((p) => p.id);

        for (const id of deletedProjIds) {
          await deletePortfolioItem(accessToken, id).catch((err) => console.warn('Delete portfolio error:', err));
        }

        for (const proj of formData.portfolio || []) {
          const dto = {
            title: proj.title || 'Project',
            description: proj.description || '',
            role: proj.role || 'Developer',
            gameEngine: proj.gameEngine || 'Unreal Engine 5',
            genre: proj.genre || 'Action',
            platform: proj.platform || 'PC',
            status: proj.status || 'In Development',
            coverUrl: proj.coverUrl || '',
            projectUrl: proj.projectUrl || '',
            technologies: proj.technologies || [],
          };
          if (proj.id.startsWith('proj-')) {
            await createPortfolioItem(accessToken, dto).catch((err) => console.warn('Create portfolio error:', err));
          } else {
            await updatePortfolioItem(accessToken, proj.id, dto).catch((err) => console.warn('Update portfolio error:', err));
          }
        }

        // 6. Links CRUD Sync
        const currentLinkIds = new Set((formData.links || []).map((l) => l.id));
        const deletedLinkIds = (profileData.links || [])
          .filter((l) => !currentLinkIds.has(l.id))
          .map((l) => l.id);

        for (const id of deletedLinkIds) {
          await deleteLink(accessToken, id).catch((err) => console.warn('Delete link error:', err));
        }

        for (const link of formData.links || []) {
          const dto = {
            platform: link.platform || 'website',
            displayName: link.displayName || 'Portfolio Link',
            url: link.url || 'https://pantheon.dev',
          };
          if (link.id.startsWith('link-')) {
            await createLink(accessToken, dto).catch((err) => console.warn('Create link error:', err));
          } else {
            await updateLink(accessToken, link.id, dto).catch((err) => console.warn('Update link error:', err));
          }
        }
      }
    } catch (error) {
      console.warn('Profile save notice:', error);
    } finally {
      setIsSaving(false);
    }

    onSave(formData);
    onClose();
  };

  const handleUserChange = (field: keyof ProfileData['user'], value: any) => {
    setFormData((prev) => ({
      ...prev,
      user: { ...prev.user, [field]: value },
    }));
  };

  const handleTaxonomyChange = (
    category: keyof ProfileData['professional'],
    items: TaxonomyItem[],
  ) => {
    setFormData((prev) => ({
      ...prev,
      professional: {
        ...(prev.professional || {
          roles: [],
          specializations: [],
          skills: [],
          tools: [],
          gameEngines: [],
          genres: [],
          platforms: [],
        }),
        [category]: items,
      },
    }));
  };

  const handleAddExperienceItem = () => {
    const newExp: ExperienceItem = {
      id: `exp-${Date.now()}`,
      position: 'Senior Gameplay Developer',
      company: 'Pantheon Studios',
      location: 'Remote',
      startDate: '2025',
      isCurrent: true,
      description: 'Implemented systemic multiplayer combat mechanics using Unreal Engine and C++.',
      technologies: ['Unreal Engine', 'C++', 'Git'],
    };
    setFormData((prev) => ({
      ...prev,
      experiences: [newExp, ...(prev.experiences || [])],
    }));
  };

  const handleRemoveExperienceItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      experiences: (prev.experiences || []).filter((e) => e.id !== id),
    }));
  };

  const handleAddEducationItem = () => {
    const newEdu: EducationItem = {
      id: `edu-${Date.now()}`,
      institution: 'State University',
      degree: 'B.S. Computer Science & Game Engineering',
      startDate: '2021',
      endDate: '2025',
      description: 'Focused on 3D graphics rendering, physics simulation, and AI behavior trees.',
    };
    setFormData((prev) => ({
      ...prev,
      education: [...(prev.education || []), newEdu],
    }));
  };

  const handleRemoveEducationItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      education: (prev.education || []).filter((e) => e.id !== id),
    }));
  };

  const handleAddPortfolioItem = () => {
    const newProj: PortfolioItem = {
      id: `proj-${Date.now()}`,
      title: 'New Game Prototype',
      description: 'Systemic third-person action mechanics built in Unreal Engine.',
      role: 'Gameplay Lead',
      gameEngine: 'Unreal Engine 5',
      genre: 'Action RPG',
      platform: 'PC',
      status: 'Prototype',
      technologies: ['C++', 'GAS'],
      projectUrl: 'https://github.com',
    };
    setFormData((prev) => ({
      ...prev,
      portfolio: [newProj, ...(prev.portfolio || [])],
    }));
  };

  const handleRemovePortfolioItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      portfolio: (prev.portfolio || []).filter((p) => p.id !== id),
    }));
  };

  const handleAddLinkItem = () => {
    const newLink: ProfileLink = {
      id: `link-${Date.now()}`,
      platform: 'custom',
      displayName: 'Personal Portfolio Site',
      url: 'https://aibal.dev',
    };
    setFormData((prev) => ({
      ...prev,
      links: [...(prev.links || []), newLink],
    }));
  };

  const handleRemoveLinkItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      links: (prev.links || []).filter((l) => l.id !== id),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-[#363433] bg-[#1c1b1a] shadow-2xl overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#2b2a29] px-6 py-4">
          <div>
            <h2 className="font-headline text-xl font-bold text-[#ffffff]">Edit Profile</h2>
            <p className="text-xs text-[#8c887e]">Update your public game developer identity</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#363433] bg-[#141312] p-2 text-[#8c887e] hover:text-[#ffffff] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-[#2b2a29] bg-[#141312] px-6 gap-2 text-xs font-mono">
          {[
            { id: 'basic', label: 'Basic Info', icon: User },
            { id: 'identity', label: 'Skills & Tags', icon: Tag },
            { id: 'experience', label: 'Experience', icon: Briefcase },
            { id: 'education', label: 'Education', icon: GraduationCap },
            { id: 'portfolio', label: 'Portfolio', icon: Layers },
            { id: 'resume_links', label: 'Resume & Links', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 border-b-2 px-3 py-3 font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'border-[#e6e2df] text-[#ffffff]'
                    : 'border-transparent text-[#8c887e] hover:text-[#cac6bc]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body / Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#8c887e] mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.user.firstName || ''}
                    onChange={(e) => handleUserChange('firstName', e.target.value)}
                    className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#48473f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8c887e] mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.user.lastName || ''}
                    onChange={(e) => handleUserChange('lastName', e.target.value)}
                    className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#48473f] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#8c887e] mb-1">Display Name (Optional)</label>
                <input
                  type="text"
                  value={formData.user.displayName || ''}
                  onChange={(e) => handleUserChange('displayName', e.target.value)}
                  placeholder="e.g. Aibal Jacob"
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#48473f] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#8c887e] mb-1">Professional Headline</label>
                <input
                  type="text"
                  value={formData.user.headline || ''}
                  onChange={(e) => handleUserChange('headline', e.target.value)}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#48473f] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#8c887e] mb-1">Professional Bio</label>
                <textarea
                  rows={4}
                  value={formData.user.bio || ''}
                  onChange={(e) => handleUserChange('bio', e.target.value)}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#48473f] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#8c887e] mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.user.location || ''}
                    onChange={(e) => handleUserChange('location', e.target.value)}
                    className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#48473f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8c887e] mb-1">Timezone</label>
                  <input
                    type="text"
                    value={formData.user.timezone || ''}
                    onChange={(e) => handleUserChange('timezone', e.target.value)}
                    className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#48473f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8c887e] mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    value={formData.user.experienceYears ?? 0}
                    onChange={(e) => handleUserChange('experienceYears', parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#48473f] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#8c887e] mb-1">Availability Status</label>
                <select
                  value={formData.user.availability || 'Available for collaboration'}
                  onChange={(e) => handleUserChange('availability', e.target.value)}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#48473f] focus:outline-none"
                >
                  <option value="Available for collaboration">Available for collaboration</option>
                  <option value="Open to offers">Open to offers</option>
                  <option value="Not available">Not available</option>
                  <option value="Founder active">Founder active</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 2: CONTROLLED TAXONOMY SKILLS & IDENTITY */}
          {activeTab === 'identity' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs font-mono text-amber-200">
                <span>
                  💡 Pantheon Taxonomy: Professional identity uses backend-verified taxonomy entities. Select recognized values from the backend search. Custom arbitrary entries are disabled.
                </span>
              </div>

              {/* 1. Primary Roles (Max 5) */}
              <TaxonomyMultiSelect
                categoryLabel="Primary Roles"
                placeholder="Search recognized roles (e.g. Gameplay Programmer, Technical Artist)..."
                selectedItems={normalizeTaxonomyArray(professional.roles)}
                onChange={(items) => handleTaxonomyChange('roles', items)}
                fetchSearch={searchRoles}
                maxLimit={5}
              />

              {/* 2. Specializations (Max 10) */}
              <TaxonomyMultiSelect
                categoryLabel="Specializations"
                placeholder="Search specializations (e.g. Core Gameplay, Multiplayer)..."
                selectedItems={normalizeTaxonomyArray(professional.specializations)}
                onChange={(items) => handleTaxonomyChange('specializations', items)}
                fetchSearch={searchSpecializations}
                maxLimit={10}
              />

              {/* 3. Game Engines (Max 10) */}
              <TaxonomyMultiSelect
                categoryLabel="Game Engines"
                placeholder="Search game engines (e.g. Unreal Engine, Unity, Godot)..."
                selectedItems={normalizeTaxonomyArray(professional.gameEngines)}
                onChange={(items) => handleTaxonomyChange('gameEngines', items)}
                fetchSearch={searchGameEngines}
                maxLimit={10}
              />

              {/* 4. Technical Skills (Max 30) */}
              <TaxonomyMultiSelect
                categoryLabel="Technical & Creative Skills"
                placeholder="Search skills (e.g. C++, Shader Programming, Game AI)..."
                selectedItems={normalizeTaxonomyArray(professional.skills)}
                onChange={(items) => handleTaxonomyChange('skills', items)}
                fetchSearch={searchSkills}
                maxLimit={30}
              />

              {/* 5. Tools & Software (Max 30) */}
              <TaxonomyMultiSelect
                categoryLabel="Tools & Software"
                placeholder="Search tools (e.g. Blender, Maya, Visual Studio, Wwise)..."
                selectedItems={normalizeTaxonomyArray(professional.tools)}
                onChange={(items) => handleTaxonomyChange('tools', items)}
                fetchSearch={searchTools}
                maxLimit={30}
              />

              {/* 6. Platforms (Max 10) */}
              <TaxonomyMultiSelect
                categoryLabel="Platform Experience"
                placeholder="Search platforms (e.g. PC, PlayStation, Xbox, Mobile)..."
                selectedItems={normalizeTaxonomyArray(professional.platforms)}
                onChange={(items) => handleTaxonomyChange('platforms', items)}
                fetchSearch={searchPlatforms}
                maxLimit={10}
              />

              {/* 7. Genres (Max 10) */}
              <TaxonomyMultiSelect
                categoryLabel="Preferred Genres"
                placeholder="Search genres (e.g. Action, RPG, Strategy, FPS)..."
                selectedItems={normalizeTaxonomyArray(professional.genres)}
                onChange={(items) => handleTaxonomyChange('genres', items)}
                fetchSearch={searchGenres}
                maxLimit={10}
              />
            </div>
          )}

          {/* TAB 3: EXPERIENCE */}
          {activeTab === 'experience' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-sm font-bold text-[#ffffff]">Work Experience Items</h3>
                <Button variant="secondary" size="sm" onClick={handleAddExperienceItem} icon={<Plus className="h-3.5 w-3.5" />}>
                  Add Experience
                </Button>
              </div>

              {(formData.experiences || []).map((exp) => (
                <div key={exp.id} className="rounded-xl border border-[#2b2a29] bg-[#141312] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#8c887e]">ID: {exp.id}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExperienceItem(exp.id)}
                      className="text-xs text-red-400 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={exp.position || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          experiences: (prev.experiences || []).map((item) => item.id === exp.id ? { ...item, position: val } : item),
                        }));
                      }}
                      className="rounded-lg border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs text-[#e6e2df]"
                      placeholder="Position Title"
                    />
                    <input
                      type="text"
                      value={exp.company || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          experiences: (prev.experiences || []).map((item) => item.id === exp.id ? { ...item, company: val } : item),
                        }));
                      }}
                      className="rounded-lg border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs text-[#e6e2df]"
                      placeholder="Company / Studio"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: EDUCATION */}
          {activeTab === 'education' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-sm font-bold text-[#ffffff]">Education History</h3>
                <Button variant="secondary" size="sm" onClick={handleAddEducationItem} icon={<Plus className="h-3.5 w-3.5" />}>
                  Add Education
                </Button>
              </div>

              {(formData.education || []).map((edu) => (
                <div key={edu.id} className="rounded-xl border border-[#2b2a29] bg-[#141312] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#8c887e]">ID: {edu.id}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEducationItem(edu.id)}
                      className="text-xs text-red-400 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={edu.degree || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          education: (prev.education || []).map((item) => item.id === edu.id ? { ...item, degree: val } : item),
                        }));
                      }}
                      className="rounded-lg border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs text-[#e6e2df]"
                      placeholder="Degree / Program"
                    />
                    <input
                      type="text"
                      value={edu.institution || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          education: (prev.education || []).map((item) => item.id === edu.id ? { ...item, institution: val } : item),
                        }));
                      }}
                      className="rounded-lg border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs text-[#e6e2df]"
                      placeholder="University / Institution"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-sm font-bold text-[#ffffff]">Portfolio Projects</h3>
                <Button variant="primary" size="sm" onClick={handleAddPortfolioItem} icon={<Plus className="h-3.5 w-3.5" />}>
                  Add Project
                </Button>
              </div>

              {(formData.portfolio || []).map((proj) => (
                <div key={proj.id} className="rounded-xl border border-[#2b2a29] bg-[#141312] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#8c887e]">{proj.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePortfolioItem(proj.id)}
                      className="text-xs text-red-400 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={proj.title || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          portfolio: (prev.portfolio || []).map((item) => item.id === proj.id ? { ...item, title: val } : item),
                        }));
                      }}
                      className="rounded-lg border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs text-[#e6e2df]"
                      placeholder="Project Title"
                    />
                    <input
                      type="text"
                      value={proj.role || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          portfolio: (prev.portfolio || []).map((item) => item.id === proj.id ? { ...item, role: val } : item),
                        }));
                      }}
                      className="rounded-lg border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs text-[#e6e2df]"
                      placeholder="Your Role"
                    />
                    <input
                      type="text"
                      value={proj.gameEngine || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          portfolio: (prev.portfolio || []).map((item) => item.id === proj.id ? { ...item, gameEngine: val } : item),
                        }));
                      }}
                      className="rounded-lg border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs text-[#e6e2df]"
                      placeholder="Engine"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: RESUME & LINKS */}
          {activeTab === 'resume_links' && (
            <div className="space-y-6">
              {/* Resume controls */}
              <div className="space-y-3 border-b border-[#2b2a29] pb-4">
                <h3 className="font-headline text-sm font-bold text-[#ffffff]">Resume Settings</h3>
                {formData.resume ? (
                  <div className="rounded-xl border border-[#363433] bg-[#141312] p-4 flex items-center justify-between">
                    <div>
                      <p className="font-mono text-xs font-semibold text-[#e6e2df]">{formData.resume.fileName}</p>
                      <p className="text-[10px] font-mono text-[#8c887e]">
                        {formData.resume.fileSize} · Visibility: {formData.resume.visibility}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          resume: prev.resume
                            ? {
                                ...prev.resume,
                                visibility: prev.resume.visibility === 'Public' ? 'Private' : 'Public',
                              }
                            : null,
                        }))
                      }
                      className="rounded-lg border border-[#363433] bg-[#201f1e] px-3 py-1 font-mono text-xs text-[#e6e2df]"
                    >
                      Set {formData.resume.visibility === 'Public' ? 'Private' : 'Public'}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-[#8c887e]">No resume active.</p>
                )}
              </div>

              {/* Links controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline text-sm font-bold text-[#ffffff]">External Profile Links</h3>
                  <Button variant="secondary" size="sm" onClick={handleAddLinkItem} icon={<Plus className="h-3.5 w-3.5" />}>
                    Add Link
                  </Button>
                </div>

                {(formData.links || []).map((link) => (
                  <div key={link.id} className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3 flex items-center gap-3">
                    <input
                      type="text"
                      value={link.displayName || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          links: (prev.links || []).map((l) => (l.id === link.id ? { ...l, displayName: val } : l)),
                        }));
                      }}
                      className="w-1/3 rounded-lg border border-[#363433] bg-[#1c1b1a] px-3 py-1 text-xs text-[#e6e2df]"
                      placeholder="Display Name"
                    />
                    <input
                      type="text"
                      value={link.url || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          links: (prev.links || []).map((l) => (l.id === link.id ? { ...l, url: val } : l)),
                        }));
                      }}
                      className="flex-1 rounded-lg border border-[#363433] bg-[#1c1b1a] px-3 py-1 text-xs text-[#e6e2df]"
                      placeholder="URL"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLinkItem(link.id)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#2b2a29] bg-[#141312] px-6 py-4">
          <Button variant="ghost" size="md" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={isSaving}
            icon={isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};
