import type { AuthStateSnapshot, AuthUser } from '../types';

const USERS_STORAGE_KEY = 'pantheon.mock-auth.users';

export function getMockUsersStorageKey(): string {
  return USERS_STORAGE_KEY;
}

export function readStoredUsers<T>(storageKey: string): T[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const rawValue = window.localStorage.getItem(storageKey);
  if (!rawValue) {
    return [];
  }

  try {
    return JSON.parse(rawValue) as T[];
  } catch {
    return [];
  }
}

export function writeStoredUsers<T>(storageKey: string, users: T[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(users));
}

export function deriveUserSnapshot(user: AuthUser | null, accessToken: string | null, refreshToken: string | null, rememberMe: boolean): AuthStateSnapshot {
  return {
    currentUser: user,
    accessToken,
    refreshToken,
    rememberMe,
  };
}