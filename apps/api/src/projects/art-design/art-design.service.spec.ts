import { Test, TestingModule } from '@nestjs/testing';
import { ArtDesignService } from './art-design.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAuthorizationService } from '../../tasks/project-authorization.service';
import { TasksService } from '../../tasks/tasks.service';
import {
  ArtProposalCategory,
  ArtProposalStatus,
  ArtVoteType,
  DesignAssetCategory,
  DesignAssetStatus,
  ProjectMemberStatus,
  TaskType,
} from '@prisma/client';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { FounderDecisionType } from './art-design.dto';

describe('ArtDesignService', () => {
  let service: ArtDesignService;
  let prisma: any;
  let tasksService: any;

  const mockProjectId = 'project-123';
  const mockFounderId = 'founder-user-1';
  const mockArtistUserId = 'artist-user-2';
  const mockProgrammerUserId = 'programmer-user-3';
  const mockStrangerUserId = 'stranger-user-4';

  const mockProject = {
    id: mockProjectId,
    name: 'Ashen Oath',
    founderId: mockFounderId,
    members: [
      {
        id: 'member-1',
        userId: mockArtistUserId,
        status: ProjectMemberStatus.ACTIVE,
        role: 'Lead Concept Artist',
        assignedRoles: [],
        projectRole: null,
        user: { profile: { identity: { roles: [] } } },
      },
      {
        id: 'member-2',
        userId: mockProgrammerUserId,
        status: ProjectMemberStatus.ACTIVE,
        role: 'Systems Programmer',
        assignedRoles: [],
        projectRole: null,
        user: { profile: { identity: { roles: [] } } },
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      project: {
        findUnique: jest.fn().mockImplementation((args) => {
          if (args.where?.id === mockProjectId) {
            const memberFilterUserId = args.select?.members?.where?.userId;
            return Promise.resolve({
              ...mockProject,
              members: memberFilterUserId
                ? mockProject.members.filter((m) => m.userId === memberFilterUserId)
                : mockProject.members,
            });
          }
          return Promise.resolve(null);
        }),
      },
      projectMember: {
        count: jest.fn().mockResolvedValue(2),
      },
      artProposal: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      artProposalVote: {
        upsert: jest.fn(),
      },
      artProposalComment: {
        create: jest.fn(),
      },
      designAsset: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      task: {
        findUnique: jest.fn(),
      },
    };

    tasksService = {
      createTask: jest.fn().mockResolvedValue({
        id: 'task-999',
        taskNumber: 14,
        taskCode: 'TASK-14',
        title: '[Art] Blood Cathedral Gate',
        type: TaskType.ART,
        status: 'TODO',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArtDesignService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProjectAuthorizationService, useValue: {} },
        { provide: TasksService, useValue: tasksService },
      ],
    }).compile();

    service = module.get<ArtDesignService>(ArtDesignService);
  });

  describe('1. Role Authorization for Art Proposals', () => {
    it('should reject non-art/design member with ForbiddenException', async () => {
      await expect(
        service.assertArtDesignRole(mockProjectId, mockProgrammerUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject stranger with ForbiddenException', async () => {
      await expect(
        service.assertArtDesignRole(mockProjectId, mockStrangerUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow member with Art/Design role to submit proposal', async () => {
      await expect(
        service.assertArtDesignRole(mockProjectId, mockArtistUserId),
      ).resolves.toBeUndefined();
    });

    it('should allow project founder to submit proposal regardless of member role', async () => {
      await expect(
        service.assertArtDesignRole(mockProjectId, mockFounderId),
      ).resolves.toBeUndefined();
    });
  });

  describe('2. Voting & Reviews', () => {
    it('should allow active member to vote once per round', async () => {
      prisma.artProposal.findFirst.mockResolvedValue({
        id: 'prop-1',
        projectId: mockProjectId,
        currentRound: 1,
        status: ArtProposalStatus.IN_VOTING,
      });

      prisma.artProposalVote.upsert.mockResolvedValue({ id: 'vote-1' });

      // Mock getProposal return
      jest.spyOn(service, 'getProposal').mockResolvedValue({
        id: 'prop-1',
        userVote: { voteType: ArtVoteType.APPROVE },
      } as any);

      const result = await service.voteProposal(
        mockProjectId,
        'prop-1',
        { voteType: ArtVoteType.APPROVE, feedback: 'Strong lighting contrast' },
        mockArtistUserId,
      );

      expect(prisma.artProposalVote.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            proposalId_userId_round: {
              proposalId: 'prop-1',
              userId: mockArtistUserId,
              round: 1,
            },
          },
        }),
      );
      expect(result).toBeDefined();
    });

    it('should reject voting if proposal is not in voting status', async () => {
      prisma.artProposal.findFirst.mockResolvedValue({
        id: 'prop-1',
        projectId: mockProjectId,
        currentRound: 1,
        status: ArtProposalStatus.APPROVED,
      });

      await expect(
        service.voteProposal(
          mockProjectId,
          'prop-1',
          { voteType: ArtVoteType.APPROVE },
          mockArtistUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Revisions & Multiple Voting Rounds', () => {
    it('should allow author to submit revision, archive round 1 and advance to round 2', async () => {
      prisma.artProposal.findFirst.mockResolvedValue({
        id: 'prop-1',
        projectId: mockProjectId,
        authorId: mockArtistUserId,
        currentRound: 1,
        revisions: [],
        votes: [
          { round: 1, voteType: ArtVoteType.APPROVE },
          { round: 1, voteType: ArtVoteType.DISAPPROVE },
        ],
        project: { founderId: mockFounderId },
      });

      prisma.artProposal.update.mockResolvedValue({ id: 'prop-1' });
      jest.spyOn(service, 'getProposal').mockResolvedValue({
        id: 'prop-1',
        currentRound: 2,
      } as any);

      await service.reviseProposal(
        mockProjectId,
        'prop-1',
        {
          revisionNotes: 'Darkened silhouettes and increased ember saturation',
          title: 'Revised Blood Cathedral Gate',
        },
        mockArtistUserId,
      );

      expect(prisma.artProposal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prop-1' },
          data: expect.objectContaining({
            currentRound: 2,
            status: ArtProposalStatus.IN_VOTING,
            revisions: expect.arrayContaining([
              expect.objectContaining({
                round: 1,
                revisionNotes:
                  'Darkened silhouettes and increased ember saturation',
              }),
            ]),
          }),
        }),
      );
    });
  });

  describe('4. Founder Final Decision Enforcement', () => {
    it('should reject non-founder member from approving proposal', async () => {
      await expect(
        service.founderDecision(
          mockProjectId,
          'prop-1',
          { decision: FounderDecisionType.APPROVED },
          mockArtistUserId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow project founder to make final approval decision', async () => {
      prisma.artProposal.findFirst.mockResolvedValue({
        id: 'prop-1',
        projectId: mockProjectId,
        status: ArtProposalStatus.IN_VOTING,
      });
      prisma.artProposal.update.mockResolvedValue({ id: 'prop-1' });
      jest.spyOn(service, 'getProposal').mockResolvedValue({
        id: 'prop-1',
        status: ArtProposalStatus.APPROVED,
        founderDecision: 'APPROVED',
      } as any);

      const res = await service.founderDecision(
        mockProjectId,
        'prop-1',
        {
          decision: FounderDecisionType.APPROVED,
          decisionNotes: 'Approved for production art backlog',
        },
        mockFounderId,
      );

      expect(prisma.artProposal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ArtProposalStatus.APPROVED,
            founderDecision: FounderDecisionType.APPROVED,
            decisionNotes: 'Approved for production art backlog',
          }),
        }),
      );
      expect(res).toBeDefined();
    });
  });

  describe('5. Approved Design → Production Task Conversion', () => {
    it('should reject task creation for unapproved proposal', async () => {
      prisma.artProposal.findFirst.mockResolvedValue({
        id: 'prop-1',
        projectId: mockProjectId,
        status: ArtProposalStatus.IN_VOTING,
      });

      await expect(
        service.convertProposalToTask(
          mockProjectId,
          'prop-1',
          {},
          mockArtistUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create production task and link back to source proposal', async () => {
      prisma.artProposal.findFirst.mockResolvedValue({
        id: 'prop-1',
        projectId: mockProjectId,
        title: 'Gothic Viaduct',
        rationale: 'Key traversal vista',
        status: ArtProposalStatus.APPROVED,
        createdTaskId: null,
      });

      const res = await service.convertProposalToTask(
        mockProjectId,
        'prop-1',
        {
          title: '[Art] Gothic Viaduct 3D Blockout',
          type: TaskType.ART,
        },
        mockArtistUserId,
      );

      expect(tasksService.createTask).toHaveBeenCalledWith(
        mockProjectId,
        expect.objectContaining({
          title: '[Art] Gothic Viaduct 3D Blockout',
          type: TaskType.ART,
        }),
        mockFounderId,
        undefined,
      );

      expect(prisma.artProposal.update).toHaveBeenCalledWith({
        where: { id: 'prop-1' },
        data: { createdTaskId: 'task-999' },
      });

      expect(res.taskCode).toBe('TASK-14');
    });

    it('should prevent duplicate task creation if already converted', async () => {
      prisma.artProposal.findFirst.mockResolvedValue({
        id: 'prop-1',
        projectId: mockProjectId,
        title: 'Gothic Viaduct',
        status: ArtProposalStatus.APPROVED,
        createdTaskId: 'task-999',
      });

      prisma.task.findUnique.mockResolvedValue({
        id: 'task-999',
        taskNumber: 14,
        title: 'Existing Task',
      });

      await expect(
        service.convertProposalToTask(
          mockProjectId,
          'prop-1',
          {},
          mockArtistUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('6. Design Library Management', () => {
    it('should allow active member to add library asset', async () => {
      prisma.designAsset.create.mockResolvedValue({
        id: 'asset-1',
        title: 'Ember Lantern Prop',
        category: DesignAssetCategory.PROPS_WEAPONS,
        status: DesignAssetStatus.PROPOSED,
        fileUrl: '/uploads/art-design/lantern.png',
      });

      const created = await service.createAsset(
        mockProjectId,
        {
          title: 'Ember Lantern Prop',
          category: DesignAssetCategory.PROPS_WEAPONS,
          fileUrl: '/uploads/art-design/lantern.png',
        },
        mockArtistUserId,
      );

      expect(created.status).toBe(DesignAssetStatus.PROPOSED);
    });

    it('should auto-approve asset if created by founder', async () => {
      prisma.designAsset.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'asset-founder', ...data }),
      );

      const created = await service.createAsset(
        mockProjectId,
        {
          title: 'Ashen Oath Logo Study',
          category: DesignAssetCategory.UI_ICONS,
          fileUrl: '/uploads/art-design/logo.png',
        },
        mockFounderId,
      );

      expect(created.status).toBe(DesignAssetStatus.APPROVED);
    });
  });
});
