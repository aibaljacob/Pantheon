function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
}

export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface CandidateApplicationDetail {
  id: string;
  projectId: string;
  projectRoleId: string;
  status: ApplicationStatus;
  message?: string | null;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    slug: string;
    coverUrl?: string | null;
    genre?: string | null;
    platform?: string | null;
    gameEngine?: string | null;
    founder: {
      username: string;
      displayName?: string | null;
      avatarUrl?: string | null;
    };
  };
  projectRole: {
    id: string;
    title?: string | null;
    roleName: string;
    experienceLevel: string;
    commitment: string;
    status: string;
  };
}

export interface FounderApplicationDetail {
  id: string;
  projectId: string;
  projectRoleId: string;
  status: ApplicationStatus;
  message?: string | null;
  createdAt: string;
  updatedAt: string;
  applicant: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    headline?: string | null;
    location?: string | null;
    experienceYears?: number | null;
    availability?: string | null;
    skills: string[];
    tools: string[];
  };
  projectRole: {
    id: string;
    title?: string | null;
    roleName: string;
    experienceLevel: string;
    commitment: string;
    status: string;
  };
  matchScore?: number;
  matchGrade?: string;
  matchBreakdown?: {
    roleMatch: number;
    skillMatch: number;
    toolMatch: number;
    experienceMatch: number;
    availabilityMatch: number;
    projectContextMatch: number;
  };
}

export async function applyToProjectRole(
  accessToken: string,
  projectId: string,
  projectRoleId: string,
  message?: string,
): Promise<{ id: string; status: ApplicationStatus }> {
  const url = `${getApiBaseUrl()}/projects/${projectId}/roles/${projectRoleId}/applications`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to submit application.');
  }

  return res.json();
}

export async function fetchCandidateApplications(
  accessToken: string,
): Promise<CandidateApplicationDetail[]> {
  const url = `${getApiBaseUrl()}/users/me/applications`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to fetch your applications.');
  }

  return res.json();
}

export async function withdrawCandidateApplication(
  accessToken: string,
  applicationId: string,
): Promise<{ id: string; status: ApplicationStatus }> {
  const url = `${getApiBaseUrl()}/applications/${applicationId}/withdraw`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to withdraw application.');
  }

  return res.json();
}

export async function fetchProjectApplications(
  accessToken: string,
  projectId: string,
): Promise<FounderApplicationDetail[]> {
  const url = `${getApiBaseUrl()}/projects/${projectId}/applications`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to load applications for this project.');
  }

  return res.json();
}

export async function respondToProjectApplication(
  accessToken: string,
  applicationId: string,
  action: 'ACCEPT' | 'REJECT',
): Promise<{ id: string; status: ApplicationStatus }> {
  const url = `${getApiBaseUrl()}/applications/${applicationId}/respond`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ action }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to respond to application.');
  }

  return res.json();
}
