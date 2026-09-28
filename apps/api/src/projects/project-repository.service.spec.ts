import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProjectRepositoryService } from './project-repository.service';
import {
  ProjectRepositoryRepository,
  type ProjectForRepository,
} from './project-repository.repository';
import { GitService } from './git.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAuthorizationService } from '../tasks/project-authorization.service';
import { ProjectModerationStatus, Role, AuthProvider } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/current-user.decorator';

describe('ProjectRepositoryService', () => {
  let service: ProjectRepositoryService;
  let repoRepository: jest.Mocked<ProjectRepositoryRepository>;
  let gitService: jest.Mocked<GitService>;
  let prismaService: PrismaService;
  let authService: jest.Mocked<ProjectAuthorizationService>;

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'member@pantheon.studio',
    username: 'member',
    role: Role.USER,
    passwordHash: 'hash',
    refreshTokenVersion: 1,
    provider: AuthProvider.LOCAL,
    providerId: null,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdmin: AuthenticatedUser = {
    id: 'admin-123',
    email: 'admin@pantheon.studio',
    username: 'admin',
    role: Role.ADMINISTRATOR,
    passwordHash: 'hash',
    refreshTokenVersion: 1,
    provider: AuthProvider.LOCAL,
    providerId: null,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProject: ProjectForRepository = {
    id: 'proj-123',
    name: 'Mythic Odyssey',
    slug: 'mythic-odyssey',
    description: 'An epic adventure game',
    gameEngine: 'Godot',
    founder: {
      username: 'mythic_lead',
    },
    members: [{ id: 'mem-1' }, { id: 'mem-2' }],
    repository: {
      id: 'repo-123',
      projectId: 'proj-123',
      defaultBranch: 'main',
      repoDiskPath: 'D:/Projects/Pantheon/repos/mythic-odyssey.git',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-02T00:00:00Z'),
    },
  };

  beforeEach(async () => {
    repoRepository = {
      findProjectForRepository: jest.fn(),
      findProjectWithDetails: jest.fn(),
      findRepositoryByProjectId: jest.fn(),
      createRepository: jest.fn(),
    } as unknown as jest.Mocked<ProjectRepositoryRepository>;

    gitService = {
      isValidRepository: jest.fn().mockResolvedValue(true),
      initBareRepository: jest.fn().mockResolvedValue(undefined),
      createInitialCommitFromFiles: jest.fn().mockResolvedValue(undefined),
      listBranches: jest.fn().mockResolvedValue([
        { name: 'main', isDefault: true, lastCommitHash: 'hash1' },
        { name: 'dev', isDefault: false, lastCommitHash: 'hash2' },
      ]),
      listCommits: jest.fn().mockResolvedValue([
        {
          hash: 'hash1',
          message: 'feat: initial prototype',
          authorName: 'mythic_lead',
          authorEmail: 'mythic_lead@pantheon.studio',
          date: '2026-01-01T12:00:00Z',
        },
      ]),
      getTree: jest.fn().mockResolvedValue([
        { type: 'blob', path: 'src/main.ts', hash: 'blob1', size: 120 },
        { type: 'blob', path: 'README.md', hash: 'blob2', size: 50 },
        { type: 'blob', path: 'assets/texture.png', hash: 'blob3', size: 5000 },
      ]),
      getBlobsBatch: jest.fn().mockResolvedValue(
        new Map([
          ['blob1', 'console.log("hello");'],
          ['blob2', '# Mythic Odyssey'],
        ]),
      ),
      getFileContent: jest.fn(),
    } as unknown as jest.Mocked<GitService>;

    authService = {
      assertCanView: jest.fn().mockResolvedValue({
        project: {
          id: mockProject.id,
          slug: mockProject.slug,
          founderId: 'founder-123',
          moderationStatus: ProjectModerationStatus.PUBLISHED,
        },
        isFounder: false,
        isMember: true,
        isAdmin: false,
      }),
    } as unknown as jest.Mocked<ProjectAuthorizationService>;

    prismaService = {
      projectRepository: {
        update: jest.fn().mockResolvedValue({}),
      },
    } as unknown as PrismaService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectRepositoryService,
        { provide: ProjectRepositoryRepository, useValue: repoRepository },
        { provide: GitService, useValue: gitService },
        { provide: PrismaService, useValue: prismaService },
        { provide: ProjectAuthorizationService, useValue: authService },
      ],
    }).compile();

    service = module.get<ProjectRepositoryService>(ProjectRepositoryService);
  });

  describe('getRepository', () => {
    it('should successfully retrieve repository data for authorized project member with preloaded repository', async () => {
      repoRepository.findProjectForRepository.mockResolvedValue(mockProject);

      const result = await service.getRepository('proj-123', mockUser);

      // Verify authorization was called
      expect(authService.assertCanView).toHaveBeenCalledWith(
        'proj-123',
        mockUser.id,
        mockUser.role,
      );

      // Verify optimized single-query project and repository lookup
      expect(repoRepository.findProjectForRepository).toHaveBeenCalledWith(
        'proj-123',
      );
      // Redundant separate repository query must NOT be called when preloaded
      expect(repoRepository.findRepositoryByProjectId).not.toHaveBeenCalled();

      // Verify API compatibility contract
      expect(result.name).toBe('Mythic Odyssey');
      expect(result.slug).toBe('mythic-odyssey');
      expect(result.gameEngine).toBe('Godot');
      expect(result.currentBranch).toBe('main');
      expect(result.defaultBranch).toBe('main');
      expect(result.branches).toHaveLength(2);
      expect(result.branches[0].name).toBe('main');
      expect(result.recentCommits).toHaveLength(1);
      expect(result.recentCommits[0].hash).toBe('hash1');
      expect(result.files).toHaveLength(3);

      // Text files have content
      const tsFile = result.files.find((f) => f.path === 'src/main.ts');
      expect(tsFile?.content).toBe('console.log("hello");');
      expect(tsFile?.linesCount).toBe(1);

      // Binary files have empty content preserved
      const binFile = result.files.find((f) => f.path === 'assets/texture.png');
      expect(binFile?.content).toBe('');

      // Verify stats
      expect(result.stats).toEqual({
        totalCommits: 1,
        totalBranches: 2,
        totalPullRequests: 0,
        totalReleases: 0,
        totalFiles: 3,
        totalLines: 2,
        totalSize: 5170,
        contributorsCount: 3, // members.length (2) + 1
      });
    });

    it('should block unauthorized users when assertCanView fails', async () => {
      authService.assertCanView.mockRejectedValue(
        new ForbiddenException('You do not have access'),
      );

      await expect(service.getRepository('proj-123', mockUser)).rejects.toThrow(
        ForbiddenException,
      );

      // Verify DB queries are bypassed on authorization failure
      expect(repoRepository.findProjectForRepository).not.toHaveBeenCalled();
      expect(gitService.listBranches).not.toHaveBeenCalled();
    });

    it('should allow admin users through assertCanView', async () => {
      authService.assertCanView.mockResolvedValue({
        project: {
          id: mockProject.id,
          slug: mockProject.slug,
          founderId: 'founder-123',
          moderationStatus: ProjectModerationStatus.PENDING_REVIEW,
        },
        isFounder: false,
        isMember: false,
        isAdmin: true,
      });

      repoRepository.findProjectForRepository.mockResolvedValue(mockProject);

      const result = await service.getRepository('proj-123', mockAdmin);

      expect(authService.assertCanView).toHaveBeenCalledWith(
        'proj-123',
        mockAdmin.id,
        Role.ADMINISTRATOR,
      );
      expect(result.name).toBe('Mythic Odyssey');
    });

    it('should allow founder through assertCanView', async () => {
      const founderUser: AuthenticatedUser = {
        id: 'founder-123',
        email: 'founder@pantheon.studio',
        username: 'founder',
        role: Role.USER,
        passwordHash: 'hash',
        refreshTokenVersion: 1,
        provider: AuthProvider.LOCAL,
        providerId: null,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      authService.assertCanView.mockResolvedValue({
        project: {
          id: mockProject.id,
          slug: mockProject.slug,
          founderId: 'founder-123',
          moderationStatus: ProjectModerationStatus.PENDING_REVIEW,
        },
        isFounder: true,
        isMember: false,
        isAdmin: false,
      });

      repoRepository.findProjectForRepository.mockResolvedValue(mockProject);

      const result = await service.getRepository('proj-123', founderUser);
      expect(result.slug).toBe('mythic-odyssey');
    });

    it('should throw NotFoundException if project is missing', async () => {
      repoRepository.findProjectForRepository.mockResolvedValue(null);

      await expect(
        service.getRepository('non-existent', mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create repository if missing in database', async () => {
      const projectWithoutRepo = {
        ...mockProject,
        repository: null,
      };

      const createdRepoRecord = {
        id: 'new-repo-123',
        projectId: 'proj-123',
        defaultBranch: 'main',
        repoDiskPath: 'D:/Projects/Pantheon/repos/mythic-odyssey.git',
        createdAt: new Date(),
        updatedAt: new Date(),
        branches: [],
      };

      repoRepository.findProjectForRepository.mockResolvedValue(
        projectWithoutRepo,
      );
      repoRepository.createRepository.mockResolvedValue(createdRepoRecord);
      repoRepository.findRepositoryByProjectId.mockResolvedValue(
        createdRepoRecord,
      );

      const result = await service.getRepository('proj-123', mockUser);

      expect(repoRepository.createRepository).toHaveBeenCalledWith(
        'proj-123',
        'main',
      );
      expect(prismaService.projectRepository.update).toHaveBeenCalled();
      expect(result.defaultBranch).toBe('main');
    });

    it('should support custom branch selection', async () => {
      repoRepository.findProjectForRepository.mockResolvedValue(mockProject);

      const result = await service.getRepository(
        'proj-123',
        mockUser,
        'feature-branch',
      );

      expect(result.currentBranch).toBe('feature-branch');
      expect(gitService.listCommits).toHaveBeenCalledWith(
        expect.any(String),
        'feature-branch',
        50,
      );
      expect(gitService.getTree).toHaveBeenCalledWith(
        expect.any(String),
        'feature-branch',
        '',
        true,
      );
    });
  });
});
