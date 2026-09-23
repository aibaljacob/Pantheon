import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BuildPlatform, BuildStatus } from '@prisma/client';

export class BuildTriggeredByUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  displayName: string;

  @ApiPropertyOptional()
  avatarUrl?: string | null;
}

export class BuildMilestoneInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;
}

export class BuildRunnerInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: BuildPlatform })
  platform: BuildPlatform;

  @ApiProperty()
  isOnline: boolean;
}

export class BuildJobResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiPropertyOptional()
  buildRunnerId?: string | null;

  @ApiPropertyOptional()
  commitHash?: string | null;

  @ApiPropertyOptional()
  branchName?: string | null;

  @ApiProperty({ enum: BuildPlatform })
  targetPlatform: BuildPlatform;

  @ApiProperty({ enum: BuildStatus })
  status: BuildStatus;

  @ApiProperty()
  triggeredById: string;

  @ApiProperty({ type: BuildTriggeredByUserDto })
  triggeredBy: BuildTriggeredByUserDto;

  @ApiPropertyOptional()
  milestoneId?: string | null;

  @ApiPropertyOptional({ type: BuildMilestoneInfoDto })
  milestone?: BuildMilestoneInfoDto | null;

  @ApiPropertyOptional({ type: BuildRunnerInfoDto })
  buildRunner?: BuildRunnerInfoDto | null;

  @ApiPropertyOptional()
  buildLogs?: string | null;

  @ApiPropertyOptional()
  errorMessage?: string | null;

  @ApiPropertyOptional()
  startedAt?: string | null;

  @ApiPropertyOptional()
  completedAt?: string | null;

  @ApiPropertyOptional({ description: 'Duration in seconds if started and completed' })
  durationSeconds?: number | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
