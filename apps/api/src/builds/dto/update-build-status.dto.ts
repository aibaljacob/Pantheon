import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BuildStatus } from '@prisma/client';

export class UpdateBuildStatusDto {
  @ApiProperty({ enum: BuildStatus, description: 'New build status' })
  @IsEnum(BuildStatus)
  @IsNotEmpty()
  status: BuildStatus;

  @ApiPropertyOptional({ description: 'Error message if status is FAILED' })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiPropertyOptional({ description: 'Build logs to append or replace' })
  @IsOptional()
  @IsString()
  buildLogs?: string;
}
