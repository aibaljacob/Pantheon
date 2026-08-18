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
}

export interface AiRoleRecommendationsResponse {
  recommendedRoles: DraftRoleRecommendation[];
}
