import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommitFileDto {
  @ApiProperty({ example: 'Source/Core/GameState.cpp' })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiProperty({ example: '// GameState implementation\n#include "GameState.h"' })
  @IsString()
  content: string;

  @ApiProperty({ example: 'feat(core): implement match timer and win condition logic' })
  @IsString()
  @IsNotEmpty()
  commitMessage: string;

  @ApiPropertyOptional({ example: 'main', default: 'main' })
  @IsString()
  @IsOptional()
  branch?: string;
}

export class DeleteFileDto {
  @ApiProperty({ example: 'Source/Core/OldModule.cpp' })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiProperty({ example: 'refactor: remove legacy obsolete module' })
  @IsString()
  @IsNotEmpty()
  commitMessage: string;

  @ApiPropertyOptional({ example: 'main', default: 'main' })
  @IsString()
  @IsOptional()
  branch?: string;
}

export class CreateBranchDto {
  @ApiProperty({ example: 'feature/unreal-combat-system' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'main', default: 'main' })
  @IsString()
  @IsOptional()
  sourceBranch?: string;
}

export class CreatePullRequestDto {
  @ApiProperty({ example: 'feat: Atmospheric Post-Processing & Lighting Polish' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Implements Volumetric Fog, ACES Tonemapping, and Lumen reflection overrides.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'feature/unreal-combat-system' })
  @IsString()
  @IsNotEmpty()
  sourceBranch: string;

  @ApiPropertyOptional({ example: 'main', default: 'main' })
  @IsString()
  @IsOptional()
  targetBranch?: string;
}

export class CreateReleaseDto {
  @ApiProperty({ example: 'v0.2.0-alpha' })
  @IsString()
  @IsNotEmpty()
  tagName: string;

  @ApiProperty({ example: 'Alpha Combat Milestone' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Includes core combat abilities, AI enemy waves, and initial map blockout.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'main', default: 'main' })
  @IsString()
  @IsOptional()
  targetBranch?: string;
}
