import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProjectMembersService } from './project-members.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationType,
  ProjectMemberStatus,
  ProjectModerationStatus,
  ProjectRoleStatus,
  Role,
} from '@prisma/client';

describe('ProjectMembersService', () => {
  let service: ProjectMembersService;
  let prismaMock: any;
  let notificationsServiceMock: any;

  const mockFounderId = 'founder-uuid-1';
  const mockMemberUserId = 'member-uuid-2';
  const mockMemberId = 'membership-uuid-1';
  const mockProjectId = 'project-uuid-1';
  const mockProjectRoleId = 'role-uuid-1';

  beforeEach(async () => {
    prismaMock = {
      project: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      projectMember: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      projectRole: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      projectApplication: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      projectInvitation: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      task: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn(async (callback: any) => callback(prismaMock)),
    };

    notificationsServiceMock = {
      createNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      resolveActionUrl: jest.fn().mockImplementation((item) => {
        if (!item.entityId) return null;
        if (item.type === NotificationType.PROJECT_ROLE_CHANGED) {
          return `/projects/${item.entityId}?tab=team`;
        }
        if (item.type === NotificationType.REMOVED_FROM_PROJECT) {
          return `/projects/${item.entityId}`;
        }
        return `/projects/${item.entityId}`;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectMembersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationsService, useValue: notificationsServiceMock },
      ],
    }).compile();

    service = module.get<ProjectMembersService>(ProjectMembersService);
  });

  describe('getTeamMembers', () => {
    it('should partition members into active and former members without exposing private info', async () => {
      prismaMock.project.findFirst.mockResolvedValue({
        id: mockProjectId,
        founderId: mockFounderId,
        moderationStatus: ProjectModerationStatus.PUBLISHED,
        members: [
          { userId: mockFounderId, status: ProjectMemberStatus.ACTIVE },
        ],
      });

      const now = new Date();
      prismaMock.projectMember.findMany.mockResolvedValue([
        {
          id: 'mem-1',
          userId: mockFounderId,
          role: 'Founder',
          projectRoleId: null,
          projectRole: null,
          status: ProjectMemberStatus.ACTIVE,
          joinedAt: now,
          leftAt: null,
          user: {
            id: mockFounderId,
            username: 'founder_user',
            profile: {
              displayName: 'Studio Founder',
              firstName: 'Studio',
              lastName: 'Founder',
              avatarUrl: null,
              headline: 'Lead Producer',
            },
          },
        },
        {
          id: 'mem-2',
          userId: mockMemberUserId,
          role: 'Member',
          projectRoleId: mockProjectRoleId,
          projectRole: {
            id: mockProjectRoleId,
            title: 'Technical Artist',
            role: { name: 'Technical Artist' },
          },
          status: ProjectMemberStatus.REMOVED,
          joinedAt: new Date(Date.now() - 100000),
          leftAt: now,
          user: {
            id: mockMemberUserId,
            username: 'aaron_artist',
            profile: {
              displayName: 'Aaron George',
              firstName: 'Aaron',
              lastName: 'George',
              avatarUrl: null,
              headline: 'Shader Specialist',
            },
          },
        },
      ]);

      const result = await service.getTeamMembers(
        mockProjectId,
        mockFounderId,
        Role.USER,
      );

      expect(result.projectId).toBe(mockProjectId);
      expect(result.activeCount).toBe(1);
      expect(result.activeMembers).toHaveLength(1);
      expect(result.activeMembers[0].username).toBe('founder_user');
      expect(result.activeMembers[0].role).toBe('Founder');

      expect(result.formerMembers).toHaveLength(1);
      expect(result.formerMembers[0].username).toBe('aaron_artist');
      expect(result.formerMembers[0].status).toBe(ProjectMemberStatus.REMOVED);
      expect(result.formerMembers[0].projectRoleTitle).toBe('Technical Artist');
    });

    it('should throw NotFoundException if project does not exist', async () => {
      prismaMock.project.findFirst.mockResolvedValue(null);
      await expect(
        service.getTeamMembers('non-existent', mockFounderId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for unpublished project if caller is not founder, member, or admin', async () => {
      prismaMock.project.findFirst.mockResolvedValue({
        id: mockProjectId,
        founderId: mockFounderId,
        moderationStatus: ProjectModerationStatus.PENDING_REVIEW,
        members: [
          { userId: mockFounderId, status: ProjectMemberStatus.ACTIVE },
        ],
      });

      await expect(
        service.getTeamMembers(mockProjectId, 'random-user-id', Role.USER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeMember', () => {
    it('should allow founder to remove an active member, setting status to REMOVED and reopening their filled role', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        name: 'Project Helios',
        founderId: mockFounderId,
      });

      const memberMock = {
        id: mockMemberId,
        projectId: mockProjectId,
        userId: mockMemberUserId,
        role: 'Member',
        projectRoleId: mockProjectRoleId,
        status: ProjectMemberStatus.ACTIVE,
        joinedAt: new Date(),
      };
      // Outside transaction read
      prismaMock.projectMember.findUnique
        .mockResolvedValueOnce(memberMock)
        // Outside transaction post-commit read
        .mockResolvedValueOnce({
          ...memberMock,
          status: ProjectMemberStatus.REMOVED,
          leftAt: new Date(),
          user: {
            id: mockMemberUserId,
            username: 'aaron_artist',
            profile: { displayName: 'Aaron George' },
          },
          projectRole: {
            title: 'Technical Artist',
            role: { name: 'Technical Artist' },
          },
          assignedRoles: [],
        });

      prismaMock.projectRole.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.removeMember(
        mockProjectId,
        mockMemberId,
        mockFounderId,
      );

      // Verify atomic update of member status inside transaction
      expect(prismaMock.projectMember.updateMany).toHaveBeenCalledWith({
        where: {
          id: mockMemberId,
          projectId: mockProjectId,
          status: ProjectMemberStatus.ACTIVE,
        },
        data: expect.objectContaining({
          status: ProjectMemberStatus.REMOVED,
          projectRoleId: null,
        }),
      });

      // Verify role reopening
      expect(prismaMock.projectRole.updateMany).toHaveBeenCalledWith({
        where: {
          projectId: mockProjectId,
          OR: [{ assignedMemberId: mockMemberId }, { id: mockProjectRoleId }],
        },
        data: {
          assignedMemberId: null,
          status: ProjectRoleStatus.OPEN,
        },
      });

      // Verify task unassignment
      expect(prismaMock.task.updateMany).toHaveBeenCalledWith({
        where: {
          projectId: mockProjectId,
          assigneeId: mockMemberUserId,
        },
        data: {
          assigneeId: null,
        },
      });

      // Verify notification creation after successful commit
      expect(notificationsServiceMock.createNotification).toHaveBeenCalledWith({
        userId: mockMemberUserId,
        type: NotificationType.REMOVED_FROM_PROJECT,
        title: 'Removed from Project',
        message: expect.stringContaining('Project Helios'),
        entityType: 'PROJECT',
        entityId: mockProjectId,
      });

      expect(result.status).toBe(ProjectMemberStatus.REMOVED);
      expect(result.leftAt).toBeDefined();
    });

    it('should reject non-founder with ForbiddenException', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        name: 'Project Helios',
        founderId: mockFounderId,
      });

      await expect(
        service.removeMember(mockProjectId, mockMemberId, 'imposter-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent founder from removing themselves', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        name: 'Project Helios',
        founderId: mockFounderId,
      });

      prismaMock.projectMember.findUnique.mockResolvedValue({
        id: 'founder-membership-id',
        projectId: mockProjectId,
        userId: mockFounderId,
        status: ProjectMemberStatus.ACTIVE,
      });

      await expect(
        service.removeMember(
          mockProjectId,
          'founder-membership-id',
          mockFounderId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if member is already inactive (REMOVED or LEFT)', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        name: 'Project Helios',
        founderId: mockFounderId,
      });

      prismaMock.projectMember.findUnique.mockResolvedValue({
        id: mockMemberId,
        projectId: mockProjectId,
        userId: mockMemberUserId,
        status: ProjectMemberStatus.LEFT,
      });

      await expect(
        service.removeMember(mockProjectId, mockMemberId, mockFounderId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should still succeed if notification creation fails after commit', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        name: 'Project Helios',
        founderId: mockFounderId,
      });

      const memberMock = {
        id: mockMemberId,
        projectId: mockProjectId,
        userId: mockMemberUserId,
        role: 'Member',
        projectRoleId: mockProjectRoleId,
        status: ProjectMemberStatus.ACTIVE,
        joinedAt: new Date(),
      };
      prismaMock.projectMember.findUnique
        .mockResolvedValueOnce(memberMock)
        .mockResolvedValueOnce({
          ...memberMock,
          status: ProjectMemberStatus.REMOVED,
          leftAt: new Date(),
          user: {
            id: mockMemberUserId,
            username: 'aaron_artist',
            profile: { displayName: 'Aaron George' },
          },
          projectRole: null,
          assignedRoles: [],
        });

      notificationsServiceMock.createNotification.mockRejectedValueOnce(
        new Error('Notification service offline'),
      );

      const result = await service.removeMember(
        mockProjectId,
        mockMemberId,
        mockFounderId,
      );

      expect(result.status).toBe(ProjectMemberStatus.REMOVED);
    });
  });

  describe('leaveProject', () => {
    it('should allow active member to voluntarily leave, reopening their filled role and setting status to LEFT', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        name: 'Project Helios',
        founderId: mockFounderId,
      });

      const memberMock = {
        id: mockMemberId,
        projectId: mockProjectId,
        userId: mockMemberUserId,
        projectRoleId: mockProjectRoleId,
        status: ProjectMemberStatus.ACTIVE,
      };
      prismaMock.projectMember.findUnique.mockResolvedValue(memberMock);

      const result = await service.leaveProject(
        mockProjectId,
        mockMemberUserId,
      );

      expect(prismaMock.projectMember.updateMany).toHaveBeenCalledWith({
        where: {
          id: mockMemberId,
          projectId: mockProjectId,
          status: ProjectMemberStatus.ACTIVE,
        },
        data: expect.objectContaining({
          status: ProjectMemberStatus.LEFT,
          projectRoleId: null,
        }),
      });

      expect(prismaMock.projectRole.updateMany).toHaveBeenCalledWith({
        where: {
          projectId: mockProjectId,
          OR: [{ assignedMemberId: mockMemberId }, { id: mockProjectRoleId }],
        },
        data: {
          assignedMemberId: null,
          status: ProjectRoleStatus.OPEN,
        },
      });

      expect(prismaMock.task.updateMany).toHaveBeenCalledWith({
        where: {
          projectId: mockProjectId,
          assigneeId: mockMemberUserId,
        },
        data: {
          assigneeId: null,
        },
      });

      expect(result.success).toBe(true);
    });

    it('should prevent founder from leaving their own project', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        name: 'Project Helios',
        founderId: mockFounderId,
      });

      await expect(
        service.leaveProject(mockProjectId, mockFounderId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user is not an active member', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        name: 'Project Helios',
        founderId: mockFounderId,
      });

      prismaMock.projectMember.findUnique.mockResolvedValue(null);

      await expect(
        service.leaveProject(mockProjectId, 'random-user'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('assignMemberRoles', () => {
    const mockNewRoleId = 'new-role-uuid-2';

    it('should allow founder to assign roles, reopening unselected roles and filling selected roles', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        name: 'Project Helios',
        founderId: mockFounderId,
      });

      const memberMock = {
        id: mockMemberId,
        projectId: mockProjectId,
        userId: mockMemberUserId,
        role: 'Member',
        projectRoleId: mockProjectRoleId,
        status: ProjectMemberStatus.ACTIVE,
        joinedAt: new Date(),
      };
      // Outside transaction targetMember read
      prismaMock.projectMember.findUnique
        .mockResolvedValueOnce(memberMock)
        // Outside transaction post-commit read
        .mockResolvedValueOnce({
          ...memberMock,
          projectRoleId: mockNewRoleId,
          user: {
            id: mockMemberUserId,
            username: 'aaron_artist',
            profile: { displayName: 'Aaron George' },
          },
          projectRole: {
            id: mockNewRoleId,
            title: '3D Modeler',
            role: { name: '3D Modeler' },
          },
          assignedRoles: [
            {
              id: mockNewRoleId,
              title: '3D Modeler',
              role: { name: '3D Modeler' },
            },
          ],
        });

      // 1. Outside transaction: find requested valid roles
      // 2. Outside transaction: find currently assigned roles
      prismaMock.projectRole.findMany
        .mockResolvedValueOnce([
          {
            id: mockNewRoleId,
            projectId: mockProjectId,
            status: ProjectRoleStatus.OPEN,
            title: '3D Modeler',
            role: { name: '3D Modeler' },
          },
        ])
        .mockResolvedValueOnce([
          {
            id: mockProjectRoleId,
            projectId: mockProjectId,
          },
        ]);

      const result = await service.assignMemberRoles(
        mockProjectId,
        mockMemberId,
        mockFounderId,
        { roleIds: [mockNewRoleId] },
      );

      // Verify atomic update on member inside transaction
      expect(prismaMock.projectMember.updateMany).toHaveBeenCalledWith({
        where: {
          id: mockMemberId,
          projectId: mockProjectId,
          status: ProjectMemberStatus.ACTIVE,
        },
        data: {
          projectRoleId: mockNewRoleId,
          role: '3D Modeler',
        },
      });

      // Verify unassign old roles (batch updateMany)
      expect(prismaMock.projectRole.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: [mockProjectRoleId] },
          projectId: mockProjectId,
        },
        data: { assignedMemberId: null, status: ProjectRoleStatus.OPEN },
      });

      // Verify assign new roles (batch updateMany)
      expect(prismaMock.projectRole.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: [mockNewRoleId] },
          projectId: mockProjectId,
        },
        data: {
          assignedMemberId: mockMemberId,
          status: ProjectRoleStatus.FILLED,
        },
      });

      // Verify notification creation after successful commit
      expect(notificationsServiceMock.createNotification).toHaveBeenCalledWith({
        userId: mockMemberUserId,
        type: NotificationType.PROJECT_ROLE_CHANGED,
        title: 'Project Role Updated',
        message: expect.stringContaining('3D Modeler'),
        entityType: 'PROJECT',
        entityId: mockProjectId,
      });

      expect(result.projectRoleId).toBe(mockNewRoleId);
      expect(result.projectRoleTitle).toBe('3D Modeler');
    });

    it('should reject unauthorized caller with ForbiddenException', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        name: 'Project Helios',
        founderId: mockFounderId,
      });

      await expect(
        service.assignMemberRoles(
          mockProjectId,
          mockMemberId,
          'imposter-founder',
          { roleIds: [mockNewRoleId] },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject assigning a role belonging to another project', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        name: 'Project Helios',
        founderId: mockFounderId,
      });

      prismaMock.projectMember.findUnique.mockResolvedValue({
        id: mockMemberId,
        projectId: mockProjectId,
        status: ProjectMemberStatus.ACTIVE,
      });

      prismaMock.projectRole.findMany.mockResolvedValue([]); // not found in project

      await expect(
        service.assignMemberRoles(mockProjectId, mockMemberId, mockFounderId, {
          roleIds: ['foreign-role-id'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject assigning a role that is closed', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        name: 'Project Helios',
        founderId: mockFounderId,
      });

      prismaMock.projectMember.findUnique.mockResolvedValue({
        id: mockMemberId,
        projectId: mockProjectId,
        projectRoleId: mockProjectRoleId,
        status: ProjectMemberStatus.ACTIVE,
      });

      prismaMock.projectRole.findMany.mockResolvedValue([
        {
          id: mockNewRoleId,
          projectId: mockProjectId,
          status: ProjectRoleStatus.CLOSED,
          role: { name: 'Lead Dev' },
        },
      ]);

      await expect(
        service.assignMemberRoles(mockProjectId, mockMemberId, mockFounderId, {
          roleIds: [mockNewRoleId],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should still succeed if notification creation fails after role assignment', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        name: 'Project Helios',
        founderId: mockFounderId,
      });

      const memberMock = {
        id: mockMemberId,
        projectId: mockProjectId,
        userId: mockMemberUserId,
        role: 'Member',
        projectRoleId: mockProjectRoleId,
        status: ProjectMemberStatus.ACTIVE,
        joinedAt: new Date(),
      };
      prismaMock.projectMember.findUnique
        .mockResolvedValueOnce(memberMock)
        .mockResolvedValueOnce({
          ...memberMock,
          projectRoleId: mockNewRoleId,
          user: {
            id: mockMemberUserId,
            username: 'aaron_artist',
            profile: { displayName: 'Aaron George' },
          },
          projectRole: {
            id: mockNewRoleId,
            title: '3D Modeler',
            role: { name: '3D Modeler' },
          },
          assignedRoles: [],
        });

      prismaMock.projectRole.findMany
        .mockResolvedValueOnce([
          {
            id: mockNewRoleId,
            projectId: mockProjectId,
            status: ProjectRoleStatus.OPEN,
            title: '3D Modeler',
            role: { name: '3D Modeler' },
          },
        ])
        .mockResolvedValueOnce([]);

      notificationsServiceMock.createNotification.mockRejectedValueOnce(
        new Error('Notification service offline'),
      );

      const result = await service.assignMemberRoles(
        mockProjectId,
        mockMemberId,
        mockFounderId,
        { roleIds: [mockNewRoleId] },
      );

      expect(result.projectRoleId).toBe(mockNewRoleId);
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign a role to an existing user and create a notification', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        name: 'Project Helios',
        founderId: mockFounderId,
      });

      prismaMock.projectRole.findUnique.mockResolvedValue({
        id: mockProjectRoleId,
        projectId: mockProjectId,
        title: 'Gameplay Engineer',
        status: ProjectRoleStatus.OPEN,
        role: { name: 'Gameplay Engineer' },
      });

      prismaMock.projectMember.findUnique
        .mockResolvedValueOnce({
          id: mockMemberId,
          userId: mockMemberUserId,
          role: 'Member',
          status: ProjectMemberStatus.ACTIVE,
        })
        .mockResolvedValueOnce({
          id: mockMemberId,
          userId: mockMemberUserId,
          role: 'Gameplay Engineer',
          status: ProjectMemberStatus.ACTIVE,
          user: {
            id: mockMemberUserId,
            username: 'coder_dan',
            profile: { displayName: 'Dan Coder' },
          },
          projectRole: {
            id: mockProjectRoleId,
            title: 'Gameplay Engineer',
            role: { name: 'Gameplay Engineer' },
          },
          assignedRoles: [],
        });

      prismaMock.projectMember.update.mockResolvedValue({
        id: mockMemberId,
        userId: mockMemberUserId,
      });

      const result = await service.assignRoleToUser(
        mockProjectId,
        mockProjectRoleId,
        mockMemberUserId,
        mockFounderId,
      );

      expect(prismaMock.projectRole.update).toHaveBeenCalledWith({
        where: { id: mockProjectRoleId },
        data: {
          assignedMemberId: mockMemberId,
          status: ProjectRoleStatus.FILLED,
        },
      });

      expect(notificationsServiceMock.createNotification).toHaveBeenCalledWith({
        userId: mockMemberUserId,
        type: NotificationType.PROJECT_ROLE_CHANGED,
        title: 'Assigned to Project Role',
        message: expect.stringContaining('Gameplay Engineer'),
        entityType: 'PROJECT',
        entityId: mockProjectId,
      });

      expect(result.role).toBe('Gameplay Engineer');
    });
  });
});
