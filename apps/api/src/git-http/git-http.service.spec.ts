import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GitHttpService } from './git-http.service';
import { ProjectAuthorizationService } from '../tasks/project-authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';

describe('GitHttpService Security Suite', () => {
  let service: GitHttpService;
  let authService: ProjectAuthorizationService;
  let prismaMock: any;

  const mockRepoRoot = path.resolve(process.cwd(), 'repos');
  const mockProjectAId = 'project-uuid-a';
  const mockProjectBId = 'project-uuid-b';

  const mockProjectA = {
    id: mockProjectAId,
    slug: 'game-project-a',
    founderId: 'founder-uuid-a',
    repository: {
      id: 'repo-uuid-a',
      projectId: mockProjectAId,
      repoDiskPath: path.join(mockRepoRoot, 'game-project-a.git'),
    },
  };

  const mockProjectB = {
    id: mockProjectBId,
    slug: 'game-project-b',
    founderId: 'founder-uuid-b',
    repository: {
      id: 'repo-uuid-b',
      projectId: mockProjectBId,
      repoDiskPath: path.join(mockRepoRoot, 'game-project-b.git'),
    },
  };

  const mockRunnerA = {
    id: 'runner-uuid-a',
    projectId: mockProjectAId, // Assigned to Project A
    name: 'Runner A',
    platform: 'WINDOWS',
  };

  const mockDeveloperUser = {
    id: 'dev-user-1',
    role: 'USER',
  };

  const mockDeveloperPat = {
    id: 'pat-uuid-1',
    userId: 'dev-user-1',
    scopes: ['repo:read', 'repo:write'],
  };

  beforeEach(async () => {
    process.env.PANTHEON_REPO_ROOT = mockRepoRoot;

    prismaMock = {
      project: {
        findUnique: jest.fn().mockImplementation((args: any) => {
          if (args.where?.slug === 'game-project-a')
            return Promise.resolve(mockProjectA);
          if (args.where?.slug === 'game-project-b')
            return Promise.resolve(mockProjectB);
          return Promise.resolve(null);
        }),
      },
      projectMember: {
        findUnique: jest.fn().mockImplementation((args: any) => {
          if (
            args.where?.projectId_userId?.projectId === mockProjectAId &&
            args.where?.projectId_userId?.userId === mockDeveloperUser.id
          ) {
            return Promise.resolve({
              id: 'member-1',
              projectId: mockProjectAId,
              userId: mockDeveloperUser.id,
              status: 'ACTIVE',
            });
          }
          return Promise.resolve(null);
        }),
      },
    };

    const authServiceMock = {
      assertCanView: jest
        .fn()
        .mockImplementation((projectId: string, userId: string) => {
          if (projectId === mockProjectAId && userId === mockDeveloperUser.id) {
            return Promise.resolve({
              isFounder: false,
              isMember: true,
              isAdmin: false,
            });
          }
          throw new ForbiddenException('User cannot view project');
        }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitHttpService,
        {
          provide: ProjectAuthorizationService,
          useValue: authServiceMock,
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<GitHttpService>(GitHttpService);
    authService = module.get<ProjectAuthorizationService>(
      ProjectAuthorizationService,
    );
  });

  // ==========================================
  // RUNNER REPOSITORY ISOLATION
  // ==========================================
  describe('Runner Git HTTP Isolation', () => {
    it('should ALLOW Runner A to read its assigned project repository (Project A)', async () => {
      const repoPath = await service.resolveRepoPath(
        'game-project-a',
        null,
        null,
        mockRunnerA,
        'read',
      );

      expect(repoPath).toBe(
        path.normalize(mockProjectA.repository.repoDiskPath),
      );
    });

    it('should REJECT Runner A attempting to read another project repository (Project B)', async () => {
      await expect(
        service.resolveRepoPath(
          'game-project-b',
          null,
          null,
          mockRunnerA, // Belongs to Project A
          'read',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should REJECT any runner attempting write/push access', async () => {
      await expect(
        service.resolveRepoPath(
          'game-project-a',
          null,
          null,
          mockRunnerA,
          'write', // Runners must never push code
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if repository does not exist', async () => {
      await expect(
        service.resolveRepoPath(
          'non-existent-slug',
          null,
          null,
          mockRunnerA,
          'read',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==========================================
  // DEVELOPER PAT COMPATIBILITY
  // ==========================================
  describe('Developer Personal Access Token Compatibility', () => {
    it('should ALLOW developer with valid PAT and read scope to read assigned repository', async () => {
      const repoPath = await service.resolveRepoPath(
        'game-project-a',
        mockDeveloperUser,
        mockDeveloperPat,
        null, // No runner
        'read',
      );

      expect(repoPath).toBe(
        path.normalize(mockProjectA.repository.repoDiskPath),
      );
      expect(authService.assertCanView).toHaveBeenCalledWith(
        mockProjectAId,
        mockDeveloperUser.id,
        mockDeveloperUser.role,
      );
    });

    it('should REJECT developer PAT missing repo:read scope', async () => {
      const patWithoutRead = {
        ...mockDeveloperPat,
        scopes: ['user:profile'],
      };

      await expect(
        service.resolveRepoPath(
          'game-project-a',
          mockDeveloperUser,
          patWithoutRead,
          null,
          'read',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should ALLOW active member with repo:write scope to push code', async () => {
      const repoPath = await service.resolveRepoPath(
        'game-project-a',
        mockDeveloperUser,
        mockDeveloperPat,
        null,
        'write',
      );

      expect(repoPath).toBe(
        path.normalize(mockProjectA.repository.repoDiskPath),
      );
    });

    it('should REJECT non-member developer from pushing code', async () => {
      const nonMemberUser = { id: 'stranger-uuid', role: 'USER' };
      const nonMemberPat = {
        id: 'pat-2',
        userId: 'stranger-uuid',
        scopes: ['repo:write'],
      };

      await expect(
        service.resolveRepoPath(
          'game-project-a',
          nonMemberUser,
          nonMemberPat,
          null,
          'write',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
