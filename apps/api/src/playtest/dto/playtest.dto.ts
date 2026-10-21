import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsObject,
} from 'class-validator';
import { FeedbackSeverity, FeedbackStatus, Prisma } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlaytestSessionDto {
  @ApiProperty({ description: 'Title of the playtest session' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Instructions for testers' })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiPropertyOptional({ description: 'Start date of the playtest' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date of the playtest' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class UpdatePlaytestSessionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreatePlaytestFeedbackDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: FeedbackSeverity })
  @IsEnum(FeedbackSeverity)
  @IsOptional()
  severity?: FeedbackSeverity;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  systemSpecs?: Prisma.InputJsonObject;
}

export class UpdatePlaytestFeedbackDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: FeedbackSeverity })
  @IsEnum(FeedbackSeverity)
  @IsOptional()
  severity?: FeedbackSeverity;

  @ApiPropertyOptional({ enum: FeedbackStatus })
  @IsEnum(FeedbackStatus)
  @IsOptional()
  status?: FeedbackStatus;
}

export class PlaytestBuildInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  version: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  platform: string;

  @ApiPropertyOptional()
  storagePath?: string | null;

  @ApiPropertyOptional({
    description:
      'File size in bytes represented as string to avoid BigInt serialization errors',
  })
  fileSizeBytes?: string | null;

  @ApiPropertyOptional()
  fileChecksum?: string | null;

  @ApiPropertyOptional()
  releaseNotes?: string | null;

  @ApiPropertyOptional()
  buildJob?: {
    id?: string;
    commitHash?: string | null;
    branchName?: string | null;
  } | null;
}

export class PlaytestSessionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiPropertyOptional()
  playableBuildId?: string | null;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  instructions?: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  startDate?: Date | null;

  @ApiPropertyOptional()
  endDate?: Date | null;

  @ApiPropertyOptional()
  createdById?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: PlaytestBuildInfoDto })
  playableBuild?: PlaytestBuildInfoDto | null;

  @ApiPropertyOptional()
  _count?: {
    feedback: number;
  };
}
