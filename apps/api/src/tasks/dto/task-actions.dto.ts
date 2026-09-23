import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskStatusDto {
  @IsNotEmpty()
  @IsEnum(TaskStatus)
  status: TaskStatus;
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
