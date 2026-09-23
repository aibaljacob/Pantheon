import { Role, AuthProvider } from '@prisma/client';

export interface TestUserOptions {
  id?: string;
  username?: string;
  email?: string;
  role?: Role;
  provider?: AuthProvider;
  emailVerified?: boolean;
  refreshTokenVersion?: number;
  profile?: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    headline?: string;
    bio?: string;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
  };
}

export const createTestUser = (options: TestUserOptions = {}) => {
  const id = options.id || `user-uuid-${Math.random().toString(36).substring(2, 9)}`;
  const username = options.username || `testuser_${Math.random().toString(36).substring(2, 7)}`;
  const email = options.email || `${username}@example.com`;

  return {
    id,
    username,
    email,
    passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
    role: options.role || Role.USER,
    provider: options.provider || AuthProvider.LOCAL,
    providerId: null,
    emailVerified: options.emailVerified ?? true,
    refreshTokenVersion: options.refreshTokenVersion || 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: options.profile
      ? {
          id: `profile-uuid-${id}`,
          userId: id,
          firstName: options.profile.firstName || 'Test',
          lastName: options.profile.lastName || 'User',
          displayName: options.profile.displayName || `${options.profile.firstName || 'Test'} ${options.profile.lastName || 'User'}`,
          headline: options.profile.headline || 'Game Developer',
          bio: options.profile.bio || 'Indie game developer passionate about graphics.',
          avatarUrl: options.profile.avatarUrl ?? null,
          bannerUrl: options.profile.bannerUrl ?? null,
          location: 'San Francisco, CA',
          timezone: 'America/Los_Angeles',
          experienceYears: 4,
          availability: 'Available for collaboration',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      : null,
  };
};
