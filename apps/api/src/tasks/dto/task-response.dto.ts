import { TaskPriority, TaskStatus } from '@prisma/client';

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

export interface TaskResponseDto {
  id: string;
  projectId: string;
  taskNumber: number;
  taskCode: string; // e.g., "TASK-12"
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  assignee?: TaskAssigneeDto | null;
  milestoneId?: string | null;
  milestone?: TaskMilestoneSummaryDto | null;
  createdAt: string;
  updatedAt: string;
}
