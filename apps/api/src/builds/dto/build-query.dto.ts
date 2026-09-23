import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BuildPlatform, BuildStatus } from '@prisma/client';

export class BuildQueryDto {
  @ApiPropertyOptional({ enum: BuildStatus, description: 'Filter by build status' })
  @IsOptional()
  @IsEnum(BuildStatus)
  status?: BuildStatus;

  @ApiPropertyOptional({ enum: BuildPlatform, description: 'Filter by target platform' })
  @IsOptional()
  @IsEnum(BuildPlatform)
  platform?: BuildPlatform;

  @ApiPropertyOptional({ description: 'Filter by milestone ID' })
  @IsOptional()
  @IsString()
  milestoneId?: string;
}
