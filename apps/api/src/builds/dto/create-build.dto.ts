import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BuildPlatform } from '@prisma/client';

export class CreateBuildDto {
  @ApiProperty({ enum: BuildPlatform, description: 'Target platform for the build' })
  @IsEnum(BuildPlatform)
  @IsNotEmpty()
  targetPlatform: BuildPlatform;

  @ApiPropertyOptional({ description: 'Git branch name to build from', example: 'main' })
  @IsOptional()
  @IsString()
  branchName?: string;

  @ApiPropertyOptional({ description: 'Git commit hash to build from', example: 'a1b2c3d' })
  @IsOptional()
  @IsString()
  commitHash?: string;

  @ApiPropertyOptional({ description: 'Associated milestone ID' })
  @IsOptional()
  @IsString()
  milestoneId?: string;
}
