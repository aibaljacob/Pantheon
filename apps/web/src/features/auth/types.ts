export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  email: string;
  avatar: string;
  avatarUrl?: string | null;
  provider?: 'LOCAL' | 'GOOGLE';
  providerId?: string | null;
  emailVerified?: boolean;
  role: 'User' | 'Administrator';
  isFounder: boolean;
  profileCompletion: number;
  portfolioCompletion: number;
  skills: string[];
  createdAt: string;
  projectsCount?: number;
  unreadNotifications?: number;
  unreadMessages?: number;
  refreshTokenVersion?: number;
}

export interface AuthServerUser {
  id: string;
  username: string;
  email: string;
  provider: 'LOCAL' | 'GOOGLE';
  emailVerified: boolean;
  role: 'USER' | 'ADMINISTRATOR';
  createdAt: string;
}

export interface AuthServerProfile {
  firstName: string;
  lastName: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  timezone?: string | null;
  experienceYears?: number | null;
}

export interface AuthLoginInput {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthRegisterInput {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string | null;
  tokenType: 'Bearer';
  expiresAt?: string | null;
}

export interface AuthServerSession {
  user: AuthServerUser;
  profile: AuthServerProfile;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresAt: string;
}

export interface AuthServerCurrentUser {
  user: AuthServerUser;
  profile: AuthServerProfile | null;
}

export interface AuthRegistrationResult {
  user: AuthServerUser;
  profile: AuthServerProfile;
  emailVerificationSent: boolean;
}

export interface AuthGenericResult {
  verified?: true;
  verificationSent?: boolean;
  emailSent?: boolean;
  passwordReset?: true;
  loggedOut?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AuthStateSnapshot {
  currentUser: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  rememberMe: boolean;
}

export interface AuthSessionBootstrapInput {
  accessToken: string;
  refreshToken?: string | null;
  rememberMe?: boolean;
}