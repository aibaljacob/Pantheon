import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BuildsService } from './builds.service';
import { ProjectAuthorizationService } from '../tasks/project-authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import { BuildPlatform, ProjectModerationStatus, Prisma } from '@prisma/client';
import { CreatePlayableBuildDto } from './dto/create-playable-build.dto';
import { getArtifactMaxSizeBytes } from '../build-runners/build-artifact-storage.config';
import { BuildRunnersService } from '../build-runners/build-runners.service';
import { BuildsGateway } from '../events/builds.gateway';

describe('PlayableBuild Release Validation (BUG-RELEASE-01 & BUG-RELEASE-02)', () => {
  let buildsService: BuildsService;
  let prismaMock: {
    project: { findFirst: jest.Mock };
    milestone: { findUnique: jest.Mock };
    buildJob: { findUnique: jest.Mock };
    playableBuild: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };

  const mockProjectId = 'project-uuid-1';
  const mockFounderId = 'founder-uuid-1';

  const mockProject = {
    id: mockProjectId,
    slug: 'cyber-odyssey',
    founderId: mockFounderId,
    moderationStatus: ProjectModerationStatus.PUBLISHED,
    members: [],
  };

  const existingWindowsV1Release = {
    id: 'playable-existing-1',
    projectId: mockProjectId,
    buildJobId: null,
    milestoneId: null,
    version: '1.0.0',
    title: 'Initial Release',
    platform: BuildPlatform.WINDOWS,
    storagePath: 'builds/cyber-odyssey/v1.0.0-win.zip',
    fileSizeBytes: BigInt(50000000),
    fileChecksum: 'sha256:11111111',
    releaseNotes: 'First release',
    uploadedById: mockFounderId,
    createdAt: new Date('2026-10-01T10:00:00Z'),
    updatedAt: new Date('2026-10-01T10:00:00Z'),
    milestone: null,
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
        findFirst: jest
          .fn()
          .mockImplementation(
            (args: {
              where?: { OR?: Array<{ id?: string; slug?: string }> };
            }) => {
              if (
                args.where?.OR?.some(
                  (cond) =>
                    cond.id === mockProjectId || cond.slug === mockProjectId,
                )
              ) {
                return Promise.resolve(mockProject);
              }
              return Promise.resolve(null);
            },
          ),
      },
      milestone: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      buildJob: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      playableBuild: {
        findUnique: jest.fn().mockImplementation(
          (args: {
            where?: {
              id?: string;
              projectId_version_platform?: {
                projectId: string;
                version: string;
                platform: BuildPlatform;
              };
            };
          }) => {
            if (args.where?.id === existingWindowsV1Release.id) {
              return Promise.resolve(existingWindowsV1Release);
            }
            if (args.where?.projectId_version_platform) {
              const { projectId, version, platform } =
                args.where.projectId_version_platform;
              if (
                projectId === mockProjectId &&
                version === existingWindowsV1Release.version &&
                platform === existingWindowsV1Release.platform
              ) {
                return Promise.resolve({ id: existingWindowsV1Release.id });
              }
            }
            return Promise.resolve(null);
          },
        ),
        create: jest.fn().mockImplementation(
          (args: {
            data: {
              projectId: string;
              version: string;
              title: string;
              platform: BuildPlatform;
              buildJobId?: string | null;
              milestoneId?: string | null;
              storagePath?: string | null;
              fileSizeBytes?: bigint | null;
              fileChecksum?: string | null;
              releaseNotes?: string | null;
              uploadedById: string;
            };
          }) => {
            return Promise.resolve({
              id: 'playable-created-id',
              ...args.data,
              createdAt: new Date(),
              updatedAt: new Date(),
              milestone: null,
              uploadedBy: {
                id: args.data.uploadedById,
                username: 'studiofounder',
                profile: {
                  displayName: 'Studio Founder',
                  firstName: 'Studio',
                  avatarUrl: null,
                },
              },
            });
          },
        ),
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
        {
          provide: BuildRunnersService,
          useValue: {
            getRunnerStatus: jest
              .fn()
              .mockResolvedValue({ online: true, status: 'ONLINE' }),
            getActiveRunnerForPlatform: jest
              .fn()
              .mockResolvedValue({ id: 'r1', isOnline: true }),
          },
        },
        {
          provide: BuildsGateway,
          useValue: {
            emitBuildCreated: jest.fn(),
            emitBuildUpdated: jest.fn(),
            emitRunnerStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    buildsService = module.get<BuildsService>(BuildsService);
  });

  describe('TASK 1 — Duplicate Release Prevention (BUG-RELEASE-01)', () => {
    it('1. should succeed when registering the first release with version + platform', async () => {
      const result = await buildsService.createPlayableBuild(
        mockProjectId,
        {
          version: '1.0.0',
          title: 'Linux Release',
          platform: BuildPlatform.LINUX,
          fileSizeBytes: 1048576,
        },
        mockFounderId,
      );

      expect(result).toBeDefined();
      expect(result.version).toBe('1.0.0');
      expect(result.platform).toBe(BuildPlatform.LINUX);
    });

    it('2. should reject exact duplicate version + platform with ConflictException', async () => {
      await expect(
        buildsService.createPlayableBuild(
          mockProjectId,
          {
            version: '1.0.0',
            title: 'Duplicate Windows Release',
            platform: BuildPlatform.WINDOWS,
            fileSizeBytes: 2048,
          },
          mockFounderId,
        ),
      ).rejects.toThrow(ConflictException);

      try {
        await buildsService.createPlayableBuild(
          mockProjectId,
          {
            version: '1.0.0',
            title: 'Duplicate Windows Release',
            platform: BuildPlatform.WINDOWS,
          },
          mockFounderId,
        );
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ConflictException);
        const conflict = err as ConflictException;
        expect(conflict.message).toContain(
          'A release with version "1.0.0" for platform "WINDOWS" already exists',
        );
      }
    });

    it('3. should succeed when registering same version on a different platform', async () => {
      const result = await buildsService.createPlayableBuild(
        mockProjectId,
        {
          version: '1.0.0',
          title: 'Mac Build',
          platform: BuildPlatform.MAC,
          fileSizeBytes: 52428800,
        },
        mockFounderId,
      );

      expect(result).toBeDefined();
      expect(result.version).toBe('1.0.0');
      expect(result.platform).toBe(BuildPlatform.MAC);
    });

    it('4. should succeed when registering different version on the same platform', async () => {
      const result = await buildsService.createPlayableBuild(
        mockProjectId,
        {
          version: '1.0.1',
          title: 'Windows Patch',
          platform: BuildPlatform.WINDOWS,
          fileSizeBytes: 60000000,
        },
        mockFounderId,
      );

      expect(result).toBeDefined();
      expect(result.version).toBe('1.0.1');
      expect(result.platform).toBe(BuildPlatform.WINDOWS);
    });

    it('should enforce duplicate constraint even if service-level check is bypassed/raced (Prisma P2002)', async () => {
      prismaMock.playableBuild.findUnique.mockResolvedValueOnce(null);
      prismaMock.playableBuild.create.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError(
          'Unique constraint failed on the fields: (`projectId`,`version`,`platform`)',
          {
            code: 'P2002',
            clientVersion: '6.19.3',
          },
        ),
      );

      await expect(
        buildsService.createPlayableBuild(
          mockProjectId,
          {
            version: '1.0.0',
            title: 'Concurrent Race Release',
            platform: BuildPlatform.WINDOWS,
            fileSizeBytes: 1000,
          },
          mockFounderId,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('TASK 2 — Release Size Validation (BUG-RELEASE-02)', () => {
    it('5. should reject negative release size with BadRequestException at service level', async () => {
      await expect(
        buildsService.createPlayableBuild(
          mockProjectId,
          {
            version: '2.0.0',
            title: 'Negative Size Release',
            platform: BuildPlatform.WINDOWS,
            fileSizeBytes: -1,
          },
          mockFounderId,
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        buildsService.createPlayableBuild(
          mockProjectId,
          {
            version: '2.0.0',
            title: 'Negative Size Release',
            platform: BuildPlatform.WINDOWS,
            fileSizeBytes: -50000,
          },
          mockFounderId,
        ),
      ).rejects.toThrow('Release size must be a non-negative finite number.');
    });

    it('should reject non-finite release size (NaN or Infinity) with BadRequestException', async () => {
      await expect(
        buildsService.createPlayableBuild(
          mockProjectId,
          {
            version: '2.0.0',
            title: 'NaN Size',
            platform: BuildPlatform.WINDOWS,
            fileSizeBytes: NaN,
          },
          mockFounderId,
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        buildsService.createPlayableBuild(
          mockProjectId,
          {
            version: '2.0.0',
            title: 'Infinity Size',
            platform: BuildPlatform.WINDOWS,
            fileSizeBytes: Infinity,
          },
          mockFounderId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject release size exceeding max allowed size with BadRequestException', async () => {
      const maxBytes = getArtifactMaxSizeBytes();
      await expect(
        buildsService.createPlayableBuild(
          mockProjectId,
          {
            version: '2.0.0',
            title: 'Oversized Build',
            platform: BuildPlatform.WINDOWS,
            fileSizeBytes: maxBytes + 1,
          },
          mockFounderId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('6. should follow intended existing behavior and succeed when release size is zero', async () => {
      const result = await buildsService.createPlayableBuild(
        mockProjectId,
        {
          version: '2.0.0',
          title: 'Zero Size Release',
          platform: BuildPlatform.WINDOWS,
          fileSizeBytes: 0,
        },
        mockFounderId,
      );

      expect(result).toBeDefined();
      expect(result.fileSizeBytes).toBe(0);
    });

    it('7. should succeed with valid positive release size', async () => {
      const result = await buildsService.createPlayableBuild(
        mockProjectId,
        {
          version: '2.0.0',
          title: 'Positive Size Release',
          platform: BuildPlatform.WINDOWS,
          fileSizeBytes: 250000000,
        },
        mockFounderId,
      );

      expect(result).toBeDefined();
      expect(result.fileSizeBytes).toBe(250000000);
    });

    describe('DTO Validation (CreatePlayableBuildDto)', () => {
      it('should fail DTO validation for negative fileSizeBytes', async () => {
        const dto = plainToInstance(CreatePlayableBuildDto, {
          version: 'v1.0.0',
          title: 'Test Build',
          platform: BuildPlatform.WINDOWS,
          fileSizeBytes: -100,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const error = errors.find((e) => e.property === 'fileSizeBytes');
        expect(error).toBeDefined();
        expect(error?.constraints?.min).toContain(
          'File size must be greater than or equal to 0 bytes.',
        );
      });

      it('should fail DTO validation for non-finite fileSizeBytes', async () => {
        const dto = plainToInstance(CreatePlayableBuildDto, {
          version: 'v1.0.0',
          title: 'Test Build',
          platform: BuildPlatform.WINDOWS,
          fileSizeBytes: NaN,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const error = errors.find((e) => e.property === 'fileSizeBytes');
        expect(error).toBeDefined();
        expect(error?.constraints?.isNumber).toContain(
          'File size must be a finite number.',
        );
      });

      it('should fail DTO validation when fileSizeBytes exceeds maximum allowed bytes', async () => {
        const dto = plainToInstance(CreatePlayableBuildDto, {
          version: 'v1.0.0',
          title: 'Test Build',
          platform: BuildPlatform.WINDOWS,
          fileSizeBytes: getArtifactMaxSizeBytes() + 1024,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const error = errors.find((e) => e.property === 'fileSizeBytes');
        expect(error).toBeDefined();
        expect(error?.constraints?.max).toContain(
          'File size exceeds maximum allowed limit.',
        );
      });

      it('should pass DTO validation when fileSizeBytes is zero', async () => {
        const dto = plainToInstance(CreatePlayableBuildDto, {
          version: 'v1.0.0',
          title: 'Test Build',
          platform: BuildPlatform.WINDOWS,
          fileSizeBytes: 0,
        });

        const errors = await validate(dto);
        const error = errors.find((e) => e.property === 'fileSizeBytes');
        expect(error).toBeUndefined();
      });

      it('should pass DTO validation when fileSizeBytes is valid positive', async () => {
        const dto = plainToInstance(CreatePlayableBuildDto, {
          version: 'v1.0.0',
          title: 'Test Build',
          platform: BuildPlatform.WINDOWS,
          fileSizeBytes: 1048576,
        });

        const errors = await validate(dto);
        const error = errors.find((e) => e.property === 'fileSizeBytes');
        expect(error).toBeUndefined();
      });

      it('should pass DTO validation when fileSizeBytes is omitted', async () => {
        const dto = plainToInstance(CreatePlayableBuildDto, {
          version: 'v1.0.0',
          title: 'Test Build',
          platform: BuildPlatform.WINDOWS,
        });

        const errors = await validate(dto);
        const error = errors.find((e) => e.property === 'fileSizeBytes');
        expect(error).toBeUndefined();
      });
    });
  });
});
