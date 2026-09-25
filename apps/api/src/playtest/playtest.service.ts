import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAuthorizationService } from '../tasks/project-authorization.service';
import { TasksService } from '../tasks/tasks.service';
import { CreateFeedbackDto, ConvertToTaskDto } from './dto/playtest.dto';
import { PlaytestSessionStatus, FeedbackStatus, FeedbackType } from '@prisma/client';

@Injectable()
export class PlaytestService {
  constructor(
    private prisma: PrismaService,
    private authzService: ProjectAuthorizationService,
    private tasksService: TasksService,
  ) {}

  async startSession(projectId: string, buildId: string, userId: string) {
    await this.authzService.assertCanView(projectId, userId);

    const build = await this.prisma.playableBuild.findFirst({
      where: { id: buildId, projectId },
    });

    if (!build) {
      throw new NotFoundException('Playable build not found in this project');
    }

    return this.prisma.playtestSession.create({
      data: {
        playableBuildId: buildId,
        testerId: userId,
      },
    });
  }

  async endSession(projectId: string, sessionId: string, userId: string) {
    const session = await this.prisma.playtestSession.findFirst({
      where: { id: sessionId, testerId: userId, playableBuild: { projectId } },
      include: { playableBuild: true },
    });

    if (!session) {
      throw new NotFoundException('Playtest session not found or you are not the tester');
    }

    const durationSeconds = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);

    return this.prisma.playtestSession.update({
      where: { id: sessionId },
      data: {
        status: PlaytestSessionStatus.COMPLETED,
        endedAt: new Date(),
        durationSeconds,
      },
    });
  }

  async submitFeedback(projectId: string, sessionId: string, userId: string, dto: CreateFeedbackDto) {
    const session = await this.prisma.playtestSession.findFirst({
      where: { id: sessionId, testerId: userId, playableBuild: { projectId } },
    });

    if (!session) {
      throw new NotFoundException('Playtest session not found or you are not the tester');
    }

    return this.prisma.playtestFeedback.create({
      data: {
        playtestSessionId: sessionId,
        projectId,
        authorId: userId,
        title: dto.title,
        description: dto.description,
        type: dto.type || FeedbackType.GENERAL,
        severity: dto.severity,
      },
    });
  }

  async getFeedbackForProject(projectId: string, userId: string) {
    await this.authzService.assertCanView(projectId, userId);

    return this.prisma.playtestFeedback.findMany({
      where: { projectId },
      include: {
        author: { select: { id: true, username: true } },
        playtestSession: {
          include: {
            playableBuild: { select: { id: true, version: true, title: true } }
          }
        },
        task: { select: { id: true, taskNumber: true, status: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async convertToTask(projectId: string, feedbackId: string, userId: string, dto: ConvertToTaskDto) {
    await this.authzService.assertCanManage(projectId, userId);

    const feedback = await this.prisma.playtestFeedback.findFirst({
      where: { id: feedbackId, projectId },
      include: { 
        playtestSession: {
          include: { playableBuild: true }
        }
      }
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    if (feedback.taskId) {
      throw new BadRequestException('Feedback is already converted to a task');
    }

    const buildVer = feedback.playtestSession.playableBuild.version;
    const taskDesc = `*Reported via Playtest on Build ${buildVer}*\n\n${feedback.description}`;

    // Create the task via TasksService
    const task = await this.tasksService.createTask(
      projectId,
      {
        title: feedback.title,
        description: taskDesc,
        assigneeId: dto.assigneeId,
        milestoneId: dto.milestoneId,
        priority: feedback.severity === 'CRITICAL' ? 'HIGH' : (feedback.severity === 'HIGH' ? 'HIGH' : 'MEDIUM'),
      },
      userId
    );

    // Update feedback to link the task
    const updatedFeedback = await this.prisma.playtestFeedback.update({
      where: { id: feedbackId },
      data: {
        status: FeedbackStatus.CONVERTED_TO_TASK,
        taskId: task.id,
      },
      include: {
        task: true
      }
    });

    return updatedFeedback;
  }
}
