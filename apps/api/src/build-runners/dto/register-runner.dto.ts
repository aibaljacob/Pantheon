import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { BuildPlatform } from '@prisma/client';

export class RegisterRunnerDto {
  @ApiProperty({ example: 'Windows Build Server 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: BuildPlatform, example: BuildPlatform.WINDOWS })
  @IsEnum(BuildPlatform)
  platform: BuildPlatform;

  @ApiPropertyOptional({
    description: 'Initial/home project ID to associate runner with',
    example: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Server bootstrap secret required to register a runner',
  })
  @IsString()
  @IsOptional()
  bootstrapSecret?: string;
}
