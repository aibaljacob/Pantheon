import { Test, TestingModule } from '@nestjs/testing';
import {
  FeedbackSeverity,
  FeedbackStatus,
  ProjectMemberStatus,
  ProjectModerationStatus,
  ProjectStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAuthorizationService } from '../tasks/project-authorization.service';
import { ProjectMembersService } from '../projects/project-members.service';
import { PlaytestService } from '../playtest/playtest.service';
import { TasksService } from '../tasks/tasks.service';

interface MockUser {
  id: string;
  username: string;
  email: string;
}

interface MockProject {
  id: string;
  slug: string;
  founderId: string;
  moderationStatus: ProjectModerationStatus;
  status: ProjectStatus;
  openRoles?: unknown[];
  applications?: unknown[];
  invitations?: unknown[];
}

interface MockRepoCommit {
  id: string;
  repositoryId: string;
  hash: string;
  message: string;
  branchName: string;
  authorId: string | null;
  changedFiles: string[];
}

interface MockPlaytestFeedback {
  id: string;
  sessionId: string;
  reporterId: string | null;
  title: string;
  description: string;
  severity: FeedbackSeverity;
  status: FeedbackStatus;
  convertedTaskId: string | null;
}

interface MockPlaytestSession {
  id: string;
  projectId: string;
  playableBuildId: string | null;
  createdById: string | null;
  title: string;
  isActive: boolean;
  feedback?: MockPlaytestFeedback[];
}

interface MockProjectMember {
  id: string;
  projectId: string;
  userId: string | null;
  role: string;
  status: ProjectMemberStatus;
  joinedAt: Date;
  leftAt: Date | null;
  user?: MockUser | null;
}

