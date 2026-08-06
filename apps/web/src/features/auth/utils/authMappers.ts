import type { AuthServerCurrentUser, AuthServerProfile, AuthServerSession, AuthServerUser, AuthSession, AuthUser } from '../types';
import { createAvatarDataUrl } from './avatar';

function buildDisplayName(firstName: string, lastName: string, fallback: string): string {
  const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
  return displayName || fallback;
}

export function mapServerUserToAuthUser(user: AuthServerUser, profile: AuthServerProfile | null): AuthUser {
  const firstName = profile?.firstName?.trim() || user.username.split('.')[0] || user.username;
  const lastName = profile?.lastName?.trim() || '';
  const fullName = profile?.displayName?.trim() || buildDisplayName(firstName, lastName, user.username);

  return {
    id: user.id,
    firstName,
    lastName,
    fullName,
    username: user.username,
    email: user.email,
    avatar: profile?.avatarUrl ?? createAvatarDataUrl(firstName, lastName),
    avatarUrl: profile?.avatarUrl ?? null,
    provider: user.provider,
    emailVerified: user.emailVerified,
    role: user.role === 'ADMINISTRATOR' ? 'Administrator' : 'User',
    isFounder: false,
    profileCompletion: profile ? 45 : 30,
    portfolioCompletion: 0,
    skills: [],
    createdAt: user.createdAt,
    projectsCount: 0,
    unreadNotifications: 0,
    unreadMessages: 0,
  };
}

export function mapServerSessionToAuthSession(session: AuthServerSession): AuthSession {
  return {
    user: mapServerUserToAuthUser(session.user, session.profile),
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    tokenType: session.tokenType,
    expiresAt: session.expiresAt,
  };
}

export function mapServerCurrentUserToAuthUser(currentUser: AuthServerCurrentUser): AuthUser {
  return mapServerUserToAuthUser(currentUser.user, currentUser.profile);
}
