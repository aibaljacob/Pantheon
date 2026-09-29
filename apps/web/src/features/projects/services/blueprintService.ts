import type { GameBlueprint, UpsertGameBlueprintInput } from '../types';

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
}

export async function fetchGameBlueprint(
  projectId: string,
  token?: string,
): Promise<GameBlueprint | null> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/blueprint`,
    {
      method: 'GET',
      headers,
    },
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch game blueprint.');
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text || !text.trim() || text.trim() === 'null') {
    return null;
  }

  try {
    return JSON.parse(text) as GameBlueprint;
  } catch {
    return null;
  }
}

export async function upsertGameBlueprint(
  projectId: string,
  payload: UpsertGameBlueprintInput,
  token: string,
): Promise<GameBlueprint> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/blueprint`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to save game blueprint.');
  }

  const text = await response.text();
  if (!text || !text.trim() || text.trim() === 'null') {
    throw new Error('Unexpected empty response while saving blueprint.');
  }

  return JSON.parse(text) as GameBlueprint;
}
