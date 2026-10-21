import { Test, TestingModule } from '@nestjs/testing';
import { PlaytestService } from './playtest.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAuthorizationService } from '../tasks/project-authorization.service';
import { TasksService } from '../tasks/tasks.service';
import { NotFoundException } from '@nestjs/common';
import { FeedbackStatus, TaskPriority, TaskStatus } from '@prisma/client';

describe('PlaytestService', () => {
  let service: PlaytestService;

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

    jest.clearAllMocks();
  });

  describe('createPlaytest', () => {
    it('creates a playtest', async () => {
      mockAuthzService.assertCanManage.mockResolvedValue({ isFounder: true });
      mockPrisma.playableBuild.findFirst.mockResolvedValue({ id: 'build-1' });
      mockPrisma.playtestSession.create.mockResolvedValue({ id: 'pt-1' });

      const res = await service.createPlaytest(
        'proj-1',
        'build-1',
        { title: 'Test' },
        'user-1',
      );
      expect(res).toEqual({ id: 'pt-1' });
      expect(mockPrisma.playableBuild.findFirst).toHaveBeenCalledWith({
        where: { id: 'build-1', projectId: 'proj-1' },
      });
    });

    it('throws NotFoundException if build not found in project', async () => {
      mockAuthzService.assertCanManage.mockResolvedValue({ isFounder: true });
      mockPrisma.playableBuild.findFirst.mockResolvedValue(null);

      await expect(
        service.createPlaytest(
          'proj-1',
          'build-1',
          { title: 'Test' },
          'user-1',
        ),
      ).rejects.toThrow(NotFoundException);
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

      await service.createFeedback(
        'proj-1',
        'pt-1',
        { title: 'Bug', description: 'desc' },
        'user-1',
      );

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
      mockTasksService.createTask.mockResolvedValue({
        id: 'task-1',
        taskNumber: 5,
      });

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

      const res = await service.convertFeedbackToTask(
        'proj-1',
        'pt-1',
        'fb-1',
        'user-1',
      );

      expect(res).toEqual({ id: 'task-1' });
      expect(mockTasksService.createTask).not.toHaveBeenCalled();
    });
  });

  describe('BUG-PLAYTEST-01: BigInt Serialization & Retrieval', () => {
    const mockSessionWithBigIntBuild = {
      id: 'pt-100',
      projectId: 'proj-1',
      playableBuildId: 'build-100',
      title: 'Alpha Combat Session',
      instructions: 'Check jump physics',
      isActive: true,
      startDate: null,
      endDate: null,
      createdById: 'user-1',
      createdAt: new Date('2026-10-06T10:00:00Z'),
      updatedAt: new Date('2026-10-06T10:00:00Z'),
      playableBuild: {
        id: 'build-100',
        projectId: 'proj-1',
        version: 'v0.1.0',
        title: 'Combat Slice',
        platform: 'WINDOWS',
        fileSizeBytes: 250000000n, // JavaScript BigInt
        buildJob: {
          id: 'job-1',
          commitHash: 'commit-abc1234',
        },
      },
      _count: { feedback: 0 },
    };

    it('creates a playtest and serializes BigInt fileSizeBytes safely to string', async () => {
      mockAuthzService.assertCanManage.mockResolvedValue({ isFounder: true });
      mockPrisma.playableBuild.findFirst.mockResolvedValue({
        id: 'build-100',
        projectId: 'proj-1',
      });
      mockPrisma.playtestSession.create.mockResolvedValue(
        mockSessionWithBigIntBuild,
      );

      const res = await service.createPlaytest(
        'proj-1',
        'build-100',
        { title: 'Alpha Combat Session' },
        'user-1',
      );

      expect(res).toBeDefined();
      expect(res.playableBuild?.fileSizeBytes).toBe('250000000');
      expect(typeof res.playableBuild?.fileSizeBytes).toBe('string');
      // Crucial: Must be JSON serializable without throwing "Do not know how to serialize a BigInt"
      expect(() => JSON.stringify(res)).not.toThrow();
    });

    it('preserves exact BigInt value exceeding Number.MAX_SAFE_INTEGER without precision loss', async () => {
      const largeBigInt = 9007199254740993n;
      mockAuthzService.assertCanManage.mockResolvedValue({ isFounder: true });
      mockPrisma.playableBuild.findFirst.mockResolvedValue({
        id: 'build-100',
        projectId: 'proj-1',
      });
      mockPrisma.playtestSession.create.mockResolvedValue({
        ...mockSessionWithBigIntBuild,
        playableBuild: {
          ...mockSessionWithBigIntBuild.playableBuild,
          fileSizeBytes: largeBigInt,
        },
      });

      const res = await service.createPlaytest(
        'proj-1',
        'build-100',
        { title: 'Large Build Test' },
        'user-1',
      );

      expect(res.playableBuild?.fileSizeBytes).toBe('9007199254740993');
      expect(() => JSON.stringify(res)).not.toThrow();
    });

    it('fetches playtest by ID and returns serializable response with string fileSizeBytes', async () => {
      mockAuthzService.assertCanView.mockResolvedValue({ isMember: true });
      mockPrisma.playtestSession.findFirst.mockResolvedValue(
        mockSessionWithBigIntBuild,
      );

      const res = await service.getPlaytest('proj-1', 'pt-100', 'user-1');
      expect(res).toBeDefined();
      expect(res.playableBuild?.fileSizeBytes).toBe('250000000');
      expect(() => JSON.stringify(res)).not.toThrow();
    });

    it('throws NotFoundException when fetching nonexistent playtest', async () => {
      mockAuthzService.assertCanView.mockResolvedValue({ isMember: true });
      mockPrisma.playtestSession.findFirst.mockResolvedValue(null);

      await expect(
        service.getPlaytest('proj-1', 'pt-999', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('fetches all playtests and returns serializable list with string fileSizeBytes', async () => {
      mockAuthzService.assertCanView.mockResolvedValue({ isMember: true });
      mockPrisma.playtestSession.findMany.mockResolvedValue([
        mockSessionWithBigIntBuild,
      ]);

      const res = await service.getPlaytests('proj-1', 'user-1');
      expect(res).toHaveLength(1);
      expect(res[0].playableBuild?.fileSizeBytes).toBe('250000000');
      expect(() => JSON.stringify(res)).not.toThrow();
    });

    it('updates playtest and returns serializable response with string fileSizeBytes', async () => {
      mockAuthzService.assertCanManage.mockResolvedValue({ isFounder: true });
      mockPrisma.playtestSession.findFirst.mockResolvedValue({
        id: 'pt-100',
        projectId: 'proj-1',
      });
      mockPrisma.playtestSession.update.mockResolvedValue({
        ...mockSessionWithBigIntBuild,
        title: 'Updated Title',
      });

      const res = await service.updatePlaytest(
        'proj-1',
        'pt-100',
        { title: 'Updated Title' },
        'user-1',
      );
      expect(res.title).toBe('Updated Title');
      expect(res.playableBuild?.fileSizeBytes).toBe('250000000');
      expect(() => JSON.stringify(res)).not.toThrow();
    });
  });
});
