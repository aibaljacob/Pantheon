import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskStatusDto {
  @IsNotEmpty()
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  blockedReason?: string | null;
}

export class UpdateTaskAssigneeDto {
  @IsOptional()
  @IsUUID()
  assigneeId?: string | null;
}

export class UpdateTaskMilestoneDto {
  @IsOptional()
  @IsUUID()
  milestoneId?: string | null;
}

export class AddTaskDependencyDto {
  @IsNotEmpty()
  @IsUUID()
  dependsOnTaskId: string;
}
