import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BuildStatus } from '@prisma/client';

export class UpdateJobDto {
  @ApiProperty({ enum: BuildStatus, example: BuildStatus.RUNNING })
  @IsEnum(BuildStatus)
  status: BuildStatus;

  @ApiPropertyOptional({ example: 'Compiling assets...' })
  @IsString()
  @IsOptional()
  buildLogs?: string;

  @ApiPropertyOptional({ example: 'Failed to compile script.gd' })
  @IsString()
  @IsOptional()
  errorMessage?: string;
}
