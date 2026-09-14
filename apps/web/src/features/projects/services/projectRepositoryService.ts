function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
}

export interface RepoAuthor {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface RepoCommit {
  hash: string;
  message: string;
  author: RepoAuthor;
  date: string;
  branch: string;
  changedFiles: string[];
}

export interface RepoFile {
  path: string;
  content: string;
  size: number;
  linesCount: number;
  lastCommit: {
    hash: string;
    message: string;
    author: string;
    date: string;
  };
}

export interface RepoBranch {
  name: string;
  isDefault: boolean;
  lastCommitHash: string;
  updatedAt: string;
}

export interface RepoPullRequest {
  id: string;
  number: number;
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  status: 'OPEN' | 'MERGED' | 'CLOSED';
  author: RepoAuthor;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string | null;
  mergedBy?: string | null;
  commentsCount: number;
  changedFilesCount: number;
}

export interface RepoRelease {
  id: string;
  tagName: string;
  title: string;
  description: string;
  targetBranch: string;
  author: RepoAuthor;
  publishedAt: string;
  assets: {
    name: string;
    size: string;
    downloadUrl: string;
  }[];
}

export interface ProjectRepositoryData {
  name: string;
  slug: string;
  gameEngine: string | null;
  currentBranch: string;
  defaultBranch: string;
  branches: RepoBranch[];
  files: RepoFile[];
  recentCommits: RepoCommit[];
  pullRequests: RepoPullRequest[];
  releases: RepoRelease[];
  languages: Record<string, number>;
  stats: {
    totalCommits: number;
    totalBranches: number;
    totalPullRequests: number;
    totalReleases: number;
    totalFiles: number;
    totalLines: number;
    totalSize: number;
    contributorsCount: number;
  };
  cloneUrls: {
    https: string;
    ssh: string;
  };
}

export async function fetchProjectRepo(
  projectId: string,
  branch?: string,
  token?: string | null,
): Promise<ProjectRepositoryData> {
  const url = new URL(`${getApiBaseUrl()}/projects/${projectId}/repo`);
  if (branch) {
    url.searchParams.set('branch', branch);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch project repository.');
  }

  return res.json();
}

export async function fetchRepoFile(
  projectId: string,
  path: string,
  branch?: string,
  token?: string | null,
): Promise<RepoFile> {
  const url = new URL(`${getApiBaseUrl()}/projects/${projectId}/repo/file`);
  url.searchParams.set('path', path);
  if (branch) {
    url.searchParams.set('branch', branch);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch file content.');
  }

  return res.json();
}

export async function commitRepoFile(
  projectId: string,
  data: {
    path: string;
    content: string;
    commitMessage: string;
    branch?: string;
  },
  token: string,
): Promise<{ commit: RepoCommit; file: RepoFile }> {
  const res = await fetch(`${getApiBaseUrl()}/projects/${projectId}/repo/files`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to commit file.');
  }

  return res.json();
}

export async function deleteRepoFile(
  projectId: string,
  data: {
    path: string;
    commitMessage: string;
    branch?: string;
  },
  token: string,
): Promise<{ success: boolean; commit: RepoCommit }> {
  const res = await fetch(`${getApiBaseUrl()}/projects/${projectId}/repo/files`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete file.');
  }

  return res.json();
}

export async function createRepoBranch(
  projectId: string,
  data: {
    name: string;
    sourceBranch?: string;
  },
  token: string,
): Promise<RepoBranch> {
  const res = await fetch(`${getApiBaseUrl()}/projects/${projectId}/repo/branches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create branch.');
  }

  return res.json();
}

export async function createRepoPullRequest(
  projectId: string,
  data: {
    title: string;
    description: string;
    sourceBranch: string;
    targetBranch?: string;
  },
  token: string,
): Promise<RepoPullRequest> {
  const res = await fetch(`${getApiBaseUrl()}/projects/${projectId}/repo/pulls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create pull request.');
  }

  return res.json();
}

export async function mergeRepoPullRequest(
  projectId: string,
  prNumber: number,
  token: string,
): Promise<RepoPullRequest> {
  const res = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/repo/pulls/${prNumber}/merge`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to merge pull request.');
  }

  return res.json();
}

export async function createRepoRelease(
  projectId: string,
  data: {
    tagName: string;
    title: string;
    description: string;
    targetBranch?: string;
  },
  token: string,
): Promise<RepoRelease> {
  const res = await fetch(`${getApiBaseUrl()}/projects/${projectId}/repo/releases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create release.');
  }

  return res.json();
}
