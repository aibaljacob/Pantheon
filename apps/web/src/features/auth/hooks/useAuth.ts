import { useAuthStore } from '../store/authStore';

export function useAuth() {
  return useAuthStore((state) => ({
    currentUser: state.currentUser,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    rememberMe: state.rememberMe,
    hasHydrated: state.hasHydrated,
    isRestoringSession: state.isRestoringSession,
    isAuthenticating: state.isAuthenticating,
    error: state.error,
    initializeSession: state.initializeSession,
    registerWithCredentials: state.registerWithCredentials,
    loginWithCredentials: state.loginWithCredentials,
    logoutSession: state.logoutSession,
    clearError: state.clearError,
  }));
}