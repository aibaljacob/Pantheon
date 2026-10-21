import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GamePillarDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  description: string;
}

export class GameFeatureDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}

export class UpsertGameBlueprintDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tagline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  targetAudience?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cameraPerspective?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  artStyle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  audioTone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  networkModel?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(360)
  targetFps?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  targetResolution?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  coreLoop?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  summary?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => GamePillarDto)
  pillars?: GamePillarDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => GameFeatureDto)
  keyFeatures?: GameFeatureDto[];

  @IsOptional()
  @IsObject()
  targetSpecs?: Record<string, any>;

  @IsOptional()
  @IsObject()
  visualDirection?: Record<string, any>;

  @IsOptional()
  @IsObject()
  gameplayLoop?: Record<string, any>;

  @IsOptional()
  @IsObject()
  narrative?: Record<string, any>;
}

export class GameBlueprintResponseDto {
  id: string;
  projectId: string;
  tagline: string | null;
  targetAudience: string | null;
  cameraPerspective: string | null;
  artStyle: string | null;
  audioTone: string | null;
  networkModel: string | null;
  targetFps: number | null;
  targetResolution: string | null;
  coreLoop: string | null;
  summary: string | null;
  pillars: GamePillarDto[] | null;
  keyFeatures: GameFeatureDto[] | null;
  targetSpecs: Record<string, any> | null;
  visualDirection: Record<string, any> | null;
  gameplayLoop: Record<string, any> | null;
  narrative: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export class ApproveProductionTaskDto {
  @IsNotEmpty()
  @IsString()
  tempId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  discipline?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependsOnTempIds?: string[];
}

export class ApproveProductionPlanDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  milestoneTitle: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  milestoneDescription?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApproveProductionTaskDto)
  tasks: ApproveProductionTaskDto[];
}

export interface SkillCoverageMemberDto {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  matchedSkills: string[];
}

export interface SkillCoverageOpenRoleDto {
  id: string;
  title: string;
  openPositions: number;
  skills: string[];
}

export interface SkillCoverageCandidateRecommendationDto {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  headline: string | null;
  matchScore: number;
}

export interface SkillCoverageDisciplineDto {
  discipline: string;
  status: 'COVERED' | 'RECRUITING' | 'GAP';
  requiredSkills: string[];
  coveredByMembers: SkillCoverageMemberDto[];
  openRoles: SkillCoverageOpenRoleDto[];
  recommendedCandidatesCount: number;
  sampleCandidate?: SkillCoverageCandidateRecommendationDto | null;
}

export interface SkillCoverageResponseDto {
  totalRequiredSkills: number;
  coveredCount: number;
  recruitingCount: number;
  gapCount: number;
  coveragePercentage: number;
  disciplines: SkillCoverageDisciplineDto[];
}

export class UpdateNarrativeDto {
  @IsNotEmpty()
  @IsObject()
  narrative: Record<string, any>;
}

export class AiProposeNarrativeDto {
  @IsNotEmpty()
  @IsString()
  section: 'STORY_BIBLE' | 'CHARACTERS' | 'SCENE' | 'QUEST';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  prompt?: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}
