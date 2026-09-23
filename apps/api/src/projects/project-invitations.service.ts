import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ProjectInvitationStatus,
  ProjectMemberStatus,
  ProjectModerationStatus,
  ProjectRoleStatus,
  Role,
} from '@prisma/client';
import {
  ProjectInvitationResponseDto,
  RespondInvitationAction,
  RespondInvitationDto,
  SendInvitationDto,
  UserInvitationDetailDto,
  UserInvitationsResponseDto,
} from './projects.dto';

@Injectable()
export class ProjectInvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async sendInvitation(
    projectId: string,
    projectRoleId: string,
    inviterId: string,
    inviterRole: string,
    dto: SendInvitationDto,
  ): Promise<ProjectInvitationResponseDto> {
    // 1. Validate project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, founderId: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    // Authorization check: Only project founder or Administrator
    const isFounder = project.founderId === inviterId;
    const isAdmin = inviterRole === 'ADMINISTRATOR';
    if (!isFounder && !isAdmin) {
      throw new ForbiddenException('Only the project founder or administrator can send role invitations.');
    }

    // 2. Validate ProjectRole exists & belongs to project
    const projectRole = await this.prisma.projectRole.findUnique({
      where: { id: projectRoleId },
      select: { id: true, projectId: true, status: true, title: true },
    });

    if (!projectRole || projectRole.projectId !== projectId) {
      throw new NotFoundException('Project role not found for this project.');
    }

    // Role status check: Must be OPEN or IN_REVIEW
    if (projectRole.status === ProjectRoleStatus.CLOSED || projectRole.status === ProjectRoleStatus.FILLED) {
      throw new BadRequestException('Cannot send invitations for a role that is CLOSED or FILLED.');
    }

    // 3. Validate candidate user
    const candidateUser = await this.prisma.user.findUnique({
      where: { id: dto.candidateId },
      select: { id: true, role: true },
    });

    if (!candidateUser || candidateUser.role !== Role.USER) {
      throw new NotFoundException('Candidate user not found or ineligible for invitations.');
    }

    if (candidateUser.id === project.founderId) {
      throw new BadRequestException('Cannot send an invitation to the project founder.');
    }

    // 4. Validate candidate is not already an active member
    const existingMembership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: candidateUser.id,
        },
      },
    });

    if (
      existingMembership &&
      (!existingMembership.status || existingMembership.status === ProjectMemberStatus.ACTIVE)
    ) {
      throw new BadRequestException('Candidate is already an active team member of this project.');
    }

    // 5. Prevent duplicate pending invitations for the same project role and candidate
    const existingPendingInvitation = await this.prisma.projectInvitation.findFirst({
      where: {
        projectId,
        projectRoleId,
        inviteeId: candidateUser.id,
        status: ProjectInvitationStatus.PENDING,
      },
    });

    if (existingPendingInvitation) {
      throw new BadRequestException('Candidate already has a pending invitation for this project role.');
    }

    // 6. Create ProjectInvitation
    const invitation = await this.prisma.projectInvitation.create({
      data: {
        projectId,
        projectRoleId,
        inviterId,
        inviteeId: candidateUser.id,
        message: dto.message?.trim() || null,
        status: ProjectInvitationStatus.PENDING,
      },
    });

    return this.mapToResponseDto(invitation);
  }

  async getUserInvitations(userId: string): Promise<UserInvitationsResponseDto> {
    const invitationInclude = {
      project: {
        select: {
          id: true,
          name: true,
          coverUrl: true,
          description: true,
          genre: true,
          platform: true,
          gameEngine: true,
          founderId: true,
        },
      },
      projectRole: {
        select: {
          id: true,
          title: true,
          commitment: true,
          experienceLevel: true,
          status: true,
          role: { select: { name: true } },
        },
      },
      inviter: {
        select: {
          id: true,
          username: true,
          profile: { select: { displayName: true, avatarUrl: true, headline: true } },
        },
      },
      invitee: {
        select: {
          id: true,
          username: true,
          profile: { select: { displayName: true, avatarUrl: true, headline: true } },
        },
      },
    };

    const receivedRaw = await this.prisma.projectInvitation.findMany({
      where: { inviteeId: userId },
      include: invitationInclude,
      orderBy: { createdAt: 'desc' },
    });

    const sentRaw = await this.prisma.projectInvitation.findMany({
      where: { inviterId: userId },
      include: invitationInclude,
      orderBy: { createdAt: 'desc' },
    });

    const received = receivedRaw.map((inv) => this.mapToDetailDto(inv));
    const sent = sentRaw.map((inv) => this.mapToDetailDto(inv));
    const pendingCount = received.filter((inv) => inv.status === ProjectInvitationStatus.PENDING).length;

    return {
      received,
      sent,
      pendingCount,
    };
  }

  async respondToInvitation(
    invitationId: string,
    userId: string,
    dto: RespondInvitationDto,
  ): Promise<ProjectInvitationResponseDto> {
    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { id: invitationId },
      include: {
        projectRole: { include: { role: true } },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found.');
    }

    if (invitation.inviteeId !== userId) {
      throw new ForbiddenException('Only the invited candidate can respond to this invitation.');
    }

    if (invitation.status !== ProjectInvitationStatus.PENDING) {
      throw new BadRequestException('Invitation is no longer pending.');
    }

    if (dto.action === RespondInvitationAction.REJECT) {
      const rejected = await this.prisma.projectInvitation.update({
        where: { id: invitationId },
        data: { status: ProjectInvitationStatus.REJECTED },
      });
      return this.mapToResponseDto(rejected);
    }

    // Atomic acceptance inside a single transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Re-verify invitation status
      const currentInv = await tx.projectInvitation.findUnique({
        where: { id: invitationId },
      });

      if (!currentInv || currentInv.status !== ProjectInvitationStatus.PENDING) {
        throw new BadRequestException('Invitation is no longer pending.');
      }

      // 2. Verify project role is OPEN or IN_REVIEW
      const currentRole = await tx.projectRole.findUnique({
        where: { id: currentInv.projectRoleId },
        include: { role: true },
      });

      if (
        !currentRole ||
        currentRole.status === ProjectRoleStatus.CLOSED ||
        currentRole.status === ProjectRoleStatus.FILLED
      ) {
        throw new BadRequestException('Project role is no longer open.');
      }

      // 3. Verify user is not already an active member
      const existingMembership = await tx.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: currentInv.projectId,
            userId,
          },
        },
      });

      if (
        existingMembership &&
        (!existingMembership.status || existingMembership.status === ProjectMemberStatus.ACTIVE)
      ) {
        throw new BadRequestException('Candidate is already an active team member of this project.');
      }

      const memberRoleTitle = currentRole.title || currentRole.role?.name || 'Member';
      let memberId: string;

      // 4. Create or Reactivate ProjectMember
      if (existingMembership) {
        const updated = await tx.projectMember.update({
          where: { id: existingMembership.id },
          data: {
            status: ProjectMemberStatus.ACTIVE,
            role: memberRoleTitle,
            projectRoleId: currentInv.projectRoleId,
            joinedAt: new Date(),
            leftAt: null,
          },
        });
        memberId = updated.id;
      } else {
        const created = await tx.projectMember.create({
          data: {
            projectId: currentInv.projectId,
            userId,
            role: memberRoleTitle,
            projectRoleId: currentInv.projectRoleId,
            status: ProjectMemberStatus.ACTIVE,
          },
        });
        memberId = created.id;
      }

      // 5. Update ProjectInvitation status to ACCEPTED
      const updatedInvitation = await tx.projectInvitation.update({
        where: { id: invitationId },
        data: { status: ProjectInvitationStatus.ACCEPTED },
      });

      // 6. Update ProjectRole status to FILLED and assign to member
      await tx.projectRole.update({
        where: { id: currentInv.projectRoleId },
        data: {
          assignedMemberId: memberId,
          status: ProjectRoleStatus.FILLED,
        },
      });

      return this.mapToResponseDto(updatedInvitation);
    });
  }

  async cancelInvitation(
    invitationId: string,
    userId: string,
    userRole: string,
  ): Promise<ProjectInvitationResponseDto> {
    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found.');
    }

    const isInviter = invitation.inviterId === userId;
    const isAdmin = userRole === 'ADMINISTRATOR';
    if (!isInviter && !isAdmin) {
      throw new ForbiddenException('Only the inviter or administrator can cancel this invitation.');
    }

    if (invitation.status !== ProjectInvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be cancelled.');
    }

    const cancelled = await this.prisma.projectInvitation.update({
      where: { id: invitationId },
      data: { status: ProjectInvitationStatus.CANCELLED },
    });

    return this.mapToResponseDto(cancelled);
  }

  private mapToResponseDto(invitation: any): ProjectInvitationResponseDto {
    return {
      id: invitation.id,
      projectId: invitation.projectId,
      projectRoleId: invitation.projectRoleId,
      inviterId: invitation.inviterId,
      inviteeId: invitation.inviteeId,
      status: invitation.status,
      message: invitation.message,
      createdAt: invitation.createdAt.toISOString(),
      updatedAt: invitation.updatedAt.toISOString(),
    };
  }

  private mapToDetailDto(inv: any): UserInvitationDetailDto {
    return {
      id: inv.id,
      projectId: inv.projectId,
      projectRoleId: inv.projectRoleId,
      inviterId: inv.inviterId,
      inviteeId: inv.inviteeId,
      status: inv.status,
      message: inv.message,
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
      project: {
        id: inv.project.id,
        name: inv.project.name,
        coverUrl: inv.project.coverUrl,
        description: inv.project.description,
        genre: inv.project.genre,
        platform: inv.project.platform,
        gameEngine: inv.project.gameEngine,
        founderId: inv.project.founderId,
      },
      projectRole: {
        id: inv.projectRole.id,
        title: inv.projectRole.title || inv.projectRole.role.name,
        commitment: inv.projectRole.commitment,
        experienceLevel: inv.projectRole.experienceLevel,
        status: inv.projectRole.status,
        roleName: inv.projectRole.role.name,
      },
      inviter: {
        id: inv.inviter.id,
        username: inv.inviter.username,
        displayName: inv.inviter.profile?.displayName || inv.inviter.username,
        avatarUrl: inv.inviter.profile?.avatarUrl || null,
        headline: inv.inviter.profile?.headline || null,
      },
      invitee: {
        id: inv.invitee.id,
        username: inv.invitee.username,
        displayName: inv.invitee.profile?.displayName || inv.invitee.username,
        avatarUrl: inv.invitee.profile?.avatarUrl || null,
        headline: inv.invitee.profile?.headline || null,
      },
    };
  }
}
