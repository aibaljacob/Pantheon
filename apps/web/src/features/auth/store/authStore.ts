import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthLoginInput, AuthRegisterInput, AuthSession, AuthSessionBootstrapInput, AuthStateSnapshot, AuthUser } from '../types';
import { login, logout, me, register, setAuthToken } from '../services/authService';

interface AuthStoreState extends AuthStateSnapshot {
  hasHydrated: boolean;
  isRestoringSession: boolean;
  isAuthenticating: boolean;
  error: string | null;
  initializeSession: (sessionTokens?: AuthSessionBootstrapInput) => Promise<AuthUser | null>;
  registerWithCredentials: (input: AuthRegisterInput) => Promise<AuthUser>;
  loginWithCredentials: (input: AuthLoginInput) => Promise<AuthUser>;
  logoutSession: () => Promise<void>;
  clearError: () => void;
  setSession: (session: AuthSession, rememberMe: boolean) => void;
  clearSession: () => void;
  setHydrated: () => void;
}

function persistSnapshot(state: AuthStoreState): AuthStateSnapshot {
  return {
    currentUser: state.currentUser,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    rememberMe: state.rememberMe,
  };
}

let inFlightInitializationPromise: Promise<AuthUser | null> | null = null;

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      accessToken: null,
      refreshToken: null,
      rememberMe: false,
      hasHydrated: false,
      isRestoringSession: false,
      isAuthenticating: false,
      error: null,

      setHydrated: () => {
        set({ hasHydrated: true });
      },

      clearError: () => {
        set({ error: null });
      },

      setSession: (session, rememberMe) => {
        setAuthToken(session.accessToken);
        set({
          currentUser: session.user,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken ?? null,
          rememberMe,
          error: null,
        });
      },

      clearSession: () => {
        setAuthToken(null);
        set({
          currentUser: null,
          accessToken: null,
          refreshToken: null,
          rememberMe: false,
          error: null,
        });
      },

      initializeSession: async (sessionTokens) => {
        if (sessionTokens) {
          setAuthToken(sessionTokens.accessToken);
          set({
            currentUser: null,
            accessToken: sessionTokens.accessToken,
            refreshToken: sessionTokens.refreshToken ?? null,
            rememberMe: sessionTokens.rememberMe ?? false,
          });
          inFlightInitializationPromise = null;
        }

        if (inFlightInitializationPromise) {
          return inFlightInitializationPromise;
        }

        const { accessToken, currentUser } = get();

        if (!accessToken) {
          set({ isRestoringSession: false });
          return null;
        }

        if (currentUser) {
          setAuthToken(accessToken);
        }

        set({ isRestoringSession: true, error: null });

        inFlightInitializationPromise = (async () => {
          try {
            const response = await me(accessToken);
            set({ currentUser: response.data, isRestoringSession: false, error: null });
            return response.data;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to restore session.';
            get().clearSession();
            set({ isRestoringSession: false, error: message });
            return null;
          } finally {
            inFlightInitializationPromise = null;
          }
        })();

        return inFlightInitializationPromise;
      },

      registerWithCredentials: async (input) => {
        set({ isAuthenticating: true, error: null });

        try {
          const response = await register(input);
          set({ isAuthenticating: false });
          return response.data;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed.';
          set({ isAuthenticating: false, error: message });
          throw new Error(message);
        }
      },

      loginWithCredentials: async (input) => {
        set({ isAuthenticating: true, error: null });

        try {
          const response = await login(input);
          const session = response.data;
          get().setSession(session, input.rememberMe);
          set({ isAuthenticating: false });
          return session.user;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed.';
          set({ isAuthenticating: false, error: message });
          throw new Error(message);
        }
      },

      logoutSession: async () => {
        const { accessToken } = get();
        set({ isAuthenticating: true, error: null });

        try {
          await logout(accessToken);
        } finally {
          get().clearSession();
          set({ isAuthenticating: false });
        }
      },
    }),
    {
      name: 'pantheon-auth-session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => persistSnapshot(state),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export type AuthStore = typeof useAuthStore;