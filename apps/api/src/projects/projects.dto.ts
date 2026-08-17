import { ProjectStatus } from '@prisma/client';

export class DashboardProjectDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverUrl?: string | null;
  status: ProjectStatus;
  genre?: string | null;
  platform?: string | null;
  gameEngine?: string | null;
  memberCount: number;
  userRole: string; // e.g. "Founder" or "Gameplay Programmer · Member"
  isFounder: boolean;
  updatedAt: string;
}

export class DashboardProjectsResponseDto {
  projects: DashboardProjectDto[];
}
