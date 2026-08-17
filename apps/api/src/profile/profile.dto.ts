import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  headline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(80)
  experienceYears?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  availability?: string;
}

export class UpdateIdentityDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializationIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toolIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gameEngineIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genreIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platformIds?: string[];
}

export class CreateExperienceDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  position: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  company: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  startDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];
}

export class UpdateExperienceDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  startDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];
}

export class CreateEducationDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  institution: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  degree: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  startDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class UpdateEducationDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  institution?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  degree?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  startDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class CreatePortfolioItemDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  title: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  description: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  role: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  gameEngine: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  genre: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  platform: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  projectUrl?: string;
}

export class UpdatePortfolioItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  role?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  gameEngine?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  genre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  platform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  projectUrl?: string;
}

export class CreateLinkDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  platform: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  displayName: string;

  @IsNotEmpty()
  @IsUrl({ require_protocol: true })
  url: string;
}

export class UpdateLinkDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  platform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  url?: string;
}

export enum ResumeVisibility {
  PUBLIC = 'Public',
  PRIVATE = 'Private',
}

export class UpdateResumeVisibilityDto {
  @IsEnum(ResumeVisibility)
  visibility: ResumeVisibility;
}
