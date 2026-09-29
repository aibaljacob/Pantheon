import { TaskPriority, TaskStatus, TaskType } from '@prisma/client';

export interface TaskAssigneeDto {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface TaskMilestoneSummaryDto {
  id: string;
  title: string;
}

export interface TaskDependencySummaryDto {
  id: string;
  taskNumber: number;
  taskCode: string;
  title: string;
  status: TaskStatus;
}

export interface TaskResponseDto {
  id: string;
  projectId: string;
  taskNumber: number;
  taskCode: string; // e.g., "TASK-12"
  title: string;
  description?: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  blockedReason?: string | null;
  assigneeId?: string | null;
  assignee?: TaskAssigneeDto | null;
  milestoneId?: string | null;
  milestone?: TaskMilestoneSummaryDto | null;
  dependencies?: TaskDependencySummaryDto[];
  dependents?: TaskDependencySummaryDto[];
  createdAt: string;
  updatedAt: string;
}
