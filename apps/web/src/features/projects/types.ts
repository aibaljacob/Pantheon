export interface PublicProjectRolePreview {
  id: string;
  title: string;
  roleName: string;
  experienceLevel: string;
  commitment: string;
}

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
  founder?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
  openRoleCount?: number;
  openRoles?: PublicProjectRolePreview[];
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

export type ViewerRelationship =
  | 'FOUNDER'
  | 'ACTIVE_MEMBER'
  | 'APPLICANT'
  | 'INVITEE'
  | 'NON_MEMBER'
  | 'VISITOR';

export interface ViewerPendingApplication {
  id: string;
  projectRoleId: string;
  roleTitle: string;
  message?: string | null;
  createdAt: string;
}

export interface ViewerPendingInvitation {
  id: string;
  projectRoleId: string;
  roleTitle: string;
  inviterName: string;
  message?: string | null;
  createdAt: string;
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
  viewerRelationship?: ViewerRelationship;
  viewerRole?: string | null;
  viewerPendingApplication?: ViewerPendingApplication | null;
  viewerPendingInvitation?: ViewerPendingInvitation | null;
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
  userId?: string | null;
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

export type TaskType =
  | 'FEATURE'
  | 'BUG'
  | 'ART'
  | 'AUDIO'
  | 'CODE'
  | 'DESIGN'
  | 'TEST'
  | 'OTHER';

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

export interface TaskDependencySummary {
  id: string;
  taskNumber: number;
  taskCode: string;
  title: string;
  status: TaskStatus;
}

export interface TaskCommitItem {
  id: string;
  taskId: string;
  commitHash: string;
  commitMsg: string;
  authorName: string;
  branchName: string;
  timestamp: string;
  author?: {
    id: string;
    username: string;
    avatarUrl?: string | null;
    displayName?: string | null;
  } | null;
}

export interface TaskItem {
  id: string;
  projectId: string;
  taskNumber: number;
  taskCode: string;
  title: string;
  description?: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  blockedReason?: string | null;
  assigneeId?: string | null;
  assignee?: TaskAssignee | null;
  milestoneId?: string | null;
  milestone?: TaskMilestoneSummary | null;
  dependencies?: TaskDependencySummary[];
  dependents?: TaskDependencySummary[];
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
  type?: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  blockedReason?: string;
  milestoneId?: string;
  assigneeId?: string;
  dependencyTaskIds?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  type?: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
  blockedReason?: string | null;
  milestoneId?: string | null;
  assigneeId?: string | null;
  dependencyTaskIds?: string[];
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

export interface PlaytestSession {
  id: string;
  title: string;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  playableBuild?: {
    id?: string;
    version: string;
    platform: string;
    title: string;
    buildJob?: { commitHash?: string };
  } | null;
  _count: {
    feedback: number;
  };
  createdAt: string;
}

export interface GamePillar {
  title: string;
  description: string;
}

export interface GameFeature {
  title: string;
  description: string;
  category?: 'GAMEPLAY' | 'TECHNICAL' | 'ART' | 'AUDIO' | string;
}

export interface GameBlueprint {
  id: string;
  projectId: string;
  tagline?: string | null;
  targetAudience?: string | null;
  cameraPerspective?: string | null;
  artStyle?: string | null;
  audioTone?: string | null;
  networkModel?: string | null;
  targetFps?: number | null;
  targetResolution?: string | null;
  coreLoop?: string | null;
  summary?: string | null;
  pillars?: GamePillar[] | null;
  keyFeatures?: GameFeature[] | null;
  targetSpecs?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertGameBlueprintInput {
  tagline?: string;
  targetAudience?: string;
  cameraPerspective?: string;
  artStyle?: string;
  audioTone?: string;
  networkModel?: string;
  targetFps?: number;
  targetResolution?: string;
  coreLoop?: string;
  summary?: string;
  pillars?: GamePillar[];
  keyFeatures?: GameFeature[];
  targetSpecs?: Record<string, unknown>;
}

