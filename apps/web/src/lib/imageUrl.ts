/**
 * Centralized Image and Media URL Resolver
 *
 * Normalizes all image URL sources in Pantheon:
 * - Static/bundled assets
 * - External absolute HTTP/HTTPS URLs
 * - Backend-served upload paths (e.g. /uploads/avatars/...)
 * - Persistent cloud object storage URLs (S3/Cloudflare R2)
 * - Data URLs and local blob preview URLs
 */

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
}

export function getAssetsBaseUrl(): string {
  // If a dedicated CDN or object storage URL is configured, prioritize it.
  // Otherwise, default to the API base URL for backend-hosted uploads.
  return import.meta.env.VITE_ASSETS_BASE_URL ?? getApiBaseUrl();
}

/**
 * Resolves any image URL to a valid browser-loadable URL.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }

  // 1. Data URLs and Blob URLs (e.g. local previews from crop/upload)
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // 2. Absolute HTTP/HTTPS URLs (including Google avatars, external media, R2/S3 CDNs)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Clean accidental double-slashes in the path while preserving protocol
    return trimmed.replace(/([^:])\/\/+/g, '$1/');
  }

  // 3. Root-relative paths (e.g. /uploads/avatars/abc.jpg)
  const baseUrl = getAssetsBaseUrl().replace(/\/+$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  // In production or when an asset/API base URL is configured, prepend it cleanly
  if (baseUrl) {
    return `${baseUrl}${cleanPath}`;
  }

  return cleanPath;
}

/**
 * Helper to check if a URL is an external third-party host (e.g. Google avatar).
 */
export function isExternalUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Extracts 1-2 character initials for fallback avatar badges.
 */
export function getInitials(name?: string | null, fallback = 'U'): string {
  if (!name || !name.trim()) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.trim().charAt(0).toUpperCase() || fallback;
}
