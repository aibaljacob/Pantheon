import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiRecommendationService } from '../ai/ai-recommendation.service';
import { TalentMatchingService } from './talent-matching.service';
import {
  ProjectMemberStatus,
  ProjectModerationStatus,
  ProjectRoleCommitment,
  ProjectRoleExperienceLevel,
  ProjectRoleStatus,
  ProjectStatus,
} from '@prisma/client';

describe('ProjectsService - Project Discovery & Role-Aware Details', () => {
  let service: ProjectsService;
  let prismaMock: any;

  const mockFounder = {
    id: 'founder-1',
    username: 'alex_creator',
    profile: {
      displayName: 'Alex Creator',
      avatarUrl: 'https://cdn.example.com/avatar.jpg',
      firstName: 'Alex',
      lastName: 'Creator',
    },
  };

  const mockOpenRoles = [
    {
      id: 'role-1',
      title: 'Senior Gameplay Engineer',
      experienceLevel: ProjectRoleExperienceLevel.SENIOR,
      commitment: ProjectRoleCommitment.FULL_TIME,
      status: ProjectRoleStatus.OPEN,
      role: { name: 'Gameplay Programmer' },
    },
    {
      id: 'role-2',
      title: 'Technical Artist',
      experienceLevel: ProjectRoleExperienceLevel.MID,
      commitment: ProjectRoleCommitment.PART_TIME,
      status: ProjectRoleStatus.OPEN,
      role: { name: 'Technical Artist' },
    },
  ];

  const mockPublishedProject = {
    id: 'proj-1',
    name: 'Cyber Odyssey',
    slug: 'cyber-odyssey',
    description: 'A dark cyberpunk action RPG built in Unreal Engine 5.',
    coverUrl: 'https://cdn.example.com/cyber.jpg',
    status: ProjectStatus.IN_DEVELOPMENT,
    moderationStatus: ProjectModerationStatus.PUBLISHED,
    genre: 'Cyberpunk RPG',
    platform: 'PC / Windows',
    gameEngine: 'Unreal Engine 5',
    founderId: 'founder-1',
    updatedAt: new Date('2026-09-29T12:00:00Z'),
    founder: mockFounder,
    openRoles: mockOpenRoles,
    members: [{ userId: 'founder-1', role: 'Founder' }],
    _count: {
      members: 4,
      openRoles: 2,
    },
  };

  beforeEach(async () => {
    prismaMock = {
      project: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: AiRecommendationService,
          useValue: {},
        },
        {
          provide: TalentMatchingService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  describe('getPublicProjects (Project Discovery)', () => {
    it('1. should only query PUBLISHED projects, strictly respecting moderationStatus', async () => {
      prismaMock.project.findMany.mockResolvedValueOnce([mockPublishedProject]);

      const result = await service.getPublicProjects();

      expect(prismaMock.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            moderationStatus: ProjectModerationStatus.PUBLISHED,
          }),
        }),
      );
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].moderationStatus).toBe(
        ProjectModerationStatus.PUBLISHED,
      );
      expect(result.projects[0].name).toBe('Cyber Odyssey');
    });

    it('2. should apply search filter across name, description, genre, and engine', async () => {
      prismaMock.project.findMany.mockResolvedValueOnce([mockPublishedProject]);

      await service.getPublicProjects('cyber');

      expect(prismaMock.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            moderationStatus: ProjectModerationStatus.PUBLISHED,
            OR: [
              { name: { contains: 'cyber', mode: 'insensitive' } },
              { description: { contains: 'cyber', mode: 'insensitive' } },
              { genre: { contains: 'cyber', mode: 'insensitive' } },
              { gameEngine: { contains: 'cyber', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('3. should filter by genre when genre parameter is provided', async () => {
      prismaMock.project.findMany.mockResolvedValueOnce([mockPublishedProject]);

      await service.getPublicProjects(undefined, 'RPG');

      expect(prismaMock.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            moderationStatus: ProjectModerationStatus.PUBLISHED,
            genre: { contains: 'RPG', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('4. should filter by platform when platform parameter is provided', async () => {
      prismaMock.project.findMany.mockResolvedValueOnce([mockPublishedProject]);

      await service.getPublicProjects(undefined, undefined, 'PC');

      expect(prismaMock.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            moderationStatus: ProjectModerationStatus.PUBLISHED,
            platform: { contains: 'PC', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('5. should ignore "ALL" sentinel for genre and platform filters', async () => {
      prismaMock.project.findMany.mockResolvedValueOnce([mockPublishedProject]);

      await service.getPublicProjects(undefined, 'ALL', 'ALL');

      const callArgs = prismaMock.project.findMany.mock.calls[0][0];
      expect(callArgs.where.genre).toBeUndefined();
      expect(callArgs.where.platform).toBeUndefined();
      expect(callArgs.where.moderationStatus).toBe(
        ProjectModerationStatus.PUBLISHED,
      );
    });

    it('6. should enrich projects with founder details, open role counts, and previews', async () => {
      prismaMock.project.findMany.mockResolvedValueOnce([mockPublishedProject]);

      const result = await service.getPublicProjects();
      const proj = result.projects[0];

      expect(proj.founder).toBeDefined();
      expect(proj.founder?.username).toBe('alex_creator');
      expect(proj.founder?.avatarUrl).toBe(
        'https://cdn.example.com/avatar.jpg',
      );
      expect(proj.memberCount).toBe(4);
      expect(proj.openRoleCount).toBe(2);
      expect(proj.openRoles).toHaveLength(2);
      expect(proj.openRoles?.[0].title).toBe('Senior Gameplay Engineer');
      expect(proj.openRoles?.[0].roleName).toBe('Gameplay Programmer');
      expect(proj.openRoles?.[0].experienceLevel).toBe(
        ProjectRoleExperienceLevel.SENIOR,
      );
      expect(proj.openRoles?.[0].commitment).toBe(
        ProjectRoleCommitment.FULL_TIME,
      );
    });
  });

  describe('getProjectDetails (Role-Aware Viewer Resolution)', () => {
    const mockDetailProject = {
      id: 'proj-1',
      name: 'Cyber Odyssey',
      slug: 'cyber-odyssey',
      description: 'A dark cyberpunk action RPG.',
      coverUrl: 'https://cdn.example.com/cyber.jpg',
      status: ProjectStatus.IN_DEVELOPMENT,
      moderationStatus: ProjectModerationStatus.PUBLISHED,
      genre: 'Cyberpunk RPG',
      platform: 'PC',
      gameEngine: 'Unreal Engine 5',
      founderId: 'founder-1',
      createdAt: new Date('2026-09-01T00:00:00Z'),
      updatedAt: new Date('2026-09-29T12:00:00Z'),
      founder: mockFounder,
      members: [
        {
          id: 'member-1',
          userId: 'founder-1',
          role: 'Founder',
          status: ProjectMemberStatus.ACTIVE,
          joinedAt: new Date('2026-09-01T00:00:00Z'),
          user: { username: 'alex_creator', profile: mockFounder.profile },
        },
        {
          id: 'member-2',
          userId: 'member-user-1',
          role: 'Lead Artist',
          status: ProjectMemberStatus.ACTIVE,
          joinedAt: new Date('2026-09-02T00:00:00Z'),
          user: {
            username: 'art_lead',
            profile: { displayName: 'Art Lead', avatarUrl: null },
          },
        },
      ],
    };

    beforeEach(() => {
      prismaMock.project.findFirst.mockResolvedValue(mockDetailProject);
      prismaMock.projectRole = {
        findMany: jest.fn().mockResolvedValue([]),
      };
      prismaMock.projectApplication = {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      };
      prismaMock.projectInvitation = {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      };
    });

    it('1. should resolve unauthenticated visitor as VISITOR', async () => {
      const result = await service.getProjectDetails('proj-1');

      expect(result.viewerRelationship).toBe('VISITOR');
      expect(result.isFounder).toBe(false);
      expect(result.isMember).toBe(false);
      expect(result.viewerPendingApplication).toBeNull();
      expect(result.viewerPendingInvitation).toBeNull();
    });

    it('2. should resolve project founder as FOUNDER with full founder flags', async () => {
      const result = await service.getProjectDetails('proj-1', 'founder-1');

      expect(result.viewerRelationship).toBe('FOUNDER');
      expect(result.isFounder).toBe(true);
      expect(result.isMember).toBe(true);
      expect(result.viewerRole).toBe('Founder');
    });

    it('3. should resolve active team member as ACTIVE_MEMBER with their role', async () => {
      const result = await service.getProjectDetails('proj-1', 'member-user-1');

      expect(result.viewerRelationship).toBe('ACTIVE_MEMBER');
      expect(result.isFounder).toBe(false);
      expect(result.isMember).toBe(true);
      expect(result.viewerRole).toBe('Lead Artist');
    });

    it('4. should resolve user with pending invitation as INVITEE with invitation details', async () => {
      prismaMock.projectInvitation.findFirst.mockResolvedValueOnce({
        id: 'inv-123',
        projectId: 'proj-1',
        projectRoleId: 'role-concept',
        createdAt: new Date('2026-09-25T10:00:00Z'),
        message: 'Join our concept team!',
        projectRole: {
          id: 'role-concept',
          title: 'Senior Concept Artist',
          role: { name: 'Concept Artist' },
        },
        inviter: {
          id: 'founder-1',
          username: 'alex_creator',
          profile: { displayName: 'Alex Creator' },
        },
      });

      const result = await service.getProjectDetails(
        'proj-1',
        'invitee-user-1',
      );

      expect(result.viewerRelationship).toBe('INVITEE');
      expect(result.isFounder).toBe(false);
      expect(result.isMember).toBe(false);
      expect(result.viewerPendingInvitation).toBeDefined();
      expect(result.viewerPendingInvitation?.id).toBe('inv-123');
      expect(result.viewerPendingInvitation?.roleTitle).toBe(
        'Senior Concept Artist',
      );
      expect(result.viewerPendingInvitation?.inviterName).toBe('Alex Creator');
    });

    it('5. should resolve user with pending application as APPLICANT with application details', async () => {
      prismaMock.projectApplication.findFirst.mockResolvedValueOnce({
        id: 'app-456',
        projectId: 'proj-1',
        projectRoleId: 'role-audio',
        createdAt: new Date('2026-09-27T14:00:00Z'),
        message: 'Excited about the audio tone.',
        projectRole: {
          id: 'role-audio',
          title: null,
          role: { name: 'Audio Designer' },
        },
      });

      const result = await service.getProjectDetails(
        'proj-1',
        'applicant-user-1',
      );

      expect(result.viewerRelationship).toBe('APPLICANT');
      expect(result.isFounder).toBe(false);
      expect(result.isMember).toBe(false);
      expect(result.viewerPendingApplication).toBeDefined();
      expect(result.viewerPendingApplication?.id).toBe('app-456');
      expect(result.viewerPendingApplication?.roleTitle).toBe('Audio Designer');
    });

    it('6. should resolve authenticated stranger with no connection as NON_MEMBER', async () => {
      const result = await service.getProjectDetails(
        'proj-1',
        'stranger-user-1',
      );

      expect(result.viewerRelationship).toBe('NON_MEMBER');
      expect(result.isFounder).toBe(false);
      expect(result.isMember).toBe(false);
      expect(result.viewerPendingApplication).toBeNull();
      expect(result.viewerPendingInvitation).toBeNull();
    });
  });
});
