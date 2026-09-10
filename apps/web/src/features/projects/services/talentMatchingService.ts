function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
}

export interface CandidateQueryQueryParams {
  page?: number;
  limit?: number;
  minScore?: number;
  search?: string;
}

export interface MatchBreakdown {
  roleMatch: number;
  skillMatch: number;
  toolMatch: number;
  experienceMatch: number;
  availabilityMatch: number;
  projectContextMatch: number;
  experienceUnspecified?: boolean;
}

export interface CandidatePortfolioHighlight {
  id: string;
  title: string;
  role: string;
  gameEngine: string;
  genre: string;
  platform: string;
  coverUrl?: string | null;
  description: string;
}

export interface CandidateResumeInfo {
  fileName: string;
  fileSize: string;
  downloadUrl?: string | null;
}

export interface CandidateProfileSummary {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  timezone?: string | null;
  experienceYears?: number | null;
  availability?: string | null;
  roles: string[];
  skills: string[];
  tools: string[];
  gameEngines: string[];
  portfolioHighlights: CandidatePortfolioHighlight[];
  resume?: CandidateResumeInfo | null;
}

export interface RecommendedCandidate {
  candidate: CandidateProfileSummary;
  totalScore: number;
  matchGrade: 'EXCELLENT_MATCH' | 'STRONG_MATCH' | 'GOOD_MATCH' | 'POTENTIAL_MATCH';
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  matchBreakdown: MatchBreakdown;
  matchedSkills: string[];
  missingSkills: string[];
  matchedTools: string[];
  missingTools: string[];
  explanation: string;
  invitationStatus?: 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
}

export interface RankedCandidatesResponse {
  projectRoleId: string;
  projectRoleTitle: string;
  totalCandidatesScored: number;
  matchingCandidatesCount: number;
  page: number;
  limit: number;
  totalPages: number;
  candidates: RecommendedCandidate[];
}

export interface ProjectInvitationResponse {
  id: string;
  projectId: string;
  projectRoleId: string;
  inviterId: string;
  inviteeId: string;
  status: string;
  message?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserInvitationProjectSummary {
  id: string;
  name: string;
  coverUrl?: string | null;
  description: string;
  genre?: string | null;
  platform?: string | null;
  gameEngine?: string | null;
  founderId: string;
}

export interface UserInvitationRoleSummary {
  id: string;
  title: string;
  commitment: string;
  experienceLevel: string;
  status: string;
  roleName: string;
}

export interface UserInvitationUserProfileSummary {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  headline?: string | null;
}

export interface UserInvitationDetail {
  id: string;
  projectId: string;
  projectRoleId: string;
  inviterId: string;
  inviteeId: string;
  status: string;
  message?: string | null;
  createdAt: string;
  updatedAt: string;
  project: UserInvitationProjectSummary;
  projectRole: UserInvitationRoleSummary;
  inviter: UserInvitationUserProfileSummary;
  invitee: UserInvitationUserProfileSummary;
}

export interface UserInvitationsResponse {
  received: UserInvitationDetail[];
  sent: UserInvitationDetail[];
  pendingCount: number;
}

export async function fetchRecommendedTalent(
  accessToken: string,
  projectId: string,
  projectRoleId: string,
  query?: CandidateQueryQueryParams,
): Promise<RankedCandidatesResponse> {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.minScore !== undefined) params.set('minScore', String(query.minScore));
  if (query?.search) params.set('search', query.search);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const url = `${getApiBaseUrl()}/projects/${projectId}/roles/${projectRoleId}/candidates${queryString}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to fetch candidate recommendations.');
  }

  return response.json();
}

export async function sendProjectRoleInvitation(
  accessToken: string,
  projectId: string,
  projectRoleId: string,
  candidateId: string,
  message?: string,
): Promise<ProjectInvitationResponse> {
  const url = `${getApiBaseUrl()}/projects/${projectId}/roles/${projectRoleId}/invitations`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ candidateId, message }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to send invitation.');
  }

  return response.json();
}

export async function fetchUserInvitations(
  accessToken: string,
): Promise<UserInvitationsResponse> {
  const url = `${getApiBaseUrl()}/users/me/invitations`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to fetch user invitations.');
  }

  return response.json();
}

export async function respondToInvitation(
  accessToken: string,
  invitationId: string,
  action: 'ACCEPT' | 'REJECT',
): Promise<ProjectInvitationResponse> {
  const url = `${getApiBaseUrl()}/invitations/${invitationId}/respond`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Failed to ${action.toLowerCase()} invitation.`);
  }

  return response.json();
}

export async function cancelProjectInvitation(
  accessToken: string,
  invitationId: string,
): Promise<ProjectInvitationResponse> {
  const url = `${getApiBaseUrl()}/invitations/${invitationId}/cancel`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Failed to cancel invitation.');
  }

  return response.json();
}
