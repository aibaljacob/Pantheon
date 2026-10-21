import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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
  TaskPriority,
  TaskType,
} from '@prisma/client';
import {
  CommentArtProposalDto,
  ConvertProposalToTaskDto,
  CreateArtProposalDto,
  CreateDesignAssetDto,
  FounderDecisionDto,
  FounderDecisionType,
  ReviseArtProposalDto,
  UpdateArtProposalDto,
  UpdateDesignAssetDto,
  VoteArtProposalDto,
} from './art-design.dto';
import { CreateTaskDto } from '../../tasks/dto/create-task.dto';

@Injectable()
export class ArtDesignService {
  private readonly logger = new Logger(ArtDesignService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authzService: ProjectAuthorizationService,
    private readonly tasksService: TasksService,
  ) {}

  // ---------------------------------------------------------------------------
  // PERMISSION HELPERS
  // ---------------------------------------------------------------------------

  /**
   * Enforces that the user is either the Project Founder OR has an Art/Design-related role.
   */
  async assertArtDesignRole(projectId: string, userId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        founderId: true,
        members: {
          where: { userId, status: ProjectMemberStatus.ACTIVE },
          include: {
            assignedRoles: {
              include: { role: true },
            },
            projectRole: {
              include: { role: true },
            },
            user: {
              include: {
                profile: {
                  include: {
                    identity: {
                      include: {
                        roles: {
                          include: { role: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    // Founder always possesses creative leadership authority
    if (project.founderId === userId) {
      return;
    }

    const member = project.members[0];
    if (!member) {
      throw new ForbiddenException(
        'You must be an active project member with an Art or Design role to submit proposals.',
      );
    }

    const artDesignRegex =
      /art|artist|design|designer|creative|concept|3d|2d|animator|lighting|ui|ux|visual/i;

    // 1. Direct member.role string
    if (member.role && artDesignRegex.test(member.role)) {
      return;
    }

    // 2. Primary project role
    if (member.projectRole) {
      if (
        (member.projectRole.title &&
          artDesignRegex.test(member.projectRole.title)) ||
        (member.projectRole.role?.name &&
          artDesignRegex.test(member.projectRole.role.name))
      ) {
        return;
      }
    }

    // 3. Multi-assigned project roles
    for (const pr of member.assignedRoles || []) {
      if (
        (pr.title && artDesignRegex.test(pr.title)) ||
        (pr.role?.name && artDesignRegex.test(pr.role.name))
      ) {
        return;
      }
    }

    // 4. User professional identity taxonomy roles
    const identityRoles = member.user?.profile?.identity?.roles || [];
    for (const ur of identityRoles) {
      if (ur.role?.name && artDesignRegex.test(ur.role.name)) {
        return;
      }
    }

    throw new ForbiddenException(
      'Only project members with Art or Design roles (or the project founder) can submit art proposals.',
    );
  }

  /**
   * Enforces that the user is the project founder or an active project member.
   */
  async assertActiveMember(
    projectId: string,
    userId: string,
  ): Promise<{ founderId: string; isFounder: boolean }> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        founderId: true,
        members: {
          where: { userId, status: ProjectMemberStatus.ACTIVE },
          select: { id: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const isFounder = project.founderId === userId;
    const isMember = project.members.length > 0;

    if (!isFounder && !isMember) {
      throw new ForbiddenException(
        'You must be an active project member or founder to perform this action.',
      );
    }

    return { founderId: project.founderId, isFounder };
  }

  /**
   * Enforces that the user is strictly the PROJECT FOUNDER.
   * Constraint: Keep project founder approval separate from platform Administrator privileges.
   */
  async assertProjectFounder(projectId: string, userId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { founderId: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (project.founderId !== userId) {
      throw new ForbiddenException(
        'Only the project founder can make the final approval or rejection decision on art proposals.',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 1. ART PROPOSALS & VOTING
  // ---------------------------------------------------------------------------

  async getProposals(
    projectId: string,
    query: {
      category?: ArtProposalCategory;
      status?: ArtProposalStatus;
      search?: string;
    },
    currentUserId?: string,
  ) {
    const whereClause: any = { projectId };

    if (query.category) {
      whereClause.category = query.category;
    }

    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      whereClause.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { rationale: { contains: q, mode: 'insensitive' } },
        { designNotes: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Get active team count for participation metric
    const [proposals, activeMembersCount, founderProject] = await Promise.all([
      this.prisma.artProposal.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          votes: true,
          comments: {
            select: { id: true },
          },
          createdTask: {
            select: {
              id: true,
              taskNumber: true,
              title: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.projectMember.count({
        where: { projectId, status: ProjectMemberStatus.ACTIVE },
      }),
      this.prisma.project.findUnique({
        where: { id: projectId },
        select: { founderId: true },
      }),
    ]);

    // Total eligible voters = active members + founder (if founder not counted in members)
    const totalEligibleVoters = Math.max(1, activeMembersCount);

    return proposals.map((p) => {
      const currentRoundVotes = p.votes.filter(
        (v) => v.round === p.currentRound,
      );
      const approveCount = currentRoundVotes.filter(
        (v) => v.voteType === ArtVoteType.APPROVE,
      ).length;
      const disapproveCount = currentRoundVotes.filter(
        (v) => v.voteType === ArtVoteType.DISAPPROVE,
      ).length;
      const neutralCount = currentRoundVotes.filter(
        (v) => v.voteType === ArtVoteType.NEUTRAL,
      ).length;
      const totalVotes = currentRoundVotes.length;
      const participationRate = Math.min(
        100,
        Math.round((totalVotes / totalEligibleVoters) * 100),
      );

      const userVote = currentUserId
        ? currentRoundVotes.find((v) => v.userId === currentUserId) || null
        : null;

      return {
        id: p.id,
        projectId: p.projectId,
        authorId: p.authorId,
        author: {
          id: p.author.id,
          username: p.author.username,
          displayName:
            p.author.profile?.displayName || p.author.username,
          avatarUrl: p.author.profile?.avatarUrl || null,
        },
        title: p.title,
        category: p.category,
        status: p.status,
        rationale: p.rationale,
        designNotes: p.designNotes,
        paletteColors: p.paletteColors || [],
        referenceImages: p.referenceImages || [],
        currentRound: p.currentRound,
        founderDecision: p.founderDecision,
        decisionNotes: p.decisionNotes,
        decidedAt: p.decidedAt ? p.decidedAt.toISOString() : null,
        createdTaskId: p.createdTaskId,
        createdTask: p.createdTask
          ? {
              id: p.createdTask.id,
              taskCode: `TASK-${p.createdTask.taskNumber}`,
              taskNumber: p.createdTask.taskNumber,
              title: p.createdTask.title,
              status: p.createdTask.status,
            }
          : null,
        revisions: p.revisions || [],
        commentsCount: p.comments.length,
        voteSummary: {
          approveCount,
          disapproveCount,
          neutralCount,
          totalVotes,
          eligibleVoters: totalEligibleVoters,
          participationRate,
        },
        userVote: userVote
          ? {
              voteType: userVote.voteType,
              feedback: userVote.feedback,
              createdAt: userVote.createdAt.toISOString(),
            }
          : null,
        isFounder: founderProject?.founderId === currentUserId,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    });
  }

  async getProposal(
    projectId: string,
    proposalId: string,
    currentUserId?: string,
  ) {
    const [proposal, activeMembersCount, project] = await Promise.all([
      this.prisma.artProposal.findFirst({
        where: { id: proposalId, projectId },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          votes: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  profile: {
                    select: {
                      displayName: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  profile: {
                    select: {
                      displayName: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          createdTask: {
            select: {
              id: true,
              taskNumber: true,
              title: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.projectMember.count({
        where: { projectId, status: ProjectMemberStatus.ACTIVE },
      }),
      this.prisma.project.findUnique({
        where: { id: projectId },
        select: { founderId: true },
      }),
    ]);

    if (!proposal) {
      throw new NotFoundException('Art proposal not found in this project.');
    }

    const currentRoundVotes = proposal.votes.filter(
      (v) => v.round === proposal.currentRound,
    );
    const approveCount = currentRoundVotes.filter(
      (v) => v.voteType === ArtVoteType.APPROVE,
    ).length;
    const disapproveCount = currentRoundVotes.filter(
      (v) => v.voteType === ArtVoteType.DISAPPROVE,
    ).length;
    const neutralCount = currentRoundVotes.filter(
      (v) => v.voteType === ArtVoteType.NEUTRAL,
    ).length;
    const totalVotes = currentRoundVotes.length;
    const totalEligibleVoters = Math.max(1, activeMembersCount);
    const participationRate = Math.min(
      100,
      Math.round((totalVotes / totalEligibleVoters) * 100),
    );

    const userVote = currentUserId
      ? currentRoundVotes.find((v) => v.userId === currentUserId) || null
      : null;

    return {
      id: proposal.id,
      projectId: proposal.projectId,
      authorId: proposal.authorId,
      author: {
        id: proposal.author.id,
        username: proposal.author.username,
        displayName:
          proposal.author.profile?.displayName || proposal.author.username,
        avatarUrl: proposal.author.profile?.avatarUrl || null,
      },
      title: proposal.title,
      category: proposal.category,
      status: proposal.status,
      rationale: proposal.rationale,
      designNotes: proposal.designNotes,
      paletteColors: proposal.paletteColors || [],
      referenceImages: proposal.referenceImages || [],
      currentRound: proposal.currentRound,
      founderDecision: proposal.founderDecision,
      decisionNotes: proposal.decisionNotes,
      decidedAt: proposal.decidedAt ? proposal.decidedAt.toISOString() : null,
      createdTaskId: proposal.createdTaskId,
      createdTask: proposal.createdTask
        ? {
            id: proposal.createdTask.id,
            taskCode: `TASK-${proposal.createdTask.taskNumber}`,
            taskNumber: proposal.createdTask.taskNumber,
            title: proposal.createdTask.title,
            status: proposal.createdTask.status,
          }
        : null,
      revisions: proposal.revisions || [],
      voteSummary: {
        approveCount,
        disapproveCount,
        neutralCount,
        totalVotes,
        eligibleVoters: totalEligibleVoters,
        participationRate,
      },
      currentRoundVotes: currentRoundVotes.map((v) => ({
        id: v.id,
        userId: v.userId,
        username: v.user.username,
        displayName:
          v.user.profile?.displayName || v.user.username,
        avatarUrl: v.user.profile?.avatarUrl || null,
        round: v.round,
        voteType: v.voteType,
        feedback: v.feedback,
        createdAt: v.createdAt.toISOString(),
      })),
      comments: proposal.comments.map((c) => ({
        id: c.id,
        authorId: c.authorId,
        author: {
          id: c.author.id,
          username: c.author.username,
          displayName:
            c.author.profile?.displayName || c.author.username,
          avatarUrl: c.author.profile?.avatarUrl || null,
        },
        content: c.content,
        createdAt: c.createdAt.toISOString(),
      })),
      userVote: userVote
        ? {
            voteType: userVote.voteType,
            feedback: userVote.feedback,
            createdAt: userVote.createdAt.toISOString(),
          }
        : null,
      isFounder: project?.founderId === currentUserId,
      createdAt: proposal.createdAt.toISOString(),
      updatedAt: proposal.updatedAt.toISOString(),
    };
  }

  async createProposal(
    projectId: string,
    dto: CreateArtProposalDto,
    userId: string,
  ) {
    await this.assertArtDesignRole(projectId, userId);

    const created = await this.prisma.artProposal.create({
      data: {
        projectId,
        authorId: userId,
        title: dto.title.trim(),
        category: dto.category,
        status: ArtProposalStatus.IN_VOTING,
        rationale: dto.rationale?.trim() || dto.title.trim(),
        designNotes: dto.designNotes?.trim() || null,
        paletteColors: dto.paletteColors || [],
        referenceImages: dto.referenceImages || [],
        currentRound: 1,
        revisions: [],
      },
    });

    return this.getProposal(projectId, created.id, userId);
  }

  async updateProposal(
    projectId: string,
    proposalId: string,
    dto: UpdateArtProposalDto,
    userId: string,
  ) {
    const { isFounder } = await this.assertActiveMember(projectId, userId);

    const proposal = await this.prisma.artProposal.findFirst({
      where: { id: proposalId, projectId },
    });

    if (!proposal) {
      throw new NotFoundException('Art proposal not found in this project.');
    }

    if (proposal.authorId !== userId && !isFounder) {
      throw new ForbiddenException('Only the author or project founder can edit this proposal.');
    }

    await this.prisma.artProposal.update({
      where: { id: proposalId },
      data: {
        ...(dto.title && { title: dto.title.trim() }),
        ...(dto.category && { category: dto.category }),
        ...(dto.rationale !== undefined && {
          rationale: dto.rationale.trim(),
        }),
        ...(dto.designNotes !== undefined && {
          designNotes: dto.designNotes ? dto.designNotes.trim() : null,
        }),
        ...(dto.referenceImages !== undefined && {
          referenceImages: dto.referenceImages,
        }),
      },
    });

    return this.getProposal(projectId, proposalId, userId);
  }

  async deleteProposal(
    projectId: string,
    proposalId: string,
    userId: string,
  ) {
    const { isFounder } = await this.assertActiveMember(projectId, userId);

    const proposal = await this.prisma.artProposal.findFirst({
      where: { id: proposalId, projectId },
    });

    if (!proposal) {
      throw new NotFoundException('Art proposal not found in this project.');
    }

    if (proposal.authorId !== userId && !isFounder) {
      throw new ForbiddenException('Only the author or project founder can delete this proposal.');
    }

    await this.prisma.artProposal.delete({
      where: { id: proposalId },
    });

    return { success: true, message: 'Proposal deleted successfully.' };
  }

  async voteProposal(
    projectId: string,
    proposalId: string,
    dto: VoteArtProposalDto,
    userId: string,
  ) {
    await this.assertActiveMember(projectId, userId);

    const proposal = await this.prisma.artProposal.findFirst({
      where: { id: proposalId, projectId },
      select: { id: true, currentRound: true, status: true },
    });

    if (!proposal) {
      throw new NotFoundException('Art proposal not found in this project.');
    }

    if (
      proposal.status !== ArtProposalStatus.IN_VOTING &&
      proposal.status !== ArtProposalStatus.REVISION_REQUESTED
    ) {
      throw new BadRequestException(
        `Voting is closed for this proposal (Status: ${proposal.status}).`,
      );
    }

    // Upsert vote for current round
    await this.prisma.artProposalVote.upsert({
      where: {
        proposalId_userId_round: {
          proposalId,
          userId,
          round: proposal.currentRound,
        },
      },
      create: {
        proposalId,
        userId,
        round: proposal.currentRound,
        voteType: dto.voteType,
        feedback: dto.feedback?.trim() || null,
      },
      update: {
        voteType: dto.voteType,
        feedback: dto.feedback?.trim() || null,
      },
    });

    return this.getProposal(projectId, proposalId, userId);
  }

  async commentProposal(
    projectId: string,
    proposalId: string,
    dto: CommentArtProposalDto,
    userId: string,
  ) {
    await this.assertActiveMember(projectId, userId);

    const proposal = await this.prisma.artProposal.findFirst({
      where: { id: proposalId, projectId },
      select: { id: true },
    });

    if (!proposal) {
      throw new NotFoundException('Art proposal not found in this project.');
    }

    const comment = await this.prisma.artProposalComment.create({
      data: {
        proposalId,
        authorId: userId,
        content: dto.content.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return {
      id: comment.id,
      authorId: comment.authorId,
      author: {
        id: comment.author.id,
        username: comment.author.username,
        displayName:
          comment.author.profile?.displayName || comment.author.username,
        avatarUrl: comment.author.profile?.avatarUrl || null,
      },
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  async reviseProposal(
    projectId: string,
    proposalId: string,
    dto: ReviseArtProposalDto,
    userId: string,
  ) {
    const proposal = await this.prisma.artProposal.findFirst({
      where: { id: proposalId, projectId },
      include: {
        votes: true,
        project: { select: { founderId: true } },
      },
    });

    if (!proposal) {
      throw new NotFoundException('Art proposal not found.');
    }

    const isAuthor = proposal.authorId === userId;
    const isFounder = proposal.project.founderId === userId;

    if (!isAuthor && !isFounder) {
      throw new ForbiddenException(
        'Only the proposal author or project founder can submit a revision.',
      );
    }

    // Archive current round votes into history
    const currentRoundVotes = proposal.votes.filter(
      (v) => v.round === proposal.currentRound,
    );
    const roundSummary = {
      round: proposal.currentRound,
      revisionNotes: dto.revisionNotes.trim(),
      revisedBy: userId,
      revisedAt: new Date().toISOString(),
      votesSummary: {
        approve: currentRoundVotes.filter(
          (v) => v.voteType === ArtVoteType.APPROVE,
        ).length,
        disapprove: currentRoundVotes.filter(
          (v) => v.voteType === ArtVoteType.DISAPPROVE,
        ).length,
        neutral: currentRoundVotes.filter(
          (v) => v.voteType === ArtVoteType.NEUTRAL,
        ).length,
        total: currentRoundVotes.length,
      },
    };

    const existingRevisions = Array.isArray(proposal.revisions)
      ? (proposal.revisions as any[])
      : [];

    await this.prisma.artProposal.update({
      where: { id: proposalId },
      data: {
        ...(dto.title && { title: dto.title.trim() }),
        ...(dto.rationale && { rationale: dto.rationale.trim() }),
        ...(dto.designNotes !== undefined && {
          designNotes: dto.designNotes ? dto.designNotes.trim() : null,
        }),
        ...(dto.paletteColors !== undefined && {
          paletteColors: dto.paletteColors,
        }),
        ...(dto.referenceImages !== undefined && {
          referenceImages: dto.referenceImages,
        }),
        currentRound: proposal.currentRound + 1,
        status: ArtProposalStatus.IN_VOTING,
        revisions: [...existingRevisions, roundSummary],
      },
    });

    return this.getProposal(projectId, proposalId, userId);
  }

  async founderDecision(
    projectId: string,
    proposalId: string,
    dto: FounderDecisionDto,
    userId: string,
  ) {
    // Strict requirement: Only the project founder makes the final decision
    await this.assertProjectFounder(projectId, userId);

    const proposal = await this.prisma.artProposal.findFirst({
      where: { id: proposalId, projectId },
    });

    if (!proposal) {
      throw new NotFoundException('Art proposal not found.');
    }

    const newStatus =
      dto.decision === FounderDecisionType.APPROVED
        ? ArtProposalStatus.APPROVED
        : ArtProposalStatus.REJECTED;

    const updated = await this.prisma.artProposal.update({
      where: { id: proposalId },
      data: {
        status: newStatus,
        founderDecision: dto.decision,
        decisionNotes: dto.decisionNotes?.trim() || null,
        decidedAt: new Date(),
      },
    });

    return this.getProposal(projectId, updated.id, userId);
  }

  async convertProposalToTask(
    projectId: string,
    proposalId: string,
    dto: ConvertProposalToTaskDto,
    userId: string,
    userRole?: string,
  ) {
    const { founderId } = await this.assertActiveMember(projectId, userId);

    const proposal = await this.prisma.artProposal.findFirst({
      where: { id: proposalId, projectId },
    });

    if (!proposal) {
      throw new NotFoundException('Art proposal not found.');
    }

    if (proposal.status !== ArtProposalStatus.APPROVED) {
      throw new BadRequestException(
        'Only approved art proposals can be converted into production tasks.',
      );
    }

    // Prevent duplicate creation
    if (proposal.createdTaskId) {
      const existingTask = await this.prisma.task.findUnique({
        where: { id: proposal.createdTaskId },
        select: { id: true, taskNumber: true, title: true, status: true },
      });
      if (existingTask) {
        throw new BadRequestException(
          `A production task has already been created from this proposal (TASK-${existingTask.taskNumber}: ${existingTask.title}).`,
        );
      }
    }

    const taskTitle = dto.title?.trim() || `[Art] ${proposal.title}`;
    const taskDescription =
      dto.description?.trim() ||
      `${proposal.rationale}\n\n**Design Notes:**\n${proposal.designNotes || 'None'}\n\n**Source Art Proposal:** [${proposal.title}](#art-proposal-${proposal.id}) (Category: ${proposal.category})`;

    const createTaskDto: CreateTaskDto = {
      title: taskTitle,
      description: taskDescription,
      type: dto.type || TaskType.ART,
      priority: dto.priority || TaskPriority.MEDIUM,
      milestoneId: dto.milestoneId,
      assigneeId: dto.assigneeId,
    };

    // Use existing task workflow
    const task = await this.tasksService.createTask(
      projectId,
      createTaskDto,
      founderId,
      userRole,
    );

    // Save link back to the source design
    await this.prisma.artProposal.update({
      where: { id: proposalId },
      data: { createdTaskId: task.id },
    });

    return {
      success: true,
      taskId: task.id,
      taskCode: task.taskCode,
      taskNumber: task.taskNumber,
      title: task.title,
      proposalId,
    };
  }

  // ---------------------------------------------------------------------------
  // 2. DESIGN LIBRARIES
  // ---------------------------------------------------------------------------

  async getAssets(
    projectId: string,
    query: {
      category?: DesignAssetCategory;
      status?: DesignAssetStatus;
      search?: string;
    },
  ) {
    const whereClause: any = { projectId };

    if (query.category) {
      whereClause.category = query.category;
    }

    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      whereClause.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
        { creatorDetails: { contains: q, mode: 'insensitive' } },
      ];
    }

    const assets = await this.prisma.designAsset.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        proposal: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        createdTask: {
          select: {
            id: true,
            taskNumber: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return assets.map((a) => ({
      id: a.id,
      projectId: a.projectId,
      authorId: a.authorId,
      author: {
        id: a.author.id,
        username: a.author.username,
        displayName:
          a.author.profile?.displayName || a.author.username,
        avatarUrl: a.author.profile?.avatarUrl || null,
      },
      title: a.title,
      category: a.category,
      status: a.status,
      description: a.description,
      fileUrl: a.fileUrl,
      thumbnailUrl: a.thumbnailUrl || a.fileUrl,
      tags: a.tags || [],
      sourceDetails: a.sourceDetails,
      creatorDetails: a.creatorDetails,
      licenseDetails: a.licenseDetails,
      paletteColors: a.paletteColors || [],
      proposalId: a.proposalId,
      proposal: a.proposal
        ? {
            id: a.proposal.id,
            title: a.proposal.title,
            status: a.proposal.status,
          }
        : null,
      createdTaskId: a.createdTaskId,
      createdTask: a.createdTask
        ? {
            id: a.createdTask.id,
            taskCode: `TASK-${a.createdTask.taskNumber}`,
            taskNumber: a.createdTask.taskNumber,
            title: a.createdTask.title,
            status: a.createdTask.status,
          }
        : null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));
  }

  async createAsset(
    projectId: string,
    dto: CreateDesignAssetDto,
    userId: string,
  ) {
    const { isFounder } = await this.assertActiveMember(projectId, userId);

    const asset = await this.prisma.designAsset.create({
      data: {
        projectId,
        authorId: userId,
        title: dto.title.trim(),
        category: dto.category,
        status: isFounder
          ? DesignAssetStatus.APPROVED
          : DesignAssetStatus.PROPOSED,
        description: dto.description?.trim() || null,
        fileUrl: dto.fileUrl.trim(),
        thumbnailUrl: dto.thumbnailUrl?.trim() || dto.fileUrl.trim(),
        tags: dto.tags || [],
        sourceDetails: dto.sourceDetails?.trim() || null,
        creatorDetails: dto.creatorDetails?.trim() || null,
        licenseDetails: dto.licenseDetails?.trim() || null,
        paletteColors: dto.paletteColors || [],
        proposalId: dto.proposalId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return asset;
  }

  async updateAsset(
    projectId: string,
    assetId: string,
    dto: UpdateDesignAssetDto,
    userId: string,
  ) {
    const { isFounder } = await this.assertActiveMember(projectId, userId);

    const existing = await this.prisma.designAsset.findFirst({
      where: { id: assetId, projectId },
    });

    if (!existing) {
      throw new NotFoundException('Design asset not found.');
    }

    // Only founder can approve/archive assets directly
    if (dto.status && dto.status !== existing.status && !isFounder) {
      if (existing.authorId !== userId) {
        throw new ForbiddenException(
          'Only the project founder can change design asset approval status.',
        );
      }
    }

    return this.prisma.designAsset.update({
      where: { id: assetId },
      data: {
        ...(dto.title && { title: dto.title.trim() }),
        ...(dto.category && { category: dto.category }),
        ...(dto.status && { status: dto.status }),
        ...(dto.description !== undefined && {
          description: dto.description ? dto.description.trim() : null,
        }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.sourceDetails !== undefined && {
          sourceDetails: dto.sourceDetails ? dto.sourceDetails.trim() : null,
        }),
        ...(dto.creatorDetails !== undefined && {
          creatorDetails: dto.creatorDetails ? dto.creatorDetails.trim() : null,
        }),
        ...(dto.licenseDetails !== undefined && {
          licenseDetails: dto.licenseDetails ? dto.licenseDetails.trim() : null,
        }),
        ...(dto.paletteColors !== undefined && {
          paletteColors: dto.paletteColors,
        }),
      },
    });
  }

  async deleteAsset(
    projectId: string,
    assetId: string,
    userId: string,
  ) {
    const { isFounder } = await this.assertActiveMember(projectId, userId);

    const asset = await this.prisma.designAsset.findFirst({
      where: { id: assetId, projectId },
    });

    if (!asset) {
      throw new NotFoundException('Design asset not found.');
    }

    if (asset.authorId !== userId && !isFounder) {
      throw new ForbiddenException('Only the author or project founder can delete this asset.');
    }

    await this.prisma.designAsset.delete({
      where: { id: assetId },
    });

    return { success: true, message: 'Asset deleted successfully.' };
  }

  async convertAssetToTask(
    projectId: string,
    assetId: string,
    dto: ConvertProposalToTaskDto,
    userId: string,
    userRole?: string,
  ) {
    const { founderId } = await this.assertActiveMember(projectId, userId);

    const asset = await this.prisma.designAsset.findFirst({
      where: { id: assetId, projectId },
    });

    if (!asset) {
      throw new NotFoundException('Design asset not found.');
    }

    if (asset.status !== DesignAssetStatus.APPROVED) {
      throw new BadRequestException(
        'Only approved design assets can be converted into production tasks.',
      );
    }

    // Prevent duplicate creation
    if (asset.createdTaskId) {
      const existingTask = await this.prisma.task.findUnique({
        where: { id: asset.createdTaskId },
        select: { id: true, taskNumber: true, title: true, status: true },
      });
      if (existingTask) {
        throw new BadRequestException(
          `A production task has already been created from this asset (TASK-${existingTask.taskNumber}: ${existingTask.title}).`,
        );
      }
    }

    const taskTitle = dto.title?.trim() || `[Asset] ${asset.title}`;
    const taskDescription =
      dto.description?.trim() ||
      `${asset.description || 'Production reference asset.'}\n\n**File Link:** ${asset.fileUrl}\n**Category:** ${asset.category}\n**Source / Creator:** ${asset.creatorDetails || asset.sourceDetails || 'Internal Studio'}\n\n**Source Asset ID:** ${asset.id}`;

    const createTaskDto: CreateTaskDto = {
      title: taskTitle,
      description: taskDescription,
      type: dto.type || TaskType.ART,
      priority: dto.priority || TaskPriority.MEDIUM,
      milestoneId: dto.milestoneId,
      assigneeId: dto.assigneeId,
    };

    const task = await this.tasksService.createTask(
      projectId,
      createTaskDto,
      founderId,
      userRole,
    );

    await this.prisma.designAsset.update({
      where: { id: assetId },
      data: { createdTaskId: task.id },
    });

    return {
      success: true,
      taskId: task.id,
      taskCode: task.taskCode,
      taskNumber: task.taskNumber,
      title: task.title,
      assetId,
    };
  }
}
