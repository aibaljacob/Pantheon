export interface AuthUserAccount {
  id: string;
  username: string;
  email: string;
  provider: 'LOCAL' | 'GOOGLE';
  emailVerified: boolean;
  role: 'USER' | 'ADMINISTRATOR';
  createdAt: string;
}

export interface AuthUserProfile {
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
  rememberMe?: boolean;
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

export interface AuthResendVerificationInput {
  email: string;
}

export interface AuthForgotPasswordInput {
  email: string;
}

export interface AuthResetPasswordInput {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface GoogleOAuthProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}

export interface AuthSession {
  user: AuthUserAccount;
  profile: AuthUserProfile;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresAt: string;
}

export interface AuthCurrentUser {
  user: AuthUserAccount;
  profile: AuthUserProfile | null;
}

export interface AuthRegistrationResult {
  user: AuthUserAccount;
  profile: AuthUserProfile;
  emailVerificationSent: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

