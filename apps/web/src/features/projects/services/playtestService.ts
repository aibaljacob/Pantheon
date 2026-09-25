import { useAuthStore } from '../../auth/store/authStore';

export interface PlaytestSession {
  id: string;
  playableBuildId: string;
  testerId: string | null;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
}

export interface PlaytestFeedback {
  id: string;
  playtestSessionId: string;
  projectId: string;
  authorId: string;
  title: string;
  description: string;
  type: 'BUG' | 'SUGGESTION' | 'GENERAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
  status: 'OPEN' | 'CONVERTED_TO_TASK' | 'RESOLVED' | 'DISMISSED';
  taskId: string | null;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    username: string;
  };
  playtestSession?: {
    playableBuild: {
      id: string;
      version: string;
      title: string;
    }
  };
  task?: {
    id: string;
    taskNumber: number;
    status: string;
  };
}

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
}

function buildHeaders(accessToken?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = accessToken ?? useAuthStore.getState().accessToken;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export const playtestService = {
  startSession: async (projectId: string, buildId: string): Promise<PlaytestSession> => {
    const res = await fetch(`${getApiBaseUrl()}/projects/${projectId}/playable-builds/${buildId}/playtest-sessions`, {
      method: 'POST',
      headers: buildHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  endSession: async (projectId: string, sessionId: string): Promise<PlaytestSession> => {
    const res = await fetch(`${getApiBaseUrl()}/projects/${projectId}/playtest-sessions/${sessionId}/end`, {
      method: 'PUT',
      headers: buildHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  submitFeedback: async (
    projectId: string,
    sessionId: string,
    data: { title: string; description: string; type?: string; severity?: string }
  ): Promise<PlaytestFeedback> => {
    const res = await fetch(`${getApiBaseUrl()}/projects/${projectId}/playtest-sessions/${sessionId}/feedback`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errText = await res.text();
      let msg = errText;
      try { msg = JSON.parse(errText).message || errText; } catch {}
      throw new Error(msg);
    }
    return res.json();
  },

  getFeedback: async (projectId: string): Promise<PlaytestFeedback[]> => {
    const res = await fetch(`${getApiBaseUrl()}/projects/${projectId}/feedback`, {
      headers: buildHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  convertToTask: async (
    projectId: string,
    feedbackId: string,
    data?: { assigneeId?: string; milestoneId?: string }
  ): Promise<PlaytestFeedback> => {
    const res = await fetch(`${getApiBaseUrl()}/projects/${projectId}/feedback/${feedbackId}/convert-to-task`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) {
      const errText = await res.text();
      let msg = errText;
      try { msg = JSON.parse(errText).message || errText; } catch {}
      throw new Error(msg);
    }
    return res.json();
  }
};
