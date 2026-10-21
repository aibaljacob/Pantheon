import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationType,
  ProjectMemberStatus,
  ProjectModerationStatus,
  ProjectRoleStatus,
  Role,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  AssignProjectMemberRolesDto,
  ProjectActiveTeamMemberDto,
  ProjectFormerTeamMemberDto,
  ProjectTeamResponseDto,
} from './projects.dto';

@Injectable()
export class ProjectMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private mapToActiveMemberDto(
    member: any,
    founderId: string,
    allRoles: any[] = [],
    acceptedApps: any[] = [],
    acceptedInvs: any[] = [],
  ): ProjectActiveTeamMemberDto {
    const profile = member.user?.profile;
    const displayName =
      profile?.displayName ||
      `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() ||
      member.user?.username ||
      'Member';

    const roleMap = new Map<string, any>();

    for (const r of member.assignedRoles || []) {
      if (r && r.id) {
        roleMap.set(r.id, {
          id: r.id,
          roleId: r.roleId,
          roleName: r.role?.name || 'Role',
          title: r.title || null,
          experienceLevel: r.experienceLevel,
          commitment: r.commitment,
          status: r.status,
        });
      }
    }

    if (member.projectRole && !roleMap.has(member.projectRole.id)) {
      roleMap.set(member.projectRole.id, {
        id: member.projectRole.id,
        roleId: member.projectRole.roleId,
        roleName: member.projectRole.role?.name || 'Role',
        title: member.projectRole.title || null,
        experienceLevel: member.projectRole.experienceLevel,
        commitment: member.projectRole.commitment,
        status: member.projectRole.status,
      });
    }

    for (const pr of allRoles) {
      if (!roleMap.has(pr.id)) {
        const isAssignedDirectly =
          pr.assignedMemberId === member.id ||
          pr.assignedMemberId === member.userId;
        const isFromAcceptedApp = acceptedApps.some(
          (app) =>
            app.applicantId === member.userId && app.projectRoleId === pr.id,
        );
        const isFromAcceptedInv = acceptedInvs.some(
          (inv) =>
            inv.inviteeId === member.userId && inv.projectRoleId === pr.id,
        );
        const isFilledWithMatchingTitle =
          pr.status === ProjectRoleStatus.FILLED &&
          !pr.assignedMemberId &&
          member.role &&
          member.role !== 'Member' &&
          member.role !== 'Founder' &&
          (pr.title?.toLowerCase() === member.role.toLowerCase() ||
            pr.role?.name?.toLowerCase() === member.role.toLowerCase());

        if (
          isAssignedDirectly ||
          isFromAcceptedApp ||
          isFromAcceptedInv ||
          isFilledWithMatchingTitle
        ) {
          roleMap.set(pr.id, {
            id: pr.id,
            roleId: pr.roleId,
            roleName: pr.role?.name || 'Role',
            title: pr.title || null,
            experienceLevel: pr.experienceLevel,
            commitment: pr.commitment,
            status: pr.status,
          });
        }
      }
    }

    const assignedRoles = Array.from(roleMap.values());
    const primaryRole = assignedRoles[0] || null;
    const isFounder = (member.user?.id || member.userId) === founderId;
    const roleTitle =
      primaryRole?.title ||
      primaryRole?.roleName ||
      (member.role && member.role !== 'Member'
        ? member.role
        : isFounder
          ? 'Founder'
          : 'Member');

    return {
      id: member.id,
      membershipId: member.id,
      userId: member.user?.id || member.userId,
      username: member.user?.username || '',
      displayName,
      avatarUrl: profile?.avatarUrl || null,
      headline: profile?.headline || null,
      role: roleTitle,
      isFounder,
      projectRoleId: primaryRole?.id || member.projectRoleId || null,
      projectRoleTitle: primaryRole?.title || member.projectRole?.title || null,
      projectRoleName:
        primaryRole?.roleName || member.projectRole?.role?.name || null,
      assignedRoles,
      joinedAt:
        member.joinedAt instanceof Date
          ? member.joinedAt.toISOString()
          : String(member.joinedAt),
    };
  }

  private mapToFormerMemberDto(
    member: any,
    founderId: string,
    allRoles: any[] = [],
    acceptedApps: any[] = [],
    acceptedInvs: any[] = [],
  ): ProjectFormerTeamMemberDto {
    const profile = member.user?.profile;
    const displayName =
      profile?.displayName ||
      `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() ||
      member.user?.username ||
      'Former Member';

    const roleMap = new Map<string, any>();

    for (const r of member.assignedRoles || []) {
      if (r && r.id) {
        roleMap.set(r.id, {
          id: r.id,
          roleId: r.roleId,
          roleName: r.role?.name || 'Role',
          title: r.title || null,
          experienceLevel: r.experienceLevel,
          commitment: r.commitment,
          status: r.status,
        });
      }
    }

    if (member.projectRole && !roleMap.has(member.projectRole.id)) {
      roleMap.set(member.projectRole.id, {
        id: member.projectRole.id,
        roleId: member.projectRole.roleId,
        roleName: member.projectRole.role?.name || 'Role',
        title: member.projectRole.title || null,
        experienceLevel: member.projectRole.experienceLevel,
        commitment: member.projectRole.commitment,
        status: member.projectRole.status,
      });
    }

    for (const pr of allRoles) {
      if (!roleMap.has(pr.id)) {
        const isAssignedDirectly =
          pr.assignedMemberId === member.id ||
          pr.assignedMemberId === member.userId;
        const isFromAcceptedApp = acceptedApps.some(
          (app) =>
            app.applicantId === member.userId && app.projectRoleId === pr.id,
        );
        const isFromAcceptedInv = acceptedInvs.some(
          (inv) =>
            inv.inviteeId === member.userId && inv.projectRoleId === pr.id,
        );

        if (isAssignedDirectly || isFromAcceptedApp || isFromAcceptedInv) {
          roleMap.set(pr.id, {
            id: pr.id,
            roleId: pr.roleId,
            roleName: pr.role?.name || 'Role',
            title: pr.title || null,
            experienceLevel: pr.experienceLevel,
            commitment: pr.commitment,
            status: pr.status,
          });
        }
      }
    }

    const assignedRoles = Array.from(roleMap.values());
    const primaryRole = assignedRoles[0] || null;
    const isFounder = (member.user?.id || member.userId) === founderId;
    const roleTitle =
      primaryRole?.title ||
      primaryRole?.roleName ||
      (member.role && member.role !== 'Member'
        ? member.role
        : isFounder
          ? 'Founder'
          : 'Member');

    return {
      id: member.id,
      membershipId: member.id,
      userId: member.user?.id || member.userId || null,
      username: member.user?.username || 'deleted_user',
      displayName,
      avatarUrl: profile?.avatarUrl || null,
      headline: profile?.headline || null,
      role: roleTitle,
      isFounder,
      projectRoleId: primaryRole?.id || member.projectRoleId || null,
      projectRoleTitle: primaryRole?.title || member.projectRole?.title || null,
      projectRoleName:
        primaryRole?.roleName || member.projectRole?.role?.name || null,
      assignedRoles,
      status: member.status,
      joinedAt:
        member.joinedAt instanceof Date
          ? member.joinedAt.toISOString()
          : String(member.joinedAt),
      leftAt: member.leftAt
        ? member.leftAt instanceof Date
          ? member.leftAt.toISOString()
          : String(member.leftAt)
        : null,
    };
  }

  async getTeamMembers(
    projectId: string,
    currentUserId?: string,
    currentUserRole?: string,
  ): Promise<ProjectTeamResponseDto> {
    const project = await this.prisma.project.findFirst({
      where: {
        OR: [{ id: projectId }, { slug: projectId }],
      },
      select: {
        id: true,
        founderId: true,
        moderationStatus: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const [allMembers, allRoles, acceptedApps, acceptedInvs] =
      await Promise.all([
        this.prisma.projectMember.findMany({
          where: { projectId: project.id },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profile: {
                  select: {
                    displayName: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                    headline: true,
                  },
                },
              },
            },
            projectRole: {
              select: {
                id: true,
                roleId: true,
                title: true,
                experienceLevel: true,
                commitment: true,
                status: true,
                role: { select: { name: true } },
              },
            },
            assignedRoles: {
              select: {
                id: true,
                roleId: true,
                title: true,
                experienceLevel: true,
                commitment: true,
                status: true,
                role: { select: { name: true } },
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        }),
        this.prisma.projectRole.findMany({
          where: { projectId: project.id },
          select: {
            id: true,
            roleId: true,
            title: true,
            experienceLevel: true,
            commitment: true,
            status: true,
            assignedMemberId: true,
            role: { select: { name: true } },
          },
        }),
        this.prisma.projectApplication?.findMany
          ? this.prisma.projectApplication.findMany({
              where: { projectId: project.id, status: 'ACCEPTED' as any },
              select: { applicantId: true, projectRoleId: true },
            })
          : Promise.resolve([]),
        this.prisma.projectInvitation?.findMany
          ? this.prisma.projectInvitation.findMany({
              where: { projectId: project.id, status: 'ACCEPTED' as any },
              select: { inviteeId: true, projectRoleId: true },
            })
          : Promise.resolve([]),
      ]);

    const rawMembers =
      allMembers ||
      ((project as unknown as { members?: typeof allMembers }).members ?? []);

    const isFounder = Boolean(
      currentUserId && project.founderId === currentUserId,
    );
    const isMember = Boolean(
      currentUserId &&
      (isFounder ||
        rawMembers.some(
          (m) =>
            m.userId === currentUserId &&
            m.status === ProjectMemberStatus.ACTIVE,
        )),
    );
    const isAdmin = currentUserRole === Role.ADMINISTRATOR;

    if (project.moderationStatus !== ProjectModerationStatus.PUBLISHED) {
      if (!isFounder && !isMember && !isAdmin) {
        throw new NotFoundException('Project not found.');
      }
    }

    const activeMembers = rawMembers
      .filter((m) => m.status === ProjectMemberStatus.ACTIVE)
      .map((m) =>
        this.mapToActiveMemberDto(
          m,
          project.founderId,
          allRoles || [],
          acceptedApps || [],
          acceptedInvs || [],
        ),
      );

    const formerMembers = rawMembers
      .filter(
        (m) =>
          m.status === ProjectMemberStatus.LEFT ||
          m.status === ProjectMemberStatus.REMOVED,
      )
      .sort((a, b) => {
        const dateA = a.leftAt ? a.leftAt.getTime() : a.joinedAt.getTime();
        const dateB = b.leftAt ? b.leftAt.getTime() : b.joinedAt.getTime();
        return dateB - dateA;
      })
      .map((m) =>
        this.mapToFormerMemberDto(
          m,
          project.founderId,
          allRoles,
          acceptedApps,
          acceptedInvs,
        ),
      );

    // Opportunistically ensure DB relations are synced for matched roles
    for (const am of activeMembers) {
      for (const ar of am.assignedRoles) {
        const matchingRole = allRoles.find((r) => r.id === ar.id);
        if (matchingRole && matchingRole.assignedMemberId !== am.id) {
          this.prisma.projectRole
            .update({
              where: { id: matchingRole.id },
              data: {
                assignedMemberId: am.id,
                status: ProjectRoleStatus.FILLED,
              },
            })
            .catch(() => {});
        }
        const dbMember = allMembers.find((m) => m.id === am.id);
        if (dbMember && !dbMember.projectRoleId) {
          this.prisma.projectMember
            .update({
              where: { id: am.id },
              data: {
                projectRoleId: ar.id,
                role: ar.title || ar.roleName || am.role,
              },
            })
            .catch(() => {});
        }
      }
    }

    return {
      projectId: project.id,
      activeCount: activeMembers.length,
      activeMembers,
      formerMembers,
    };
  }

  async removeMember(
    projectId: string,
    memberId: string,
    founderId: string,
  ): Promise<ProjectFormerTeamMemberDto> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, founderId: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (project.founderId !== founderId) {
      throw new ForbiddenException(
        'You do not have permission to manage this team.',
      );
    }

    const targetMember = await this.prisma.projectMember.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        userId: true,
        projectId: true,
        projectRoleId: true,
        status: true,
      },
    });

    if (!targetMember || targetMember.projectId !== projectId) {
      throw new NotFoundException('Team member not found in this project.');
    }

    if (targetMember.userId === project.founderId) {
      throw new BadRequestException('The project founder cannot be removed.');
    }

    if (targetMember.status !== ProjectMemberStatus.ACTIVE) {
      throw new BadRequestException('This member is no longer active.');
    }

    const roleConditions: any[] = [{ assignedMemberId: targetMember.id }];
    if (targetMember.projectRoleId) {
      roleConditions.push({ id: targetMember.projectRoleId });
    }

    await this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.projectMember.updateMany({
        where: {
          id: memberId,
          projectId,
          status: ProjectMemberStatus.ACTIVE,
        },
        data: {
          status: ProjectMemberStatus.REMOVED,
          leftAt: new Date(),
          projectRoleId: null,
        },
      });

      if (updateResult.count === 0) {
        throw new BadRequestException('This member is no longer active.');
      }

      // Free all occupied roles
      await tx.projectRole.updateMany({
        where: {
          projectId,
          OR: roleConditions,
        },
        data: {
          assignedMemberId: null,
          status: ProjectRoleStatus.OPEN,
        },
      });

      // Unassign any tasks assigned to this removed member
      await tx.task.updateMany({
        where: {
          projectId,
          assigneeId: targetMember.userId,
        },
        data: {
          assigneeId: null,
        },
      });
    });

    const updated = await this.prisma.projectMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                headline: true,
              },
            },
          },
        },
        projectRole: {
          include: {
            role: true,
          },
        },
        assignedRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (targetMember.userId) {
      try {
        await this.notificationsService.createNotification({
          userId: targetMember.userId,
          type: NotificationType.REMOVED_FROM_PROJECT,
          title: 'Removed from Project',
          message: `You have been removed from the project "${project.name}".`,
          entityType: 'PROJECT',
          entityId: projectId,
        });
      } catch (notifErr) {
        // Log warning, notification failure must not rollback member removal
        console.warn('Failed to create member removal notification:', notifErr);
      }
    }

    return this.mapToFormerMemberDto(updated, project.founderId);
  }

  async leaveProject(
    projectId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, founderId: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (project.founderId === userId) {
      throw new BadRequestException(
        'The project founder cannot leave the project.',
      );
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
      select: {
        id: true,
        userId: true,
        projectId: true,
        projectRoleId: true,
        status: true,
      },
    });

    if (!membership || membership.status !== ProjectMemberStatus.ACTIVE) {
      throw new BadRequestException(
        'You are not an active member of this project.',
      );
    }

    const roleConditions: any[] = [{ assignedMemberId: membership.id }];
    if (membership.projectRoleId) {
      roleConditions.push({ id: membership.projectRoleId });
    }

    await this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.projectMember.updateMany({
        where: {
          id: membership.id,
          projectId,
          status: ProjectMemberStatus.ACTIVE,
        },
        data: {
          status: ProjectMemberStatus.LEFT,
          leftAt: new Date(),
          projectRoleId: null,
        },
      });

      if (updateResult.count === 0) {
        throw new BadRequestException(
          'You are not an active member of this project.',
        );
      }

      // Reopen any occupied roles
      await tx.projectRole.updateMany({
        where: {
          projectId,
          OR: roleConditions,
        },
        data: {
          assignedMemberId: null,
          status: ProjectRoleStatus.OPEN,
        },
      });

      // Unassign any tasks assigned to this departing member
      await tx.task.updateMany({
        where: {
          projectId,
          assigneeId: membership.userId,
        },
        data: {
          assigneeId: null,
        },
      });
    });

    return {
      success: true,
      message:
        'You have left the project. Historical membership has been preserved.',
    };
  }

  async assignMemberRoles(
    projectId: string,
    memberId: string,
    founderId: string,
    dto: AssignProjectMemberRolesDto,
  ): Promise<ProjectActiveTeamMemberDto> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, founderId: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (project.founderId !== founderId) {
      throw new ForbiddenException(
        'You do not have permission to manage this team.',
      );
    }

    const targetMember = await this.prisma.projectMember.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        userId: true,
        projectId: true,
        role: true,
        projectRoleId: true,
        status: true,
      },
    });

    if (!targetMember || targetMember.projectId !== projectId) {
      throw new NotFoundException('Team member not found in this project.');
    }

    if (targetMember.status !== ProjectMemberStatus.ACTIVE) {
      throw new BadRequestException('This member is no longer active.');
    }

    // Determine target role IDs from DTO
    let targetRoleIds: string[] = [];
    if (dto.roleIds && Array.isArray(dto.roleIds)) {
      targetRoleIds = dto.roleIds.filter(Boolean);
    } else if (dto.projectRoleId !== undefined) {
      targetRoleIds = dto.projectRoleId ? [dto.projectRoleId] : [];
    }

    let primaryRoleTitle = 'Member';
    const primaryRoleId = targetRoleIds[0] || null;

    // Verify all requested role IDs belong to the project and are not closed
    if (targetRoleIds.length > 0) {
      const validRoles = await this.prisma.projectRole.findMany({
        where: {
          id: { in: targetRoleIds },
          projectId,
        },
        include: { role: true },
      });

      if (validRoles.length !== targetRoleIds.length) {
        throw new BadRequestException(
          'One or more selected project roles are not found in this project.',
        );
      }

      for (const r of validRoles) {
        if (r.status === ProjectRoleStatus.CLOSED) {
          throw new BadRequestException(
            `Role "${r.title || 'Selected role'}" is closed.`,
          );
        }
      }

      if (primaryRoleId) {
        const primaryRole = validRoles.find((r) => r.id === primaryRoleId);
        if (primaryRole) {
          primaryRoleTitle =
            primaryRole.title || primaryRole.role?.name || 'Member';
        }
      }
    }

    // Find currently assigned roles outside the transaction
    const currentlyAssignedRoles = await this.prisma.projectRole.findMany({
      where: {
        projectId,
        OR: [
          { assignedMemberId: memberId },
          { id: targetMember.projectRoleId || undefined },
        ],
      },
      select: { id: true },
    });

    const rolesToUnassignIds = currentlyAssignedRoles
      .filter((r) => !targetRoleIds.includes(r.id))
      .map((r) => r.id);

    await this.prisma.$transaction(async (tx) => {
      // 1. Atomic compare-and-swap on active member status
      const updateResult = await tx.projectMember.updateMany({
        where: {
          id: memberId,
          projectId,
          status: ProjectMemberStatus.ACTIVE,
        },
        data: {
          projectRoleId: primaryRoleId,
          role: primaryRoleTitle,
        },
      });

      if (updateResult.count === 0) {
        throw new BadRequestException('This member is no longer active.');
      }

      // 2. Unassign roles that are no longer in targetRoleIds
      if (rolesToUnassignIds.length > 0) {
        await tx.projectRole.updateMany({
          where: {
            id: { in: rolesToUnassignIds },
            projectId,
          },
          data: {
            assignedMemberId: null,
            status: ProjectRoleStatus.OPEN,
          },
        });
      }

      // 3. Assign target roles to this member
      if (targetRoleIds.length > 0) {
        await tx.projectRole.updateMany({
          where: {
            id: { in: targetRoleIds },
            projectId,
          },
          data: {
            assignedMemberId: memberId,
            status: ProjectRoleStatus.FILLED,
          },
        });
      }
    });

    // Enriched read outside transaction
    const updated = await this.prisma.projectMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                headline: true,
              },
            },
          },
        },
        projectRole: {
          include: {
            role: true,
          },
        },
        assignedRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (targetMember.userId) {
      try {
        await this.notificationsService.createNotification({
          userId: targetMember.userId,
          type: NotificationType.PROJECT_ROLE_CHANGED,
          title: 'Project Role Updated',
          message: `Your role in "${project.name}" has been updated to "${primaryRoleTitle}".`,
          entityType: 'PROJECT',
          entityId: projectId,
        });
      } catch (notifErr) {
        console.warn('Failed to create role update notification:', notifErr);
      }
    }

    return this.mapToActiveMemberDto(updated, project.founderId);
  }

  async assignRoleToUser(
    projectId: string,
    projectRoleId: string,
    targetUserId: string,
    founderId: string,
  ): Promise<ProjectActiveTeamMemberDto> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, founderId: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (project.founderId !== founderId) {
      throw new ForbiddenException(
        'You do not have permission to manage this team.',
      );
    }

    const projectRole = await this.prisma.projectRole.findUnique({
      where: { id: projectRoleId },
      include: { role: true },
    });

    if (!projectRole || projectRole.projectId !== projectId) {
      throw new NotFoundException('Project role not found in this project.');
    }

    if (projectRole.status === ProjectRoleStatus.CLOSED) {
      throw new BadRequestException('This project role is closed.');
    }

    const roleTitle = projectRole.title || projectRole.role.name || 'Member';

    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: targetUserId },
      },
      select: {
        id: true,
        userId: true,
        role: true,
        projectRoleId: true,
        status: true,
      },
    });

    let assignedMemberId: string;

    await this.prisma.$transaction(async (tx) => {
      let member: { id: string };
      if (!existingMember) {
        member = await tx.projectMember.create({
          data: {
            projectId,
            userId: targetUserId,
            role: roleTitle,
            projectRoleId,
            status: ProjectMemberStatus.ACTIVE,
          },
        });
      } else if (existingMember.status !== ProjectMemberStatus.ACTIVE) {
        member = await tx.projectMember.update({
          where: { id: existingMember.id },
          data: {
            status: ProjectMemberStatus.ACTIVE,
            leftAt: null,
            joinedAt: new Date(),
            role: roleTitle,
            projectRoleId: existingMember.projectRoleId || projectRoleId,
          },
        });
      } else {
        member = await tx.projectMember.update({
          where: { id: existingMember.id },
          data: {
            projectRoleId: existingMember.projectRoleId || projectRoleId,
            role:
              existingMember.role === 'Member'
                ? roleTitle
                : existingMember.role,
          },
        });
      }

      assignedMemberId = member.id;

      // Assign the role to this member
      await tx.projectRole.update({
        where: { id: projectRoleId },
        data: {
          assignedMemberId: member.id,
          status: ProjectRoleStatus.FILLED,
        },
      });
    });

    const updated = await this.prisma.projectMember.findUnique({
      where: { id: assignedMemberId! },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                headline: true,
              },
            },
          },
        },
        projectRole: {
          include: {
            role: true,
          },
        },
        assignedRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    try {
      await this.notificationsService.createNotification({
        userId: targetUserId,
        type: NotificationType.PROJECT_ROLE_CHANGED,
        title: 'Assigned to Project Role',
        message: `You have been assigned to role "${roleTitle}" in "${project.name}".`,
        entityType: 'PROJECT',
        entityId: projectId,
      });
    } catch (notifErr) {
      console.warn('Failed to create role assignment notification:', notifErr);
    }

    return this.mapToActiveMemberDto(updated, project.founderId);
  }

  // Alias for backward compatibility
  async changeProjectRole(
    projectId: string,
    memberId: string,
    founderId: string,
    newProjectRoleId: string | null,
  ): Promise<ProjectActiveTeamMemberDto> {
    return this.assignMemberRoles(projectId, memberId, founderId, {
      projectRoleId: newProjectRoleId,
    });
  }
}
