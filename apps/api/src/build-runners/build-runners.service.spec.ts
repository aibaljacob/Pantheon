import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BuildRunnersService } from './build-runners.service';
import { BuildRunnerAuthGuard } from './build-runner-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { BuildPlatform, BuildStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

describe('BuildRunnersService & BuildRunnerAuthGuard Security Suite', () => {
  let service: BuildRunnersService;
  let guard: BuildRunnerAuthGuard;
  let prismaMock: any;

  const mockBootstrapSecret = 'test-runner-bootstrap-secret-secure-123';
  const mockProjectAId = 'proj-uuid-aaaa-1111';
  const mockProjectBId = 'proj-uuid-bbbb-2222';

  const mockProjectA = {
    id: mockProjectAId,
    name: 'Project A Alpha',
    slug: 'project-a',
  };

  const mockProjectB = {
    id: mockProjectBId,
    name: 'Project B Beta',
    slug: 'project-b',
  };

  const mockRawTokenA = 'secret-raw-token-runner-a-32bytes';
  let mockHashedTokenA: string;

  let mockRunnerA: any;
  let mockRunnerB: any;

  beforeAll(async () => {
    mockHashedTokenA = await bcrypt.hash(mockRawTokenA, 10);
  });

  beforeEach(async () => {
    process.env.BUILD_RUNNER_BOOTSTRAP_SECRET = mockBootstrapSecret;

    mockRunnerA = {
      id: 'runner-uuid-a',
      projectId: mockProjectAId,
      name: 'Runner A (Dedicated to Project A)',
      platform: BuildPlatform.WINDOWS,
      tokenHash: mockHashedTokenA,
      isOnline: true,
      lastSeenAt: new Date(),
    };

    mockRunnerB = {
      id: 'runner-uuid-b',
      projectId: mockProjectBId,
      name: 'Runner B (Dedicated to Project B)',
      platform: BuildPlatform.WINDOWS,
      tokenHash: await bcrypt.hash('secret-raw-token-runner-b', 10),
      isOnline: true,
      lastSeenAt: new Date(),
    };

    prismaMock = {
      project: {
        findUnique: jest.fn().mockImplementation((args: any) => {
          if (args.where?.id === mockProjectAId)
            return Promise.resolve(mockProjectA);
          if (args.where?.id === mockProjectBId)
            return Promise.resolve(mockProjectB);
          return Promise.resolve(null);
        }),
      },
      buildRunner: {
        create: jest.fn().mockImplementation((args: any) => {
          return Promise.resolve({
            id: 'new-runner-uuid',
            ...args.data,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }),
        findUnique: jest.fn().mockImplementation((args: any) => {
          if (args.where?.id === mockRunnerA.id)
            return Promise.resolve({ ...mockRunnerA });
          if (args.where?.id === mockRunnerB.id)
            return Promise.resolve({ ...mockRunnerB });
          return Promise.resolve(null);
        }),
        update: jest.fn().mockImplementation((args: any) => {
          return Promise.resolve({
            id: args.where.id,
            ...args.data,
          });
        }),
      },
      buildJob: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      playableBuild: {
        create: jest.fn().mockImplementation((args: any) => {
          return Promise.resolve({
            id: 'playable-uuid-1',
            ...args.data,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }),
      },
      $transaction: jest.fn().mockImplementation(async (callback: any) => {
        return callback(prismaMock);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuildRunnersService,
        BuildRunnerAuthGuard,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<BuildRunnersService>(BuildRunnersService);
    guard = module.get<BuildRunnerAuthGuard>(BuildRunnerAuthGuard);
  });

  // ==========================================
  // 1. REGISTRATION SECURITY
  // ==========================================
  describe('1. Secure Runner Registration', () => {
    it('should reject registration when bootstrap credential is missing', async () => {
      await expect(
        service.registerRunner({
          name: 'Rogue Runner',
          platform: BuildPlatform.WINDOWS,
          projectId: mockProjectAId,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject registration with invalid bootstrap credential', async () => {
      await expect(
        service.registerRunner({
          name: 'Rogue Runner',
          platform: BuildPlatform.WINDOWS,
          projectId: mockProjectAId,
          bootstrapSecret: 'wrong-secret-guess',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject registration when server has no bootstrap secret configured', async () => {
      delete process.env.BUILD_RUNNER_BOOTSTRAP_SECRET;
      await expect(
        service.registerRunner({
          name: 'Runner',
          platform: BuildPlatform.WINDOWS,
          projectId: mockProjectAId,
          bootstrapSecret: mockBootstrapSecret,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject registration when requested project does not exist', async () => {
      await expect(
        service.registerRunner({
          name: 'Runner',
          platform: BuildPlatform.WINDOWS,
          projectId: 'non-existent-project-id',
          bootstrapSecret: mockBootstrapSecret,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow registration with valid bootstrap credential and project ID', async () => {
      const result = await service.registerRunner({
        name: 'Dedicated Runner A',
        platform: BuildPlatform.WINDOWS,
        projectId: mockProjectAId,
        bootstrapSecret: mockBootstrapSecret,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('new-runner-uuid');
      expect(result.projectId).toBe(mockProjectAId);
      expect(result.name).toBe('Dedicated Runner A');
      expect(result.token).toBeDefined();
      expect(result.token.length).toBe(64); // 32 bytes in hex

      // Verify the token is NOT stored in plain text
      expect(prismaMock.buildRunner.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: mockProjectAId,
            tokenHash: expect.any(String),
          }),
        }),
      );
      const createCall = prismaMock.buildRunner.create.mock.calls[0][0];
      expect(createCall.data.tokenHash).not.toBe(result.token);
      expect(
        await bcrypt.compare(result.token, createCall.data.tokenHash),
      ).toBe(true);
    });

    it('should accept bootstrap secret passed via header', async () => {
      const result = await service.registerRunner(
        {
          name: 'Header Runner',
          platform: BuildPlatform.LINUX,
          projectId: mockProjectAId,
        },
        mockBootstrapSecret,
      );

      expect(result).toBeDefined();
      expect(result.projectId).toBe(mockProjectAId);
    });
  });

  // ==========================================
  // 2. AUTHENTICATION & GUARD
  // ==========================================
  describe('2. BuildRunnerAuthGuard & Credential Verification', () => {
    it('should reject requests missing x-runner-id header', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { 'x-runner-token': mockRawTokenA },
          }),
        }),
      } as any;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject requests missing x-runner-token header', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { 'x-runner-id': mockRunnerA.id },
          }),
        }),
      } as any;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject requests with invalid runner token', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              'x-runner-id': mockRunnerA.id,
              'x-runner-token': 'completely-wrong-token',
            },
          }),
        }),
      } as any;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject requests for non-existent runner ID', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              'x-runner-id': 'non-existent-runner',
              'x-runner-token': mockRawTokenA,
            },
          }),
        }),
      } as any;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should authenticate valid credentials and attach authoritative database projectId', async () => {
      const req: any = {
        headers: {
          'x-runner-id': mockRunnerA.id,
          'x-runner-token': mockRawTokenA,
        },
        body: {
          projectId: 'spoofed-project-id-in-body',
        },
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => req,
        }),
      } as any;

      const allowed = await guard.canActivate(mockContext);
      expect(allowed).toBe(true);
      expect(req.runner).toBeDefined();
      expect(req.runner.id).toBe(mockRunnerA.id);
      expect(req.runner.projectId).toBe(mockProjectAId); // Authoritative DB projectId, not spoofed
      expect(req.runner.projectId).not.toBe('spoofed-project-id-in-body');
    });
  });

  // ==========================================
  // 3. PROJECT ISOLATION & JOB CLAIMING
  // ==========================================
  describe('3. Job Claiming & Multi-Tenant Isolation', () => {
    it('should allow Runner A to claim a queued job belonging to Project A', async () => {
      const mockJobA = {
        id: 'job-proj-a-1',
        projectId: mockProjectAId,
        status: BuildStatus.QUEUED,
        targetPlatform: BuildPlatform.WINDOWS,
      };

      prismaMock.buildJob.findFirst.mockResolvedValueOnce(mockJobA);
      prismaMock.buildJob.updateMany.mockResolvedValueOnce({ count: 1 });
      prismaMock.buildJob.findUnique.mockResolvedValueOnce({
        ...mockJobA,
        status: BuildStatus.RUNNING,
        buildRunnerId: mockRunnerA.id,
        project: mockProjectA,
      });

      const result = await service.claimJob(mockRunnerA.id);

      expect(result.job).toBeDefined();
      expect(result.job!.id).toBe('job-proj-a-1');
      expect(result.job!.projectId).toBe(mockProjectAId);

      // Verify the query strictly enforced runner.projectId
      expect(prismaMock.buildJob.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: BuildStatus.QUEUED,
            targetPlatform: BuildPlatform.WINDOWS,
            projectId: mockProjectAId,
          }),
        }),
      );
    });

    it('should NOT allow Runner A to claim a queued job belonging to Project B', async () => {
      // Runner A queries for Project A, so if only Project B has queued jobs, findFirst returns null
      prismaMock.buildJob.findFirst.mockResolvedValueOnce(null);

      const result = await service.claimJob(mockRunnerA.id);

      expect(result.job).toBeNull();
      expect(prismaMock.buildJob.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: mockProjectAId, // Must NOT query without projectId or with Project B
          }),
        }),
      );
    });

    it('should handle atomic concurrency: return null if job was claimed by concurrent runner', async () => {
      const mockJobA = {
        id: 'job-proj-a-1',
        projectId: mockProjectAId,
        status: BuildStatus.QUEUED,
        targetPlatform: BuildPlatform.WINDOWS,
      };

      prismaMock.buildJob.findFirst.mockResolvedValueOnce(mockJobA);
      // updateMany returns count: 0 (race condition: another worker updated it first)
      prismaMock.buildJob.updateMany.mockResolvedValueOnce({ count: 0 });

      const result = await service.claimJob(mockRunnerA.id);

      expect(result.job).toBeNull();
    });
  });

  // ==========================================
  // 4. ARTIFACT UPLOAD AUTHORIZATION
  // ==========================================
  describe('4. Artifact Upload Authorization', () => {
    const mockClaimedJobA = {
      id: 'job-claimed-by-a',
      projectId: mockProjectAId,
      buildRunnerId: 'runner-uuid-a',
      status: BuildStatus.RUNNING,
      commitHash: 'commit1234567',
      targetPlatform: BuildPlatform.WINDOWS,
      project: mockProjectA,
    };

    it('should allow Runner A to upload artifact to its own claimed job', async () => {
      prismaMock.buildJob.findUnique.mockResolvedValueOnce({
        ...mockClaimedJobA,
      });

      const validatedJob = await service.assertJobOwnedByRunner(
        mockClaimedJobA.id,
        mockRunnerA.id,
        mockRunnerA.projectId,
      );
      expect(validatedJob.id).toBe(mockClaimedJobA.id);

      prismaMock.buildJob.findUnique.mockResolvedValueOnce({
        ...mockClaimedJobA,
      });

      const playableBuild = await service.saveArtifactAsPlayableBuild(
        mockClaimedJobA.id,
        mockRunnerA.id,
        'http://localhost:3000/uploads/build_123.zip',
        1000000,
        'sha256:abc',
      );

      expect(playableBuild).toBeDefined();
      expect(playableBuild.projectId).toBe(mockProjectAId);
      expect(playableBuild.buildJobId).toBe(mockClaimedJobA.id);
    });

    it('should REJECT Runner A uploading artifact to Runner B claimed job', async () => {
      const mockJobB = {
        id: 'job-claimed-by-b',
        projectId: mockProjectBId,
        buildRunnerId: 'runner-uuid-b', // Belongs to Runner B
        status: BuildStatus.RUNNING,
        project: mockProjectB,
      };

      prismaMock.buildJob.findUnique.mockResolvedValueOnce(mockJobB);

      await expect(
        service.assertJobOwnedByRunner(
          mockJobB.id,
          mockRunnerA.id, // Runner A attempting upload
          mockRunnerA.projectId,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should REJECT upload if job project does not match runner project', async () => {
      const mockMismatchedJob = {
        id: 'job-mismatch',
        projectId: mockProjectBId, // Project B
        buildRunnerId: mockRunnerA.id, // Somehow set to Runner A
        status: BuildStatus.RUNNING,
        project: mockProjectB,
      };

      prismaMock.buildJob.findUnique.mockResolvedValueOnce(mockMismatchedJob);

      await expect(
        service.assertJobOwnedByRunner(
          mockMismatchedJob.id,
          mockRunnerA.id,
          mockRunnerA.projectId, // Project A
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ==========================================
  // 5. HEARTBEAT & STATUS
  // ==========================================
  describe('5. Heartbeat & Status Authorization', () => {
    it('should allow Runner A to update its own heartbeat', async () => {
      const result = await service.heartbeat(mockRunnerA.id);
      expect(result.success).toBe(true);
      expect(prismaMock.buildRunner.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockRunnerA.id },
          data: expect.objectContaining({
            isOnline: true,
            lastSeenAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should allow Runner A to update status on its own claimed job', async () => {
      const mockJob = {
        id: 'job-1',
        projectId: mockProjectAId,
        buildRunnerId: mockRunnerA.id,
        status: BuildStatus.RUNNING,
      };
      prismaMock.buildJob.findUnique.mockResolvedValueOnce(mockJob);
      prismaMock.buildJob.update.mockResolvedValueOnce({
        ...mockJob,
        status: BuildStatus.SUCCESS,
      });

      const updated = await service.updateJobStatus(
        mockRunnerA.id,
        mockJob.id,
        {
          status: BuildStatus.SUCCESS,
          buildLogs: 'Build finished cleanly',
        },
      );

      expect(updated.status).toBe(BuildStatus.SUCCESS);
    });

    it('should REJECT Runner A updating status on Runner B job', async () => {
      const mockJobB = {
        id: 'job-b',
        projectId: mockProjectBId,
        buildRunnerId: mockRunnerB.id,
        status: BuildStatus.RUNNING,
      };
      prismaMock.buildJob.findUnique.mockResolvedValueOnce(mockJobB);

      await expect(
        service.updateJobStatus(mockRunnerA.id, mockJobB.id, {
          status: BuildStatus.FAILED,
          errorMessage: 'Malicious failure injection',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
