import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminDashboardMetricsDto {
  totalUsers: number;
  activeVerifiedUsers: number;
  totalProjects: number;
  activeProjects: number;
  totalTaxonomyEntries: number;
}

export class AdminUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  emailVerified?: string;
}

export class AdminUserItemDto {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMINISTRATOR';
  emailVerified: boolean;
  provider: string;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
  headline?: string | null;
  foundedProjectsCount: number;
  joinedProjectsCount: number;
}

export class AdminPaginatedUsersResponseDto {
  users: AdminUserItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class AdminProjectsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class AdminProjectItemDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverUrl?: string | null;
  status: string;
  genre?: string | null;
  platform?: string | null;
  gameEngine?: string | null;
  founderId: string;
  founderUsername: string;
  founderDisplayName: string;
  founderEmail: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export class AdminPaginatedProjectsResponseDto {
  projects: AdminProjectItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class AdminProjectDetailDto extends AdminProjectItemDto {
  members: {
    id: string;
    userId: string;
    username: string;
    displayName: string;
    email: string;
    avatarUrl?: string | null;
    role: string;
    joinedAt: string;
  }[];
}

export class AdminTaxonomyQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;
}

export class AdminTaxonomyItemDto {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

export class AdminPaginatedTaxonomyResponseDto {
  items: AdminTaxonomyItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class CreateTaxonomyEntryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateTaxonomyEntryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ToggleTaxonomyActiveDto {
  @IsBoolean()
  isActive: boolean;
}

export class AdminActivityItemDto {
  id: string;
  type: 'USER_REGISTERED' | 'PROJECT_CREATED' | 'MEMBER_JOINED' | 'TAXONOMY_UPDATED';
  title: string;
  description: string;
  timestamp: string;
}
