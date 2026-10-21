import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAuthorizationService } from '../tasks/project-authorization.service';
import { TasksService } from '../tasks/tasks.service';
import {
  CreatePlaytestSessionDto,
  UpdatePlaytestSessionDto,
  CreatePlaytestFeedbackDto,
  UpdatePlaytestFeedbackDto,
  PlaytestSessionResponseDto,
} from './dto/playtest.dto';
import { FeedbackStatus, TaskPriority, TaskStatus } from '@prisma/client';
import { serializePlaytestSession } from './playtest.serializer';

@Injectable()
export class PlaytestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authzService: ProjectAuthorizationService,
    private readonly tasksService: TasksService,
  ) {}

  async createPlaytest(
    projectId: string,
    buildId: string,
    dto: CreatePlaytestSessionDto,
    userId: string,
    userRole?: string,
  ): Promise<PlaytestSessionResponseDto> {
    await this.authzService.assertCanManage(projectId, userId, userRole);

    const build = await this.prisma.playableBuild.findFirst({
      where: { id: buildId, projectId },
    });
    if (!build) {
      throw new NotFoundException('PlayableBuild not found in this project.');
    }

    const session = await this.prisma.playtestSession.create({
      data: {
        projectId,
        playableBuildId: build.id,
        title: dto.title,
        instructions: dto.instructions,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        createdById: userId,
      },
      include: {
        playableBuild: {
          include: { buildJob: true },
        },
        _count: { select: { feedback: true } },
      },
    });

    return serializePlaytestSession(
      session,
    ) as unknown as PlaytestSessionResponseDto;
  }

  async getPlaytests(
    projectId: string,
    userId?: string,
    userRole?: string,
  ): Promise<PlaytestSessionResponseDto[]> {
    await this.authzService.assertCanView(projectId, userId, userRole);

    const sessions = await this.prisma.playtestSession.findMany({
      where: { projectId },
      include: {
        playableBuild: {
          include: { buildJob: true },
        },
        _count: { select: { feedback: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map(
      (s) =>
        serializePlaytestSession(s) as unknown as PlaytestSessionResponseDto,
    );
  }

  async getPlaytest(
    projectId: string,
    playtestId: string,
    userId?: string,
    userRole?: string,
  ): Promise<PlaytestSessionResponseDto> {
    await this.authzService.assertCanView(projectId, userId, userRole);

    const session = await this.prisma.playtestSession.findFirst({
      where: { id: playtestId, projectId },
      include: {
        playableBuild: {
          include: { buildJob: true },
        },
        _count: { select: { feedback: true } },
      },
    });

    if (!session) throw new NotFoundException('Playtest session not found.');
    return serializePlaytestSession(
      session,
    ) as unknown as PlaytestSessionResponseDto;
  }

  async updatePlaytest(
    projectId: string,
    playtestId: string,
    dto: UpdatePlaytestSessionDto,
    userId: string,
    userRole?: string,
  ): Promise<PlaytestSessionResponseDto> {
    await this.authzService.assertCanManage(projectId, userId, userRole);

    const session = await this.prisma.playtestSession.findFirst({
      where: { id: playtestId, projectId },
    });
    if (!session) throw new NotFoundException('Playtest session not found.');

    const updated = await this.prisma.playtestSession.update({
      where: { id: playtestId },
      data: {
        title: dto.title,
        instructions: dto.instructions,
        startDate:
          dto.startDate !== undefined
            ? dto.startDate
              ? new Date(dto.startDate)
              : null
            : undefined,
        endDate:
          dto.endDate !== undefined
            ? dto.endDate
              ? new Date(dto.endDate)
              : null
            : undefined,
        isActive: dto.isActive,
      },
      include: {
        playableBuild: {
          include: { buildJob: true },
        },
        _count: { select: { feedback: true } },
      },
    });

    return serializePlaytestSession(
      updated,
    ) as unknown as PlaytestSessionResponseDto;
  }

  async deletePlaytest(
    projectId: string,
    playtestId: string,
    userId: string,
    userRole?: string,
  ) {
    await this.authzService.assertCanManage(projectId, userId, userRole);

    const session = await this.prisma.playtestSession.findFirst({
      where: { id: playtestId, projectId },
    });
    if (!session) throw new NotFoundException('Playtest session not found.');

    await this.prisma.playtestSession.delete({
      where: { id: playtestId },
    });
    return { success: true };
  }

  // ==========================================
  // FEEDBACK
  // ==========================================

  async createFeedback(
    projectId: string,
    playtestId: string,
    dto: CreatePlaytestFeedbackDto,
    userId: string,
    userRole?: string,
  ) {
    // Only members or active participants can submit feedback (must be able to view)
    await this.authzService.assertCanView(projectId, userId, userRole);
    // Extra validation: ensure the user is an active member or admin. For public projects, we allow logged-in users?
    // Based on requirements: "unrelated user cannot submit private-project feedback". `assertCanView` handles private project access.
    // For now, if they can view the playtest, they can submit feedback if logged in.

    const session = await this.prisma.playtestSession.findFirst({
      where: { id: playtestId, projectId },
      include: { playableBuild: { include: { buildJob: true } } },
    });

    if (!session) throw new NotFoundException('Playtest session not found.');
    if (!session.isActive)
      throw new BadRequestException('Playtest session is inactive.');
    if (session.startDate && new Date() < session.startDate)
      throw new BadRequestException('Playtest has not started.');
    if (session.endDate && new Date() > session.endDate)
      throw new BadRequestException('Playtest has ended.');

    const commitHash = session.playableBuild?.buildJob?.commitHash || null;

    return this.prisma.playtestFeedback.create({
      data: {
        sessionId: playtestId,
        reporterId: userId,
        title: dto.title,
        description: dto.description,
        severity: dto.severity || 'MEDIUM',
        status: 'OPEN',
        systemSpecs: dto.systemSpecs || {},
        commitHash,
      },
    });
  }

  async getFeedbackList(
    projectId: string,
    playtestId: string,
    userId: string,
    userRole?: string,
  ) {
    // Only managers/admins can view all feedback
    await this.authzService.assertCanManage(projectId, userId, userRole);

    return this.prisma.playtestFeedback.findMany({
      where: { session: { id: playtestId, projectId } },
      include: {
        reporter: { select: { id: true, username: true } },
        convertedTask: { select: { id: true, taskNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateFeedback(
    projectId: string,
    playtestId: string,
    feedbackId: string,
    dto: UpdatePlaytestFeedbackDto,
    userId: string,
    userRole?: string,
  ) {
    await this.authzService.assertCanManage(projectId, userId, userRole);

    const feedback = await this.prisma.playtestFeedback.findFirst({
      where: { id: feedbackId, session: { id: playtestId, projectId } },
    });
    if (!feedback) throw new NotFoundException('Feedback not found.');

    return this.prisma.playtestFeedback.update({
      where: { id: feedbackId },
      data: {
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        status: dto.status,
      },
    });
  }

  async convertFeedbackToTask(
    projectId: string,
    playtestId: string,
    feedbackId: string,
    userId: string,
    userRole?: string,
  ) {
    await this.authzService.assertCanManage(projectId, userId, userRole);

    const feedback = await this.prisma.playtestFeedback.findFirst({
      where: { id: feedbackId, session: { id: playtestId, projectId } },
      include: {
        session: { include: { playableBuild: true } },
      },
    });

    if (!feedback) throw new NotFoundException('Feedback not found.');
    if (feedback.convertedTaskId) {
      return this.prisma.task.findUnique({
        where: { id: feedback.convertedTaskId },
      });
    }

    const taskTitle = feedback.title;
    const taskDescription = `**Playtest Feedback**\nSeverity: ${feedback.severity}\nReporter: ${feedback.reporterId || 'Anonymous'}\nBuild: ${feedback.session.playableBuild?.version || 'N/A'}\nCommit: ${feedback.commitHash || 'N/A'}\n\n${feedback.description}`;

    // Map severity to Priority roughly
    let priority: TaskPriority = TaskPriority.MEDIUM;
    if (feedback.severity === 'LOW') priority = TaskPriority.LOW;
    if (feedback.severity === 'HIGH') priority = TaskPriority.HIGH;
    if (feedback.severity === 'CRITICAL') priority = TaskPriority.CRITICAL;

    const task = await this.tasksService.createTask(
      projectId,
      {
        title: taskTitle.substring(0, 150),
        description: taskDescription.substring(0, 5000),
        priority,
        status: TaskStatus.TODO,
      },
      userId,
      userRole,
    );

    await this.prisma.playtestFeedback.update({
      where: { id: feedbackId },
      data: {
        status: FeedbackStatus.CONVERTED_TO_TASK,
        convertedTaskId: task.id,
      },
    });

    return task;
  }
}
