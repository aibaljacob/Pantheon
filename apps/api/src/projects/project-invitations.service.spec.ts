import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectInvitationsService } from './project-invitations.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectInvitationStatus, ProjectRoleStatus, Role } from '@prisma/client';
import { RespondInvitationAction } from './projects.dto';

describe('ProjectInvitationsService', () => {
  let service: ProjectInvitationsService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      project: {
        findUnique: jest.fn(),
      },
      projectRole: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      projectMember: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      projectInvitation: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectInvitationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ProjectInvitationsService>(ProjectInvitationsService);
  });

  describe('sendInvitation', () => {
    const mockSendDto = { candidateId: 'user-2', message: 'Join us!' };

    it('should create and return a project invitation successfully', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 'proj-1', founderId: 'founder-1' });
      prismaMock.projectRole.findUnique.mockResolvedValue({
        id: 'role-1',
        projectId: 'proj-1',
        status: ProjectRoleStatus.OPEN,
      });
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-2', role: Role.USER });
      prismaMock.projectMember.findUnique.mockResolvedValue(null);
      prismaMock.projectInvitation.findFirst.mockResolvedValue(null);
      prismaMock.projectInvitation.create.mockResolvedValue({
        id: 'inv-1',
        projectId: 'proj-1',
        projectRoleId: 'role-1',
        inviterId: 'founder-1',
        inviteeId: 'user-2',
        status: ProjectInvitationStatus.PENDING,
        message: 'Join us!',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.sendInvitation('proj-1', 'role-1', 'founder-1', 'USER', mockSendDto);

      expect(result.id).toBe('inv-1');
      expect(result.status).toBe('PENDING');
      expect(prismaMock.projectInvitation.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for duplicate pending invitation', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 'proj-1', founderId: 'founder-1' });
      prismaMock.projectRole.findUnique.mockResolvedValue({
        id: 'role-1',
        projectId: 'proj-1',
        status: ProjectRoleStatus.OPEN,
      });
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-2', role: Role.USER });
      prismaMock.projectMember.findUnique.mockResolvedValue(null);
      prismaMock.projectInvitation.findFirst.mockResolvedValue({
        id: 'inv-existing',
        status: ProjectInvitationStatus.PENDING,
      });

      await expect(
        service.sendInvitation('proj-1', 'role-1', 'founder-1', 'USER', mockSendDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if non-founder tries to invite', async () => {
      prismaMock.project.findUnique.mockResolvedValue({ id: 'proj-1', founderId: 'founder-1' });

      await expect(
        service.sendInvitation('proj-1', 'role-1', 'other-user', 'USER', mockSendDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancelInvitation', () => {
    it('should allow founder to cancel a pending invitation', async () => {
      prismaMock.projectInvitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        inviterId: 'founder-1',
        status: ProjectInvitationStatus.PENDING,
      });
      prismaMock.projectInvitation.update.mockResolvedValue({
        id: 'inv-1',
        status: ProjectInvitationStatus.CANCELLED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.cancelInvitation('inv-1', 'founder-1', 'USER');

      expect(result.status).toBe(ProjectInvitationStatus.CANCELLED);
    });

    it('should throw BadRequestException when trying to cancel non-pending invitation', async () => {
      prismaMock.projectInvitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        inviterId: 'founder-1',
        status: ProjectInvitationStatus.ACCEPTED,
      });

      await expect(service.cancelInvitation('inv-1', 'founder-1', 'USER')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('respondToInvitation', () => {
    it('should reject invitation cleanly without creating project member', async () => {
      prismaMock.projectInvitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        inviteeId: 'candidate-1',
        status: ProjectInvitationStatus.PENDING,
        projectRole: { role: { name: 'Developer' } },
      });
      prismaMock.projectInvitation.update.mockResolvedValue({
        id: 'inv-1',
        status: ProjectInvitationStatus.REJECTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.respondToInvitation('inv-1', 'candidate-1', {
        action: RespondInvitationAction.REJECT,
      });

      expect(result.status).toBe(ProjectInvitationStatus.REJECTED);
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if wrong user attempts response', async () => {
      prismaMock.projectInvitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        inviteeId: 'candidate-1',
        status: ProjectInvitationStatus.PENDING,
      });

      await expect(
        service.respondToInvitation('inv-1', 'wrong-user', {
          action: RespondInvitationAction.ACCEPT,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if invitation is non-pending', async () => {
      prismaMock.projectInvitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        inviteeId: 'candidate-1',
        status: ProjectInvitationStatus.EXPIRED,
      });

      await expect(
        service.respondToInvitation('inv-1', 'candidate-1', {
          action: RespondInvitationAction.ACCEPT,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should execute atomic transaction on ACCEPT and update member, invitation, and role status', async () => {
      const mockInv = {
        id: 'inv-1',
        projectId: 'proj-1',
        projectRoleId: 'role-1',
        inviterId: 'founder-1',
        inviteeId: 'candidate-1',
        status: ProjectInvitationStatus.PENDING,
        projectRole: { title: 'Lead Developer', role: { name: 'Developer' } },
      };

      prismaMock.projectInvitation.findUnique.mockResolvedValue(mockInv);

      // Mock $transaction callback execution
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          projectInvitation: {
            findUnique: jest.fn().mockResolvedValue(mockInv),
            update: jest.fn().mockResolvedValue({
              ...mockInv,
              status: ProjectInvitationStatus.ACCEPTED,
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
          projectRole: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'role-1',
              status: ProjectRoleStatus.OPEN,
              title: 'Lead Developer',
            }),
            update: jest.fn().mockResolvedValue({ id: 'role-1', status: ProjectRoleStatus.FILLED }),
          },
          projectMember: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: 'mem-1' }),
          },
        };
        return callback(txMock);
      });

      const result = await service.respondToInvitation('inv-1', 'candidate-1', {
        action: RespondInvitationAction.ACCEPT,
      });

      expect(result.status).toBe(ProjectInvitationStatus.ACCEPTED);
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('should fail transaction if role is already filled', async () => {
      const mockInv = {
        id: 'inv-1',
        projectId: 'proj-1',
        projectRoleId: 'role-1',
        inviteeId: 'candidate-1',
        status: ProjectInvitationStatus.PENDING,
        projectRole: { title: 'Lead Developer', role: { name: 'Developer' } },
      };

      prismaMock.projectInvitation.findUnique.mockResolvedValue(mockInv);

      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          projectInvitation: {
            findUnique: jest.fn().mockResolvedValue(mockInv),
          },
          projectRole: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'role-1',
              status: ProjectRoleStatus.FILLED,
            }),
          },
          projectMember: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(txMock);
      });

      await expect(
        service.respondToInvitation('inv-1', 'candidate-1', {
          action: RespondInvitationAction.ACCEPT,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should fail transaction if user is already a project member', async () => {
      const mockInv = {
        id: 'inv-1',
        projectId: 'proj-1',
        projectRoleId: 'role-1',
        inviteeId: 'candidate-1',
        status: ProjectInvitationStatus.PENDING,
        projectRole: { title: 'Lead Developer', role: { name: 'Developer' } },
      };

      prismaMock.projectInvitation.findUnique.mockResolvedValue(mockInv);

      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        const txMock = {
          projectInvitation: {
            findUnique: jest.fn().mockResolvedValue(mockInv),
          },
          projectRole: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'role-1',
              status: ProjectRoleStatus.OPEN,
            }),
          },
          projectMember: {
            findUnique: jest.fn().mockResolvedValue({ id: 'existing-mem' }),
          },
        };
        return callback(txMock);
      });

      await expect(
        service.respondToInvitation('inv-1', 'candidate-1', {
          action: RespondInvitationAction.ACCEPT,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
