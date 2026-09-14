import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectApplicationStatus } from '@prisma/client';

export enum RespondProjectApplicationAction {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
}

export class CreateProjectApplicationDto {
  @ApiPropertyOptional({
    example: 'I have 4 years of Unreal C++ experience and would love to build the combat systems.',
    description: 'Pitch or cover note for the application',
    maxLength: 1000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  message?: string;
}

export class RespondProjectApplicationDto {
  @ApiProperty({
    enum: RespondProjectApplicationAction,
    example: RespondProjectApplicationAction.ACCEPT,
    description: 'Response action for the application',
  })
  @IsEnum(RespondProjectApplicationAction)
  @IsNotEmpty()
  action: RespondProjectApplicationAction;
}

export class ProjectApplicationResponseDto {
  @ApiProperty({ example: 'app-uuid' })
  id: string;

  @ApiProperty({ example: 'proj-uuid' })
  projectId: string;

  @ApiProperty({ example: 'role-uuid' })
  projectRoleId: string;

  @ApiProperty({ example: 'user-uuid' })
  applicantId: string;

  @ApiProperty({ enum: ProjectApplicationStatus, example: ProjectApplicationStatus.PENDING })
  status: ProjectApplicationStatus;

  @ApiPropertyOptional({ example: 'I am excited to contribute to this game.' })
  message?: string | null;

  @ApiProperty({ example: '2026-09-14T09:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-09-14T09:00:00.000Z' })
  updatedAt: string;
}

export class CandidateApplicationDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  projectRoleId: string;

  @ApiProperty({ enum: ProjectApplicationStatus })
  status: ProjectApplicationStatus;

  @ApiPropertyOptional()
  message?: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty()
  project: {
    id: string;
    name: string;
    slug: string;
    coverUrl?: string | null;
    genre?: string | null;
    platform?: string | null;
    gameEngine?: string | null;
    founder: {
      username: string;
      displayName?: string | null;
      avatarUrl?: string | null;
    };
  };

  @ApiProperty()
  projectRole: {
    id: string;
    title?: string | null;
    roleName: string;
    experienceLevel: string;
    commitment: string;
    status: string;
  };
}

export class FounderApplicationDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  projectRoleId: string;

  @ApiProperty({ enum: ProjectApplicationStatus })
  status: ProjectApplicationStatus;

  @ApiPropertyOptional()
  message?: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty()
  applicant: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    headline?: string | null;
    location?: string | null;
    experienceYears?: number | null;
    availability?: string | null;
    skills: string[];
    tools: string[];
  };

  @ApiProperty()
  projectRole: {
    id: string;
    title?: string | null;
    roleName: string;
    experienceLevel: string;
    commitment: string;
    status: string;
  };

  @ApiPropertyOptional({ example: 85 })
  matchScore?: number;

  @ApiPropertyOptional({ example: 'STRONG_MATCH' })
  matchGrade?: string;

  @ApiPropertyOptional()
  matchBreakdown?: {
    roleMatch: number;
    skillMatch: number;
    toolMatch: number;
    experienceMatch: number;
    availabilityMatch: number;
    projectContextMatch: number;
  };
}
