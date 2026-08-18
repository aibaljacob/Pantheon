import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FolderKanban,
  Crown,
  Users,
  Edit3,
  Clock,
  XCircle,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Layers,
  Gamepad2,
  Cpu,
  Briefcase,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../features/auth/store/authStore';
import { DashboardLayout } from '../features/dashboard/components/DashboardLayout';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type {
  DraftRoleRecommendation,
  ProjectDetail,
  ProjectRoleItem,
} from '../features/projects/types';
import {
  fetchProjectDetails,
  fetchProjectRoles,
  deleteProjectRole,
  fetchAiRoleRecommendations,
} from '../features/projects/services/projectService';
import { EditProjectModal } from '../features/profile/components/EditProjectModal';
import { AddEditRoleModal } from '../features/profile/components/AddEditRoleModal';
import { AiRoleRecommendationsDrawer } from '../features/profile/components/AiRoleRecommendationsDrawer';
import { RecommendedTalentSection } from '../features/projects/components/RecommendedTalentSection';

function formatStatus(status: string): string {
  switch (status) {
    case 'PLANNING':
      return 'Planning';
    case 'PRE_PRODUCTION':
      return 'Pre-Production';
    case 'PROTOTYPE':
      return 'Prototype';
    case 'IN_DEVELOPMENT':
      return 'In Development';
    case 'ALPHA':
      return 'Alpha';
    case 'BETA':
      return 'Beta';
    case 'COMPLETED':
      return 'Completed';
    case 'PAUSED':
      return 'Paused';
    default:
      return status;
  }
}

function formatExperience(level: string): string {
  switch (level) {
    case 'JUNIOR':
      return 'Junior';
    case 'MID':
      return 'Mid-Level';
    case 'SENIOR':
      return 'Senior';
    case 'LEAD':
      return 'Lead';
    default:
      return level;
  }
}

function formatCommitment(commitment: string): string {
  switch (commitment) {
    case 'FULL_TIME':
      return 'Full-Time';
    case 'PART_TIME':
      return 'Part-Time';
    case 'CONTRACT':
      return 'Contract';
    case 'REV_SHARE':
      return 'Rev-Share';
    default:
      return commitment;
  }
}

