export interface DashboardProjectItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverUrl?: string | null;
  status: string; // e.g. "IN_DEVELOPMENT", "PLANNING", "PROTOTYPE", "COMPLETED"
  moderationStatus: 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';
  genre?: string | null;
  platform?: string | null;
  gameEngine?: string | null;
  memberCount: number;
  userRole: string; // e.g. "Founder" or "Gameplay Programmer · Member"
  isFounder: boolean;
  updatedAt: string;
}

export interface DashboardProjectsResponse {
  projects: DashboardProjectItem[];
}

export interface CreateProjectInput {
  name: string;
  description: string;
  coverUrl?: string;
  status?: string;
  genre?: string;
  platform?: string;
  gameEngine?: string;
}
