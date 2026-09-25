import { Test, TestingModule } from '@nestjs/testing';
import { PlaytestService } from './playtest.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAuthorizationService } from '../tasks/project-authorization.service';
import { TasksService } from '../tasks/tasks.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FeedbackSeverity, FeedbackStatus, TaskPriority, TaskStatus } from '@prisma/client';

describe('PlaytestService', () => {
  let service: PlaytestService;
  let prisma: PrismaService;
  let authzService: ProjectAuthorizationService;
  let tasksService: TasksService;

  const mockPrisma = {
    playableBuild: { findFirst: jest.fn() },
    playtestSession: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    playtestFeedback: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    task: {
      findUnique: jest.fn(),
    },
  };

  const mockAuthzService = {
    assertCanManage: jest.fn(),
    assertCanView: jest.fn(),
  };

  const mockTasksService = {
    createTask: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaytestService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ProjectAuthorizationService, useValue: mockAuthzService },
        { provide: TasksService, useValue: mockTasksService },
      ],
    }).compile();

    service = module.get<PlaytestService>(PlaytestService);
    prisma = module.get<PrismaService>(PrismaService);
    authzService = module.get<ProjectAuthorizationService>(ProjectAuthorizationService);
    tasksService = module.get<TasksService>(TasksService);

    jest.clearAllMocks();
  });

  describe('createPlaytest', () => {
    it('creates a playtest', async () => {
      mockAuthzService.assertCanManage.mockResolvedValue({ isFounder: true });
      mockPrisma.playableBuild.findFirst.mockResolvedValue({ id: 'build-1' });
      mockPrisma.playtestSession.create.mockResolvedValue({ id: 'pt-1' });

      const res = await service.createPlaytest('proj-1', 'build-1', { title: 'Test' }, 'user-1');
      expect(res).toEqual({ id: 'pt-1' });
      expect(mockPrisma.playableBuild.findFirst).toHaveBeenCalledWith({ where: { id: 'build-1', projectId: 'proj-1' } });
    });

    it('throws NotFoundException if build not found in project', async () => {
      mockAuthzService.assertCanManage.mockResolvedValue({ isFounder: true });
      mockPrisma.playableBuild.findFirst.mockResolvedValue(null);

      await expect(service.createPlaytest('proj-1', 'build-1', { title: 'Test' }, 'user-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('createFeedback', () => {
    it('creates feedback defaulting to OPEN and resolving commitHash', async () => {
      mockAuthzService.assertCanView.mockResolvedValue({ isMember: true });
      mockPrisma.playtestSession.findFirst.mockResolvedValue({
        id: 'pt-1',
        isActive: true,
        playableBuild: { buildJob: { commitHash: 'abc1234' } },
      });
      mockPrisma.playtestFeedback.create.mockResolvedValue({ id: 'fb-1' });

      await service.createFeedback('proj-1', 'pt-1', { title: 'Bug', description: 'desc' }, 'user-1');

      expect(mockPrisma.playtestFeedback.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'OPEN',
            commitHash: 'abc1234',
            severity: 'MEDIUM',
          }),
        }),
      );
    });
  });

  describe('convertFeedbackToTask', () => {
    it('creates a task in the same project and updates feedback status', async () => {
      mockAuthzService.assertCanManage.mockResolvedValue({ isFounder: true });
      mockPrisma.playtestFeedback.findFirst.mockResolvedValue({
        id: 'fb-1',
        title: 'Bug',
        description: 'desc',
        severity: 'HIGH',
        reporterId: 'user-2',
        commitHash: 'abc1234',
        session: { playableBuild: { version: 'v1' } },
      });
      mockTasksService.createTask.mockResolvedValue({ id: 'task-1', taskNumber: 5 });

      await service.convertFeedbackToTask('proj-1', 'pt-1', 'fb-1', 'user-1');

      expect(mockTasksService.createTask).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({
          title: 'Bug',
          priority: TaskPriority.HIGH,
          status: TaskStatus.TODO,
        }),
        'user-1',
        undefined,
      );

      expect(mockPrisma.playtestFeedback.update).toHaveBeenCalledWith({
        where: { id: 'fb-1' },
        data: {
          status: FeedbackStatus.CONVERTED_TO_TASK,
          convertedTaskId: 'task-1',
        },
      });
    });

    it('returns existing task if already converted', async () => {
      mockAuthzService.assertCanManage.mockResolvedValue({ isFounder: true });
      mockPrisma.playtestFeedback.findFirst.mockResolvedValue({
        id: 'fb-1',
        convertedTaskId: 'task-1',
        session: { playableBuild: { version: 'v1' } },
      });
      mockPrisma.task.findUnique.mockResolvedValue({ id: 'task-1' });

      const res = await service.convertFeedbackToTask('proj-1', 'pt-1', 'fb-1', 'user-1');

      expect(res).toEqual({ id: 'task-1' });
      expect(mockTasksService.createTask).not.toHaveBeenCalled();
    });
  });
});
