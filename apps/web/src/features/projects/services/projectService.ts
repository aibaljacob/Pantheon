import type { DashboardProjectsResponse } from '../types';
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
