import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { TaskPriority, TaskStatus } from '@prisma/client';

export class TaskQueryDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsUUID()
  milestoneId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'taskNumber', 'priority', 'status'])
  sortBy?: 'createdAt' | 'updatedAt' | 'taskNumber' | 'priority' | 'status' = 'taskNumber';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}
