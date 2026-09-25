import { create } from 'zustand';
import type { PlaytestSession } from '../services/playtestService';

interface PlaytestStoreState {
  activeSession: PlaytestSession | null;
  activeProjectId: string | null;
  buildVersion: string | null;
  setActiveSession: (session: PlaytestSession | null, projectId: string | null, buildVersion: string | null) => void;
  clearSession: () => void;
}

export const usePlaytestStore = create<PlaytestStoreState>((set) => ({
  activeSession: null,
  activeProjectId: null,
  buildVersion: null,
  setActiveSession: (session, projectId, buildVersion) => set({ activeSession: session, activeProjectId: projectId, buildVersion }),
  clearSession: () => set({ activeSession: null, activeProjectId: null, buildVersion: null }),
}));
