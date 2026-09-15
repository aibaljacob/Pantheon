import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectMembersService } from './project-members.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ProjectMemberStatus,
  ProjectModerationStatus,
  ProjectRoleStatus,
  Role,
} from '@prisma/client';

describe('ProjectMembersService', () => {
  let service: ProjectMembersService;
  let prismaMock: any;

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
      },
      projectRole: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(async (callback: any) => callback(prismaMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectMembersService,
        { provide: PrismaService, useValue: prismaMock },
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
        members: [{ userId: mockFounderId, status: ProjectMemberStatus.ACTIVE }],
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

      const result = await service.getTeamMembers(mockProjectId, mockFounderId, Role.USER);

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
        members: [{ userId: mockFounderId, status: ProjectMemberStatus.ACTIVE }],
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
      prismaMock.projectMember.findUnique.mockResolvedValue(memberMock);

      prismaMock.projectRole.findUnique.mockResolvedValue({
        id: mockProjectRoleId,
        status: ProjectRoleStatus.FILLED,
      });

      prismaMock.projectRole.update.mockResolvedValue({
        id: mockProjectRoleId,
        status: ProjectRoleStatus.OPEN,
      });

      prismaMock.projectMember.update.mockResolvedValue({
        ...memberMock,
        status: ProjectMemberStatus.REMOVED,
        leftAt: new Date(),
        user: {
          id: mockMemberUserId,
          username: 'aaron_artist',
          profile: { displayName: 'Aaron George' },
        },
        projectRole: { title: 'Technical Artist', role: { name: 'Technical Artist' } },
      });

      const result = await service.removeMember(mockProjectId, mockMemberId, mockFounderId);

      expect(prismaMock.projectRole.updateMany).toHaveBeenCalledWith({
        where: {
          projectId: mockProjectId,
          OR: [
            { assignedMemberId: mockMemberId },
            { id: mockProjectRoleId },
          ],
        },
        data: {
          assignedMemberId: null,
          status: ProjectRoleStatus.OPEN,
        },
      });

      expect(prismaMock.projectMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockMemberId },
          data: expect.objectContaining({
            status: ProjectMemberStatus.REMOVED,
          }),
        }),
      );

      expect(result.status).toBe(ProjectMemberStatus.REMOVED);
      expect(result.leftAt).toBeDefined();
    });

    it('should reject non-founder with ForbiddenException', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        founderId: mockFounderId,
      });

      await expect(
        service.removeMember(mockProjectId, mockMemberId, 'imposter-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent founder from removing themselves', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        founderId: mockFounderId,
      });

      prismaMock.projectMember.findUnique.mockResolvedValue({
        id: 'founder-membership-id',
        projectId: mockProjectId,
        userId: mockFounderId,
        status: ProjectMemberStatus.ACTIVE,
      });

      await expect(
        service.removeMember(mockProjectId, 'founder-membership-id', mockFounderId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if member is already inactive (REMOVED or LEFT)', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
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
  });

  describe('leaveProject', () => {
    it('should allow active member to voluntarily leave, reopening their filled role and setting status to LEFT', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
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

      prismaMock.projectRole.findUnique.mockResolvedValue({
        id: mockProjectRoleId,
        status: ProjectRoleStatus.FILLED,
      });

      prismaMock.projectRole.update.mockResolvedValue({
        id: mockProjectRoleId,
        status: ProjectRoleStatus.OPEN,
      });

      prismaMock.projectMember.update.mockResolvedValue({
        ...memberMock,
        status: ProjectMemberStatus.LEFT,
        leftAt: new Date(),
      });

      const result = await service.leaveProject(mockProjectId, mockMemberUserId);

      expect(prismaMock.projectRole.updateMany).toHaveBeenCalledWith({
        where: {
          projectId: mockProjectId,
          OR: [
            { assignedMemberId: mockMemberId },
            { id: mockProjectRoleId },
          ],
        },
        data: {
          assignedMemberId: null,
          status: ProjectRoleStatus.OPEN,
        },
      });

      expect(prismaMock.projectMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockMemberId },
          data: expect.objectContaining({
            status: ProjectMemberStatus.LEFT,
          }),
        }),
      );

      expect(result.success).toBe(true);
    });

    it('should prevent founder from leaving their own project', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        founderId: mockFounderId,
      });

      await expect(service.leaveProject(mockProjectId, mockFounderId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if user is not an active member', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        founderId: mockFounderId,
      });

      prismaMock.projectMember.findUnique.mockResolvedValue(null);

      await expect(service.leaveProject(mockProjectId, 'random-user')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('assignMemberRoles', () => {
    const mockNewRoleId = 'new-role-uuid-2';

    it('should allow founder to assign roles, reopening unselected roles and filling selected roles', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
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
      prismaMock.projectMember.findUnique.mockResolvedValue(memberMock);

      prismaMock.projectRole.findMany
        .mockResolvedValueOnce([
          {
            id: mockNewRoleId,
            projectId: mockProjectId,
            status: ProjectRoleStatus.OPEN,
            role: { name: '3D Modeler' },
          },
        ])
        .mockResolvedValueOnce([
          {
            id: mockProjectRoleId,
            projectId: mockProjectId,
            status: ProjectRoleStatus.FILLED,
            role: { name: 'Technical Artist' },
          },
        ]);

      prismaMock.projectMember.update.mockResolvedValue({
        ...memberMock,
        projectRoleId: mockNewRoleId,
        user: {
          id: mockMemberUserId,
          username: 'aaron_artist',
          profile: { displayName: 'Aaron George' },
        },
        projectRole: { id: mockNewRoleId, title: '3D Modeler', role: { name: '3D Modeler' } },
        assignedRoles: [{ id: mockNewRoleId, title: '3D Modeler', role: { name: '3D Modeler' } }],
      });

      const result = await service.assignMemberRoles(
        mockProjectId,
        mockMemberId,
        mockFounderId,
        { roleIds: [mockNewRoleId] },
      );

      expect(prismaMock.projectRole.update).toHaveBeenCalledWith({
        where: { id: mockProjectRoleId },
        data: { assignedMemberId: null, status: ProjectRoleStatus.OPEN },
      });

      expect(prismaMock.projectRole.update).toHaveBeenCalledWith({
        where: { id: mockNewRoleId },
        data: { assignedMemberId: mockMemberId, status: ProjectRoleStatus.FILLED },
      });

      expect(result.projectRoleId).toBe(mockNewRoleId);
      expect(result.projectRoleTitle).toBe('3D Modeler');
    });

    it('should reject assigning a role belonging to another project', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
        founderId: mockFounderId,
      });

      prismaMock.projectMember.findUnique.mockResolvedValue({
        id: mockMemberId,
        projectId: mockProjectId,
        status: ProjectMemberStatus.ACTIVE,
      });

      prismaMock.projectRole.findMany.mockResolvedValue([]); // not found in project

      await expect(
        service.assignMemberRoles(
          mockProjectId,
          mockMemberId,
          mockFounderId,
          { roleIds: ['foreign-role-id'] },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject assigning a role that is closed', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        id: mockProjectId,
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
        service.assignMemberRoles(
          mockProjectId,
          mockMemberId,
          mockFounderId,
          { roleIds: [mockNewRoleId] },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
