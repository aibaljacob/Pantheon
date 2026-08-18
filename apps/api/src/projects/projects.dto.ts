import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  ProjectModerationStatus,
  ProjectRoleCommitment,
  ProjectRoleExperienceLevel,
  ProjectRoleStatus,
  ProjectStatus,
} from '@prisma/client';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  gameEngine?: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  gameEngine?: string;
}

export class DashboardProjectDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverUrl?: string | null;
  status: ProjectStatus;
  moderationStatus: ProjectModerationStatus;
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

export class ProjectFounderDto {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export class ProjectMemberDetailDto {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  role: string;
  joinedAt: string;
}

export class ProjectDetailResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverUrl?: string | null;
  status: ProjectStatus;
  moderationStatus: ProjectModerationStatus;
  genre?: string | null;
  platform?: string | null;
  gameEngine?: string | null;
  createdAt: string;
  updatedAt: string;
  founder: ProjectFounderDto;
  members: ProjectMemberDetailDto[];
  memberCount: number;
  isFounder: boolean;
  isMember: boolean;
}

export class CreateProjectRoleDto {
  @IsNotEmpty()
  @IsString()
  roleId: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(ProjectRoleExperienceLevel)
  experienceLevel?: ProjectRoleExperienceLevel;

  @IsOptional()
  @IsEnum(ProjectRoleCommitment)
  commitment?: ProjectRoleCommitment;

  @IsOptional()
  @IsEnum(ProjectRoleStatus)
  status?: ProjectRoleStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toolIds?: string[];
}

export class UpdateProjectRoleDto {
  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(ProjectRoleExperienceLevel)
  experienceLevel?: ProjectRoleExperienceLevel;

  @IsOptional()
  @IsEnum(ProjectRoleCommitment)
  commitment?: ProjectRoleCommitment;

  @IsOptional()
  @IsEnum(ProjectRoleStatus)
  status?: ProjectRoleStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toolIds?: string[];
}

export class ProjectRoleTaxonomyItemDto {
  id: string;
  name: string;
}

export class ProjectRoleResponseDto {
  id: string;
  projectId: string;
  roleId: string;
  roleName: string;
  title?: string | null;
  description?: string | null;
  experienceLevel: ProjectRoleExperienceLevel;
  commitment: ProjectRoleCommitment;
  status: ProjectRoleStatus;
  createdAt: string;
  updatedAt: string;
  requiredSkills: ProjectRoleTaxonomyItemDto[];
  requiredTools: ProjectRoleTaxonomyItemDto[];
}

export class DraftRoleRecommendationDto {
  roleId: string;
  roleName: string;
  title?: string | null;
  description?: string | null;
  experienceLevel: ProjectRoleExperienceLevel;
  commitment: ProjectRoleCommitment;
  skillIds: string[];
  toolIds: string[];
  requiredSkills: ProjectRoleTaxonomyItemDto[];
  requiredTools: ProjectRoleTaxonomyItemDto[];
  reasoning: string;
}

export class AiRoleRecommendationsResponseDto {
  recommendedRoles: DraftRoleRecommendationDto[];
}

export class CandidateQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  minScore?: number = 0;

  @IsOptional()
  @IsString()
  search?: string;
}

export class MatchBreakdownDto {
  roleMatch: number;
  skillMatch: number;
  toolMatch: number;
  experienceMatch: number;
  availabilityMatch: number;
  projectContextMatch: number;
  experienceUnspecified?: boolean;
}

export class CandidatePortfolioHighlightDto {
  id: string;
  title: string;
  role: string;
  gameEngine: string;
  genre: string;
  platform: string;
  coverUrl?: string | null;
  description: string;
}

export class CandidateResumeInfoDto {
  fileName: string;
  fileSize: string;
  downloadUrl?: string | null;
}

export class CandidateProfileSummaryDto {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  timezone?: string | null;
  experienceYears?: number | null;
  availability?: string | null;
  roles: string[];
  skills: string[];
  tools: string[];
  gameEngines: string[];
  portfolioHighlights: CandidatePortfolioHighlightDto[];
  resume?: CandidateResumeInfoDto | null;
}

export class RecommendedCandidateDto {
  candidate: CandidateProfileSummaryDto;
  totalScore: number;
  matchGrade: 'EXCELLENT_MATCH' | 'STRONG_MATCH' | 'GOOD_MATCH' | 'POTENTIAL_MATCH';
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  matchBreakdown: MatchBreakdownDto;
  matchedSkills: string[];
  missingSkills: string[];
  matchedTools: string[];
  missingTools: string[];
  explanation: string;
}

export class RankedCandidatesResponseDto {
  projectRoleId: string;
  projectRoleTitle: string;
  totalCandidatesScored: number;
  matchingCandidatesCount: number;
  page: number;
  limit: number;
  totalPages: number;
  candidates: RecommendedCandidateDto[];
}
