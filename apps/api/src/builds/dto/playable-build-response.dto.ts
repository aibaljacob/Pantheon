import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BuildPlatform } from '@prisma/client';
import { BuildMilestoneInfoDto, BuildTriggeredByUserDto } from './build-response.dto';

export class PlayableBuildResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiPropertyOptional()
  buildJobId?: string | null;

  @ApiPropertyOptional()
  milestoneId?: string | null;

  @ApiPropertyOptional({ type: BuildMilestoneInfoDto })
  milestone?: BuildMilestoneInfoDto | null;

  @ApiProperty()
  version: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: BuildPlatform })
  platform: BuildPlatform;

  @ApiPropertyOptional()
  storagePath?: string | null;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  fileSizeBytes?: number | null;

  @ApiPropertyOptional()
  fileChecksum?: string | null;

  @ApiPropertyOptional()
  releaseNotes?: string | null;

  @ApiPropertyOptional()
  uploadedById?: string | null;

  @ApiPropertyOptional({ type: BuildTriggeredByUserDto })
  uploadedBy?: BuildTriggeredByUserDto | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
