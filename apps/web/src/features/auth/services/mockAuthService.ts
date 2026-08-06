import { createAvatarDataUrl } from '../utils/avatar';
import { getMockUsersStorageKey, readStoredUsers, writeStoredUsers } from '../utils/authStorage';
import type { ApiResponse, AuthGenericResult, AuthLoginInput, AuthRegisterInput, AuthRegistrationResult, AuthServerCurrentUser, AuthServerSession, AuthUser } from '../types';
interface StoredUserRecord extends AuthUser {
  password: string;
  emailVerified?: boolean;
}
const USERS_KEY = getMockUsersStorageKey();
function createMockToken(userId: string): string {
  return `mock-access.${userId}.${crypto.randomUUID()}`;
}
function createRefreshToken(userId: string): string {
  return `mock-refresh.${userId}.${crypto.randomUUID()}`;
}
function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
function getStoredUsers(): StoredUserRecord[] {
  return readStoredUsers<StoredUserRecord>(USERS_KEY);
}
function saveUsers(users: StoredUserRecord[]): void {
  writeStoredUsers(USERS_KEY, users);
}
function toPublicUser(user: StoredUserRecord): AuthUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...publicUser } = user;
  return publicUser;
}
function buildSession(user: StoredUserRecord, rememberMe: boolean): AuthServerSession {
  const accessToken = createMockToken(user.id);
  const refreshToken = createRefreshToken(user.id);
  const expiresAt = new Date(Date.now() + (rememberMe ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 24)).toISOString();
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      provider: 'LOCAL',
      emailVerified: user.emailVerified !== false,
      role: 'USER',
      createdAt: user.createdAt,
    },
    profile: {
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.fullName,
      avatarUrl: user.avatarUrl ?? null,
    },
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresAt,
  };
}
function findUserByEmail(email: string): StoredUserRecord | undefined {
  const users = getStoredUsers();
  return users.find((user) => user.email === normalizeEmail(email));
}
function findUserByToken(token: string): StoredUserRecord | undefined {
  const tokenParts = token.split('.');
  if (tokenParts.length < 3) {
    return undefined;
  }
  const userId = tokenParts[1];
  const users = getStoredUsers();
  return users.find((user) => user.id === userId);
}
export async function registerWithMockAuth(input: AuthRegisterInput): Promise<ApiResponse<AuthRegistrationResult>> {
  await delay(650);
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedUsername = input.username.trim().toLowerCase();
  const users = getStoredUsers();
  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error('An account with this email already exists.');
  }
  if (users.some((user) => user.username === normalizedUsername)) {
    throw new Error('That username is already taken.');
  }
  const now = new Date().toISOString();
  const storedUser: StoredUserRecord = {
    id: crypto.randomUUID(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    fullName: `${input.firstName.trim()} ${input.lastName.trim()}`,
    username: normalizedUsername,
    email: normalizedEmail,
    avatar: createAvatarDataUrl(input.firstName.trim(), input.lastName.trim()),
    role: 'User',
    isFounder: false,
    profileCompletion: 30,
    portfolioCompletion: 0,
    skills: [],
    createdAt: now,
    projectsCount: 0,
    unreadNotifications: 0,
    unreadMessages: 0,
    password: input.password,
    emailVerified: false,
  };
  users.unshift(storedUser);
  saveUsers(users);
  return {
    success: true,
    data: {
      user: {
        id: storedUser.id,
        username: storedUser.username,
        email: storedUser.email,
        provider: 'LOCAL',
        emailVerified: false,
        role: 'USER',
        createdAt: storedUser.createdAt,
      },
      profile: {
        firstName: storedUser.firstName,
        lastName: storedUser.lastName,
        displayName: storedUser.fullName,
        avatarUrl: storedUser.avatarUrl ?? null,
      },
      emailVerificationSent: true,
    },
    message: 'Registration successful. Please verify your email address before signing in.',
  };
}
export async function loginWithMockAuth(input: AuthLoginInput): Promise<ApiResponse<AuthServerSession>> {
  await delay(500);
  const storedUser = findUserByEmail(input.email);
  if (!storedUser || storedUser.password !== input.password) {
    throw new Error('Invalid email or password.');
  }
  if (storedUser.emailVerified === false) {
    throw new Error('Email address must be verified before signing in.');
  }
  return {
    success: true,
    data: buildSession(storedUser, input.rememberMe),
    message: 'Login successful.',
  };
}
export async function getCurrentUserWithMockAuth(accessToken: string): Promise<ApiResponse<AuthServerCurrentUser>> {
  await delay(250);
  const storedUser = findUserByToken(accessToken);
  if (!storedUser) {
    throw new Error('Session expired. Please sign in again.');
  }
  return {
    success: true,
    data: {
      user: {
        id: storedUser.id,
        username: storedUser.username,
        email: storedUser.email,
        provider: 'LOCAL',
        emailVerified: storedUser.emailVerified !== false,
        role: 'USER',
        createdAt: storedUser.createdAt,
      },
      profile: {
        firstName: storedUser.firstName,
        lastName: storedUser.lastName,
        displayName: storedUser.fullName,
        avatarUrl: storedUser.avatarUrl ?? null,
      },
    },
    message: 'Current user loaded.',
  };
}
export async function logoutWithMockAuth(): Promise<ApiResponse<{ loggedOut: boolean }>> {
  await delay(150);
  return {
    success: true,
    data: { loggedOut: true },
    message: 'Logged out successfully.',
  };
}
export async function resendVerificationWithMockAuth(): Promise<ApiResponse<AuthGenericResult>> {
  await delay(150);
  return {
    success: true,
    data: { verificationSent: true },
    message: 'Verification email sent.',
  };
}
export async function forgotPasswordWithMockAuth(): Promise<ApiResponse<AuthGenericResult>> {
  await delay(150);
  return {
    success: true,
    data: { emailSent: true },
    message: 'Password reset email sent.',
  };
}
export async function resetPasswordWithMockAuth(): Promise<ApiResponse<AuthGenericResult>> {
  await delay(150);
  return {
    success: true,
    data: { passwordReset: true },
    message: 'Password reset successfully.',
  };
}
export async function verifyEmailWithMockAuth(): Promise<ApiResponse<AuthGenericResult>> {
  await delay(150);
  return {
    success: true,
    data: { verified: true },
    message: 'Email verified successfully.',
  };
}
export async function checkUsernameWithMockAuth(username: string): Promise<ApiResponse<{ available: boolean; username: string }>> {
  await delay(200);
  const users = getStoredUsers();
  const normalized = username.trim().toLowerCase();
  const available = !users.some((user) => user.username === normalized);
  return {
    success: true,
    data: { available, username: normalized },
    message: available ? 'Username is available.' : 'That username is already taken.',
  };
}
export async function checkEmailWithMockAuth(email: string): Promise<ApiResponse<{ available: boolean; email: string }>> {
  await delay(200);
  const users = getStoredUsers();
  const normalized = normalizeEmail(email);
  const available = !users.some((user) => user.email === normalized);
  return {
    success: true,
    data: { available, email: normalized },
    message: available ? 'Email is available.' : 'An account with this email already exists.',
  };
}
export async function validateSessionToken(token: string): Promise<AuthUser> {
  const storedUser = findUserByToken(token);
  if (!storedUser) {
    throw new Error('Session expired. Please sign in again.');
  }
  return toPublicUser(storedUser);
}