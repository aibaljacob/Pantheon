import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAuthorizationService } from './project-authorization.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authzService: ProjectAuthorizationService,
  ) {}

  private mapTaskToResponse(task: any): TaskResponseDto {
    return {
      id: task.id,
      projectId: task.projectId,
      taskNumber: task.taskNumber,
      taskCode: `TASK-${task.taskNumber}`,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId,
      assignee: task.assignee
        ? {
            id: task.assignee.id,
            username: task.assignee.username,
            displayName:
              task.assignee.profile?.displayName || task.assignee.username,
            avatarUrl: task.assignee.profile?.avatarUrl,
          }
        : null,
      milestoneId: task.milestoneId,
      milestone: task.milestone
        ? {
            id: task.milestone.id,
            title: task.milestone.title,
          }
        : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  async createTask(
    projectId: string,
    dto: CreateTaskDto,
    userId: string,
    userRole?: string,
  ): Promise<TaskResponseDto> {
    const { project } = await this.authzService.assertCanManage(projectId, userId, userRole);

    if (dto.assigneeId) {
      await this.authzService.assertActiveMemberForAssignment(project.id, dto.assigneeId);
    }

    if (dto.milestoneId) {
      const milestone = await this.prisma.milestone.findFirst({
        where: { id: dto.milestoneId, projectId: project.id },
      });
      if (!milestone) {
        throw new BadRequestException('Specified milestone does not exist in this project.');
      }
    }

    // Allocate safe task number with collision retry
    const maxRetries = 3;
    let createdTask: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const lastTask = await this.prisma.task.findFirst({
          where: { projectId: project.id },
          orderBy: { taskNumber: 'desc' },
          select: { taskNumber: true },
        });

        const nextNumber = (lastTask?.taskNumber || 0) + 1;

        createdTask = await this.prisma.task.create({
          data: {
            projectId: project.id,
            taskNumber: nextNumber,
            title: dto.title.trim(),
            description: dto.description?.trim() || null,
            priority: dto.priority || TaskPriority.MEDIUM,
            status: dto.status || TaskStatus.TODO,
            milestoneId: dto.milestoneId || null,
            assigneeId: dto.assigneeId || null,
          },
          include: {
            assignee: {
              select: {
                id: true,
                username: true,
                profile: {
                  select: { displayName: true, avatarUrl: true },
                },
              },
            },
            milestone: {
              select: { id: true, title: true },
            },
          },
        });
        break;
      } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          // Unique constraint collision on [projectId, taskNumber], retry
          if (attempt === maxRetries - 1) {
            throw new BadRequestException('Could not allocate unique task number. Please try again.');
          }
          continue;
        }
        throw err;
      }
    }

    return this.mapTaskToResponse(createdTask);
  }

  async getTasks(
    projectId: string,
    query: TaskQueryDto,
    userId?: string,
    userRole?: string,
  ): Promise<TaskResponseDto[]> {
    const { project } = await this.authzService.assertCanView(projectId, userId, userRole);

    const where: Prisma.TaskWhereInput = {
      projectId: project.id,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
    }

    if (query.milestoneId) {
      where.milestoneId = query.milestoneId;
    }

    const sortBy = query.sortBy || 'taskNumber';
    const sortOrder = query.sortOrder || 'asc';

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            profile: {
              select: { displayName: true, avatarUrl: true },
            },
          },
        },
        milestone: {
          select: { id: true, title: true },
        },
      },
    });

    return tasks.map((t) => this.mapTaskToResponse(t));
  }

  async getTask(
    projectId: string,
    taskId: string,
    userId?: string,
    userRole?: string,
  ): Promise<TaskResponseDto> {
    const { project } = await this.authzService.assertCanView(projectId, userId, userRole);

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId: project.id },
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            profile: {
              select: { displayName: true, avatarUrl: true },
            },
          },
        },
        milestone: {
          select: { id: true, title: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    return this.mapTaskToResponse(task);
  }

  async updateTask(
    projectId: string,
    taskId: string,
    dto: UpdateTaskDto,
    userId: string,
    userRole?: string,
  ): Promise<TaskResponseDto> {
    const { project } = await this.authzService.assertCanView(projectId, userId, userRole);

    const existing = await this.prisma.task.findFirst({
      where: { id: taskId, projectId: project.id },
    });

    if (!existing) {
      throw new NotFoundException('Task not found.');
    }

    const isStatusOnly =
      dto.status !== undefined &&
      dto.title === undefined &&
      dto.description === undefined &&
      dto.priority === undefined &&
      dto.assigneeId === undefined &&
      dto.milestoneId === undefined;

    await this.authzService.assertCanUpdateTask(
      project.id,
      existing.assigneeId,
      userId,
      userRole,
      isStatusOnly,
    );

    // Only founder/admin can change assignee or milestone
    if (dto.assigneeId !== undefined || dto.milestoneId !== undefined) {
      const { isFounder, isAdmin } = await this.authzService.getProjectAccess(
        project.id,
        userId,
        userRole,
      );
      if (!isFounder && !isAdmin) {
        throw new ForbiddenException('Only the founder or administrator can reassign tasks or change milestones.');
      }
    }

    if (dto.assigneeId) {
      await this.authzService.assertActiveMemberForAssignment(project.id, dto.assigneeId);
    }

    if (dto.milestoneId) {
      const milestone = await this.prisma.milestone.findFirst({
        where: { id: dto.milestoneId, projectId: project.id },
      });
      if (!milestone) {
        throw new BadRequestException('Specified milestone does not exist in this project.');
      }
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: dto.title !== undefined ? dto.title.trim() : undefined,
        description:
          dto.description !== undefined ? dto.description.trim() || null : undefined,
        status: dto.status !== undefined ? dto.status : undefined,
        priority: dto.priority !== undefined ? dto.priority : undefined,
        assigneeId: dto.assigneeId !== undefined ? dto.assigneeId : undefined,
        milestoneId: dto.milestoneId !== undefined ? dto.milestoneId : undefined,
      },
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            profile: {
              select: { displayName: true, avatarUrl: true },
            },
          },
        },
        milestone: {
          select: { id: true, title: true },
        },
      },
    });

    return this.mapTaskToResponse(updated);
  }

  async updateTaskStatus(
    projectId: string,
    taskId: string,
    status: TaskStatus,
    userId: string,
    userRole?: string,
  ): Promise<TaskResponseDto> {
    return this.updateTask(projectId, taskId, { status }, userId, userRole);
  }

  async updateTaskAssignee(
    projectId: string,
    taskId: string,
    assigneeId: string | null,
    userId: string,
    userRole?: string,
  ): Promise<TaskResponseDto> {
    return this.updateTask(projectId, taskId, { assigneeId }, userId, userRole);
  }

  async updateTaskMilestone(
    projectId: string,
    taskId: string,
    milestoneId: string | null,
    userId: string,
    userRole?: string,
  ): Promise<TaskResponseDto> {
    return this.updateTask(projectId, taskId, { milestoneId }, userId, userRole);
  }

  async deleteTask(
    projectId: string,
    taskId: string,
    userId: string,
    userRole?: string,
  ): Promise<{ success: boolean; message: string }> {
    const { project } = await this.authzService.assertCanManage(projectId, userId, userRole);

    const existing = await this.prisma.task.findFirst({
      where: { id: taskId, projectId: project.id },
    });

    if (!existing) {
      throw new NotFoundException('Task not found.');
    }

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    return { success: true, message: 'Task deleted successfully.' };
  }

  async unassignTasksForMember(projectId: string, memberUserId: string): Promise<void> {
    await this.prisma.task.updateMany({
      where: {
        projectId,
        assigneeId: memberUserId,
      },
      data: {
        assigneeId: null,
      },
    });
  }

  async getTaskCommits(projectId: string, taskId: string, userId?: string, userRole?: string) {
    await this.authzService.assertCanView(projectId, userId, userRole);

    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
        projectId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    const commits = await this.prisma.taskCommitLink.findMany({
      where: { taskId },
      orderBy: { timestamp: 'desc' },
      include: {
        author: {
          include: {
            profile: true,
          }
        }
      }
    });

    return commits.map(commit => ({
      id: commit.id,
      taskId: commit.taskId,
      commitHash: commit.commitHash,
      commitMsg: commit.commitMsg,
      authorName: commit.authorName,
      branchName: commit.branchName,
      timestamp: commit.timestamp,
      author: commit.author ? {
        id: commit.author.id,
        username: commit.author.username,
        avatarUrl: commit.author.profile?.avatarUrl,
        displayName: commit.author.profile?.displayName,
      } : null,
    }));
  }
}
