import type { AuthUser } from '../auth/types';

export type DashboardUser = AuthUser;

export interface DashboardProject {
  id: string;
  title: string;
  genre: string;
  engine: string;
  stage: string;
  progress: number;
  teamSize: number;
  openTasks: number;
  coverImage: string;
  milestone: string;
  assignedTasks: number;
  onlineMembers: string[];
}

export interface TaskItem {
  id: string;
  title: string;
  projectName: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  status: string;
  bucket: 'Due Today' | 'Upcoming' | 'Overdue';
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
  category: string;
}

export interface InsightItem {
  id: string;
  title: string;
  description: string;
  icon: 'spark' | 'portfolio' | 'engine' | 'role' | 'team';
  actionLabel?: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
}