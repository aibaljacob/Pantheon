export interface RepoCloneUrls {
  https: string;
  ssh: string;
}

/**
 * Returns the base HTTP URL for Git Smart HTTP repository endpoints.
 * Resolves with priority:
 * 1. GIT_HTTP_BASE_URL (explicit Git HTTP override, e.g. https://git.pantheon.studio/repos)
 * 2. API_URL (reused public API base URL, e.g. https://api.pantheon.studio)
 * 3. Local fallback: http://localhost:${PORT ?? 3000}/repos
 */
export function getGitHttpBaseUrl(): string {
  const configured = process.env.GIT_HTTP_BASE_URL || process.env.API_URL;
  if (configured && configured.trim()) {
    const trimmed = configured.trim().replace(/\/+$/, '');
    if (trimmed.endsWith('/repos')) {
      return trimmed;
    }
    return `${trimmed}/repos`;
  }
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}/repos`;
}

/**
 * Generates authoritative clone URLs (HTTPS Smart HTTP and SSH) for a project repository.
 */
export function getGitCloneUrls(slug: string): RepoCloneUrls {
  const httpBase = getGitHttpBaseUrl();
  const https = `${httpBase}/${slug}.git`;

  let sshHost = 'localhost';
  try {
    const parsed = new URL(httpBase);
    sshHost =
      parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
        ? 'localhost'
        : parsed.hostname;
  } catch {
    sshHost = 'localhost';
  }

  if (process.env.GIT_SSH_HOST && process.env.GIT_SSH_HOST.trim()) {
    sshHost = process.env.GIT_SSH_HOST.trim();
  }

  const sshBase = process.env.GIT_SSH_BASE_URL;
  const ssh = sshBase
    ? `${sshBase.trim().replace(/\/+$/, '')}/${slug}.git`
    : `git@${sshHost}:repos/${slug}.git`;

  return { https, ssh };
}
