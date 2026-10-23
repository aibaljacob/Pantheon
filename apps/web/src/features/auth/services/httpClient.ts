import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function setApiAuthorizationHeader(token: string | null): void {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
}

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage = 'An unexpected error occurred.',
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string') {
        return message;
      }
      if (Array.isArray(message)) {
        return message
          .filter((item): item is string => typeof item === 'string')
          .join(', ');
      }
    }
    if (error.response?.statusText) {
      return `Server error: ${error.response.status} ${error.response.statusText}`;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}