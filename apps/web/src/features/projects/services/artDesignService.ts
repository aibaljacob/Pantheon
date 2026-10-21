import type {
  ArtProposalCategory,
  ArtProposalItem,
  ArtProposalStatus,
  ArtVoteType,
  DesignAssetCategory,
  DesignAssetItem,
  DesignAssetStatus,
  TaskPriority,
  TaskType,
} from '../types';

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
}

function authHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

// -----------------------------------------------------------------------------
// 1. FILE UPLOAD
// -----------------------------------------------------------------------------

export async function uploadArtDesignReference(
  projectId: string,
  file: File,
  token: string,
): Promise<{ fileUrl: string; fileName: string; fileSize: string; fileType: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/art-design/upload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to upload reference file.');
  }

  return response.json();
}

// -----------------------------------------------------------------------------
// 2. PROPOSALS & VOTING
// -----------------------------------------------------------------------------

export async function fetchArtProposals(
  projectId: string,
  filters?: {
    category?: ArtProposalCategory;
    status?: ArtProposalStatus;
    search?: string;
  },
  token?: string,
): Promise<ArtProposalItem[]> {
  const query = new URLSearchParams();
  if (filters?.category) query.set('category', filters.category);
  if (filters?.status) query.set('status', filters.status);
  if (filters?.search) query.set('search', filters.search);

  const qs = query.toString();
  const url = `${getApiBaseUrl()}/projects/${projectId}/art-design/proposals${qs ? `?${qs}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch art proposals.');
  }

  return response.json();
}

export async function fetchArtProposal(
  projectId: string,
  proposalId: string,
  token?: string,
): Promise<ArtProposalItem> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/art-design/proposals/${proposalId}`,
    {
      method: 'GET',
      headers: authHeaders(token),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch proposal details.');
  }

  return response.json();
}

export async function createArtProposal(
  projectId: string,
  payload: {
    title: string;
    category: ArtProposalCategory;
    rationale: string;
    designNotes?: string;
    paletteColors?: any[];
    referenceImages?: any[];
  },
  token: string,
): Promise<ArtProposalItem> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/art-design/proposals`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create art proposal.');
  }

  return response.json();
}

export async function updateArtProposal(
  projectId: string,
  proposalId: string,
  payload: {
    title?: string;
    category?: ArtProposalCategory;
    rationale?: string;
    designNotes?: string;
    referenceImages?: any[];
  },
  token: string,
): Promise<ArtProposalItem> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/art-design/proposals/${proposalId}`,
    {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update art proposal.');
  }

  return response.json();
}

export async function deleteArtProposal(
  projectId: string,
  proposalId: string,
  token: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/art-design/proposals/${proposalId}`,
    {
      method: 'DELETE',
      headers: authHeaders(token),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete art proposal.');
  }

  return response.json();
}

export async function voteArtProposal(
  projectId: string,
  proposalId: string,
  payload: {
    voteType: ArtVoteType;
    feedback?: string;
  },
  token: string,
): Promise<ArtProposalItem> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/art-design/proposals/${proposalId}/vote`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to submit vote.');
  }

  return response.json();
}

export async function commentArtProposal(
  projectId: string,
  proposalId: string,
  content: string,
  token: string,
): Promise<any> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/art-design/proposals/${proposalId}/comment`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ content }),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to post comment.');
  }

  return response.json();
}

export async function reviseArtProposal(
  projectId: string,
  proposalId: string,
  payload: {
    revisionNotes: string;
    title?: string;
    rationale?: string;
    designNotes?: string;
    paletteColors?: any[];
    referenceImages?: any[];
  },
  token: string,
): Promise<ArtProposalItem> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/art-design/proposals/${proposalId}/revision`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to submit revision.');
  }

  return response.json();
}

export async function founderDecisionArtProposal(
  projectId: string,
  proposalId: string,
  payload: {
    decision: 'APPROVED' | 'REJECTED';
    decisionNotes?: string;
  },
  token: string,
): Promise<ArtProposalItem> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/art-design/proposals/${proposalId}/founder-decision`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to record founder decision.');
  }

  return response.json();
}

export async function convertProposalToTask(
  projectId: string,
  proposalId: string,
  payload: {
    title?: string;
    description?: string;
    type?: TaskType;
    priority?: TaskPriority;
    milestoneId?: string;
    assigneeId?: string;
  },
  token: string,
): Promise<{
  success: boolean;
  taskId: string;
  taskCode: string;
  taskNumber: number;
  title: string;
}> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/art-design/proposals/${proposalId}/convert-to-task`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create production task.');
  }

  return response.json();
}

// -----------------------------------------------------------------------------
// 3. DESIGN LIBRARIES
// -----------------------------------------------------------------------------

export async function fetchDesignAssets(
  projectId: string,
  filters?: {
    category?: DesignAssetCategory;
    status?: DesignAssetStatus;
    search?: string;
  },
  token?: string,
): Promise<DesignAssetItem[]> {
  const query = new URLSearchParams();
  if (filters?.category) query.set('category', filters.category);
  if (filters?.status) query.set('status', filters.status);
  if (filters?.search) query.set('search', filters.search);

  const qs = query.toString();
  const url = `${getApiBaseUrl()}/projects/${projectId}/art-design/assets${qs ? `?${qs}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch design assets.');
  }

  return response.json();
}

export async function createDesignAsset(
  projectId: string,
  payload: {
    title: string;
    category: DesignAssetCategory;
    description?: string;
    fileUrl: string;
    thumbnailUrl?: string;
    tags?: string[];
    sourceDetails?: string;
    creatorDetails?: string;
    licenseDetails?: string;
    paletteColors?: any[];
    proposalId?: string;
  },
  token: string,
): Promise<DesignAssetItem> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/art-design/assets`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to add reference asset.');
  }

  return response.json();
}

export async function updateDesignAsset(
  projectId: string,
  assetId: string,
  payload: Partial<DesignAssetItem>,
  token: string,
): Promise<DesignAssetItem> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/art-design/assets/${assetId}`,
    {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update asset.');
  }

  return response.json();
}

export async function deleteDesignAsset(
  projectId: string,
  assetId: string,
  token: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/art-design/assets/${assetId}`,
    {
      method: 'DELETE',
      headers: authHeaders(token),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete design asset.');
  }

  return response.json();
}

export async function convertAssetToTask(
  projectId: string,
  assetId: string,
  payload: {
    title?: string;
    description?: string;
    type?: TaskType;
    priority?: TaskPriority;
    milestoneId?: string;
    assigneeId?: string;
  },
  token: string,
): Promise<{
  success: boolean;
  taskId: string;
  taskCode: string;
  taskNumber: number;
  title: string;
}> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/art-design/assets/${assetId}/convert-to-task`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create task from asset.');
  }

  return response.json();
}
