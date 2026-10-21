import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BuildPlatform } from '@prisma/client';
import { getArtifactMaxSizeBytes } from '../../build-runners/build-artifact-storage.config';

export class CreatePlayableBuildDto {
  @ApiProperty({
    description: 'Human-readable version string',
    example: 'v0.1.0',
  })
  @IsString()
  @IsNotEmpty()
  version: string;

  @ApiProperty({
    description: 'Title of the playable build release',
    example: 'Alpha Combat Prototype',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    enum: BuildPlatform,
    description: 'Platform for the playable build',
  })
  @IsEnum(BuildPlatform)
  @IsNotEmpty()
  platform: BuildPlatform;

  @ApiPropertyOptional({ description: 'Originating build job ID' })
  @IsOptional()
  @IsString()
  buildJobId?: string;

  @ApiPropertyOptional({ description: 'Associated milestone ID' })
  @IsOptional()
  @IsString()
  milestoneId?: string;

  @ApiPropertyOptional({
    description: 'Storage path/URI to the packaged build artifact',
  })
  @IsOptional()
  @IsString()
  storagePath?: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'File size must be a finite number.' },
  )
  @Min(0, { message: 'File size must be greater than or equal to 0 bytes.' })
  @Max(getArtifactMaxSizeBytes(), {
    message: 'File size exceeds maximum allowed limit.',
  })
  fileSizeBytes?: number;

  @ApiPropertyOptional({ description: 'SHA-256 checksum of the build archive' })
  @IsOptional()
  @IsString()
  fileChecksum?: string;

  @ApiPropertyOptional({ description: 'Release notes or changelog' })
  @IsOptional()
  @IsString()
  releaseNotes?: string;
}