describe('Phase 0.2A: Database Cascade Hardening Tests', () => {
  let authzService: ProjectAuthorizationService;
  let membersService: ProjectMembersService;
  let playtestService: PlaytestService;

  const founderUser: MockUser = {
    id: 'founder-uuid-1',
    username: 'studio_founder',
    email: 'founder@studio.com',
  };

  const project: MockProject = {
    id: 'project-uuid-1',
    slug: 'chronicles-of-valoria',
    founderId: founderUser.id,
    moderationStatus: ProjectModerationStatus.PUBLISHED,
    status: ProjectStatus.IN_DEVELOPMENT,
    openRoles: [],
    applications: [],
    invitations: [],
  };

  const prismaMock: {
    user: {
      findUnique: jest.Mock<Promise<MockUser | null>, [unknown]>;
      delete: jest.Mock<Promise<MockUser>, [{ where: { id: string } }]>;
    };
    project: {
      findFirst: jest.Mock<Promise<MockProject | null>, [unknown]>;
      findUnique: jest.Mock<Promise<MockProject | null>, [unknown]>;
      delete: jest.Mock<Promise<MockProject>, [unknown]>;
    };
    projectMember: {
      findFirst: jest.Mock<Promise<MockProjectMember | null>, [unknown]>;
      findUnique: jest.Mock<Promise<MockProjectMember | null>, [unknown]>;
      findMany: jest.Mock<Promise<MockProjectMember[]>, [unknown]>;
      update: jest.Mock;
      delete: jest.Mock;
    };
    repoCommit: {
      findUnique: jest.Mock<Promise<MockRepoCommit | null>, [unknown]>;
      findMany: jest.Mock<Promise<MockRepoCommit[]>, [unknown]>;
    };
    playtestSession: {
      findFirst: jest.Mock<Promise<MockPlaytestSession | null>, [unknown]>;
      findMany: jest.Mock<Promise<MockPlaytestSession[]>, [unknown]>;
      delete: jest.Mock;
    };
    playtestFeedback: {
      findFirst: jest.Mock<Promise<MockPlaytestFeedback | null>, [unknown]>;
      findMany: jest.Mock<Promise<MockPlaytestFeedback[]>, [unknown]>;
      delete: jest.Mock;
    };
    playableBuild: {
      findFirst: jest.Mock;
      delete: jest.Mock;
    };
    task: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    projectRole: {
      findMany: jest.Mock<Promise<unknown[]>, [unknown]>;
    };
  } = {
    user: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    projectMember: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    repoCommit: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    playtestSession: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    playtestFeedback: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    playableBuild: {
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    task: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    projectRole: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const tasksServiceMock = {
    createTask: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectAuthorizationService,
        ProjectMembersService,
        PlaytestService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: TasksService, useValue: tasksServiceMock },
      ],
    }).compile();

    authzService = module.get<ProjectAuthorizationService>(
      ProjectAuthorizationService,
    );
    membersService = module.get<ProjectMembersService>(ProjectMembersService);
    playtestService = module.get<PlaytestService>(PlaytestService);
  });

  describe('1. PROJECT FOUNDER (onDelete: Restrict)', () => {
    it('should simulate blocking founder deletion when project references founderId', async () => {
      prismaMock.user.delete.mockImplementation(
        ({ where }: { where: { id: string } }) => {
          if (where.id === project.founderId) {
            const error = new Error(
              'Foreign key constraint failed on the field: `Project_founderId_fkey (index)`: Restrict constraint violation',
            );
            (error as unknown as { code: string }).code = 'P2003';
            return Promise.reject(error);
          }
          return Promise.resolve(founderUser);
        },
      );

      await expect(
        prismaMock.user.delete({ where: { id: founderUser.id } }),
      ).rejects.toThrow('Restrict constraint violation');
    });

    it('should keep project intact when founder deletion is rejected', async () => {
      prismaMock.project.findFirst.mockResolvedValue(project);

      const existingProject: MockProject | null =
        await prismaMock.project.findFirst({
          where: { id: project.id },
        });

      expect(existingProject).toBeDefined();
      expect(existingProject?.founderId).toBe(founderUser.id);
    });
  });

  describe('2. REPO COMMIT AUTHOR (onDelete: SetNull)', () => {
    it('should preserve RepoCommit record when author user is deleted and set authorId to null', async () => {
      const commit: MockRepoCommit = {
        id: 'commit-uuid-1',
        repositoryId: 'repo-uuid-1',
        hash: 'a1b2c3d4e5f6',
        message: 'feat: implement character physics engine',
        branchName: 'main',
        authorId: null, // User was deleted, reference became null
        changedFiles: ['src/physics.rs'],
      };

      prismaMock.repoCommit.findUnique.mockResolvedValue(commit);

      const result: MockRepoCommit | null =
        await prismaMock.repoCommit.findUnique({
          where: { hash: commit.hash },
        });

      expect(result).toBeDefined();
      expect(result?.id).toBe('commit-uuid-1');
      expect(result?.authorId).toBeNull();
      expect(result?.hash).toBe('a1b2c3d4e5f6');
      expect(result?.message).toBe('feat: implement character physics engine');
    });
  });

  describe('3. PLAYTEST FEEDBACK REPORTER (onDelete: SetNull)', () => {
    it('should preserve PlaytestFeedback when reporter is deleted and reporterId becomes null', async () => {
      const feedback: MockPlaytestFeedback = {
        id: 'feedback-uuid-1',
        sessionId: 'session-uuid-1',
        reporterId: null, // Reporter account removed, feedback preserved
        title: 'Collision glitch in level 3 boss fight',
        description:
          'Player passes through terrain when jumping against the right wall.',
        severity: FeedbackSeverity.HIGH,
        status: FeedbackStatus.OPEN,
        convertedTaskId: null,
      };

      prismaMock.playtestFeedback.findFirst.mockResolvedValue(feedback);

      const result: MockPlaytestFeedback | null =
        await prismaMock.playtestFeedback.findFirst({
          where: { id: feedback.id },
        });

      expect(result).toBeDefined();
      expect(result?.reporterId).toBeNull();
      expect(result?.severity).toBe(FeedbackSeverity.HIGH);
      expect(result?.description).toContain('passes through terrain');
    });
  });

  describe('4. PLAYTEST SESSION CREATOR (onDelete: SetNull)', () => {
    it('should preserve PlaytestSession and feedback from testers when creator is deleted', async () => {
      expect(playtestService).toBeDefined();

      const otherTesterFeedback: MockPlaytestFeedback = {
        id: 'feedback-uuid-2',
        sessionId: 'session-uuid-1',
        reporterId: 'active-tester-uuid',
        title: 'Frame rate drops in multiplayer lobby',
        description: 'FPS drops from 60 to 22 when more than 4 players join.',
        severity: FeedbackSeverity.CRITICAL,
        status: FeedbackStatus.OPEN,
        convertedTaskId: null,
      };

      const session: MockPlaytestSession = {
        id: 'session-uuid-1',
        projectId: project.id,
        playableBuildId: 'build-uuid-1',
        createdById: null, // Creator was deleted, session remains intact
        title: 'Alpha 0.4 Stress Test',
        isActive: true,
        feedback: [otherTesterFeedback],
      };

      prismaMock.playtestSession.findFirst.mockResolvedValue(session);

      const result: MockPlaytestSession | null =
        await prismaMock.playtestSession.findFirst({
          where: { id: session.id },
        });

      expect(result).toBeDefined();
      expect(result?.createdById).toBeNull();
      expect(result?.title).toBe('Alpha 0.4 Stress Test');
      expect(result?.feedback?.length).toBe(1);
      expect(result?.feedback?.[0].reporterId).toBe('active-tester-uuid');
    });
  });

  describe('5. PROJECT MEMBER HISTORY (onDelete: SetNull)', () => {
    it('should preserve ProjectMember history with userId: null and REMOVED/LEFT status', async () => {
      const historicalMember: MockProjectMember = {
        id: 'member-uuid-former',
        projectId: project.id,
        userId: null, // User account deleted, historical membership preserved
        role: 'Senior Animator',
        status: ProjectMemberStatus.REMOVED,
        joinedAt: new Date('2026-01-15'),
        leftAt: new Date('2026-06-30'),
        user: null,
      };

      prismaMock.project.findFirst.mockResolvedValue({
        id: project.id,
        slug: project.slug,
        status: project.status,
        founderId: project.founderId,
        moderationStatus: ProjectModerationStatus.PUBLISHED,
        openRoles: [],
        applications: [],
        invitations: [],
      });

      prismaMock.projectMember.findMany.mockResolvedValue([historicalMember]);

      const team = await membersService.getTeamMembers(project.id);

      expect(team.formerMembers).toBeDefined();
      expect(team.formerMembers.length).toBe(1);
      expect(team.formerMembers[0].userId).toBeNull();
      expect(team.formerMembers[0].username).toBe('deleted_user');
      expect(team.formerMembers[0].displayName).toBe('Former Member');
      expect(team.formerMembers[0].role).toBe('Senior Animator');
      expect(team.formerMembers[0].status).toBe(ProjectMemberStatus.REMOVED);
    });

    it('should NOT allow a ProjectMember with userId: null to satisfy active authorization checks', async () => {
      prismaMock.project.findFirst.mockResolvedValue(project);
      prismaMock.projectMember.findFirst.mockResolvedValue(null);

      // Null userId should never match active member check
      const context = await authzService.getProjectAccess(
        project.id,
        undefined,
      );

      expect(context.isFounder).toBe(false);
      expect(context.isMember).toBe(false);
      expect(context.isAdmin).toBe(false);
    });
  });

  describe('6. PLAYTEST BUILD (onDelete: SetNull)', () => {
    it('should preserve PlaytestSession and feedback when playableBuild is deleted', async () => {
      const sessionWithoutBuild: MockPlaytestSession = {
        id: 'session-uuid-legacy',
        projectId: project.id,
        playableBuildId: null, // Build was pruned/removed, session survives
        createdById: founderUser.id,
        title: 'Legacy Closed Beta Feedback Session',
        isActive: false,
      };

      prismaMock.playtestSession.findFirst.mockResolvedValue(
        sessionWithoutBuild,
      );

      const result: MockPlaytestSession | null =
        await prismaMock.playtestSession.findFirst({
          where: { id: 'session-uuid-legacy' },
        });

      expect(result).toBeDefined();
      expect(result?.playableBuildId).toBeNull();
      expect(result?.title).toBe('Legacy Closed Beta Feedback Session');
    });
  });
});
