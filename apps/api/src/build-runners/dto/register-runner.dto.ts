import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { BuildPlatform } from '@prisma/client';

export class RegisterRunnerDto {
  @ApiProperty({ example: 'Windows Build Server 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: BuildPlatform, example: BuildPlatform.WINDOWS })
  @IsEnum(BuildPlatform)
  platform: BuildPlatform;
}
