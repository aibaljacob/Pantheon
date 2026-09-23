import type {
  BuildJobItem,
  BuildPlatform,
  BuildStatus,
  CreateBuildInput,
  CreatePlayableBuildInput,
  PlayableBuildItem,
} from '../types';
import { useAuthStore } from '../../auth/store/authStore';

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

export interface BuildFilters {
  status?: BuildStatus;
  platform?: BuildPlatform;
  milestoneId?: string;
}

export async function fetchProjectBuilds(
  projectId: string,
  filters?: BuildFilters,
  accessToken?: string | null,
): Promise<BuildJobItem[]> {
  const url = new URL(`${getApiBaseUrl()}/projects/${projectId}/builds`);
  if (filters?.status) url.searchParams.set('status', filters.status);
  if (filters?.platform) url.searchParams.set('platform', filters.platform);
  if (filters?.milestoneId) url.searchParams.set('milestoneId', filters.milestoneId);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: buildHeaders(accessToken),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch project builds.');
  }

  return res.json();
}

export async function fetchProjectBuild(
  projectId: string,
  buildId: string,
  accessToken?: string | null,
): Promise<BuildJobItem> {
  const res = await fetch(`${getApiBaseUrl()}/projects/${projectId}/builds/${buildId}`, {
    method: 'GET',
    headers: buildHeaders(accessToken),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch build details.');
  }

  return res.json();
}

export async function createProjectBuild(
  projectId: string,
  input: CreateBuildInput,
  accessToken?: string | null,
): Promise<BuildJobItem> {
  const res = await fetch(`${getApiBaseUrl()}/projects/${projectId}/builds`, {
    method: 'POST',
    headers: buildHeaders(accessToken),
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to trigger build job.');
  }

  return res.json();
}

export async function cancelProjectBuild(
  projectId: string,
  buildId: string,
  accessToken?: string | null,
): Promise<BuildJobItem> {
  const res = await fetch(`${getApiBaseUrl()}/projects/${projectId}/builds/${buildId}/cancel`, {
    method: 'POST',
    headers: buildHeaders(accessToken),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to cancel build.');
  }

  return res.json();
}

export async function fetchBuildLogs(
  projectId: string,
  buildId: string,
  accessToken?: string | null,
): Promise<{ buildId: string; status: BuildStatus; buildLogs: string }> {
  const res = await fetch(`${getApiBaseUrl()}/projects/${projectId}/builds/${buildId}/logs`, {
    method: 'GET',
    headers: buildHeaders(accessToken),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch build logs.');
  }

  return res.json();
}

export async function fetchPlayableBuilds(
  projectId: string,
  accessToken?: string | null,
): Promise<PlayableBuildItem[]> {
  const res = await fetch(`${getApiBaseUrl()}/projects/${projectId}/playable-builds`, {
    method: 'GET',
    headers: buildHeaders(accessToken),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch playable builds.');
  }

  return res.json();
}

export async function fetchPlayableBuild(
  projectId: string,
  buildId: string,
  accessToken?: string | null,
): Promise<PlayableBuildItem> {
  const res = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/playable-builds/${buildId}`,
    {
      method: 'GET',
      headers: buildHeaders(accessToken),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch playable build details.');
  }

  return res.json();
}

export async function createPlayableBuild(
  projectId: string,
  input: CreatePlayableBuildInput,
  accessToken?: string | null,
): Promise<PlayableBuildItem> {
  const res = await fetch(`${getApiBaseUrl()}/projects/${projectId}/playable-builds`, {
    method: 'POST',
    headers: buildHeaders(accessToken),
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to register playable build.');
  }

  return res.json();
}

export const buildService = {
  getBuilds: fetchProjectBuilds,
  getBuild: fetchProjectBuild,
  createBuild: createProjectBuild,
  cancelBuild: cancelProjectBuild,
  getBuildLogs: fetchBuildLogs,
  getPlayableBuilds: fetchPlayableBuilds,
  getPlayableBuild: fetchPlayableBuild,
  createPlayableBuild: createPlayableBuild,
};