function formatRoleStatusBadge(status: string) {
  switch (status) {
    case 'OPEN':
      return (
        <span className="rounded-full border border-emerald-500/40 bg-emerald-950/30 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-emerald-400">
          ● OPEN
        </span>
      );
    case 'IN_REVIEW':
      return (
        <span className="rounded-full border border-amber-500/40 bg-amber-950/30 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-amber-300">
          ● IN REVIEW
        </span>
      );
    case 'FILLED':
      return (
        <span className="rounded-full border border-blue-500/40 bg-blue-950/30 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-blue-300">
          ● FILLED
        </span>
      );
    case 'CLOSED':
      return (
        <span className="rounded-full border border-[#48473f] bg-[#201f1e] px-2.5 py-0.5 text-[10px] font-mono text-[#8c887e]">
          ● CLOSED
        </span>
      );
    default:
      return null;
  }
}

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const currentUser = useAuthStore((state) => state.currentUser);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [roles, setRoles] = useState<ProjectRoleItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<ProjectRoleItem | null>(null);

  // AI Recommendation State
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [aiRecommendations, setAiRecommendations] = useState<
    DraftRoleRecommendation[]
  >([]);

  const loadProject = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      const [projectData, rolesData] = await Promise.all([
        fetchProjectDetails(id, accessToken),
        fetchProjectRoles(id, accessToken).catch(() => []),
      ]);
      setProject(projectData);
      setRoles(rolesData);
    } catch (err: any) {
      setError(err.message || 'Project not found or restricted access.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id, accessToken]);

  const handleProjectUpdated = (updatedProject: ProjectDetail) => {
    setProject(updatedProject);
  };

  const handleOpenAddRole = () => {
    setEditingRole(null);
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: ProjectRoleItem) => {
    setEditingRole(role);
    setIsRoleModalOpen(true);
  };

  const handleRoleSaved = (savedRole: ProjectRoleItem) => {
    setRoles((prev) => {
      const index = prev.findIndex((r) => r.id === savedRole.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = savedRole;
        return next;
      }
      return [savedRole, ...prev];
    });
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!project || !accessToken) return;
    if (!window.confirm('Are you sure you want to delete this open role?'))
      return;

    try {
      await deleteProjectRole(accessToken, project.id, roleId);
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete role.');
    }
  };

  const handleGenerateAiRoles = async () => {
    if (!project || !accessToken) return;
    setIsGeneratingAi(true);

    try {
      const res = await fetchAiRoleRecommendations(project.id, accessToken);
      setAiRecommendations(res.recommendedRoles || []);
      setIsAiDrawerOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to generate AI role recommendations.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAcceptAiDraft = (draft: DraftRoleRecommendation) => {
    if (!project) return;

    // Convert draft into pre-populated role for AddEditRoleModal
    const prefilledRole: ProjectRoleItem = {
      id: '', // Empty ID signals creation mode
      projectId: project.id,
      roleId: draft.roleId,
      roleName: draft.roleName,
      title: draft.title,
      description: draft.description,
      experienceLevel: draft.experienceLevel,
      commitment: draft.commitment,
      status: 'OPEN',
      createdAt: '',
      updatedAt: '',
      requiredSkills: draft.requiredSkills,
      requiredTools: draft.requiredTools,
    };

    setEditingRole(prefilledRole);
    setIsAiDrawerOpen(false);
    setIsRoleModalOpen(true);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#8c887e]" />
        </div>
      );
    }

    if (error || !project) {
      return (
        <div className="mx-auto max-w-xl p-6 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-950/20 text-red-400">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div>
            <h2 className="font-headline text-xl font-bold text-[#ffffff]">
              Project Unavailable
            </h2>
            <p className="mt-1 text-xs text-[#8c887e] font-mono">
              {error || 'This project does not exist or requires authorization.'}
            </p>
          </div>
          <Link to="/projects">
            <Button variant="secondary" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back to Projects
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-xs font-mono text-[#8c887e] hover:text-[#ffffff] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Projects</span>
          </Link>

          {/* Founder Action Button */}
          {project.isFounder && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              icon={<Edit3 className="h-3.5 w-3.5" />}
            >
              Edit Project
            </Button>
          )}
        </div>

        {/* Moderation Warning Banners for Founder/Member */}
        {project.moderationStatus === 'PENDING_REVIEW' && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 flex items-center gap-3 text-amber-200 text-xs font-mono">
            <Clock className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
            <div>
              <p className="font-bold">Pending Administrator Review</p>
              <p className="text-[11px] text-amber-300/80 font-sans">
                This project is currently under review by Pantheon administrators. It will become visible in the public discovery directory once approved.
              </p>
            </div>
          </div>
        )}

        {project.moderationStatus === 'REJECTED' && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4 flex items-center gap-3 text-red-200 text-xs font-mono">
            <XCircle className="h-4 w-4 text-red-400 shrink-0" />
            <div>
              <p className="font-bold">Rejected by Administrator</p>
              <p className="text-[11px] text-red-300/80 font-sans">
                This project submission did not pass administrator review and is hidden from public discovery.
              </p>
            </div>
          </div>
        )}

        {/* Project Header Banner & Title Card */}
        <Card className="p-0 overflow-hidden border-[#363433] bg-[#1c1b1a]">
          <div className="relative h-48 sm:h-64 border-b border-[#2b2a29] bg-[#141312] overflow-hidden">
            {project.coverUrl ? (
              <img
                src={project.coverUrl}
                alt={project.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#201f1e] via-[#1c1b1a] to-[#141312]">
                <FolderKanban className="h-16 w-16 text-[#363433]" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1c1b1a] via-transparent to-transparent opacity-80" />

            {/* Development Stage Badge */}
            <div className="absolute top-4 left-4 rounded-full border border-[#48473f] bg-[#141312]/90 backdrop-blur-md px-3.5 py-1 text-xs font-mono text-[#ffffff]">
              ● {formatStatus(project.status)}
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-headline text-3xl sm:text-4xl font-bold text-[#ffffff] tracking-tight">
                  {project.name}
                </h1>
                <p className="text-xs font-mono text-[#8c887e] mt-1">
                  /{project.slug}
                </p>
              </div>

              {/* Tag Chips */}
              <div className="flex items-center gap-2 flex-wrap text-xs font-mono text-[#cac6bc]">
                {project.genre && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#2b2a29] bg-[#141312] px-3 py-1.5">
                    <Gamepad2 className="h-3.5 w-3.5 text-[#8c887e]" />
                    {project.genre}
                  </span>
                )}
                {project.platform && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#2b2a29] bg-[#141312] px-3 py-1.5">
                    <Layers className="h-3.5 w-3.5 text-[#8c887e]" />
                    {project.platform}
                  </span>
                )}
                {project.gameEngine && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#2b2a29] bg-[#141312] px-3 py-1.5">
                    <Cpu className="h-3.5 w-3.5 text-[#8c887e]" />
                    {project.gameEngine}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Main Grid: Overview & Team Roster */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Overview & Open Roles */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Project */}
            <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-3">
              <h3 className="font-headline text-lg font-bold text-[#ffffff]">
                About the Project
              </h3>
              <p className="text-sm leading-relaxed text-[#cac6bc] whitespace-pre-line">
                {project.description}
              </p>
            </div>

            {/* OPEN ROLES RECRUITMENT SECTION */}
            <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#2b2a29] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#48473f] bg-[#201f1e] text-[#e6e2df]">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-headline text-lg font-bold text-[#ffffff]">
                      Open Roles
                    </h3>
                    <p className="text-xs font-mono text-[#8c887e]">
                      {roles.length} {roles.length === 1 ? 'position' : 'positions'} available
                    </p>
                  </div>
                </div>

                {project.isFounder && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateAiRoles}
                      disabled={isGeneratingAi}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-950/30 px-3 py-1.5 font-mono text-xs font-semibold text-amber-300 hover:bg-amber-900/40 transition-colors disabled:opacity-50"
                    >
                      {isGeneratingAi ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Generating AI Roles...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                          <span>Recommend Roles with AI</span>
                        </>
                      )}
                    </button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleOpenAddRole}
                      icon={<Plus className="h-4 w-4" />}
                    >
                      Add Role
                    </Button>
                  </div>
                )}
              </div>

              {roles.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-xs font-mono text-[#8c887e]">
                    No open recruitment roles published yet.
                  </p>
                  {project.isFounder && (
                    <button
                      type="button"
                      onClick={handleOpenAddRole}
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-[#e6e2df] hover:text-[#ffffff] underline"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create the first open position</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="rounded-2xl border border-[#2b2a29] bg-[#141312] p-4 sm:p-5 space-y-3 transition-all hover:border-[#363433]"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-headline text-base font-bold text-[#ffffff]">
                              {role.title || role.roleName}
                            </h4>
                            {formatRoleStatusBadge(role.status)}
                          </div>
                          <p className="text-xs font-mono text-[#8c887e] mt-0.5">
                            {role.roleName}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="rounded-xl border border-[#363433] bg-[#1c1b1a] px-2.5 py-1 text-[11px] font-mono text-[#cac6bc]">
                            {formatExperience(role.experienceLevel)}
                          </span>
                          <span className="rounded-xl border border-[#363433] bg-[#1c1b1a] px-2.5 py-1 text-[11px] font-mono text-[#cac6bc]">
                            {formatCommitment(role.commitment)}
                          </span>

                          {project.isFounder && (
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditRole(role)}
                                className="p-1.5 rounded-lg border border-[#363433] text-[#8c887e] hover:border-[#e6e2df] hover:text-[#ffffff] transition-colors"
                                title="Edit Role"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRole(role.id)}
                                className="p-1.5 rounded-lg border border-red-950/40 text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-colors"
                                title="Delete Role"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {role.description && (
                        <p className="text-xs leading-relaxed text-[#cac6bc] font-sans">
                          {role.description}
                        </p>
                      )}

                      {/* Required Skills & Tools */}
                      {(role.requiredSkills.length > 0 || role.requiredTools.length > 0) && (
                        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[#201f1e]">
                          {role.requiredSkills.map((s) => (
                            <span
                              key={s.id}
                              className="rounded-lg border border-[#363433] bg-[#1c1b1a] px-2 py-0.5 text-[10px] font-mono text-[#e6e2df]"
                            >
                              Skill: {s.name}
                            </span>
                          ))}
                          {role.requiredTools.map((t) => (
                            <span
                              key={t.id}
                              className="rounded-lg border border-[#363433] bg-[#201f1e] px-2 py-0.5 text-[10px] font-mono text-[#cac6bc]"
                            >
                              Tool: {t.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Founder / Admin Candidate Recommendation Section */}
            {(project.isFounder || currentUser?.role === 'Administrator') && (
              <div className="pt-2">
                <RecommendedTalentSection project={project} roles={roles} />
              </div>
            )}
          </div>

          {/* Right Column: Founder Card & Team Roster */}
          <div className="space-y-6">
            {/* Founder Card */}
            <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
                <span className="text-xs font-mono uppercase tracking-widest text-[#8c887e]">
                  Studio Founder
                </span>
                <Crown className="h-4 w-4 text-amber-400" />
              </div>

              <div className="flex items-center gap-4">
                <Link to={`/u/${project.founder.username}`}>
                  {project.founder.avatarUrl ? (
                    <img
                      src={project.founder.avatarUrl}
                      alt={project.founder.displayName}
                      className="h-12 w-12 rounded-full object-cover border border-[#48473f]"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-[#201f1e] border border-[#48473f] flex items-center justify-center font-bold text-lg text-[#ffffff]">
                      {project.founder.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>

                <div>
                  <Link
                    to={`/u/${project.founder.username}`}
                    className="font-headline text-base font-bold text-[#ffffff] hover:text-amber-200 transition-colors"
                  >
                    {project.founder.displayName}
                  </Link>
                  <p className="text-xs font-mono text-[#8c887e]">
                    @{project.founder.username}
                  </p>
                </div>
              </div>
            </div>

            {/* Team Roster */}
            <div className="rounded-3xl border border-[#363433] bg-[#1c1b1a] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#2b2a29] pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#e6e2df]" />
                  <h3 className="font-headline text-base font-bold text-[#ffffff]">
                    Production Team
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#8c887e]">
                  {project.memberCount} {project.memberCount === 1 ? 'member' : 'members'}
                </span>
              </div>

              {/* Members List */}
              <div className="space-y-3">
                {project.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-2xl border border-[#2b2a29] bg-[#141312] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Link to={`/u/${member.username}`}>
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.displayName}
                            className="h-9 w-9 rounded-full object-cover border border-[#363433]"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-[#201f1e] border border-[#363433] flex items-center justify-center font-bold text-xs text-[#ffffff]">
                            {member.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </Link>
                      <div>
                        <Link
                          to={`/u/${member.username}`}
                          className="text-xs font-semibold text-[#ffffff] hover:text-[#e6e2df] transition-colors"
                        >
                          {member.displayName}
                        </Link>
                        <p className="text-[10px] font-mono text-[#8c887e]">
                          @{member.username}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-block rounded-full border border-[#48473f] bg-[#201f1e] px-2.5 py-0.5 text-[10px] font-mono text-[#e6e2df]">
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Project Modal for Founder */}
        {project.isFounder && (
          <EditProjectModal
            isOpen={isEditModalOpen}
            project={project}
            onClose={() => setIsEditModalOpen(false)}
            onUpdated={handleProjectUpdated}
          />
        )}

        {/* Add/Edit Role Modal for Founder */}
        {project.isFounder && (
          <AddEditRoleModal
            isOpen={isRoleModalOpen}
            onClose={() => setIsRoleModalOpen(false)}
            projectId={project.id}
            roleToEdit={editingRole}
            onRoleSaved={handleRoleSaved}
          />
        )}

        {/* AI Recommendations Drawer for Founder */}
        {project.isFounder && (
          <AiRoleRecommendationsDrawer
            isOpen={isAiDrawerOpen}
            onClose={() => setIsAiDrawerOpen(false)}
            recommendations={aiRecommendations}
            onAcceptRecommendation={handleAcceptAiDraft}
          />
        )}
      </div>
    );
  };

  if (currentUser) {
    return (
      <DashboardLayout user={currentUser}>
        <div className="max-w-7xl mx-auto pb-12">{renderContent()}</div>
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen bg-[#141312] text-[#e6e2df] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">{renderContent()}</main>
      <Footer />
    </div>
  );
};
