import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import {
  UpdateTaskAssigneeDto,
  UpdateTaskMilestoneDto,
  UpdateTaskStatusDto,
} from './dto/task-actions.dto';
import { TaskResponseDto } from './dto/task-response.dto';

@ApiTags('Project Tasks')
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new task in a project' })
  @ApiResponse({ status: 201, description: 'Task created successfully with project-scoped TASK-X number' })
  @UseGuards(JwtAuthGuard)
  @Post()
  createTask(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.tasksService.createTask(projectId, dto, user.id, user.role);
  }

  @ApiOperation({ summary: 'Get all tasks for a project with optional filters and sorting' })
  @ApiResponse({ status: 200, description: 'Returns array of tasks' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  getTasks(
    @Param('projectId') projectId: string,
    @Query() query: TaskQueryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<TaskResponseDto[]> {
    return this.tasksService.getTasks(projectId, query, user?.id, user?.role);
  }

  @ApiOperation({ summary: 'Get a single task by ID' })
  @ApiResponse({ status: 200, description: 'Returns task details' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':taskId')
  getTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<TaskResponseDto> {
    return this.tasksService.getTask(projectId, taskId, user?.id, user?.role);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @UseGuards(JwtAuthGuard)
  @Patch(':taskId')
  updateTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.tasksService.updateTask(projectId, taskId, dto, user.id, user.role);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update task status' })
  @ApiResponse({ status: 200, description: 'Task status updated successfully' })
  @UseGuards(JwtAuthGuard)
  @Patch(':taskId/status')
  updateTaskStatus(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTaskStatusDto,
  ): Promise<TaskResponseDto> {
    return this.tasksService.updateTaskStatus(
      projectId,
      taskId,
      dto.status,
      user.id,
      user.role,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update task assignee' })
  @ApiResponse({ status: 200, description: 'Task assignee updated successfully' })
  @UseGuards(JwtAuthGuard)
  @Patch(':taskId/assignee')
  updateTaskAssignee(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTaskAssigneeDto,
  ): Promise<TaskResponseDto> {
    return this.tasksService.updateTaskAssignee(
      projectId,
      taskId,
      dto.assigneeId || null,
      user.id,
      user.role,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update task milestone' })
  @ApiResponse({ status: 200, description: 'Task milestone updated successfully' })
  @UseGuards(JwtAuthGuard)
  @Patch(':taskId/milestone')
  updateTaskMilestone(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTaskMilestoneDto,
  ): Promise<TaskResponseDto> {
    return this.tasksService.updateTaskMilestone(
      projectId,
      taskId,
      dto.milestoneId || null,
      user.id,
      user.role,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @UseGuards(JwtAuthGuard)
  @Delete(':taskId')
  deleteTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string }> {
    return this.tasksService.deleteTask(projectId, taskId, user.id, user.role);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get commits linked to a task' })
  @ApiResponse({ status: 200, description: 'Commits retrieved successfully' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':taskId/commits')
  getTaskCommits(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.tasksService.getTaskCommits(projectId, taskId, user?.id, user?.role);
  }
}
