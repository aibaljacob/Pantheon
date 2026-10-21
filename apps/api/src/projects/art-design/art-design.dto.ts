import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  ArtProposalCategory,
  ArtProposalStatus,
  ArtVoteType,
  DesignAssetCategory,
  DesignAssetStatus,
  TaskPriority,
  TaskType,
} from '@prisma/client';

export {
  ArtProposalCategory,
  ArtProposalStatus,
  ArtVoteType,
  DesignAssetCategory,
  DesignAssetStatus,
};

export class CreateArtProposalDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  title: string;

  @IsNotEmpty()
  @IsEnum(ArtProposalCategory)
  category: ArtProposalCategory;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  rationale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  designNotes?: string;

  @IsOptional()
  @IsArray()
  paletteColors?: any[];

  @IsOptional()
  @IsArray()
  referenceImages?: any[];
}

export class UpdateArtProposalDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsEnum(ArtProposalCategory)
  category?: ArtProposalCategory;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  rationale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  designNotes?: string;

  @IsOptional()
  @IsArray()
  referenceImages?: any[];
}

export class VoteArtProposalDto {
  @IsNotEmpty()
  @IsEnum(ArtVoteType)
  voteType: ArtVoteType;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  feedback?: string;
}

export class CommentArtProposalDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  content: string;
}

export class ReviseArtProposalDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  revisionNotes: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  rationale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  designNotes?: string;

  @IsOptional()
  @IsArray()
  paletteColors?: any[];

  @IsOptional()
  @IsArray()
  referenceImages?: any[];
}

export enum FounderDecisionType {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class FounderDecisionDto {
  @IsNotEmpty()
  @IsEnum(FounderDecisionType)
  decision: FounderDecisionType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  decisionNotes?: string;
}

export class ConvertProposalToTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsUUID()
  milestoneId?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}

export class CreateDesignAssetDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  title: string;

  @IsNotEmpty()
  @IsEnum(DesignAssetCategory)
  category: DesignAssetCategory;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsNotEmpty()
  @IsString()
  fileUrl: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  sourceDetails?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  creatorDetails?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  licenseDetails?: string;

  @IsOptional()
  @IsArray()
  paletteColors?: any[];

  @IsOptional()
  @IsUUID()
  proposalId?: string;
}

export class UpdateDesignAssetDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsEnum(DesignAssetCategory)
  category?: DesignAssetCategory;

  @IsOptional()
  @IsEnum(DesignAssetStatus)
  status?: DesignAssetStatus;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  sourceDetails?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  creatorDetails?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  licenseDetails?: string;

  @IsOptional()
  @IsArray()
  paletteColors?: any[];
}
