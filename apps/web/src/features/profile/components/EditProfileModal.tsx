import React, { useState } from 'react';
import { X, User, Tag, Briefcase, GraduationCap, Layers, FileText, Plus, Trash2, Check } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { ProfileData, ExperienceItem, EducationItem, PortfolioItem, ProfileLink } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: ProfileData;
  onSave: (updatedProfile: ProfileData) => void;
}

type TabType = 'basic' | 'identity' | 'experience' | 'education' | 'portfolio' | 'resume_links';

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profileData,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [formData, setFormData] = useState<ProfileData>(profileData);

  // Helper state for adding dynamic tags
  const [tagInputs, setTagInputs] = useState<{ [key: string]: string }>({
    roles: '',
    specializations: '',
    skills: '',
    tools: '',
    gameEngines: '',
    genres: '',
    platforms: '',
  });

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleUserChange = (field: keyof ProfileData['user'], value: any) => {
    setFormData((prev) => ({
      ...prev,
      user: { ...prev.user, [field]: value },
    }));
  };

  const handleAddTag = (category: keyof ProfileData['professional']) => {
    const val = tagInputs[category]?.trim();
    if (!val) return;
    if (formData.professional[category].includes(val)) return;

    setFormData((prev) => ({
      ...prev,
      professional: {
        ...prev.professional,
        [category]: [...prev.professional[category], val],
      },
    }));
    setTagInputs((prev) => ({ ...prev, [category]: '' }));
  };

  const handleRemoveTag = (category: keyof ProfileData['professional'], tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      professional: {
        ...prev.professional,
        [category]: prev.professional[category].filter((t) => t !== tagToRemove),
      },
    }));
  };

  // Add dummy item helpers
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
      experiences: [newExp, ...prev.experiences],
    }));
  };

  const handleRemoveExperienceItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((e) => e.id !== id),
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
      education: [...prev.education, newEdu],
    }));
  };

  const handleRemoveEducationItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((e) => e.id !== id),
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
      portfolio: [newProj, ...prev.portfolio],
    }));
  };

  const handleRemovePortfolioItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      portfolio: prev.portfolio.filter((p) => p.id !== id),
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
      links: [...prev.links, newLink],
    }));
  };

  const handleRemoveLinkItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.filter((l) => l.id !== id),
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
                    value={formData.user.firstName}
                    onChange={(e) => handleUserChange('firstName', e.target.value)}
                    className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#48473f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8c887e] mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.user.lastName}
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
                  value={formData.user.headline}
                  onChange={(e) => handleUserChange('headline', e.target.value)}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#48473f] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#8c887e] mb-1">Professional Bio</label>
                <textarea
                  rows={4}
                  value={formData.user.bio}
                  onChange={(e) => handleUserChange('bio', e.target.value)}
                  className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#48473f] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#8c887e] mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.user.location}
                    onChange={(e) => handleUserChange('location', e.target.value)}
                    className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#48473f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8c887e] mb-1">Timezone</label>
                  <input
                    type="text"
                    value={formData.user.timezone}
                    onChange={(e) => handleUserChange('timezone', e.target.value)}
                    className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#48473f] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8c887e] mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    value={formData.user.experienceYears}
                    onChange={(e) => handleUserChange('experienceYears', parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-[#363433] bg-[#141312] px-3.5 py-2.5 text-sm text-[#e6e2df] focus:border-[#48473f] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#8c887e] mb-1">Availability Status</label>
                <select
                  value={formData.user.availability}
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

          {/* TAB 2: SKILLS & TAGS */}
          {activeTab === 'identity' && (
            <div className="space-y-6">
              {(
                [
                  { key: 'roles', title: 'Roles' },
                  { key: 'specializations', title: 'Specializations' },
                  { key: 'gameEngines', title: 'Game Engines' },
                  { key: 'skills', title: 'Technical Skills' },
                  { key: 'tools', title: 'Tools & Software' },
                  { key: 'platforms', title: 'Platforms' },
                  { key: 'genres', title: 'Genres' },
                ] as const
              ).map(({ key, title }) => (
                <div key={key} className="space-y-2 border-b border-[#2b2a29] pb-4">
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#8c887e]">
                    {title}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Add new ${title.toLowerCase()}...`}
                      value={tagInputs[key]}
                      onChange={(e) => setTagInputs({ ...tagInputs, [key]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(key);
                        }
                      }}
                      className="flex-1 rounded-xl border border-[#363433] bg-[#141312] px-3 py-1.5 text-xs font-mono text-[#e6e2df] focus:border-[#48473f] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTag(key)}
                      className="rounded-xl bg-[#201f1e] border border-[#363433] px-3 py-1.5 font-mono text-xs text-[#e6e2df] hover:border-[#e6e2df]"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {formData.professional[key].map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#48473f] bg-[#201f1e] px-2.5 py-1 text-xs font-mono text-[#e6e2df]"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(key, tag)}
                          className="text-[#8c887e] hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
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

              {formData.experiences.map((exp) => (
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
                      value={exp.position}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          experiences: prev.experiences.map((item) => item.id === exp.id ? { ...item, position: val } : item),
                        }));
                      }}
                      className="rounded-lg border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs text-[#e6e2df]"
                      placeholder="Position Title"
                    />
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          experiences: prev.experiences.map((item) => item.id === exp.id ? { ...item, company: val } : item),
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

              {formData.education.map((edu) => (
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
                      value={edu.degree}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          education: prev.education.map((item) => item.id === edu.id ? { ...item, degree: val } : item),
                        }));
                      }}
                      className="rounded-lg border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs text-[#e6e2df]"
                      placeholder="Degree / Program"
                    />
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          education: prev.education.map((item) => item.id === edu.id ? { ...item, institution: val } : item),
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

              {formData.portfolio.map((proj) => (
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
                      value={proj.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          portfolio: prev.portfolio.map((item) => item.id === proj.id ? { ...item, title: val } : item),
                        }));
                      }}
                      className="rounded-lg border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs text-[#e6e2df]"
                      placeholder="Project Title"
                    />
                    <input
                      type="text"
                      value={proj.role}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          portfolio: prev.portfolio.map((item) => item.id === proj.id ? { ...item, role: val } : item),
                        }));
                      }}
                      className="rounded-lg border border-[#363433] bg-[#1c1b1a] px-3 py-1.5 text-xs text-[#e6e2df]"
                      placeholder="Your Role"
                    />
                    <input
                      type="text"
                      value={proj.gameEngine}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          portfolio: prev.portfolio.map((item) => item.id === proj.id ? { ...item, gameEngine: val } : item),
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

                {formData.links.map((link) => (
                  <div key={link.id} className="rounded-xl border border-[#2b2a29] bg-[#141312] p-3 flex items-center gap-3">
                    <input
                      type="text"
                      value={link.displayName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          links: prev.links.map((l) => (l.id === link.id ? { ...l, displayName: val } : l)),
                        }));
                      }}
                      className="w-1/3 rounded-lg border border-[#363433] bg-[#1c1b1a] px-3 py-1 text-xs text-[#e6e2df]"
                      placeholder="Display Name"
                    />
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          links: prev.links.map((l) => (l.id === link.id ? { ...l, url: val } : l)),
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
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleSave} icon={<Check className="h-4 w-4" />}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
