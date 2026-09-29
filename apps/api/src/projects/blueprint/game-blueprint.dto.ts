import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GamePillarDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  description: string;
}

export class GameFeatureDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}

export class UpsertGameBlueprintDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  tagline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  targetAudience?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cameraPerspective?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  artStyle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  audioTone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  networkModel?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(360)
  targetFps?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  targetResolution?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  coreLoop?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  summary?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => GamePillarDto)
  pillars?: GamePillarDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => GameFeatureDto)
  keyFeatures?: GameFeatureDto[];

  @IsOptional()
  @IsObject()
  targetSpecs?: Record<string, any>;
}

export class GameBlueprintResponseDto {
  id: string;
  projectId: string;
  tagline: string | null;
  targetAudience: string | null;
  cameraPerspective: string | null;
  artStyle: string | null;
  audioTone: string | null;
  networkModel: string | null;
  targetFps: number | null;
  targetResolution: string | null;
  coreLoop: string | null;
  summary: string | null;
  pillars: GamePillarDto[] | null;
  keyFeatures: GameFeatureDto[] | null;
  targetSpecs: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}
