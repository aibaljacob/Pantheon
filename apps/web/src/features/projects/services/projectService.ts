import type {
  AiRoleRecommendationsResponse,
  CreateProjectInput,
  CreateProjectRoleInput,
  DashboardProjectItem,
  DashboardProjectsResponse,
  ProjectDetail,
  ProjectRoleItem,
  ProjectActiveTeamMember,
  ProjectTeamResponse,
  UpdateProjectInput,
  UpdateProjectRoleInput,
} from '../types';
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

export async function fetchProjectDetails(
  projectId: string,
  accessToken?: string | null,
): Promise<ProjectDetail> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${getApiBaseUrl()}/projects/${projectId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Project not found.');
  }

  const project: ProjectDetail = await response.json();
  return {
    ...project,
    coverUrl: formatApiAssetUrl(project.coverUrl),
    founder: {
      ...project.founder,
      avatarUrl: formatApiAssetUrl(project.founder.avatarUrl),
    },
    members: (project.members || []).map((m) => ({
      ...m,
      avatarUrl: formatApiAssetUrl(m.avatarUrl),
    })),
  };
}

export async function updateProject(
  accessToken: string,
  projectId: string,
  payload: UpdateProjectInput,
): Promise<ProjectDetail> {
  const response = await fetch(`${getApiBaseUrl()}/projects/${projectId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update project.');
  }

  const project: ProjectDetail = await response.json();
  return {
    ...project,
    coverUrl: formatApiAssetUrl(project.coverUrl),
    founder: {
      ...project.founder,
      avatarUrl: formatApiAssetUrl(project.founder.avatarUrl),
    },
    members: (project.members || []).map((m) => ({
      ...m,
      avatarUrl: formatApiAssetUrl(m.avatarUrl),
    })),
  };
}

export async function fetchProjectRoles(
  projectId: string,
  accessToken?: string | null,
): Promise<ProjectRoleItem[]> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${getApiBaseUrl()}/projects/${projectId}/roles`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch project roles.');
  }

  return response.json();
}

export async function createProjectRole(
  accessToken: string,
  projectId: string,
  payload: CreateProjectRoleInput,
): Promise<ProjectRoleItem> {
  const response = await fetch(`${getApiBaseUrl()}/projects/${projectId}/roles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create project role.');
  }

  return response.json();
}

export async function updateProjectRole(
  accessToken: string,
  projectId: string,
  roleId: string,
  payload: UpdateProjectRoleInput,
): Promise<ProjectRoleItem> {
  const response = await fetch(`${getApiBaseUrl()}/projects/${projectId}/roles/${roleId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update project role.');
  }

  return response.json();
}

export async function deleteProjectRole(
  accessToken: string,
  projectId: string,
  roleId: string,
): Promise<boolean> {
  const response = await fetch(`${getApiBaseUrl()}/projects/${projectId}/roles/${roleId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete project role.');
  }

  return true;
}

export async function fetchAiRoleRecommendations(
  projectId: string,
  accessToken: string,
): Promise<AiRoleRecommendationsResponse> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/roles/ai-recommendations`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || 'Failed to load AI role recommendations.',
    );
  }

  return response.json();
}

export async function rescanAiRoleRecommendations(
  projectId: string,
  accessToken: string,
): Promise<AiRoleRecommendationsResponse> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/roles/ai-recommendations`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || 'Failed to rescan AI role recommendations.',
    );
  }

  return response.json();
}

export async function fetchProjectTeam(
  projectId: string,
  accessToken?: string | null,
): Promise<ProjectTeamResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${getApiBaseUrl()}/projects/${projectId}/members`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch project team members.');
  }

  const data: ProjectTeamResponse = await response.json();

  return {
    activeMembers: (data.activeMembers || []).map((m) => ({
      ...m,
      avatarUrl: formatApiAssetUrl(m.avatarUrl),
    })),
    formerMembers: (data.formerMembers || []).map((m) => ({
      ...m,
      avatarUrl: formatApiAssetUrl(m.avatarUrl),
    })),
  };
}

export async function assignProjectMemberRoles(
  projectId: string,
  memberId: string,
  roleIds: string[],
  accessToken: string,
): Promise<ProjectActiveTeamMember> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/members/${memberId}/roles`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ roleIds }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update member role assignments.');
  }

  const data = await response.json();
  return {
    ...data,
    avatarUrl: formatApiAssetUrl(data.avatarUrl),
  };
}

export async function changeProjectMemberRole(
  projectId: string,
  memberId: string,
  projectRoleId: string | null,
  accessToken: string,
): Promise<ProjectActiveTeamMember> {
  return assignProjectMemberRoles(
    projectId,
    memberId,
    projectRoleId ? [projectRoleId] : [],
    accessToken,
  );
}

export async function assignRoleToUser(
  projectId: string,
  projectRoleId: string,
  userId: string,
  accessToken: string,
): Promise<ProjectActiveTeamMember> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/roles/${projectRoleId}/assign`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ userId }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to assign role to user.');
  }

  const data = await response.json();
  return {
    ...data,
    avatarUrl: formatApiAssetUrl(data.avatarUrl),
  };
}

export async function removeProjectMember(
  projectId: string,
  memberId: string,
  accessToken: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/members/${memberId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to remove member from project.');
  }

  return response.json();
}

export async function leaveProject(
  projectId: string,
  accessToken: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/members/me`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to leave project.');
  }

  return response.json();
}
