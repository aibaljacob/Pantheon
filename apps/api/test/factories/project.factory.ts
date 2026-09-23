import {
  ProjectStatus,
  ProjectModerationStatus,
  ProjectRoleStatus,
  ProjectRoleExperienceLevel,
  ProjectRoleCommitment,
  ProjectMemberStatus,
} from '@prisma/client';

export interface TestProjectOptions {
  id?: string;
  name?: string;
  slug?: string;
  founderId?: string;
  moderationStatus?: ProjectModerationStatus;
  status?: ProjectStatus;
  genre?: string | null;
  platform?: string | null;
  gameEngine?: string | null;
}

export const createTestProject = (options: TestProjectOptions = {}) => {
  const id = options.id || `project-uuid-${Math.random().toString(36).substring(2, 9)}`;
  const name = options.name || 'Chronicles of Elyria';
  const slug = options.slug || name.toLowerCase().replace(/\s+/g, '-');

  return {
    id,
    name,
    slug,
    description: 'An expansive open-world multiplayer game with rich physics.',
    coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f',
    status: options.status || ProjectStatus.IN_DEVELOPMENT,
    moderationStatus: options.moderationStatus || ProjectModerationStatus.PUBLISHED,
    genre: options.genre ?? 'Action RPG',
    platform: options.platform ?? 'PC',
    gameEngine: options.gameEngine ?? 'Unreal Engine 5',
    founderId: options.founderId || 'founder-uuid-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    founder: {
      id: options.founderId || 'founder-uuid-1',
      username: 'founder_studio',
      profile: {
        displayName: 'Studio Founder',
        firstName: 'Studio',
        lastName: 'Founder',
        avatarUrl: null,
      },
    },
    members: [],
    openRoles: [],
  };
};

export const createTestProjectRole = (projectId: string, overrides: any = {}) => {
  const id = overrides.id || `role-uuid-${Math.random().toString(36).substring(2, 9)}`;
  return {
    id,
    projectId,
    roleId: overrides.roleId || 'role-tax-1',
    title: overrides.title || 'Senior Gameplay Engineer',
    description: overrides.description || 'Lead implementation of player controls and combat loops.',
    experienceLevel: overrides.experienceLevel || ProjectRoleExperienceLevel.SENIOR,
    commitment: overrides.commitment || ProjectRoleCommitment.FULL_TIME,
    status: overrides.status || ProjectRoleStatus.OPEN,
    assignedMemberId: overrides.assignedMemberId || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: {
      id: overrides.roleId || 'role-tax-1',
      name: overrides.roleName || 'Gameplay Programmer',
    },
    requiredSkills: overrides.requiredSkills || [],
    requiredTools: overrides.requiredTools || [],
  };
};

export const createTestProjectMember = (projectId: string, userId: string, overrides: any = {}) => {
  const id = overrides.id || `member-uuid-${Math.random().toString(36).substring(2, 9)}`;
  return {
    id,
    projectId,
    userId,
    role: overrides.role || 'Gameplay Programmer',
    projectRoleId: overrides.projectRoleId || null,
    status: overrides.status || ProjectMemberStatus.ACTIVE,
    joinedAt: new Date(),
    leftAt: null,
    updatedAt: new Date(),
    user: {
      id: userId,
      username: overrides.username || 'team_member',
      profile: {
        displayName: overrides.displayName || 'Team Member',
        firstName: 'Team',
        lastName: 'Member',
        avatarUrl: null,
        headline: 'Senior Programmer',
      },
    },
    projectRole: overrides.projectRole || null,
    assignedRoles: overrides.assignedRoles || [],
  };
};
