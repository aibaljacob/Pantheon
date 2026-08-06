import type { ApiResponse, AuthGenericResult, AuthLoginInput, AuthRegisterInput, AuthRegistrationResult, AuthServerCurrentUser, AuthServerSession, AuthSession, AuthUser } from '../types';
import { checkEmailWithHttpAuth, checkUsernameWithHttpAuth, getCurrentUserWithHttpAuth, loginWithHttpAuth, logoutWithHttpAuth, registerWithHttpAuth } from './httpAuthService';
import { checkEmailWithMockAuth, checkUsernameWithMockAuth, forgotPasswordWithMockAuth, getCurrentUserWithMockAuth, loginWithMockAuth, logoutWithMockAuth, registerWithMockAuth, resendVerificationWithMockAuth, resetPasswordWithMockAuth, verifyEmailWithMockAuth } from './mockAuthService';
import { setApiAuthorizationHeader } from './httpClient';
import { mapServerCurrentUserToAuthUser, mapServerSessionToAuthSession, mapServerUserToAuthUser } from '../utils/authMappers';
const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === 'true';
export async function checkUsernameAvailability(username: string): Promise<ApiResponse<{ available: boolean; username: string }>> {
  if (useMockAuth) {
    return checkUsernameWithMockAuth(username);
  }
  return checkUsernameWithHttpAuth(username);
}
export async function checkEmailAvailability(email: string): Promise<ApiResponse<{ available: boolean; email: string }>> {
  if (useMockAuth) {
    return checkEmailWithMockAuth(email);
  }
  return checkEmailWithHttpAuth(email);
}
export async function register(input: AuthRegisterInput): Promise<ApiResponse<AuthUser>> {
  const response: ApiResponse<AuthRegistrationResult> = useMockAuth ? await registerWithMockAuth(input) : await registerWithHttpAuth(input);
  return {
    success: response.success,
    data: mapServerUserToAuthUser(response.data.user, response.data.profile),
    message: response.message,
  };
}
export async function login(input: AuthLoginInput): Promise<ApiResponse<AuthSession>> {
  const response: ApiResponse<AuthServerSession> = useMockAuth ? await loginWithMockAuth(input) : await loginWithHttpAuth(input);
  return {
    success: response.success,
    data: mapServerSessionToAuthSession(response.data),
    message: response.message,
  };
}
export async function me(accessToken: string | null): Promise<ApiResponse<AuthUser>> {
  if (!accessToken) {
    throw new Error('No active session found.');
  }
  if (useMockAuth) {
    const response = await getCurrentUserWithMockAuth(accessToken);
    return {
      success: response.success,
      data: mapServerCurrentUserToAuthUser(response.data),
      message: response.message,
    };
  }
  setApiAuthorizationHeader(accessToken);
  const response: ApiResponse<AuthServerCurrentUser> = await getCurrentUserWithHttpAuth();
  return {
    success: response.success,
    data: mapServerCurrentUserToAuthUser(response.data),
    message: response.message,
  };
}
export async function logout(accessToken: string | null): Promise<ApiResponse<{ loggedOut: boolean }>> {
  if (!accessToken) {
    return {
      success: true,
      data: { loggedOut: true },
      message: 'Logged out successfully.',
    };
  }
  if (useMockAuth) {
    return logoutWithMockAuth();
  }
  return logoutWithHttpAuth();
}
export async function resendVerification(email: string): Promise<ApiResponse<AuthGenericResult>> {
  if (useMockAuth) {
    return resendVerificationWithMockAuth();
  }
  return postJson<AuthGenericResult>('/auth/resend-verification', { email });
}
export async function forgotPassword(email: string): Promise<ApiResponse<AuthGenericResult>> {
  if (useMockAuth) {
    return forgotPasswordWithMockAuth();
  }
  return postJson<AuthGenericResult>('/auth/forgot-password', { email });
}
export async function resetPassword(payload: { token: string; password: string; confirmPassword: string }): Promise<ApiResponse<AuthGenericResult>> {
  if (useMockAuth) {
    return resetPasswordWithMockAuth();
  }
  return postJson<AuthGenericResult>('/auth/reset-password', payload);
}
export async function verifyEmail(token: string): Promise<ApiResponse<AuthGenericResult>> {
  if (useMockAuth) {
    return verifyEmailWithMockAuth();
  }
  const response = await fetch(`${getApiBaseUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Unable to verify email.');
  }
  return response.json() as Promise<ApiResponse<AuthGenericResult>>;
}
export function setAuthToken(token: string | null): void {
  if (useMockAuth) {
    return;
  }
  setApiAuthorizationHeader(token);
}
function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
}
async function postJson<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error('Request failed.');
  }
  return response.json() as Promise<ApiResponse<T>>;
}