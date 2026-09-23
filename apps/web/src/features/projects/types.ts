export interface DashboardProjectItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverUrl?: string | null;
  status: string; // e.g. "IN_DEVELOPMENT", "PLANNING", "PROTOTYPE", "COMPLETED"
  moderationStatus: 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';
  genre?: string | null;
  platform?: string | null;
  gameEngine?: string | null;
  memberCount: number;
  userRole: string; // e.g. "Founder" or "Gameplay Programmer · Member"
  isFounder: boolean;
  updatedAt: string;
}

export interface DashboardProjectsResponse {
  projects: DashboardProjectItem[];
}

export interface CreateProjectInput {
  name: string;
  description: string;
  coverUrl?: string;
  status?: string;
  genre?: string;
  platform?: string;
  gameEngine?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  coverUrl?: string;
  status?: string;
  genre?: string;
  platform?: string;
  gameEngine?: string;
}

export interface ProjectFounder {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface ProjectMemberDetail {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  role: string;
  joinedAt: string;
}

export interface ProjectDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverUrl?: string | null;
  status: string;
  moderationStatus: 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';
  genre?: string | null;
  platform?: string | null;
  gameEngine?: string | null;
  createdAt: string;
  updatedAt: string;
  founder: ProjectFounder;
  members: ProjectMemberDetail[];
  memberCount: number;
  isFounder: boolean;
  isMember: boolean;
}

export type ProjectRoleStatus = 'OPEN' | 'IN_REVIEW' | 'FILLED' | 'CLOSED';
export type ProjectRoleCommitment = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'REV_SHARE';
export type ProjectRoleExperienceLevel = 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD';

export interface ProjectRoleTaxonomyItem {
  id: string;
  name: string;
}

export interface ProjectRoleItem {
  id: string;
  projectId: string;
  roleId: string;
  roleName: string;
  title?: string | null;
  description?: string | null;
  experienceLevel: ProjectRoleExperienceLevel;
  commitment: ProjectRoleCommitment;
  status: ProjectRoleStatus;
  assignedMemberId?: string | null;
  assignedMemberName?: string | null;
  createdAt: string;
  updatedAt: string;
  requiredSkills: ProjectRoleTaxonomyItem[];
  requiredTools: ProjectRoleTaxonomyItem[];
}

export interface CreateProjectRoleInput {
  roleId: string;
  title?: string;
  description?: string;
  experienceLevel?: ProjectRoleExperienceLevel;
  commitment?: ProjectRoleCommitment;
  status?: ProjectRoleStatus;
  skillIds?: string[];
  toolIds?: string[];
}

export interface UpdateProjectRoleInput {
  roleId?: string;
  title?: string;
  description?: string;
  experienceLevel?: ProjectRoleExperienceLevel;
  commitment?: ProjectRoleCommitment;
  status?: ProjectRoleStatus;
  skillIds?: string[];
  toolIds?: string[];
}

import type { RecommendedCandidate } from './services/talentMatchingService';

export interface DraftRoleRecommendation {
  roleId: string;
  roleName: string;
  title?: string | null;
  description?: string | null;
  experienceLevel: ProjectRoleExperienceLevel;
  commitment: ProjectRoleCommitment;
  skillIds: string[];
  toolIds: string[];
  requiredSkills: ProjectRoleTaxonomyItem[];
  requiredTools: ProjectRoleTaxonomyItem[];
  reasoning: string;
  topCandidates?: RecommendedCandidate[];
}

export interface AiRoleRecommendationsResponse {
  recommendedRoles: DraftRoleRecommendation[];
}

export type ProjectMemberStatus = 'ACTIVE' | 'LEFT' | 'REMOVED';

export interface AssignedProjectRole {
  id: string;
  roleId: string;
  roleName: string;
  title?: string | null;
  experienceLevel?: string;
  commitment?: string;
  status?: string;
}

export interface ProjectActiveTeamMember {
  id: string;
  membershipId?: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  headline?: string | null;
  role: string;
  projectRoleId?: string | null;
  projectRoleTitle?: string | null;
  projectRoleName?: string | null;
  assignedRoles?: AssignedProjectRole[];
  joinedAt: string;
  isFounder: boolean;
}

export interface ProjectFormerTeamMember {
  id: string;
  membershipId?: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  headline?: string | null;
  role: string;
  projectRoleId?: string | null;
  projectRoleTitle?: string | null;
  projectRoleName?: string | null;
  assignedRoles?: AssignedProjectRole[];
  status: 'LEFT' | 'REMOVED';
  joinedAt: string;
  leftAt: string;
  isFounder?: boolean;
}

export interface ProjectTeamResponse {
  projectId?: string;
  activeCount?: number;
  activeMembers: ProjectActiveTeamMember[];
  formerMembers: ProjectFormerTeamMember[];
}

export type ProjectTaskMember = ProjectMemberDetail | ProjectActiveTeamMember;

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TaskAssignee {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface TaskMilestoneSummary {
  id: string;
  title: string;
}

export interface TaskItem {
  id: string;
  projectId: string;
  taskNumber: number;
  taskCode: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  assignee?: TaskAssignee | null;
  milestoneId?: string | null;
  milestone?: TaskMilestoneSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneItem {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  isCompleted: boolean;
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  milestoneId?: string;
  assigneeId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  milestoneId?: string | null;
  assigneeId?: string | null;
}

export interface CreateMilestoneInput {
  title: string;
  description?: string;
  dueDate?: string;
}

export interface UpdateMilestoneInput {
  title?: string;
  description?: string;
  dueDate?: string;
  isCompleted?: boolean;
}

export type BuildStatus = 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
export type BuildPlatform = 'WINDOWS' | 'MAC' | 'LINUX' | 'WEBGL';

export interface BuildTriggeredByUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface BuildMilestoneInfo {
  id: string;
  title: string;
}

export interface BuildRunnerInfo {
  id: string;
  name: string;
  platform: BuildPlatform;
  isOnline: boolean;
}

export interface BuildJobItem {
  id: string;
  projectId: string;
  buildRunnerId?: string | null;
  commitHash?: string | null;
  branchName?: string | null;
  targetPlatform: BuildPlatform;
  status: BuildStatus;
  triggeredById: string;
  triggeredBy: BuildTriggeredByUser;
  milestoneId?: string | null;
  milestone?: BuildMilestoneInfo | null;
  buildRunner?: BuildRunnerInfo | null;
  buildLogs?: string | null;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  durationSeconds?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlayableBuildItem {
  id: string;
  projectId: string;
  buildJobId?: string | null;
  milestoneId?: string | null;
  milestone?: BuildMilestoneInfo | null;
  version: string;
  title: string;
  platform: BuildPlatform;
  storagePath?: string | null;
  fileSizeBytes?: number | null;
  fileChecksum?: string | null;
  releaseNotes?: string | null;
  uploadedById?: string | null;
  uploadedBy?: BuildTriggeredByUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuildInput {
  targetPlatform: BuildPlatform;
  branchName?: string;
  commitHash?: string;
  milestoneId?: string;
}

export interface CreatePlayableBuildInput {
  version: string;
  title: string;
  platform: BuildPlatform;
  buildJobId?: string;
  milestoneId?: string;
  storagePath?: string;
  fileSizeBytes?: number;
  fileChecksum?: string;
  releaseNotes?: string;
}

