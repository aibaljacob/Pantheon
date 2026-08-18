import type { ProfileData } from '../types';

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
}

function getAuthHeaders(accessToken?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return headers;
}

export function formatApiAssetUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${getApiBaseUrl()}${url}`;
  }
  return `${getApiBaseUrl()}/${url}`;
}

export function mapServerProfileToFrontendProfile(raw: any): ProfileData {
  if (!raw) {
    throw new Error('Empty server profile payload.');
  }

  // Safely extract numeric completion scores
  let profileCompletion = 85;
  let portfolioCompletion = 75;

  if (typeof raw.completion === 'object' && raw.completion !== null) {
    if (typeof raw.completion.profile === 'number') {
      profileCompletion = raw.completion.profile;
    }
    if (typeof raw.completion.portfolio === 'number') {
      portfolioCompletion = raw.completion.portfolio;
    }
  } else if (typeof raw.completion === 'number') {
    profileCompletion = raw.completion;
  }

  if (typeof raw.stats?.profileCompletion === 'number') {
    profileCompletion = raw.stats.profileCompletion;
  }
  if (typeof raw.stats?.portfolioCompletion === 'number') {
    portfolioCompletion = raw.stats.portfolioCompletion;
  }

  const user = raw.user || raw;
  const prof = raw.profile || raw;
  const identity = prof.identity || raw.identity || {};
  const stats = raw.stats || {};

  const rawPortfolio = prof.portfolio || raw.portfolio || [];
  const formattedPortfolio = Array.isArray(rawPortfolio)
    ? rawPortfolio.map((p: any) => ({
        ...p,
        coverUrl: formatApiAssetUrl(p.coverUrl),
      }))
    : [];

  const rawResume = prof.resume ?? raw.resume ?? null;
  const formattedResume = rawResume
    ? {
        ...rawResume,
        downloadUrl: formatApiAssetUrl(rawResume.downloadUrl),
      }
    : null;

  return {
    user: {
      id: user.id || prof.userId || '',
      username: user.username || '',
      firstName: prof.firstName || user.firstName || '',
      lastName: prof.lastName || user.lastName || '',
      displayName: prof.displayName || user.displayName || '',
      avatarUrl: formatApiAssetUrl(prof.avatarUrl || user.avatarUrl),
      bannerUrl: formatApiAssetUrl(prof.bannerUrl || user.bannerUrl),
      headline: prof.headline || user.headline || '',
      location: prof.location || user.location || '',
      timezone: prof.timezone || user.timezone || '',
      experienceYears: prof.experienceYears ?? user.experienceYears ?? 0,
      bio: prof.bio || user.bio || '',
      availability: prof.availability || user.availability || 'Available for collaboration',
      isFounder: user.username === 'aibal' || Boolean(prof.isFounder || user.isFounder),
    },
    professional: {
      roles: identity.roles || [],
      specializations: identity.specializations || [],
      skills: identity.skills || [],
      tools: identity.tools || [],
      gameEngines: identity.gameEngines || [],
      genres: identity.genres || [],
      platforms: identity.platforms || [],
    },
    experiences: prof.experiences || raw.experiences || [],
    education: prof.education || raw.education || [],
    portfolio: formattedPortfolio,
    resume: formattedResume,
    links: prof.links || raw.links || [],
    stats: {
      followersCount: stats.followers ?? stats.followersCount ?? 0,
      followingCount: stats.following ?? stats.followingCount ?? 0,
      profileCompletion,
      portfolioCompletion,
    },
    isOwner: Boolean(raw.isOwner),
    isFollowing: Boolean(raw.isFollowing),
  };
}

// Single-flight in-flight promise guards
let inFlightOwnProfilePromise: Promise<ProfileData> | null = null;
const inFlightPublicProfileMap = new Map<string, Promise<ProfileData>>();

// 1. PUBLIC & OWN PROFILE FETCH
export async function fetchPublicProfile(
  username: string,
  accessToken?: string | null,
): Promise<ProfileData> {
  const normalizedKey = username.trim().toLowerCase();
  const existingPromise = inFlightPublicProfileMap.get(normalizedKey);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = (async () => {
    try {
      const url = `${getApiBaseUrl()}/profile/${encodeURIComponent(username)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(accessToken),
      });

      if (!response.ok) {
        throw new Error(`Profile for user '${username}' not found.`);
      }

      const rawData = await response.json();
      return mapServerProfileToFrontendProfile(rawData);
    } finally {
      inFlightPublicProfileMap.delete(normalizedKey);
    }
  })();

  inFlightPublicProfileMap.set(normalizedKey, promise);
  return promise;
}

export async function fetchOwnProfile(accessToken: string): Promise<ProfileData> {
  if (inFlightOwnProfilePromise) {
    return inFlightOwnProfilePromise;
  }

  inFlightOwnProfilePromise = (async () => {
    try {
      const url = `${getApiBaseUrl()}/profile/me`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(accessToken),
      });

      if (!response.ok) {
        throw new Error('Unable to fetch authenticated owner profile.');
      }

      const rawData = await response.json();
      return mapServerProfileToFrontendProfile(rawData);
    } finally {
      inFlightOwnProfilePromise = null;
    }
  })();

  return inFlightOwnProfilePromise;
}

