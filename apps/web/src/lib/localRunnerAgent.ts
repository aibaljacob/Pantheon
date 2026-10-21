/**
 * Pantheon Local Runner Agent Service
 *
 * Secure client communicating exclusively with http://127.0.0.1:35414.
 * Never transmits local agent credentials to the Pantheon backend.
 */

export const LOCAL_AGENT_STORAGE_KEY = 'pantheon_local_agent_token';
export const LOCAL_AGENT_ENDPOINT = 'http://127.0.0.1:35414';

export interface LocalAgentStatusResponse {
  agent: 'online';
  runner: 'running' | 'stopped';
}

export interface LocalAgentActionResponse {
  agent: 'online';
  runner: 'starting' | 'running' | 'stopped';
  message: string;
  alreadyRunning?: boolean;
  alreadyStopped?: boolean;
}

export class LocalAgentConnectionError extends Error {
  constructor(message = 'Local runner agent is not running. Please start the Pantheon Local Runner Agent.') {
    super(message);
    this.name = 'LocalAgentConnectionError';
  }
}

export class LocalAgentAuthError extends Error {
  constructor(message = 'Unauthorized: Invalid or missing local agent token. Please configure token in settings.') {
    super(message);
    this.name = 'LocalAgentAuthError';
  }
}

export function getLocalAgentToken(): string | null {
  try {
    return localStorage.getItem(LOCAL_AGENT_STORAGE_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

export function setLocalAgentToken(token: string): void {
  try {
    localStorage.setItem(LOCAL_AGENT_STORAGE_KEY, token.trim());
  } catch (err) {
    console.error('Failed to store local agent token:', err);
  }
}

export function clearLocalAgentToken(): void {
  try {
    localStorage.removeItem(LOCAL_AGENT_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to remove local agent token:', err);
  }
}

async function requestLocalAgent<T>(
  path: string,
  method: 'GET' | 'POST' = 'GET',
  overrideToken?: string | null,
): Promise<T> {
  const token = overrideToken !== undefined ? overrideToken : getLocalAgentToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${LOCAL_AGENT_ENDPOINT}${path}`, {
      method,
      headers,
    });
  } catch {
    throw new LocalAgentConnectionError();
  }

  if (response.status === 401) {
    throw new LocalAgentAuthError();
  }

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new Error(errorData.error || errorData.message || `Local agent error (${response.status})`);
  }

  return (await response.json()) as T;
}

export async function getLocalAgentStatus(token?: string | null): Promise<LocalAgentStatusResponse> {
  return requestLocalAgent<LocalAgentStatusResponse>('/status', 'GET', token);
}

export async function startLocalRunner(token?: string | null): Promise<LocalAgentActionResponse> {
  return requestLocalAgent<LocalAgentActionResponse>('/start', 'POST', token);
}

export async function stopLocalRunner(token?: string | null): Promise<LocalAgentActionResponse> {
  return requestLocalAgent<LocalAgentActionResponse>('/stop', 'POST', token);
}

export const localRunnerAgent = {
  getToken: getLocalAgentToken,
  setToken: setLocalAgentToken,
  clearToken: clearLocalAgentToken,
  getStatus: getLocalAgentStatus,
  startRunner: startLocalRunner,
  stopRunner: stopLocalRunner,
};
