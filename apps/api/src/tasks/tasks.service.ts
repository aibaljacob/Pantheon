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
import { Prisma, TaskPriority, TaskStatus, TaskType } from '@prisma/client';

import { NotificationsService } from '../notifications/notifications.service';

const TASK_INCLUDE = {
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
  dependencies: {
    include: {
      dependsOnTask: {
        select: { id: true, taskNumber: true, title: true, status: true },
      },
    },
  },
  dependents: {
    include: {
      task: {
        select: { id: true, taskNumber: true, title: true, status: true },
      },
    },
  },
} satisfies Prisma.TaskInclude;

export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: typeof TASK_INCLUDE;
}>;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authzService: ProjectAuthorizationService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private mapTaskToResponse(task: TaskWithRelations): TaskResponseDto {
    return {
      id: task.id,
      projectId: task.projectId,
      taskNumber: task.taskNumber,
      taskCode: `TASK-${task.taskNumber}`,
      title: task.title,
      description: task.description,
      type: task.type,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      blockedReason: task.blockedReason || null,
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
      dependencies: Array.isArray(task.dependencies)
        ? task.dependencies.map((d) => ({
            id: d.dependsOnTask.id,
            taskNumber: d.dependsOnTask.taskNumber,
            taskCode: `TASK-${d.dependsOnTask.taskNumber}`,
            title: d.dependsOnTask.title,
            status: d.dependsOnTask.status,
          }))
        : [],
      dependents: Array.isArray(task.dependents)
        ? task.dependents.map((d) => ({
            id: d.task.id,
            taskNumber: d.task.taskNumber,
            taskCode: `TASK-${d.task.taskNumber}`,
            title: d.task.title,
            status: d.task.status,
          }))
        : [],
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  private async checkCircularDependency(
    taskId: string,
    dependsOnTaskId: string,
  ): Promise<void> {
    const visited = new Set<string>();
    const queue: string[] = [dependsOnTaskId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (currentId === taskId) {
        throw new BadRequestException(
          'Circular dependency detected. A task cannot depend on a task that depends on it.',
        );
      }
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const upstream = await this.prisma.taskDependency.findMany({
        where: { taskId: currentId },
        select: { dependsOnTaskId: true },
      });
      for (const dep of upstream) {
        queue.push(dep.dependsOnTaskId);
      }
    }
  }

  async createTask(
    projectId: string,
    dto: CreateTaskDto,
    userId: string,
    userRole?: string,
  ): Promise<TaskResponseDto> {
    const { project } = await this.authzService.assertCanManage(
      projectId,
      userId,
      userRole,
    );

    if (dto.assigneeId) {
      await this.authzService.assertActiveMemberForAssignment(
        project.id,
        dto.assigneeId,
      );
    }

    if (dto.milestoneId) {
      const milestone = await this.prisma.milestone.findFirst({
        where: { id: dto.milestoneId, projectId: project.id },
      });
      if (!milestone) {
        throw new BadRequestException(
          'Specified milestone does not exist in this project.',
        );
      }
    }

    if (dto.dependencyTaskIds && dto.dependencyTaskIds.length > 0) {
      const distinctIds = Array.from(new Set(dto.dependencyTaskIds));
      const found = await this.prisma.task.findMany({
        where: { id: { in: distinctIds }, projectId: project.id },
        select: { id: true },
      });
      if (found.length !== distinctIds.length) {
        throw new BadRequestException(
          'One or more prerequisite tasks do not exist in this project.',
        );
      }
    }

    // Allocate safe task number with collision retry
    const maxRetries = 3;
    let createdTask: TaskWithRelations | null = null;

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
            type: dto.type || TaskType.FEATURE,
            priority: dto.priority || TaskPriority.MEDIUM,
            status: dto.status || TaskStatus.TODO,
            dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
            blockedReason: dto.blockedReason?.trim() || null,
            milestoneId: dto.milestoneId || null,
            assigneeId: dto.assigneeId || null,
          },
          include: TASK_INCLUDE,
        });
        break;
      } catch (err: unknown) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          // Unique constraint collision on [projectId, taskNumber], retry
          if (attempt === maxRetries - 1) {
            throw new BadRequestException(
              'Could not allocate unique task number. Please try again.',
            );
          }
          continue;
        }
        throw err;
      }
    }

    if (!createdTask) {
      throw new BadRequestException('Failed to create task.');
    }

    if (dto.dependencyTaskIds && dto.dependencyTaskIds.length > 0) {
      const distinctIds = Array.from(new Set(dto.dependencyTaskIds));
      await this.prisma.taskDependency.createMany({
        data: distinctIds.map((depId) => ({
          taskId: createdTask.id,
          dependsOnTaskId: depId,
        })),
      });
      return this.getTask(projectId, createdTask.id, userId, userRole);
    }

    if (createdTask.assigneeId) {
      await this.notificationsService.createNotification({
        userId: createdTask.assigneeId,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned',
        message: `You have been assigned to task TASK-${createdTask.taskNumber}: ${createdTask.title}`,
        entityType: 'Task',
        entityId: createdTask.id,
      });
    }

    return this.mapTaskToResponse(createdTask);
  }

  async getTasks(
    projectId: string,
    query: TaskQueryDto,
    userId?: string,
    userRole?: string,
  ): Promise<TaskResponseDto[]> {
    const { project } = await this.authzService.assertCanView(
      projectId,
      userId,
      userRole,
    );

    const where: Prisma.TaskWhereInput = {
      projectId: project.id,
    };

    if (query.type) {
      where.type = query.type;
    }

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
      include: TASK_INCLUDE,
    });

    return tasks.map((t) => this.mapTaskToResponse(t));
  }

  async getTask(
    projectId: string,
    taskId: string,
    userId?: string,
    userRole?: string,
  ): Promise<TaskResponseDto> {
    const { project } = await this.authzService.assertCanView(
      projectId,
      userId,
      userRole,
    );

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId: project.id },
      include: TASK_INCLUDE,
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
    const { project } = await this.authzService.assertCanView(
      projectId,
      userId,
      userRole,
    );

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
      dto.type === undefined &&
      dto.priority === undefined &&
      dto.dueDate === undefined &&
      dto.assigneeId === undefined &&
      dto.milestoneId === undefined &&
      dto.dependencyTaskIds === undefined;

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
        throw new ForbiddenException(
          'Only the founder or administrator can reassign tasks or change milestones.',
        );
      }
    }

    if (dto.assigneeId) {
      await this.authzService.assertActiveMemberForAssignment(
        project.id,
        dto.assigneeId,
      );
    }

    if (dto.milestoneId) {
      const milestone = await this.prisma.milestone.findFirst({
        where: { id: dto.milestoneId, projectId: project.id },
      });
      if (!milestone) {
        throw new BadRequestException(
          'Specified milestone does not exist in this project.',
        );
      }
    }

    if (dto.dependencyTaskIds !== undefined) {
      const distinctIds = Array.from(new Set(dto.dependencyTaskIds));
      if (distinctIds.includes(taskId)) {
        throw new BadRequestException('A task cannot depend on itself.');
      }

      if (distinctIds.length > 0) {
        const found = await this.prisma.task.findMany({
          where: { id: { in: distinctIds }, projectId: project.id },
          select: { id: true },
        });
        if (found.length !== distinctIds.length) {
          throw new BadRequestException(
            'One or more prerequisite tasks do not exist in this project.',
          );
        }

        for (const depId of distinctIds) {
          await this.checkCircularDependency(taskId, depId);
        }
      }

      await this.prisma.taskDependency.deleteMany({
        where: { taskId },
      });

      if (distinctIds.length > 0) {
        await this.prisma.taskDependency.createMany({
          data: distinctIds.map((depId) => ({
            taskId,
            dependsOnTaskId: depId,
          })),
        });
      }
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: dto.title !== undefined ? dto.title.trim() : undefined,
        description:
          dto.description !== undefined
            ? dto.description.trim() || null
            : undefined,
        type: dto.type !== undefined ? dto.type : undefined,
        status: dto.status !== undefined ? dto.status : undefined,
        priority: dto.priority !== undefined ? dto.priority : undefined,
        dueDate:
          dto.dueDate !== undefined
            ? dto.dueDate
              ? new Date(dto.dueDate)
              : null
            : undefined,
        blockedReason:
          dto.blockedReason !== undefined
            ? dto.blockedReason
              ? dto.blockedReason.trim()
              : null
            : undefined,
        assigneeId: dto.assigneeId !== undefined ? dto.assigneeId : undefined,
        milestoneId:
          dto.milestoneId !== undefined ? dto.milestoneId : undefined,
      },
      include: TASK_INCLUDE,
    });

    if (dto.assigneeId && dto.assigneeId !== existing.assigneeId) {
      await this.notificationsService.createNotification({
        userId: dto.assigneeId,
        type: 'TASK_ASSIGNED',
        title: 'Task Reassigned',
        message: `You have been assigned to task TASK-${existing.taskNumber}: ${existing.title}`,
        entityType: 'Task',
        entityId: existing.id,
      });
    }

    return this.mapTaskToResponse(updated);
  }

  async updateTaskStatus(
    projectId: string,
    taskId: string,
    status: TaskStatus,
    userId: string,
    userRole?: string,
    blockedReason?: string | null,
  ): Promise<TaskResponseDto> {
    return this.updateTask(
      projectId,
      taskId,
      { status, blockedReason },
      userId,
      userRole,
    );
  }

  async addDependency(
    projectId: string,
    taskId: string,
    dependsOnTaskId: string,
    userId: string,
    userRole?: string,
  ): Promise<TaskResponseDto> {
    const { project } = await this.authzService.assertCanView(
      projectId,
      userId,
      userRole,
    );

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId: project.id },
    });
    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    await this.authzService.assertCanUpdateTask(
      project.id,
      task.assigneeId,
      userId,
      userRole,
      false,
    );

    if (taskId === dependsOnTaskId) {
      throw new BadRequestException('A task cannot depend on itself.');
    }

    const targetTask = await this.prisma.task.findFirst({
      where: { id: dependsOnTaskId, projectId: project.id },
    });
    if (!targetTask) {
      throw new BadRequestException(
        'Prerequisite task does not exist in this project.',
      );
    }

    const existing = await this.prisma.taskDependency.findUnique({
      where: {
        taskId_dependsOnTaskId: { taskId, dependsOnTaskId },
      },
    });
    if (existing) {
      throw new BadRequestException(
        'This dependency relationship already exists.',
      );
    }

    await this.checkCircularDependency(taskId, dependsOnTaskId);

    await this.prisma.taskDependency.create({
      data: {
        taskId,
        dependsOnTaskId,
      },
    });

    return this.getTask(projectId, taskId, userId, userRole);
  }

  async removeDependency(
    projectId: string,
    taskId: string,
    dependsOnTaskId: string,
    userId: string,
    userRole?: string,
  ): Promise<TaskResponseDto> {
    const { project } = await this.authzService.assertCanView(
      projectId,
      userId,
      userRole,
    );

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId: project.id },
    });
    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    await this.authzService.assertCanUpdateTask(
      project.id,
      task.assigneeId,
      userId,
      userRole,
      false,
    );

    const dep = await this.prisma.taskDependency.findUnique({
      where: {
        taskId_dependsOnTaskId: { taskId, dependsOnTaskId },
      },
    });
    if (!dep) {
      throw new NotFoundException('Dependency relationship not found.');
    }

    await this.prisma.taskDependency.delete({
      where: {
        taskId_dependsOnTaskId: { taskId, dependsOnTaskId },
      },
    });

    return this.getTask(projectId, taskId, userId, userRole);
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
    return this.updateTask(
      projectId,
      taskId,
      { milestoneId },
      userId,
      userRole,
    );
  }

  async deleteTask(
    projectId: string,
    taskId: string,
    userId: string,
    userRole?: string,
  ): Promise<{ success: boolean; message: string }> {
    const { project } = await this.authzService.assertCanManage(
      projectId,
      userId,
      userRole,
    );

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

  async unassignTasksForMember(
    projectId: string,
    memberUserId: string,
  ): Promise<void> {
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

  async getTaskCommits(
    projectId: string,
    taskId: string,
    userId?: string,
    userRole?: string,
  ) {
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
          },
        },
      },
    });

    return commits.map((commit) => ({
      id: commit.id,
      taskId: commit.taskId,
      commitHash: commit.commitHash,
      commitMsg: commit.commitMsg,
      authorName: commit.authorName,
      branchName: commit.branchName,
      timestamp: commit.timestamp,
      author: commit.author
        ? {
            id: commit.author.id,
            username: commit.author.username,
            avatarUrl: commit.author.profile?.avatarUrl,
            displayName: commit.author.profile?.displayName,
          }
        : null,
    }));
  }
}
