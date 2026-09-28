import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsObject,
} from 'class-validator';
import { FeedbackSeverity, FeedbackStatus } from '@prisma/client';
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
  systemSpecs?: Record<string, any>;
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
