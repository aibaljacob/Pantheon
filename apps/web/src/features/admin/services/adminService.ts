import { formatApiAssetUrl } from '../../profile/services/profileService';

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
}

function getAuthHeaders(accessToken: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

export interface AdminDashboardMetrics {
  totalUsers: number;
  activeVerifiedUsers: number;
  totalProjects: number;
  activeProjects: number;
  totalTaxonomyEntries: number;
}

export interface AdminUserItem {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMINISTRATOR';
  emailVerified: boolean;
  provider: string;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
  headline?: string | null;
  foundedProjectsCount: number;
  joinedProjectsCount: number;
}

export interface AdminPaginatedUsersResponse {
  users: AdminUserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminProjectItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverUrl?: string | null;
  status: string;
  moderationStatus: 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';
  genre?: string | null;
  platform?: string | null;
  gameEngine?: string | null;
  founderId: string;
  founderUsername: string;
  founderDisplayName: string;
  founderEmail: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPaginatedProjectsResponse {
  projects: AdminProjectItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminProjectDetail extends AdminProjectItem {
  members: {
    id: string;
    userId: string;
    username: string;
    displayName: string;
    email: string;
    avatarUrl?: string | null;
    role: string;
    joinedAt: string;
  }[];
}

export interface AdminTaxonomyItem {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AdminPaginatedTaxonomyResponse {
  items: AdminTaxonomyItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminActivityItem {
  id: string;
  type: 'USER_REGISTERED' | 'PROJECT_CREATED' | 'MEMBER_JOINED' | 'TAXONOMY_UPDATED';
  title: string;
  description: string;
  timestamp: string;
}

// 1. Metrics
export async function fetchAdminDashboardMetrics(accessToken: string): Promise<AdminDashboardMetrics> {
  const res = await fetch(`${getApiBaseUrl()}/admin/dashboard/metrics`, {
    headers: getAuthHeaders(accessToken),
  });
  if (!res.ok) throw new Error('Failed to fetch admin metrics.');
  return res.json();
}

// 2. Users
export async function fetchAdminUsers(
  accessToken: string,
  params: { page?: number; limit?: number; search?: string; role?: string; emailVerified?: string },
): Promise<AdminPaginatedUsersResponse> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.search) query.append('search', params.search);
  if (params.role) query.append('role', params.role);
  if (params.emailVerified) query.append('emailVerified', params.emailVerified);

  const res = await fetch(`${getApiBaseUrl()}/admin/users?${query.toString()}`, {
    headers: getAuthHeaders(accessToken),
  });
  if (!res.ok) throw new Error('Failed to fetch admin users list.');

  const data: AdminPaginatedUsersResponse = await res.json();
  const formattedUsers = data.users.map((u) => ({
    ...u,
    avatarUrl: formatApiAssetUrl(u.avatarUrl),
  }));

  return {
    ...data,
    users: formattedUsers,
  };
}

export async function fetchAdminUserDetails(accessToken: string, userId: string): Promise<AdminUserItem> {
  const res = await fetch(`${getApiBaseUrl()}/admin/users/${userId}`, {
    headers: getAuthHeaders(accessToken),
  });
  if (!res.ok) throw new Error('Failed to fetch user details.');

  const data: AdminUserItem = await res.json();
  return {
    ...data,
    avatarUrl: formatApiAssetUrl(data.avatarUrl),
  };
}

// 3. Projects
export async function fetchAdminProjects(
  accessToken: string,
  params: { page?: number; limit?: number; search?: string; status?: string; moderationStatus?: string },
): Promise<AdminPaginatedProjectsResponse> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.search) query.append('search', params.search);
  if (params.status) query.append('status', params.status);
  if (params.moderationStatus) query.append('moderationStatus', params.moderationStatus);

  const res = await fetch(`${getApiBaseUrl()}/admin/projects?${query.toString()}`, {
    headers: getAuthHeaders(accessToken),
  });
  if (!res.ok) throw new Error('Failed to fetch admin projects list.');

  const data: AdminPaginatedProjectsResponse = await res.json();
  const formattedProjects = data.projects.map((p) => ({
    ...p,
    coverUrl: formatApiAssetUrl(p.coverUrl),
  }));

  return {
    ...data,
    projects: formattedProjects,
  };
}

export async function fetchAdminProjectDetails(accessToken: string, projectId: string): Promise<AdminProjectDetail> {
  const res = await fetch(`${getApiBaseUrl()}/admin/projects/${projectId}`, {
    headers: getAuthHeaders(accessToken),
  });
  if (!res.ok) throw new Error('Failed to fetch project details.');

  const data: AdminProjectDetail = await res.json();
  return {
    ...data,
    coverUrl: formatApiAssetUrl(data.coverUrl),
    members: data.members.map((m) => ({
      ...m,
      avatarUrl: formatApiAssetUrl(m.avatarUrl),
    })),
  };
}

export async function approveAdminProject(accessToken: string, projectId: string): Promise<AdminProjectDetail> {
  const res = await fetch(`${getApiBaseUrl()}/admin/projects/${projectId}/approve`, {
    method: 'PATCH',
    headers: getAuthHeaders(accessToken),
  });
  if (!res.ok) throw new Error('Failed to approve project.');

  const data: AdminProjectDetail = await res.json();
  return {
    ...data,
    coverUrl: formatApiAssetUrl(data.coverUrl),
    members: data.members.map((m) => ({
      ...m,
      avatarUrl: formatApiAssetUrl(m.avatarUrl),
    })),
  };
}

export async function rejectAdminProject(accessToken: string, projectId: string): Promise<AdminProjectDetail> {
  const res = await fetch(`${getApiBaseUrl()}/admin/projects/${projectId}/reject`, {
    method: 'PATCH',
    headers: getAuthHeaders(accessToken),
  });
  if (!res.ok) throw new Error('Failed to reject project.');

  const data: AdminProjectDetail = await res.json();
  return {
    ...data,
    coverUrl: formatApiAssetUrl(data.coverUrl),
    members: data.members.map((m) => ({
      ...m,
      avatarUrl: formatApiAssetUrl(m.avatarUrl),
    })),
  };
}

// 4. Taxonomy
export async function fetchAdminTaxonomy(
  accessToken: string,
  type: string,
  params: { page?: number; limit?: number; search?: string },
): Promise<AdminPaginatedTaxonomyResponse> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.search) query.append('search', params.search);

  const res = await fetch(`${getApiBaseUrl()}/admin/taxonomy/${type}?${query.toString()}`, {
    headers: getAuthHeaders(accessToken),
  });
  if (!res.ok) throw new Error(`Failed to fetch taxonomy entries for ${type}.`);
  return res.json();
}

