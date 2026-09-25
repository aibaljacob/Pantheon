import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { FeedbackType, FeedbackSeverity } from '@prisma/client';

export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(FeedbackType)
  @IsOptional()
  type?: FeedbackType;

  @IsEnum(FeedbackSeverity)
  @IsOptional()
  severity?: FeedbackSeverity;
}

export class ConvertToTaskDto {
  @IsString()
  @IsOptional()
  assigneeId?: string;
  
  @IsString()
  @IsOptional()
  milestoneId?: string;
}
