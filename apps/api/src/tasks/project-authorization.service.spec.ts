import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ProjectMemberStatus,
  ProjectModerationStatus,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAuthorizationService } from './project-authorization.service';

describe('ProjectAuthorizationService', () => {
  let service: ProjectAuthorizationService;
  let prismaMock: {
    project: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
    };
    projectMember: {
      findFirst: jest.Mock;
    };
  };

  const mockProjectId = 'project-uuid-100';
  const mockSlug = 'nebula-tactics';
  const mockFounderId = 'founder-uuid-1';
  const mockActiveMemberId = 'member-uuid-2';
  const mockRemovedMemberId = 'removed-uuid-3';
  const mockLeftMemberId = 'left-uuid-4';
  const mockUnrelatedUserId = 'unrelated-uuid-5';
  const mockAdminId = 'admin-uuid-6';

  const publishedProject = {
    id: mockProjectId,
    slug: mockSlug,
    founderId: mockFounderId,
    moderationStatus: ProjectModerationStatus.PUBLISHED,
  };

  const unpublishedProject = {
    id: mockProjectId,
    slug: mockSlug,
    founderId: mockFounderId,
    moderationStatus: ProjectModerationStatus.PENDING_REVIEW,
  };

  beforeEach(async () => {
    prismaMock = {
      project: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      projectMember: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectAuthorizationService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ProjectAuthorizationService>(
      ProjectAuthorizationService,
    );
  });

  describe('1. Missing Project', () => {
    it('should throw NotFoundException when project does not exist', async () => {
      prismaMock.project.findFirst.mockResolvedValue(null);
      prismaMock.projectMember.findFirst.mockResolvedValue(null);

      await expect(
        service.assertCanView('non-existent-id', mockActiveMemberId),
      ).rejects.toThrow(new NotFoundException('Project not found.'));
    });
  });

  describe('2. Public / Published Project Access', () => {
    beforeEach(() => {
      prismaMock.project.findFirst.mockResolvedValue(publishedProject);
    });

    it('should allow the Founder to view published project', async () => {
      prismaMock.projectMember.findFirst.mockResolvedValue(null);

      const ctx = await service.assertCanView(mockProjectId, mockFounderId);
      expect(ctx.isFounder).toBe(true);
      expect(ctx.project.id).toBe(mockProjectId);
    });

    it('should allow an Active Member to view published project', async () => {
      prismaMock.projectMember.findFirst.mockResolvedValue({ id: 'pm-1' });

      const ctx = await service.assertCanView(
        mockProjectId,
        mockActiveMemberId,
      );
      expect(ctx.isMember).toBe(true);
      expect(ctx.isFounder).toBe(false);
    });

    it('should allow an Administrator to view published project even if not member', async () => {
      prismaMock.projectMember.findFirst.mockResolvedValue(null);

      const ctx = await service.assertCanView(
        mockProjectId,
        mockAdminId,
        Role.ADMINISTRATOR,
      );
      expect(ctx.isAdmin).toBe(true);
    });

    it('should deny an unrelated non-member from viewing published project tasks', async () => {
      prismaMock.projectMember.findFirst.mockResolvedValue(null);

      await expect(
        service.assertCanView(mockProjectId, mockUnrelatedUserId),
      ).rejects.toThrow(
        new ForbiddenException(
          'You do not have access to view this project tasks and milestones.',
        ),
      );
    });

    it('should deny a removed member from viewing published project', async () => {
      // Removed member won't match status: ACTIVE, so prisma returns null
      prismaMock.projectMember.findFirst.mockResolvedValue(null);

      await expect(
        service.assertCanView(mockProjectId, mockRemovedMemberId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should deny a left member from viewing published project', async () => {
      prismaMock.projectMember.findFirst.mockResolvedValue(null);

      await expect(
        service.assertCanView(mockProjectId, mockLeftMemberId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should deny an anonymous / unauthenticated guest (no userId)', async () => {
      await expect(
        service.assertCanView(mockProjectId, undefined),
      ).rejects.toThrow(ForbiddenException);
      // Member query should not even be invoked when userId is undefined
      expect(prismaMock.projectMember.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('3. Private / Unpublished Project Access', () => {
    beforeEach(() => {
      prismaMock.project.findFirst.mockResolvedValue(unpublishedProject);
    });

    it('should allow the Founder to view unpublished project', async () => {
      prismaMock.projectMember.findFirst.mockResolvedValue(null);

      const ctx = await service.assertCanView(mockProjectId, mockFounderId);
      expect(ctx.isFounder).toBe(true);
    });

    it('should allow an Active Member to view unpublished project', async () => {
      prismaMock.projectMember.findFirst.mockResolvedValue({ id: 'pm-1' });

      const ctx = await service.assertCanView(
        mockProjectId,
        mockActiveMemberId,
      );
      expect(ctx.isMember).toBe(true);
    });

    it('should allow an Administrator to view unpublished project', async () => {
      prismaMock.projectMember.findFirst.mockResolvedValue(null);

      const ctx = await service.assertCanView(
        mockProjectId,
        mockAdminId,
        Role.ADMINISTRATOR,
      );
      expect(ctx.isAdmin).toBe(true);
    });

    it('should hide unpublished project from non-members with NotFoundException', async () => {
      prismaMock.projectMember.findFirst.mockResolvedValue(null);

      await expect(
        service.assertCanView(mockProjectId, mockUnrelatedUserId),
      ).rejects.toThrow(new NotFoundException('Project not found.'));
    });

    it('should hide unpublished project from removed members with NotFoundException', async () => {
      prismaMock.projectMember.findFirst.mockResolvedValue(null);

      await expect(
        service.assertCanView(mockProjectId, mockRemovedMemberId),
      ).rejects.toThrow(new NotFoundException('Project not found.'));
    });
  });

  describe('4. assertCanManage', () => {
    beforeEach(() => {
      prismaMock.project.findFirst.mockResolvedValue(publishedProject);
    });

    it('should allow Founder to manage project', async () => {
      const ctx = await service.assertCanManage(mockProjectId, mockFounderId);
      expect(ctx.isFounder).toBe(true);
    });

    it('should allow Administrator to manage project', async () => {
      const ctx = await service.assertCanManage(
        mockProjectId,
        mockAdminId,
        Role.ADMINISTRATOR,
      );
      expect(ctx.isAdmin).toBe(true);
    });

    it('should deny Active Member from managing project', async () => {
      prismaMock.projectMember.findFirst.mockResolvedValue({ id: 'pm-1' });

      await expect(
        service.assertCanManage(mockProjectId, mockActiveMemberId),
      ).rejects.toThrow(
        new ForbiddenException(
          'Only the project founder or an administrator can perform this action.',
        ),
      );
    });
  });

  describe('5. assertCanUpdateTask', () => {
    beforeEach(() => {
      prismaMock.project.findFirst.mockResolvedValue(publishedProject);
    });

    it('should allow Founder or Admin to update any task', async () => {
      const ctx = await service.assertCanUpdateTask(
        mockProjectId,
        'assignee-x',
        mockFounderId,
      );
      expect(ctx.isFounder).toBe(true);
    });

    it('should allow Active Member to update task status (isStatusOnlyUpdate = true)', async () => {
      prismaMock.projectMember.findFirst.mockResolvedValue({ id: 'pm-1' });

      const ctx = await service.assertCanUpdateTask(
        mockProjectId,
        'other-assignee',
        mockActiveMemberId,
        Role.USER,
        true,
      );
      expect(ctx.isMember).toBe(true);
    });

    it('should allow Active Member to update task details if assigned to them', async () => {
      prismaMock.projectMember.findFirst.mockResolvedValue({ id: 'pm-1' });

      const ctx = await service.assertCanUpdateTask(
        mockProjectId,
        mockActiveMemberId,
        mockActiveMemberId,
        Role.USER,
        false,
      );
      expect(ctx.isMember).toBe(true);
    });

    it('should deny Active Member from updating details of someone else task', async () => {
      prismaMock.projectMember.findFirst.mockResolvedValue({ id: 'pm-1' });

      await expect(
        service.assertCanUpdateTask(
          mockProjectId,
          'other-assignee',
          mockActiveMemberId,
          Role.USER,
          false,
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'You do not have permission to update this task.',
        ),
      );
    });
  });

  describe('6. assertActiveMemberForAssignment', () => {
    it('should allow assigning tasks to the founder', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        founderId: mockFounderId,
        members: [],
      });

      await expect(
        service.assertActiveMemberForAssignment(mockProjectId, mockFounderId),
      ).resolves.not.toThrow();
    });

    it('should allow assigning tasks to an active member', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        founderId: mockFounderId,
        members: [{ status: ProjectMemberStatus.ACTIVE }],
      });

      await expect(
        service.assertActiveMemberForAssignment(
          mockProjectId,
          mockActiveMemberId,
        ),
      ).resolves.not.toThrow();
    });

    it('should deny assigning tasks to non-members or inactive members', async () => {
      prismaMock.project.findUnique.mockResolvedValue({
        founderId: mockFounderId,
        members: [{ status: ProjectMemberStatus.REMOVED }],
      });

      await expect(
        service.assertActiveMemberForAssignment(
          mockProjectId,
          mockRemovedMemberId,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'Tasks can only be assigned to active project team members.',
        ),
      );
    });

    it('should throw NotFoundException if project not found for assignment', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);

      await expect(
        service.assertActiveMemberForAssignment(
          'invalid-id',
          mockActiveMemberId,
        ),
      ).rejects.toThrow(new NotFoundException('Project not found.'));
    });
  });

  describe('7. Slug Resolution', () => {
    it('should correctly query and resolve project access using slug', async () => {
      prismaMock.project.findFirst.mockResolvedValue(publishedProject);
      prismaMock.projectMember.findFirst.mockResolvedValue({ id: 'pm-1' });

      const ctx = await service.assertCanView(mockSlug, mockActiveMemberId);
      expect(ctx.isMember).toBe(true);
      expect(prismaMock.project.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ id: mockSlug }, { slug: mockSlug }],
          },
        }),
      );
    });
  });
});