export async function createAdminTaxonomyEntry(
  accessToken: string,
  type: string,
  dto: { name: string; description?: string },
): Promise<AdminTaxonomyItem> {
  const res = await fetch(`${getApiBaseUrl()}/admin/taxonomy/${type}`, {
    method: 'POST',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create taxonomy entry.');
  }
  return res.json();
}

export async function updateAdminTaxonomyEntry(
  accessToken: string,
  type: string,
  id: string,
  dto: { name?: string; description?: string },
): Promise<AdminTaxonomyItem> {
  const res = await fetch(`${getApiBaseUrl()}/admin/taxonomy/${type}/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to update taxonomy entry.');
  }
  return res.json();
}

export async function toggleAdminTaxonomyActive(
  accessToken: string,
  type: string,
  id: string,
  isActive: boolean,
): Promise<AdminTaxonomyItem> {
  const res = await fetch(`${getApiBaseUrl()}/admin/taxonomy/${type}/${id}/toggle`, {
    method: 'PATCH',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) throw new Error('Failed to toggle taxonomy active state.');
  return res.json();
}

// 5. Activity Stream
export async function fetchAdminActivity(accessToken: string): Promise<AdminActivityItem[]> {
  const res = await fetch(`${getApiBaseUrl()}/admin/activity`, {
    headers: getAuthHeaders(accessToken),
  });
  if (!res.ok) throw new Error('Failed to fetch admin activity stream.');
  return res.json();
}
