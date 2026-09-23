import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BuildsService } from './builds.service';
import { ProjectAuthorizationService } from '../tasks/project-authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BuildPlatform,
  BuildStatus,
  ProjectMemberStatus,
  ProjectModerationStatus,
  Role,
} from '@prisma/client';

describe('Builds Module - BuildsService', () => {
  let buildsService: BuildsService;
  let authService: ProjectAuthorizationService;
  let prismaMock: any;

  const mockProjectId = 'project-uuid-1';
  const mockFounderId = 'founder-uuid-1';
  const mockMemberId = 'member-uuid-2';
  const mockRemovedMemberId = 'removed-member-uuid-3';
  const mockUnrelatedUserId = 'unrelated-user-uuid-4';
  const mockAdminId = 'admin-uuid-5';
  const mockMilestoneId = 'milestone-uuid-1';
  const mockOtherProjectMilestoneId = 'milestone-other-proj-uuid-2';

  const mockProject = {
    id: mockProjectId,
    slug: 'cyber-odyssey',
    founderId: mockFounderId,
    moderationStatus: ProjectModerationStatus.PUBLISHED,
    members: [
      { userId: mockMemberId, status: ProjectMemberStatus.ACTIVE },
      { userId: mockRemovedMemberId, status: ProjectMemberStatus.REMOVED },
    ],
  };

  const mockBuildJob = {
    id: 'build-job-1',
    projectId: mockProjectId,
    buildRunnerId: null,
    commitHash: 'abc1234',
    branchName: 'main',
    targetPlatform: BuildPlatform.WINDOWS,
    status: BuildStatus.QUEUED,
    triggeredById: mockFounderId,
    buildLogs: 'Build queued',
    errorMessage: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date('2026-09-23T10:00:00Z'),
    updatedAt: new Date('2026-09-23T10:00:00Z'),
    triggeredBy: {
      id: mockFounderId,
      username: 'studiofounder',
      profile: {
        displayName: 'Studio Founder',
        firstName: 'Studio',
        avatarUrl: null,
      },
    },
    milestone: {
      id: mockMilestoneId,
      title: 'Milestone 1 - Alpha',
    },
    buildRunner: null,
  };

  const mockPlayableBuild = {
    id: 'playable-1',
    projectId: mockProjectId,
    buildJobId: 'build-job-1',
    milestoneId: mockMilestoneId,
    version: 'v0.1.0',
    title: 'Alpha Combat Prototype',
    platform: BuildPlatform.WINDOWS,
    storagePath: 'builds/cyber-odyssey/v0.1.0.zip',
    fileSizeBytes: BigInt(250000000),
    fileChecksum: 'sha256:abcdef1234567890',
    releaseNotes: 'First playable alpha build.',
    uploadedById: mockFounderId,
    createdAt: new Date('2026-09-23T11:00:00Z'),
    updatedAt: new Date('2026-09-23T11:00:00Z'),
    milestone: {
      id: mockMilestoneId,
      title: 'Milestone 1 - Alpha',
    },
    uploadedBy: {
      id: mockFounderId,
      username: 'studiofounder',
      profile: {
        displayName: 'Studio Founder',
        firstName: 'Studio',
        avatarUrl: null,
      },
    },
  };

  beforeEach(async () => {
    prismaMock = {
      project: {
        findFirst: jest.fn().mockImplementation((args: any) => {
          if (
            args.where?.OR?.some(
              (cond: any) =>
                cond.id === mockProjectId || cond.slug === mockProjectId,
            )
          ) {
            return Promise.resolve(mockProject);
          }
          return Promise.resolve(null);
        }),
        findUnique: jest.fn().mockImplementation((args: any) => {
          if (args.where?.id === mockProjectId) {
            return Promise.resolve(mockProject);
          }
          return Promise.resolve(null);
        }),
      },
      milestone: {
        findUnique: jest.fn().mockImplementation((args: any) => {
          if (args.where?.id === mockMilestoneId) {
            return Promise.resolve({
              id: mockMilestoneId,
              projectId: mockProjectId,
            });
          }
          if (args.where?.id === mockOtherProjectMilestoneId) {
            return Promise.resolve({
              id: mockOtherProjectMilestoneId,
              projectId: 'other-project-id',
            });
          }
          return Promise.resolve(null);
        }),
      },
      buildJob: {
        create: jest.fn().mockImplementation((args: any) => {
          return Promise.resolve({
            id: 'build-job-created',
            ...args.data,
            createdAt: new Date(),
            updatedAt: new Date(),
            triggeredBy: {
              id: args.data.triggeredById,
              username: 'testuser',
              profile: { displayName: 'Test User', avatarUrl: null },
            },
            milestone: args.data.milestoneId
              ? { id: args.data.milestoneId, title: 'Alpha Release' }
              : null,
            buildRunner: null,
          });
        }),
        findMany: jest.fn().mockResolvedValue([mockBuildJob]),
        findUnique: jest.fn().mockImplementation((args: any) => {
          if (args.where?.id === mockBuildJob.id) {
            return Promise.resolve({ ...mockBuildJob });
          }
          return Promise.resolve(null);
        }),
        update: jest.fn().mockImplementation((args: any) => {
          return Promise.resolve({
            ...mockBuildJob,
            ...args.data,
            updatedAt: new Date(),
          });
        }),
      },
      playableBuild: {
        findMany: jest.fn().mockResolvedValue([mockPlayableBuild]),
        findUnique: jest.fn().mockImplementation((args: any) => {
          if (args.where?.id === mockPlayableBuild.id) {
            return Promise.resolve({ ...mockPlayableBuild });
          }
          return Promise.resolve(null);
        }),
        create: jest.fn().mockImplementation((args: any) => {
          return Promise.resolve({
            id: 'playable-created',
            ...args.data,
            createdAt: new Date(),
            updatedAt: new Date(),
            milestone: args.data.milestoneId
              ? { id: args.data.milestoneId, title: 'Alpha Milestone' }
              : null,
            uploadedBy: {
              id: args.data.uploadedById,
              username: 'studiofounder',
              profile: { displayName: 'Studio Founder', avatarUrl: null },
            },
          });
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuildsService,
        ProjectAuthorizationService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    buildsService = module.get<BuildsService>(BuildsService);
    authService = module.get<ProjectAuthorizationService>(ProjectAuthorizationService);
  });

  describe('1 & 2. Build creation & default QUEUED status', () => {
    it('should create a build job with QUEUED status', async () => {
      const result = await buildsService.createBuild(
        mockProjectId,
        {
          targetPlatform: BuildPlatform.WINDOWS,
          branchName: 'main',
          commitHash: 'commit123',
        },
        mockFounderId,
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(BuildStatus.QUEUED);
      expect(result.targetPlatform).toBe(BuildPlatform.WINDOWS);
      expect(prismaMock.buildJob.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: mockProjectId,
            targetPlatform: BuildPlatform.WINDOWS,
            status: BuildStatus.QUEUED,
          }),
        }),
      );
    });
  });

  describe('3. Project authorization', () => {
    it('should allow Founder, Active Member, and Administrator to trigger builds', async () => {
      // Founder
      await expect(
        buildsService.createBuild(
          mockProjectId,
          { targetPlatform: BuildPlatform.MAC },
          mockFounderId,
        ),
      ).resolves.toBeDefined();

      // Active Member
      await expect(
        buildsService.createBuild(
          mockProjectId,
          { targetPlatform: BuildPlatform.LINUX },
          mockMemberId,
        ),
      ).resolves.toBeDefined();

      // Administrator
      await expect(
        buildsService.createBuild(
          mockProjectId,
          { targetPlatform: BuildPlatform.WEBGL },
          mockAdminId,
          Role.ADMINISTRATOR,
        ),
      ).resolves.toBeDefined();
    });
  });

  describe('4. Milestone belongs to project validation', () => {
    it('should allow valid milestone belonging to project', async () => {
      const result = await buildsService.createBuild(
        mockProjectId,
        {
          targetPlatform: BuildPlatform.WINDOWS,
          milestoneId: mockMilestoneId,
        },
        mockFounderId,
      );
      expect(result).toBeDefined();
    });

    it('should reject milestone belonging to a different project', async () => {
      await expect(
        buildsService.createBuild(
          mockProjectId,
          {
            targetPlatform: BuildPlatform.WINDOWS,
            milestoneId: mockOtherProjectMilestoneId,
          },
          mockFounderId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('5. Valid status transition QUEUED -> RUNNING', () => {
    it('should transition from QUEUED to RUNNING and set startedAt', async () => {
      prismaMock.buildJob.findUnique.mockResolvedValueOnce({
        ...mockBuildJob,
        status: BuildStatus.QUEUED,
        startedAt: null,
      });

      const result = await buildsService.updateBuildStatus(
        mockProjectId,
        mockBuildJob.id,
        { status: BuildStatus.RUNNING },
        mockFounderId,
      );

      expect(result.status).toBe(BuildStatus.RUNNING);
      expect(prismaMock.buildJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: BuildStatus.RUNNING,
            startedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('6. Valid status transition RUNNING -> SUCCESS', () => {
    it('should transition from RUNNING to SUCCESS and set completedAt', async () => {
      const startedAt = new Date('2026-09-23T10:00:00Z');
      prismaMock.buildJob.findUnique.mockResolvedValueOnce({
        ...mockBuildJob,
        status: BuildStatus.RUNNING,
        startedAt,
      });

      const result = await buildsService.updateBuildStatus(
        mockProjectId,
        mockBuildJob.id,
        { status: BuildStatus.SUCCESS },
        mockFounderId,
      );

      expect(result.status).toBe(BuildStatus.SUCCESS);
      expect(prismaMock.buildJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: BuildStatus.SUCCESS,
            completedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('7. Valid status transition RUNNING -> FAILED', () => {
    it('should transition from RUNNING to FAILED with errorMessage and completedAt', async () => {
      prismaMock.buildJob.findUnique.mockResolvedValueOnce({
        ...mockBuildJob,
        status: BuildStatus.RUNNING,
        startedAt: new Date(),
      });

      const result = await buildsService.updateBuildStatus(
        mockProjectId,
        mockBuildJob.id,
        { status: BuildStatus.FAILED, errorMessage: 'Compilation error: Shader missing' },
        mockFounderId,
      );

      expect(result.status).toBe(BuildStatus.FAILED);
      expect(prismaMock.buildJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: BuildStatus.FAILED,
            errorMessage: 'Compilation error: Shader missing',
            completedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('8. Valid status transition RUNNING -> CANCELLED', () => {
    it('should transition from RUNNING to CANCELLED and set completedAt', async () => {
      prismaMock.buildJob.findUnique.mockResolvedValueOnce({
        ...mockBuildJob,
        status: BuildStatus.RUNNING,
        startedAt: new Date(),
      });

      const result = await buildsService.updateBuildStatus(
        mockProjectId,
        mockBuildJob.id,
        { status: BuildStatus.CANCELLED },
        mockFounderId,
      );

      expect(result.status).toBe(BuildStatus.CANCELLED);
    });
  });

  describe('9. Invalid status transition', () => {
    it('should reject invalid transition QUEUED -> SUCCESS directly', async () => {
      prismaMock.buildJob.findUnique.mockResolvedValueOnce({
        ...mockBuildJob,
        status: BuildStatus.QUEUED,
      });

      await expect(
        buildsService.updateBuildStatus(
          mockProjectId,
          mockBuildJob.id,
          { status: BuildStatus.SUCCESS },
          mockFounderId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('10. Terminal build cannot be changed', () => {
    it('should reject updating a SUCCESS terminal build', async () => {
      prismaMock.buildJob.findUnique.mockResolvedValueOnce({
        ...mockBuildJob,
        status: BuildStatus.SUCCESS,
      });

      await expect(
        buildsService.updateBuildStatus(
          mockProjectId,
          mockBuildJob.id,
          { status: BuildStatus.RUNNING },
          mockFounderId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject updating a CANCELLED terminal build', async () => {
      prismaMock.buildJob.findUnique.mockResolvedValueOnce({
        ...mockBuildJob,
        status: BuildStatus.CANCELLED,
      });

      await expect(
        buildsService.updateBuildStatus(
          mockProjectId,
          mockBuildJob.id,
          { status: BuildStatus.FAILED },
          mockFounderId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('11. Cancel queued build', () => {
    it('should allow founder to cancel a queued build', async () => {
      prismaMock.buildJob.findUnique.mockResolvedValueOnce({
        ...mockBuildJob,
        status: BuildStatus.QUEUED,
      });

      const result = await buildsService.cancelBuild(
        mockProjectId,
        mockBuildJob.id,
        mockFounderId,
      );

      expect(result.status).toBe(BuildStatus.CANCELLED);
      expect(prismaMock.buildJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: BuildStatus.CANCELLED,
            completedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should allow initiator member to cancel their own queued build', async () => {
      prismaMock.buildJob.findUnique.mockResolvedValueOnce({
        ...mockBuildJob,
        triggeredById: mockMemberId,
        status: BuildStatus.QUEUED,
      });

      const result = await buildsService.cancelBuild(
        mockProjectId,
        mockBuildJob.id,
        mockMemberId,
      );

      expect(result.status).toBe(BuildStatus.CANCELLED);
    });

    it('should reject cancelling an already terminal build', async () => {
      prismaMock.buildJob.findUnique.mockResolvedValueOnce({
        ...mockBuildJob,
        status: BuildStatus.FAILED,
      });

      await expect(
        buildsService.cancelBuild(mockProjectId, mockBuildJob.id, mockFounderId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('12. Build retrieval', () => {
    it('should get build details and calculate duration in seconds', async () => {
      const startedAt = new Date('2026-09-23T10:00:00Z');
      const completedAt = new Date('2026-09-23T10:02:30Z'); // 150 seconds
      prismaMock.buildJob.findUnique.mockResolvedValueOnce({
        ...mockBuildJob,
        status: BuildStatus.SUCCESS,
        startedAt,
        completedAt,
      });

      const result = await buildsService.getBuild(
        mockProjectId,
        mockBuildJob.id,
        mockFounderId,
      );

      expect(result.id).toBe(mockBuildJob.id);
      expect(result.durationSeconds).toBe(150);
    });

    it('should get build logs', async () => {
      prismaMock.buildJob.findUnique.mockResolvedValueOnce({
        id: mockBuildJob.id,
        projectId: mockProjectId,
        status: BuildStatus.SUCCESS,
        buildLogs: 'Build completed with 0 errors.',
      });

      const result = await buildsService.getBuildLogs(
        mockProjectId,
        mockBuildJob.id,
        mockFounderId,
      );

      expect(result.buildLogs).toBe('Build completed with 0 errors.');
    });
  });

  describe('13. PlayableBuild retrieval', () => {
    it('should get all playable builds for a project', async () => {
      const builds = await buildsService.getPlayableBuilds(
        mockProjectId,
        mockFounderId,
      );

      expect(builds).toHaveLength(1);
      expect(builds[0].version).toBe('v0.1.0');
      expect(builds[0].fileSizeBytes).toBe(250000000);
    });

    it('should create a playable build for founder/admin', async () => {
      const result = await buildsService.createPlayableBuild(
        mockProjectId,
        {
          version: 'v0.1.1',
          title: 'Bugfix Release',
          platform: BuildPlatform.WINDOWS,
          fileSizeBytes: 260000000,
        },
        mockFounderId,
      );

      expect(result).toBeDefined();
      expect(result.version).toBe('v0.1.1');
    });
  });

  describe('14 & 15. Unauthorized access & former member denial', () => {
    it('should deny unrelated user from viewing or creating builds', async () => {
      await expect(
        buildsService.createBuild(
          mockProjectId,
          { targetPlatform: BuildPlatform.WINDOWS },
          mockUnrelatedUserId,
        ),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        buildsService.getBuilds(mockProjectId, {}, mockUnrelatedUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should deny former/removed member from viewing or creating builds', async () => {
      await expect(
        buildsService.createBuild(
          mockProjectId,
          { targetPlatform: BuildPlatform.WINDOWS },
          mockRemovedMemberId,
        ),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        buildsService.getBuilds(mockProjectId, {}, mockRemovedMemberId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
