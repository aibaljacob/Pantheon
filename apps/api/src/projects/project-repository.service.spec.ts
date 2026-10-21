import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
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
      taskCommitLink: {
        findMany: jest.fn().mockResolvedValue([]),
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

      // Verify clone URLs match the local Smart HTTP endpoint and do not use obsolete URLs
      expect(result.cloneUrls.https).toBe(
        'http://localhost:3000/repos/mythic-odyssey.git',
      );
      expect(result.cloneUrls.ssh).toBe(
        'git@localhost:repos/mythic-odyssey.git',
      );
      expect(result.cloneUrls.https).not.toContain('git.pantheon.studio');
      expect(result.cloneUrls.https).not.toContain('/projects/');
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

    describe('Commit ↔ Task Linking (TaskCommitLink Authoritative Source)', () => {
      it('should return one linked task when a commit has a single TaskCommitLink record', async () => {
        repoRepository.findProjectForRepository.mockResolvedValue(mockProject);
        gitService.listCommits.mockResolvedValue([
          {
            hash: 'commit-hash-1',
            message: 'feat: add player movement [TASK-12]',
            authorName: 'developer',
            authorEmail: 'dev@pantheon.studio',
            date: '2026-01-01T12:00:00Z',
          },
        ]);

        (prismaService.taskCommitLink.findMany as jest.Mock).mockResolvedValue([
          {
            id: 'link-1',
            taskId: 'task-uuid-12',
            commitHash: 'commit-hash-1',
            commitMsg: 'feat: add player movement [TASK-12]',
            task: {
              id: 'task-uuid-12',
              taskNumber: 12,
              title: 'Player Movement Physics',
              status: 'DONE',
            },
          },
        ]);

        const result = await service.getRepository('proj-123', mockUser);

        expect(result.recentCommits).toHaveLength(1);
        const commit = result.recentCommits[0];
        expect(commit.linkedTasks).toHaveLength(1);
        expect(commit.linkedTasks[0]).toEqual({
          id: 'task-uuid-12',
          taskNumber: 12,
          taskCode: 'TASK-12',
          title: 'Player Movement Physics',
          status: 'DONE',
        });
        expect(commit.message).toBe('feat: add player movement [TASK-12]');
      });

      it('should return all linked tasks when a commit has multiple TaskCommitLinks (TASK-12, TASK-18, TASK-25)', async () => {
        repoRepository.findProjectForRepository.mockResolvedValue(mockProject);
        gitService.listCommits.mockResolvedValue([
          {
            hash: 'multi-task-commit-hash',
            message:
              'feat: multi subsystem integration [TASK-12] [TASK-18] [TASK-25]',
            authorName: 'developer',
            authorEmail: 'dev@pantheon.studio',
            date: '2026-01-01T12:00:00Z',
          },
        ]);

        (prismaService.taskCommitLink.findMany as jest.Mock).mockResolvedValue([
          {
            id: 'link-12',
            taskId: 'task-uuid-12',
            commitHash: 'multi-task-commit-hash',
            task: {
              id: 'task-uuid-12',
              taskNumber: 12,
              title: 'Movement Physics',
              status: 'DONE',
            },
          },
          {
            id: 'link-18',
            taskId: 'task-uuid-18',
            commitHash: 'multi-task-commit-hash',
            task: {
              id: 'task-uuid-18',
              taskNumber: 18,
              title: 'Combat System',
              status: 'IN_PROGRESS',
            },
          },
          {
            id: 'link-25',
            taskId: 'task-uuid-25',
            commitHash: 'multi-task-commit-hash',
            task: {
              id: 'task-uuid-25',
              taskNumber: 25,
              title: 'Animation Blending',
              status: 'TODO',
            },
          },
        ]);

        const result = await service.getRepository('proj-123', mockUser);

        expect(result.recentCommits).toHaveLength(1);
        const commit = result.recentCommits[0];
        expect(commit.linkedTasks).toHaveLength(3);
        expect(commit.linkedTasks.map((t) => t.taskCode)).toEqual([
          'TASK-12',
          'TASK-18',
          'TASK-25',
        ]);
        expect(commit.linkedTasks.map((t) => t.taskNumber)).toEqual([
          12, 18, 25,
        ]);
        expect(commit.message).toBe(
          'feat: multi subsystem integration [TASK-12] [TASK-18] [TASK-25]',
        );
      });

      it('should NOT return a linked task when commit message contains nonexistent TASK-999 and no TaskCommitLink exists', async () => {
        repoRepository.findProjectForRepository.mockResolvedValue(mockProject);
        gitService.listCommits.mockResolvedValue([
          {
            hash: 'rogue-commit-hash',
            message: 'fix: bad commit message containing [TASK-999]',
            authorName: 'developer',
            authorEmail: 'dev@pantheon.studio',
            date: '2026-01-01T12:00:00Z',
          },
        ]);

        // TaskCommitLink table has no record for this commit
        (prismaService.taskCommitLink.findMany as jest.Mock).mockResolvedValue(
          [],
        );

        const result = await service.getRepository('proj-123', mockUser);

        expect(result.recentCommits).toHaveLength(1);
        const commit = result.recentCommits[0];
        expect(commit.linkedTasks).toEqual([]);
        // Authored message preserved verbatim
        expect(commit.message).toBe(
          'fix: bad commit message containing [TASK-999]',
        );
      });

      it('should return empty linkedTasks when a commit has no TaskCommitLink records', async () => {
        repoRepository.findProjectForRepository.mockResolvedValue(mockProject);
        gitService.listCommits.mockResolvedValue([
          {
            hash: 'clean-commit-hash',
            message: 'docs: update repository readme',
            authorName: 'developer',
            authorEmail: 'dev@pantheon.studio',
            date: '2026-01-01T12:00:00Z',
          },
        ]);

        (prismaService.taskCommitLink.findMany as jest.Mock).mockResolvedValue(
          [],
        );

        const result = await service.getRepository('proj-123', mockUser);

        expect(result.recentCommits[0].linkedTasks).toEqual([]);
      });

      it('should preserve valid TaskCommitLink records across repeated calls (simulating refresh)', async () => {
        repoRepository.findProjectForRepository.mockResolvedValue(mockProject);
        gitService.listCommits.mockResolvedValue([
          {
            hash: 'persistent-hash',
            message: 'feat: persistent feature [TASK-7]',
            authorName: 'developer',
            authorEmail: 'dev@pantheon.studio',
            date: '2026-01-01T12:00:00Z',
          },
        ]);

        (prismaService.taskCommitLink.findMany as jest.Mock).mockResolvedValue([
          {
            id: 'link-7',
            taskId: 'task-uuid-7',
            commitHash: 'persistent-hash',
            task: {
              id: 'task-uuid-7',
              taskNumber: 7,
              title: 'Inventory Storage',
              status: 'DONE',
            },
          },
        ]);

        const firstResult = await service.getRepository('proj-123', mockUser);
        const refreshedResult = await service.getRepository(
          'proj-123',
          mockUser,
        );

        expect(firstResult.recentCommits[0].linkedTasks).toHaveLength(1);
        expect(firstResult.recentCommits[0].linkedTasks[0].taskCode).toBe(
          'TASK-7',
        );

        expect(refreshedResult.recentCommits[0].linkedTasks).toHaveLength(1);
        expect(refreshedResult.recentCommits[0].linkedTasks[0].taskCode).toBe(
          'TASK-7',
        );
      });

      it('should match commit hashes case-insensitively with TaskCommitLink records', async () => {
        repoRepository.findProjectForRepository.mockResolvedValue(mockProject);
        gitService.listCommits.mockResolvedValue([
          {
            hash: 'AABBCCDDEEFF00112233',
            message: 'fix: case insensitive hash test [TASK-3]',
            authorName: 'developer',
            authorEmail: 'dev@pantheon.studio',
            date: '2026-01-01T12:00:00Z',
          },
        ]);

        (prismaService.taskCommitLink.findMany as jest.Mock).mockResolvedValue([
          {
            id: 'link-3',
            taskId: 'task-uuid-3',
            commitHash: 'aabbccddeeff00112233',
            task: {
              id: 'task-uuid-3',
              taskNumber: 3,
              title: 'Collision bug',
              status: 'IN_PROGRESS',
            },
          },
        ]);

        const result = await service.getRepository('proj-123', mockUser);

        expect(result.recentCommits[0].linkedTasks).toHaveLength(1);
        expect(result.recentCommits[0].linkedTasks[0].taskCode).toBe('TASK-3');
      });
    });
  });

  describe('getCommit', () => {
    const validHash = 'c1234567890abcdef1234567890abcdef1234567';

    it('should reject unauthorized users with ForbiddenException when assertCanView fails', async () => {
      authService.assertCanView.mockRejectedValueOnce(
        new ForbiddenException('User cannot view project'),
      );

      await expect(
        service.getCommit('proj-123', validHash, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject invalid commit hash format with BadRequestException', async () => {
      await expect(
        service.getCommit('proj-123', '../malicious/path', mockUser),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getCommit('proj-123', 'short', mockUser),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getCommit('proj-123', 'has spaces in hash 12345', mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should isolate repository access to the specified project and fail if project does not exist', async () => {
      repoRepository.findProjectForRepository.mockResolvedValue(null);

      await expect(
        service.getCommit('non-existent-proj', validHash, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if commit hash does not exist in repository', async () => {
      repoRepository.findProjectForRepository.mockResolvedValue(mockProject);
      (gitService as any).getCommitInfo = jest
        .fn()
        .mockRejectedValue(
          new NotFoundException('Commit not found in repository'),
        );

      await expect(
        service.getCommit('proj-123', validHash, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return commit details with added, modified, deleted, and renamed files and linked tasks', async () => {
      repoRepository.findProjectForRepository.mockResolvedValue(mockProject);

      (gitService as any).getCommitInfo = jest.fn().mockResolvedValue({
        hash: validHash,
        message: 'feat: combat overhaul [TASK-12]',
        authorName: 'developer',
        authorEmail: 'dev@pantheon.studio',
        date: '2026-01-01T12:00:00Z',
      });

      (gitService as any).getCommitChangedFiles = jest.fn().mockResolvedValue([
        { status: 'ADDED', path: 'src/combat/Hitbox.ts' },
        { status: 'MODIFIED', path: 'src/combat/PlayerAttack.ts' },
        { status: 'DELETED', path: 'src/combat/OldPunch.ts' },
        {
          status: 'RENAMED',
          oldPath: 'src/combat/Stats.ts',
          path: 'src/combat/CombatStats.ts',
        },
      ]);

      (prismaService.taskCommitLink.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'link-12',
          taskId: 'task-12-uuid',
          commitHash: validHash,
          task: {
            id: 'task-12-uuid',
            taskNumber: 12,
            title: 'Combat Overhaul',
            status: 'DONE',
          },
        },
      ]);

      const result = await service.getCommit('proj-123', validHash, mockUser);

      expect(result.hash).toBe(validHash);
      expect(result.message).toBe('feat: combat overhaul [TASK-12]');
      expect(result.author.username).toBe('developer');
      expect(result.changedFiles).toEqual([
        'src/combat/Hitbox.ts',
        'src/combat/PlayerAttack.ts',
        'src/combat/OldPunch.ts',
        'src/combat/CombatStats.ts',
      ]);
      expect(result.fileChanges).toEqual([
        { status: 'ADDED', path: 'src/combat/Hitbox.ts' },
        { status: 'MODIFIED', path: 'src/combat/PlayerAttack.ts' },
        { status: 'DELETED', path: 'src/combat/OldPunch.ts' },
        {
          status: 'RENAMED',
          oldPath: 'src/combat/Stats.ts',
          path: 'src/combat/CombatStats.ts',
        },
      ]);
      expect(result.linkedTasks).toHaveLength(1);
      expect(result.linkedTasks[0].taskCode).toBe('TASK-12');
    });

    it('should return empty arrays when a commit has no changed files', async () => {
      repoRepository.findProjectForRepository.mockResolvedValue(mockProject);

      (gitService as any).getCommitInfo = jest.fn().mockResolvedValue({
        hash: validHash,
        message: 'chore: empty root or merge',
        authorName: 'developer',
        authorEmail: 'dev@pantheon.studio',
        date: '2026-01-01T12:00:00Z',
      });

      (gitService as any).getCommitChangedFiles = jest
        .fn()
        .mockResolvedValue([]);
      (prismaService.taskCommitLink.findMany as jest.Mock).mockResolvedValue(
        [],
      );

      const result = await service.getCommit('proj-123', validHash, mockUser);

      expect(result.changedFiles).toEqual([]);
      expect(result.fileChanges).toEqual([]);
      expect(result.linkedTasks).toEqual([]);
    });

    it('should ensure getRepository list remains lightweight with changedFiles: [] while TaskCommitLink remains intact', async () => {
      repoRepository.findProjectForRepository.mockResolvedValue(mockProject);
      gitService.listCommits.mockResolvedValue([
        {
          hash: validHash,
          message: 'feat: player jump physics [TASK-12]',
          authorName: 'developer',
          authorEmail: 'dev@pantheon.studio',
          date: '2026-01-01T12:00:00Z',
        },
      ]);

      (prismaService.taskCommitLink.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'link-12',
          taskId: 'task-12-uuid',
          commitHash: validHash,
          task: {
            id: 'task-12-uuid',
            taskNumber: 12,
            title: 'Player Jump',
            status: 'DONE',
          },
        },
      ]);

      const listResult = await service.getRepository('proj-123', mockUser);

      expect(listResult.recentCommits).toHaveLength(1);
      // List view must remain lightweight (not running diffs per commit in list)
      expect(listResult.recentCommits[0].changedFiles).toEqual([]);
      // TaskCommitLink remains visible and unaffected
      expect(listResult.recentCommits[0].linkedTasks).toHaveLength(1);
      expect(listResult.recentCommits[0].linkedTasks[0].taskCode).toBe(
        'TASK-12',
      );
    });
  });

  describe('getGitCloneUrls', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
      delete process.env.GIT_HTTP_BASE_URL;
      delete process.env.API_URL;
      delete process.env.PORT;
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should generate local Smart HTTP clone URL with default port 3000', () => {
      const urls = service.getGitCloneUrls('mythic-odyssey');
      expect(urls.https).toBe('http://localhost:3000/repos/mythic-odyssey.git');
      expect(urls.ssh).toBe('git@localhost:repos/mythic-odyssey.git');
      expect(urls.https).not.toContain('git.pantheon.studio');
      expect(urls.https).not.toContain('/projects/');
    });

    it('should respect custom PORT in development environment', () => {
      process.env.PORT = '5000';
      const urls = service.getGitCloneUrls('cyber-runner');
      expect(urls.https).toBe('http://localhost:5000/repos/cyber-runner.git');
    });

    it('should generate production Smart HTTP clone URL when API_URL is configured', () => {
      process.env.API_URL = 'https://api.pantheon.studio';
      const urls = service.getGitCloneUrls('project-helios');
      expect(urls.https).toBe(
        'https://api.pantheon.studio/repos/project-helios.git',
      );
      expect(urls.ssh).toBe('git@api.pantheon.studio:repos/project-helios.git');
    });

    it('should generate production clone URL when GIT_HTTP_BASE_URL is configured', () => {
      process.env.GIT_HTTP_BASE_URL = 'https://git.pantheon.studio/repos';
      const urls = service.getGitCloneUrls('space-odyssey');
      expect(urls.https).toBe(
        'https://git.pantheon.studio/repos/space-odyssey.git',
      );
    });
  });
});
