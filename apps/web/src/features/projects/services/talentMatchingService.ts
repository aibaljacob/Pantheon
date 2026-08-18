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
