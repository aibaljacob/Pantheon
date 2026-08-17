import type { CreateProjectInput, DashboardProjectItem, DashboardProjectsResponse } from '../types';
import { formatApiAssetUrl } from '../../profile/services/profileService';

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
}

export async function fetchUserDashboardProjects(
  accessToken: string,
): Promise<DashboardProjectsResponse> {
  const response = await fetch(`${getApiBaseUrl()}/projects/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch active dashboard projects.');
  }

  const data: DashboardProjectsResponse = await response.json();

  const formattedProjects = (data.projects || []).map((p) => ({
    ...p,
    coverUrl: formatApiAssetUrl(p.coverUrl),
  }));

  return {
    projects: formattedProjects,
  };
}

export async function createProject(
  accessToken: string,
  payload: CreateProjectInput,
): Promise<DashboardProjectItem> {
  const response = await fetch(`${getApiBaseUrl()}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create project.');
  }

  const project: DashboardProjectItem = await response.json();
  return {
    ...project,
    coverUrl: formatApiAssetUrl(project.coverUrl),
  };
}

export async function fetchPublicProjects(
  search?: string,
): Promise<DashboardProjectsResponse> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const response = await fetch(`${getApiBaseUrl()}/projects/public${query}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch public projects.');
  }

  const data: DashboardProjectsResponse = await response.json();

  const formattedProjects = (data.projects || []).map((p) => ({
    ...p,
    coverUrl: formatApiAssetUrl(p.coverUrl),
  }));

  return {
    projects: formattedProjects,
  };
}
