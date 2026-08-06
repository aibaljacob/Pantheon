import { apiClient } from './httpClient';
import type { ApiResponse, AuthLoginInput, AuthRegisterInput, AuthRegistrationResult, AuthServerCurrentUser, AuthServerSession } from '../types';
export async function registerWithHttpAuth(input: AuthRegisterInput): Promise<ApiResponse<AuthRegistrationResult>> {
  const response = await apiClient.post<ApiResponse<AuthRegistrationResult>>('/auth/register', input);
  return response.data;
}
export async function loginWithHttpAuth(input: AuthLoginInput): Promise<ApiResponse<AuthServerSession>> {
  const response = await apiClient.post<ApiResponse<AuthServerSession>>('/auth/login', input);
  return response.data;
}
export async function getCurrentUserWithHttpAuth(): Promise<ApiResponse<AuthServerCurrentUser>> {
  const response = await apiClient.get<ApiResponse<AuthServerCurrentUser>>('/auth/me');
  return response.data;
}
export async function logoutWithHttpAuth(): Promise<ApiResponse<{ loggedOut: boolean }>> {
  const response = await apiClient.post<ApiResponse<{ loggedOut: boolean }>>('/auth/logout');
  return response.data;
}
export async function checkUsernameWithHttpAuth(username: string): Promise<ApiResponse<{ available: boolean; username: string }>> {
  const response = await apiClient.get<ApiResponse<{ available: boolean; username: string }>>('/auth/check-username', {
    params: { username },
  });
  return response.data;
}
export async function checkEmailWithHttpAuth(email: string): Promise<ApiResponse<{ available: boolean; email: string }>> {
  const response = await apiClient.get<ApiResponse<{ available: boolean; email: string }>>('/auth/check-email', {
    params: { email },
  });
  return response.data;
}