// 2. BASIC PROFILE UPDATE
export async function updateBasicProfile(
  accessToken: string,
  dto: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    headline?: string;
    bio?: string;
    location?: string;
    timezone?: string;
    experienceYears?: number;
    availability?: string;
  },
): Promise<ProfileData> {
  const response = await fetch(`${getApiBaseUrl()}/profile/me`, {
    method: 'PATCH',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error('Failed to update profile basic info.');
  }

  const rawData = await response.json();
  return mapServerProfileToFrontendProfile(rawData);
}

// 3. FOLLOW / UNFOLLOW
export async function followUser(accessToken: string, username: string): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/profile/${encodeURIComponent(username)}/follow`, {
    method: 'POST',
    headers: getAuthHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error('Failed to follow user.');
  }

  return response.json();
}

export async function unfollowUser(accessToken: string, username: string): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/profile/${encodeURIComponent(username)}/follow`, {
    method: 'DELETE',
    headers: getAuthHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error('Failed to unfollow user.');
  }

  return response.json();
}

// 4. AVATAR & BANNER UPLOADS
export async function uploadAvatar(accessToken: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${getApiBaseUrl()}/profile/me/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload avatar.');
  }

  const result = await response.json();
  return {
    ...result,
    avatarUrl: formatApiAssetUrl(result.avatarUrl),
  };
}

export async function deleteAvatar(accessToken: string): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/profile/me/avatar`, {
    method: 'DELETE',
    headers: getAuthHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error('Failed to delete avatar.');
  }

  return response.json();
}

export async function uploadBanner(accessToken: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${getApiBaseUrl()}/profile/me/banner`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload banner.');
  }

  const result = await response.json();
  return {
    ...result,
    bannerUrl: formatApiAssetUrl(result.bannerUrl),
  };
}

export async function deleteBanner(accessToken: string): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/profile/me/banner`, {
    method: 'DELETE',
    headers: getAuthHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error('Failed to delete banner.');
  }

  return response.json();
}

// 5. EXPERIENCE CRUD
export async function createExperience(accessToken: string, dto: any): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/profile/me/experience`, {
    method: 'POST',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error('Failed to create experience entry.');
  }

  return response.json();
}

export async function updateExperience(accessToken: string, id: string, dto: any): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/profile/me/experience/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error('Failed to update experience entry.');
  }

  return response.json();
}

export async function deleteExperience(accessToken: string, id: string): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/profile/me/experience/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error('Failed to delete experience entry.');
  }

  return response.json();
}

// 6. EDUCATION CRUD
export async function createEducation(accessToken: string, dto: any): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/profile/me/education`, {
    method: 'POST',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error('Failed to create education entry.');
  }

  return response.json();
}

export async function updateEducation(accessToken: string, id: string, dto: any): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/profile/me/education/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error('Failed to update education entry.');
  }

  return response.json();
}

export async function deleteEducation(accessToken: string, id: string): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/profile/me/education/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error('Failed to delete education entry.');
  }

  return response.json();
}

// 7. PORTFOLIO CRUD
export async function createPortfolioItem(accessToken: string, dto: any): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/profile/me/portfolio`, {
    method: 'POST',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error('Failed to create portfolio project.');
  }

  const result = await response.json();
  return {
    ...result,
    coverUrl: formatApiAssetUrl(result.coverUrl),
  };
}

export async function uploadPortfolioCover(accessToken: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${getApiBaseUrl()}/profile/me/portfolio/cover`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload portfolio cover image.');
  }

  const result = await response.json();
  return {
    ...result,
    coverUrl: formatApiAssetUrl(result.coverUrl),
  };
}

export async function updatePortfolioItem(accessToken: string, id: string, dto: any): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/profile/me/portfolio/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error('Failed to update portfolio project.');
  }

  const result = await response.json();
  return {
    ...result,
    coverUrl: formatApiAssetUrl(result.coverUrl),
  };
}

export async function deletePortfolioItem(accessToken: string, id: string): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/profile/me/portfolio/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error('Failed to delete portfolio project.');
  }

  return response.json();
}

// 8. RESUME UPLOAD & MANAGEMENT
export async function uploadResume(accessToken: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${getApiBaseUrl()}/profile/me/resume`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload resume.');
  }

  return response.json();
}

export async function updateResumeVisibility(accessToken: string, visibility: 'Public' | 'Private'): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/profile/me/resume`, {
    method: 'PATCH',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({ visibility }),
  });

  if (!response.ok) {
    throw new Error('Failed to update resume visibility.');
  }

  return response.json();
}

export async function deleteResume(accessToken: string): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/profile/me/resume`, {
    method: 'DELETE',
    headers: getAuthHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error('Failed to delete resume.');
  }

  return response.json();
}

// 9. LINKS CRUD
export async function createLink(accessToken: string, dto: any): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/profile/me/links`, {
    method: 'POST',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error('Failed to create external profile link.');
  }

  return response.json();
}

export async function updateLink(accessToken: string, id: string, dto: any): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/profile/me/links/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error('Failed to update external profile link.');
  }

  return response.json();
}

export async function deleteLink(accessToken: string, id: string): Promise<any> {
  const response = await fetch(`${getApiBaseUrl()}/profile/me/links/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error('Failed to delete external profile link.');
  }

  return response.json();
}
