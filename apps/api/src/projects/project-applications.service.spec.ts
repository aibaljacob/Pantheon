import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectApplicationsService } from './project-applications.service';
import { PrismaService } from '../prisma/prisma.service';
import { TalentMatchingService } from './talent-matching.service';
import {
  ProjectApplicationStatus,
  ProjectMemberStatus,
  ProjectModerationStatus,
  ProjectRoleStatus,
  Role,
} from '@prisma/client';
import { RespondProjectApplicationAction } from './project-applications.dto';

describe('ProjectApplicationsService', () => {
  let service: ProjectApplicationsService;
  let prismaMock: any;
  let talentMatchingServiceMock: any;

  beforeEach(async () => {
    prismaMock = {
      project: {
        findUnique: jest.fn(),
      },
      projectRole: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      projectMember: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      projectApplication: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    talentMatchingServiceMock = {
      scoreCandidate: jest.fn().mockReturnValue({
        totalScore: 90,
        matchGrade: 'STRONG_MATCH',
        matchBreakdown: {
          roleMatch: 25,
          skillMatch: 25,
          toolMatch: 15,
          experienceMatch: 15,
          availabilityMatch: 5,
          projectContextMatch: 5,
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectApplicationsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: TalentMatchingService, useValue: talentMatchingServiceMock },
      ],
    }).compile();

    service = module.get<ProjectApplicationsService>(ProjectApplicationsService);
  });

  describe('applyToRole', () => {
    const mockDto = { message: 'I would love to join as Gameplay Programmer!' };

    it('should successfully create an application for an open role', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        founderId: 'founder-1',
        moderationStatus: ProjectModerationStatus.PUBLISHED,
      });
      prismaMock.projectRole.findUnique.mockResolvedValue({
        id: 'role-1',
        projectId: 'proj-1',
        status: ProjectRoleStatus.OPEN,
      });
      prismaMock.projectMember.findUnique.mockResolvedValue(null);
      prismaMock.projectApplication.findFirst.mockResolvedValue(null);
      prismaMock.projectApplication.create.mockResolvedValue({
        id: 'app-1',
        projectId: 'proj-1',
        projectRoleId: 'role-1',
        applicantId: 'user-2',
        message: mockDto.message,
        status: ProjectApplicationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.applyToRole(
        'proj-1',
        'role-1',
        'user-2',
        Role.USER,
        mockDto,
      );

      expect(result.id).toBe('app-1');
      expect(result.status).toBe(ProjectApplicationStatus.PENDING);
      expect(prismaMock.projectApplication.create).toHaveBeenCalled();
    });

    it('should prevent duplicate active applications for the same applicant and role', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        founderId: 'founder-1',
        moderationStatus: ProjectModerationStatus.PUBLISHED,
      });
      prismaMock.projectRole.findUnique.mockResolvedValue({
        id: 'role-1',
        projectId: 'proj-1',
        status: ProjectRoleStatus.OPEN,
      });
      prismaMock.projectMember.findUnique.mockResolvedValue(null);
      prismaMock.projectApplication.findFirst.mockResolvedValue({
        id: 'existing-app-1',
        status: ProjectApplicationStatus.PENDING,
      });

      await expect(
        service.applyToRole('proj-1', 'role-1', 'user-2', Role.USER, mockDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject application if role is FILLED or CLOSED', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        founderId: 'founder-1',
        moderationStatus: ProjectModerationStatus.PUBLISHED,
      });
      prismaMock.projectRole.findUnique.mockResolvedValue({
        id: 'role-1',
        projectId: 'proj-1',
        status: ProjectRoleStatus.FILLED,
      });

      await expect(
        service.applyToRole('proj-1', 'role-1', 'user-2', Role.USER, mockDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject application if applicant is already a member', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        founderId: 'founder-1',
        moderationStatus: ProjectModerationStatus.PUBLISHED,
      });
      prismaMock.projectRole.findUnique.mockResolvedValue({
        id: 'role-1',
        projectId: 'proj-1',
        status: ProjectRoleStatus.OPEN,
      });
      prismaMock.projectMember.findUnique.mockResolvedValue({ id: 'mem-1' });

      await expect(
        service.applyToRole('proj-1', 'role-1', 'user-2', Role.USER, mockDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject application if applicant is the project founder', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        founderId: 'founder-1',
        moderationStatus: ProjectModerationStatus.PUBLISHED,
      });

      await expect(
        service.applyToRole('proj-1', 'role-1', 'founder-1', Role.USER, mockDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject application if project is not published', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        founderId: 'founder-1',
        moderationStatus: ProjectModerationStatus.PENDING_REVIEW,
      });

      await expect(
        service.applyToRole('proj-1', 'role-1', 'user-2', Role.USER, mockDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('withdrawApplication', () => {
    it('should allow the applicant to withdraw a pending application', async () => {
      prismaMock.projectApplication.findUnique.mockResolvedValue({
        id: 'app-1',
        applicantId: 'user-2',
        status: ProjectApplicationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prismaMock.projectApplication.update.mockResolvedValue({
        id: 'app-1',
        applicantId: 'user-2',
        status: ProjectApplicationStatus.WITHDRAWN,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.withdrawApplication('app-1', 'user-2');
      expect(result.status).toBe(ProjectApplicationStatus.WITHDRAWN);
      expect(prismaMock.projectApplication.update).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        data: { status: ProjectApplicationStatus.WITHDRAWN },
      });
    });

    it('should prevent another user from withdrawing an application', async () => {
      prismaMock.projectApplication.findUnique.mockResolvedValue({
        id: 'app-1',
        applicantId: 'user-2',
        status: ProjectApplicationStatus.PENDING,
      });

      await expect(service.withdrawApplication('app-1', 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject withdrawal if application is not pending', async () => {
      prismaMock.projectApplication.findUnique.mockResolvedValue({
        id: 'app-1',
        applicantId: 'user-2',
        status: ProjectApplicationStatus.ACCEPTED,
      });

      await expect(service.withdrawApplication('app-1', 'user-2')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getProjectApplications (Founder Review)', () => {
    it('should return project applications with deterministic match score for founder', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        founderId: 'founder-1',
        gameEngine: 'Unreal Engine 5',
        genre: 'Action RPG',
      });

      prismaMock.projectApplication.findMany.mockResolvedValue([
        {
          id: 'app-1',
          projectId: 'proj-1',
          projectRoleId: 'role-1',
          status: ProjectApplicationStatus.PENDING,
          message: 'Excited to build combat mechanics',
          createdAt: new Date(),
          updatedAt: new Date(),
          projectRole: {
            id: 'role-1',
            roleId: 'tax-role-1',
            title: 'Lead Combat Programmer',
            role: { name: 'Gameplay Programmer' },
            experienceLevel: 'SENIOR',
            commitment: 'FULL_TIME',
            status: 'OPEN',
            requiredSkills: [],
            requiredTools: [],
          },
          applicant: {
            id: 'cand-1',
            username: 'alexdev',
            profile: {
              displayName: 'Alex Rivers',
              headline: 'Unreal Combat Specialist',
              identity: {
                skills: [],
                tools: [],
              },
            },
          },
        },
      ]);

      const list = await service.getProjectApplications('proj-1', 'founder-1', Role.USER);
      expect(list.length).toBe(1);
      expect(list[0].id).toBe('app-1');
      expect(list[0].applicant.username).toBe('alexdev');
      expect(list[0].matchScore).toBe(90);
      expect(talentMatchingServiceMock.scoreCandidate).toHaveBeenCalled();
    });

    it('should reject non-founder from viewing project applications', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        founderId: 'founder-1',
      });

      await expect(
        service.getProjectApplications('proj-1', 'random-user', Role.USER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('respondToApplication (Accept & Reject)', () => {
    const mockApp = {
      id: 'app-1',
      projectId: 'proj-1',
      projectRoleId: 'role-1',
      applicantId: 'user-2',
      status: ProjectApplicationStatus.PENDING,
      project: { id: 'proj-1', founderId: 'founder-1' },
      projectRole: { id: 'role-1', title: 'Senior Audio Designer', role: { name: 'Audio Designer' } },
    };

    it('should reject an application without creating membership', async () => {
      prismaMock.projectApplication.findUnique.mockResolvedValue(mockApp);
      prismaMock.projectApplication.update.mockResolvedValue({
        ...mockApp,
        status: ProjectApplicationStatus.REJECTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await service.respondToApplication('app-1', 'founder-1', Role.USER, {
        action: RespondProjectApplicationAction.REJECT,
      });

      expect(res.status).toBe(ProjectApplicationStatus.REJECTED);
      expect(prismaMock.projectMember.create).not.toHaveBeenCalled();
    });

    it('should accept an application atomically, creating ProjectMember and setting role to FILLED', async () => {
      prismaMock.projectApplication.findUnique.mockResolvedValue(mockApp);

      const txMock = {
        projectApplication: {
          findUnique: jest.fn().mockResolvedValue(mockApp),
          update: jest.fn().mockResolvedValue({
            ...mockApp,
            status: ProjectApplicationStatus.ACCEPTED,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
        projectRole: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'role-1',
            title: 'Senior Audio Designer',
            role: { name: 'Audio Designer' },
            status: ProjectRoleStatus.OPEN,
          }),
          update: jest.fn().mockResolvedValue({ id: 'role-1', status: ProjectRoleStatus.FILLED }),
        },
        projectMember: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 'mem-1' }),
        },
      };

      prismaMock.$transaction.mockImplementation(async (cb: any) => cb(txMock));

      const res = await service.respondToApplication('app-1', 'founder-1', Role.USER, {
        action: RespondProjectApplicationAction.ACCEPT,
      });

      expect(res.status).toBe(ProjectApplicationStatus.ACCEPTED);
      expect(txMock.projectMember.create).toHaveBeenCalledWith({
        data: {
          projectId: 'proj-1',
          userId: 'user-2',
          role: 'Member',
          projectRoleId: 'role-1',
          status: ProjectMemberStatus.ACTIVE,
        },
      });
      expect(txMock.projectRole.update).toHaveBeenCalledWith({
        where: { id: 'role-1' },
        data: { status: ProjectRoleStatus.FILLED },
      });
    });

    it('should reject acceptance if role is already filled concurrently', async () => {
      prismaMock.projectApplication.findUnique.mockResolvedValue(mockApp);

      const txMock = {
        projectApplication: {
          findUnique: jest.fn().mockResolvedValue(mockApp),
        },
        projectRole: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'role-1',
            status: ProjectRoleStatus.FILLED,
          }),
        },
      };

      prismaMock.$transaction.mockImplementation(async (cb: any) => cb(txMock));

      await expect(
        service.respondToApplication('app-1', 'founder-1', Role.USER, {
          action: RespondProjectApplicationAction.ACCEPT,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
