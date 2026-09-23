import type {
  CreateMilestoneInput,
  CreateTaskInput,
  MilestoneItem,
  TaskItem,
  TaskPriority,
  TaskStatus,
  UpdateMilestoneInput,
  UpdateTaskInput,
} from '../types';
import { useAuthStore } from '../../auth/store/authStore';

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
}

function buildHeaders(accessToken?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

// ==========================================
// MILESTONES API
// ==========================================

export async function fetchProjectMilestones(
  projectId: string,
  accessToken?: string | null,
): Promise<MilestoneItem[]> {
  const response = await fetch(`${getApiBaseUrl()}/projects/${projectId}/milestones`, {
    method: 'GET',
    headers: buildHeaders(accessToken),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch project milestones.');
  }

  return response.json();
}

export async function createProjectMilestone(
  projectId: string,
  input: CreateMilestoneInput,
  accessToken: string,
): Promise<MilestoneItem> {
  const response = await fetch(`${getApiBaseUrl()}/projects/${projectId}/milestones`, {
    method: 'POST',
    headers: buildHeaders(accessToken),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create milestone.');
  }

  return response.json();
}

export async function updateProjectMilestone(
  projectId: string,
  milestoneId: string,
  input: UpdateMilestoneInput,
  accessToken: string,
): Promise<MilestoneItem> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/milestones/${milestoneId}`,
    {
      method: 'PATCH',
      headers: buildHeaders(accessToken),
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update milestone.');
  }

  return response.json();
}

export async function deleteProjectMilestone(
  projectId: string,
  milestoneId: string,
  accessToken: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/milestones/${milestoneId}`,
    {
      method: 'DELETE',
      headers: buildHeaders(accessToken),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete milestone.');
  }

  return response.json();
}

// ==========================================
// TASKS API
// ==========================================

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  milestoneId?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'taskNumber' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export async function fetchProjectTasks(
  projectId: string,
  filters?: TaskFilters,
  accessToken?: string | null,
): Promise<TaskItem[]> {
  const url = new URL(`${getApiBaseUrl()}/projects/${projectId}/tasks`);

  if (filters) {
    if (filters.status) url.searchParams.set('status', filters.status);
    if (filters.priority) url.searchParams.set('priority', filters.priority);
    if (filters.assigneeId) url.searchParams.set('assigneeId', filters.assigneeId);
    if (filters.milestoneId) url.searchParams.set('milestoneId', filters.milestoneId);
    if (filters.sortBy) url.searchParams.set('sortBy', filters.sortBy);
    if (filters.sortOrder) url.searchParams.set('sortOrder', filters.sortOrder);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: buildHeaders(accessToken),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch project tasks.');
  }

  return response.json();
}

export async function fetchProjectTask(
  projectId: string,
  taskId: string,
  accessToken?: string | null,
): Promise<TaskItem> {
  const response = await fetch(`${getApiBaseUrl()}/projects/${projectId}/tasks/${taskId}`, {
    method: 'GET',
    headers: buildHeaders(accessToken),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch task details.');
  }

  return response.json();
}

export async function createProjectTask(
  projectId: string,
  input: CreateTaskInput,
  accessToken: string,
): Promise<TaskItem> {
  const response = await fetch(`${getApiBaseUrl()}/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: buildHeaders(accessToken),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create task.');
  }

  return response.json();
}

export async function updateProjectTask(
  projectId: string,
  taskId: string,
  input: UpdateTaskInput,
  accessToken: string,
): Promise<TaskItem> {
  const response = await fetch(`${getApiBaseUrl()}/projects/${projectId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: buildHeaders(accessToken),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update task.');
  }

  return response.json();
}

export async function updateTaskStatus(
  projectId: string,
  taskId: string,
  status: TaskStatus,
  accessToken: string,
): Promise<TaskItem> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/tasks/${taskId}/status`,
    {
      method: 'PATCH',
      headers: buildHeaders(accessToken),
      body: JSON.stringify({ status }),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update task status.');
  }

  return response.json();
}

export async function updateTaskAssignee(
  projectId: string,
  taskId: string,
  assigneeId: string | null,
  accessToken: string,
): Promise<TaskItem> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/tasks/${taskId}/assignee`,
    {
      method: 'PATCH',
      headers: buildHeaders(accessToken),
      body: JSON.stringify({ assigneeId }),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update task assignee.');
  }

  return response.json();
}

export async function updateTaskMilestone(
  projectId: string,
  taskId: string,
  milestoneId: string | null,
  accessToken: string,
): Promise<TaskItem> {
  const response = await fetch(
    `${getApiBaseUrl()}/projects/${projectId}/tasks/${taskId}/milestone`,
    {
      method: 'PATCH',
      headers: buildHeaders(accessToken),
      body: JSON.stringify({ milestoneId }),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update task milestone.');
  }

  return response.json();
}

export async function deleteProjectTask(
  projectId: string,
  taskId: string,
  accessToken: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${getApiBaseUrl()}/projects/${projectId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: buildHeaders(accessToken),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete task.');
  }

  return response.json();
}

export const taskService = {
  getTasks: (projectId: string, filters?: TaskFilters, token?: string | null) =>
    fetchProjectTasks(projectId, filters, token ?? useAuthStore.getState().accessToken),
  getTaskById: (projectId: string, taskId: string, token?: string | null) =>
    fetchProjectTask(projectId, taskId, token ?? useAuthStore.getState().accessToken),
  createTask: (projectId: string, input: CreateTaskInput, token?: string | null) =>
    createProjectTask(projectId, input, token ?? useAuthStore.getState().accessToken ?? ''),
  updateTask: (projectId: string, taskId: string, input: UpdateTaskInput, token?: string | null) =>
    updateProjectTask(projectId, taskId, input, token ?? useAuthStore.getState().accessToken ?? ''),
  updateTaskStatus: (projectId: string, taskId: string, status: TaskStatus, token?: string | null) =>
    updateTaskStatus(projectId, taskId, status, token ?? useAuthStore.getState().accessToken ?? ''),
  updateTaskAssignee: (projectId: string, taskId: string, assigneeId: string | null, token?: string | null) =>
    updateTaskAssignee(projectId, taskId, assigneeId, token ?? useAuthStore.getState().accessToken ?? ''),
  updateTaskMilestone: (projectId: string, taskId: string, milestoneId: string | null, token?: string | null) =>
    updateTaskMilestone(projectId, taskId, milestoneId, token ?? useAuthStore.getState().accessToken ?? ''),
  deleteTask: (projectId: string, taskId: string, token?: string | null) =>
    deleteProjectTask(projectId, taskId, token ?? useAuthStore.getState().accessToken ?? ''),

  getMilestones: (projectId: string, token?: string | null) =>
    fetchProjectMilestones(projectId, token ?? useAuthStore.getState().accessToken),
  createMilestone: (projectId: string, input: CreateMilestoneInput, token?: string | null) =>
    createProjectMilestone(projectId, input, token ?? useAuthStore.getState().accessToken ?? ''),
  updateMilestone: (projectId: string, milestoneId: string, input: UpdateMilestoneInput, token?: string | null) =>
    updateProjectMilestone(projectId, milestoneId, input, token ?? useAuthStore.getState().accessToken ?? ''),
  deleteMilestone: (projectId: string, milestoneId: string, token?: string | null) =>
    deleteProjectMilestone(projectId, milestoneId, token ?? useAuthStore.getState().accessToken ?? ''),
};
