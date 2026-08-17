import type { TaxonomyResponse, UpdateIdentityIdsPayload } from '../types';

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
}

const taxonomyCache = new Map<string, { timestamp: number; data: TaxonomyResponse }>();
const CACHE_TTL_MS = 60000; // 60s cache TTL

export async function fetchTaxonomyCategory(
  endpoint: 'roles' | 'specializations' | 'skills' | 'tools' | 'game-engines' | 'genres' | 'platforms',
  search?: string,
  page: number = 1,
  limit: number = 20,
): Promise<TaxonomyResponse> {
  const params = new URLSearchParams();
  if (search?.trim()) {
    params.set('search', search.trim());
  }
  params.set('page', page.toString());
  params.set('limit', limit.toString());

  const cacheKey = `${endpoint}?${params.toString()}`;
  const cached = taxonomyCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const url = `${getApiBaseUrl()}/taxonomy/${endpoint}?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${endpoint} taxonomy.`);
  }

  const result = (await response.json()) as TaxonomyResponse;
  taxonomyCache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
}

export function searchRoles(search?: string, limit: number = 20) {
  return fetchTaxonomyCategory('roles', search, 1, limit);
}

export function searchSpecializations(search?: string, limit: number = 20) {
  return fetchTaxonomyCategory('specializations', search, 1, limit);
}

const NON_TECH_SKILLS = new Set([
  'Agile & Sprint Planning',
  '3D Modeling',
  'Digital Sculpting',
  'Texturing & PBR Workflows',
  'Rigging & Skinning',
  'Level Design',
  'Sound Design',
]);

export async function searchTechnologies(search?: string, limit: number = 20): Promise<TaxonomyResponse> {
  const result = await fetchTaxonomyCategory('skills', search, 1, limit);
  const filteredData = (result.data || []).filter((item) => !NON_TECH_SKILLS.has(item.name));
  return {
    ...result,
    data: filteredData,
  };
}

export function searchSkills(search?: string, limit: number = 20) {
  return fetchTaxonomyCategory('skills', search, 1, limit);
}

export function searchTools(search?: string, limit: number = 20) {
  return fetchTaxonomyCategory('tools', search, 1, limit);
}

export function searchGameEngines(search?: string, limit: number = 20) {
  return fetchTaxonomyCategory('game-engines', search, 1, limit);
}

export function searchGenres(search?: string, limit: number = 20) {
  return fetchTaxonomyCategory('genres', search, 1, limit);
}

export function searchPlatforms(search?: string, limit: number = 20) {
  return fetchTaxonomyCategory('platforms', search, 1, limit);
}

export async function updateIdentity(
  accessToken: string | null,
  payload: UpdateIdentityIdsPayload,
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${getApiBaseUrl()}/profile/me/identity`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update professional identity.');
  }

  return response.json();
}
