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

export async function generateVisualDirection(
  projectId: string,
  token: string,
): Promise<import('../types').VisualDirection> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/blueprint/visual-direction/generate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to generate visual direction.');
  }

  return response.json();
}

export async function proposeGameplayLoop(
  projectId: string,
  token: string,
): Promise<import('../types').GameplayLoopData> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/blueprint/gameplay-loop/propose`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to propose gameplay loop.');
  }

  return response.json();
}

export async function generateProductionPlan(
  projectId: string,
  token: string,
): Promise<import('../types').ProductionPlanDraft> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/blueprint/production-plan/generate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to generate production plan.');
  }

  return response.json();
}

export async function approveProductionPlan(
  projectId: string,
  payload: import('../types').ApproveProductionPlanInput,
  token: string,
): Promise<import('../types').ApproveProductionPlanResult> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/blueprint/production-plan/approve`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to approve production plan.');
  }

  return response.json();
}

export async function fetchSkillCoverage(
  projectId: string,
  token?: string,
): Promise<import('../types').SkillCoverageData> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/blueprint/skill-coverage`,
    {
      method: 'GET',
      headers,
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch skill coverage.');
  }

  return response.json();
}

export async function fetchNarrative(
  projectId: string,
  token?: string,
): Promise<import('../types').NarrativeData | null> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/blueprint/narrative`,
    {
      method: 'GET',
      headers,
    },
  );

  if (!response.ok) {
    if (response.status === 404) return null;
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch narrative.');
  }

  const text = await response.text();
  if (!text || !text.trim() || text.trim() === 'null') {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function saveNarrative(
  projectId: string,
  narrative: import('../types').NarrativeData,
  token: string,
): Promise<import('../types').NarrativeData> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/blueprint/narrative`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ narrative }),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to save narrative.');
  }

  return response.json();
}

export async function aiProposeNarrative(
  projectId: string,
  section: 'STORY_BIBLE' | 'CHARACTERS' | 'SCENE' | 'QUEST',
  prompt?: string,
  context?: Record<string, any>,
  token?: string,
): Promise<import('../types').NarrativeAiProposal> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/blueprint/narrative/ai-propose`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ section, prompt, context }),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to request AI narrative proposal.');
  }

  return response.json();
}
