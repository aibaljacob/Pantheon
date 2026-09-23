import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectMemberStatus, ProjectModerationStatus, Role } from '@prisma/client';

export interface ProjectAccessContext {
  project: {
    id: string;
    slug: string;
    founderId: string;
    moderationStatus: ProjectModerationStatus;
  };
  isFounder: boolean;
  isMember: boolean;
  isAdmin: boolean;
}

@Injectable()
export class ProjectAuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async getProjectAccess(
    projectIdOrSlug: string,
    userId?: string,
    userRole?: string,
  ): Promise<ProjectAccessContext> {
    const project = await this.prisma.project.findFirst({
      where: {
        OR: [{ id: projectIdOrSlug }, { slug: projectIdOrSlug }],
      },
      select: {
        id: true,
        slug: true,
        founderId: true,
        moderationStatus: true,
        members: {
          select: {
            userId: true,
            status: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const isFounder = Boolean(userId && project.founderId === userId);
    const isMember = Boolean(
      userId &&
        project.members.some(
          (m) => m.userId === userId && m.status === ProjectMemberStatus.ACTIVE,
        ),
    );
    const isAdmin = userRole === Role.ADMINISTRATOR;

    return {
      project: {
        id: project.id,
        slug: project.slug,
        founderId: project.founderId,
        moderationStatus: project.moderationStatus,
      },
      isFounder,
      isMember,
      isAdmin,
    };
  }

  async assertCanView(
    projectId: string,
    userId?: string,
    userRole?: string,
  ): Promise<ProjectAccessContext> {
    const context = await this.getProjectAccess(projectId, userId, userRole);

    // If project is not yet published, only Founder, active member, or admin can access
    if (context.project.moderationStatus !== ProjectModerationStatus.PUBLISHED) {
      if (!context.isFounder && !context.isMember && !context.isAdmin) {
        throw new NotFoundException('Project not found.');
      }
    }

    // Unrelated users or removed members cannot view tasks
    if (!context.isFounder && !context.isMember && !context.isAdmin) {
      throw new ForbiddenException('You do not have access to view this project tasks and milestones.');
    }

    return context;
  }

  async assertCanManage(
    projectId: string,
    userId: string,
    userRole?: string,
  ): Promise<ProjectAccessContext> {
    const context = await this.assertCanView(projectId, userId, userRole);

    if (!context.isFounder && !context.isAdmin) {
      throw new ForbiddenException('Only the project founder or an administrator can perform this action.');
    }

    return context;
  }

  async assertCanUpdateTask(
    projectId: string,
    taskAssigneeId: string | null,
    userId: string,
    userRole?: string,
    isStatusOnlyUpdate: boolean = false,
  ): Promise<ProjectAccessContext> {
    const context = await this.assertCanView(projectId, userId, userRole);

    if (context.isFounder || context.isAdmin) {
      return context;
    }

    if (context.isMember) {
      // Active members can update status, or update task details if assigned to them
      if (isStatusOnlyUpdate || taskAssigneeId === userId) {
        return context;
      }
    }

    throw new ForbiddenException('You do not have permission to update this task.');
  }

  async assertActiveMemberForAssignment(
    projectId: string,
    targetUserId: string,
  ): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        founderId: true,
        members: {
          where: { userId: targetUserId },
          select: { status: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const isFounder = project.founderId === targetUserId;
    const isActiveMember = project.members.some(
      (m) => m.status === ProjectMemberStatus.ACTIVE,
    );

    if (!isFounder && !isActiveMember) {
      throw new BadRequestException('Tasks can only be assigned to active project team members.');
    }
  }
}
