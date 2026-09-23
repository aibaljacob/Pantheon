import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AiRoleRecommendationsResponseDto,
  CreateProjectDto,
  CreateProjectRoleDto,
  DashboardProjectDto,
  DashboardProjectsResponseDto,
  ProjectDetailResponseDto,
  ProjectRoleResponseDto,
  UpdateProjectDto,
  UpdateProjectRoleDto,
} from './projects.dto';
import {
  ProjectMemberStatus,
  ProjectModerationStatus,
  ProjectRoleCommitment,
  ProjectRoleExperienceLevel,
  ProjectRoleStatus,
  ProjectStatus,
  Role,
} from '@prisma/client';
import { AiRecommendationService } from '../ai/ai-recommendation.service';
import { TalentMatchingService } from './talent-matching.service';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiRecommendationService,
    private readonly talentMatchingService: TalentMatchingService,
  ) {}

  private generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    return baseSlug || 'project';
  }

  async createProject(userId: string, dto: CreateProjectDto): Promise<DashboardProjectDto> {
    if (dto.genre?.trim()) {
      const genreExists = await this.prisma.genre.findFirst({
        where: { name: dto.genre.trim(), isActive: true },
      });
      if (!genreExists) {
        throw new BadRequestException(`Unrecognized genre taxonomy value: "${dto.genre}"`);
      }
    }

    if (dto.platform?.trim()) {
      const platformExists = await this.prisma.platform.findFirst({
        where: { name: dto.platform.trim(), isActive: true },
      });
      if (!platformExists) {
        throw new BadRequestException(`Unrecognized platform taxonomy value: "${dto.platform}"`);
      }
    }

    if (dto.gameEngine?.trim()) {
      const engineExists = await this.prisma.gameEngine.findFirst({
        where: { name: dto.gameEngine.trim(), isActive: true },
      });
      if (!engineExists) {
        throw new BadRequestException(`Unrecognized game engine taxonomy value: "${dto.gameEngine}"`);
      }
    }

    let slug = this.generateSlug(dto.name);

    // Check slug collision
    const existing = await this.prisma.project.findUnique({ where: { slug } });
    if (existing) {
      const suffix = Math.floor(1000 + Math.random() * 9000);
      slug = `${slug}-${suffix}`;
    }

    const createdProject = await this.prisma.project.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description.trim(),
        coverUrl: dto.coverUrl?.trim() || null,
        status: dto.status || ProjectStatus.IN_DEVELOPMENT,
        moderationStatus: ProjectModerationStatus.PENDING_REVIEW,
        genre: dto.genre?.trim() || null,
        platform: dto.platform?.trim() || null,
        gameEngine: dto.gameEngine?.trim() || null,
        founderId: userId,
        members: {
          create: {
            userId,
            role: 'Founder',
          },
        },
      },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return {
      id: createdProject.id,
      name: createdProject.name,
      slug: createdProject.slug,
      description: createdProject.description,
      coverUrl: createdProject.coverUrl,
      status: createdProject.status,
      moderationStatus: createdProject.moderationStatus,
      genre: createdProject.genre,
      platform: createdProject.platform,
      gameEngine: createdProject.gameEngine,
      memberCount: createdProject._count.members,
      userRole: 'Founder',
      isFounder: true,
      updatedAt: createdProject.updatedAt.toISOString(),
    };
  }

  async getUserDashboardProjects(userId: string): Promise<DashboardProjectsResponseDto> {
    // Retrieve projects where current user is founder OR active member
    const projects = await this.prisma.project.findMany({
      where: {
        OR: [
          { founderId: userId },
          { members: { some: { userId, status: ProjectMemberStatus.ACTIVE } } },
        ],
      },
      include: {
        members: {
          where: { status: ProjectMemberStatus.ACTIVE },
          select: {
            userId: true,
            role: true,
            status: true,
            projectRole: {
              include: {
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const mappedProjects: DashboardProjectDto[] = projects.map((p) => {
      const isFounder = p.founderId === userId;
      let userRole = 'Member';

      if (isFounder) {
        userRole = 'Founder';
      } else {
        const memberRecord = p.members.find((m) => m.userId === userId);
        if (memberRecord) {
          const roleTitle = memberRecord.projectRole?.title || memberRecord.projectRole?.role?.name || memberRecord.role;
          userRole = roleTitle ? `${roleTitle} · Member` : 'Member';
        }
      }

      const activeMemberCount = p.members.length;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        coverUrl: p.coverUrl,
        status: p.status,
        moderationStatus: p.moderationStatus,
        genre: p.genre,
        platform: p.platform,
        gameEngine: p.gameEngine,
        memberCount: activeMemberCount,
        userRole,
        isFounder,
        updatedAt: p.updatedAt.toISOString(),
      };
    });

    return {
      projects: mappedProjects,
    };
  }

  async getPublicProjects(search?: string): Promise<DashboardProjectsResponseDto> {
    // Database-level filter: ONLY return PUBLISHED projects
    const where: any = {
      moderationStatus: ProjectModerationStatus.PUBLISHED,
    };

    if (search && search.trim()) {
      const s = search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { genre: { contains: s, mode: 'insensitive' } },
        { gameEngine: { contains: s, mode: 'insensitive' } },
      ];
    }

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        members: {
          select: {
            userId: true,
            role: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const mappedProjects: DashboardProjectDto[] = projects.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      coverUrl: p.coverUrl,
      status: p.status,
      moderationStatus: p.moderationStatus,
      genre: p.genre,
      platform: p.platform,
      gameEngine: p.gameEngine,
      memberCount: p._count.members,
      userRole: 'Project',
      isFounder: false,
      updatedAt: p.updatedAt.toISOString(),
    }));

    return {
      projects: mappedProjects,
    };
  }

  async getProjectDetails(
    idOrSlug: string,
    currentUserId?: string,
    currentUserRole?: string,
  ): Promise<ProjectDetailResponseDto> {
    const project = await this.prisma.project.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        founder: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        members: {
          where: { status: ProjectMemberStatus.ACTIVE },
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
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const isFounder = Boolean(currentUserId && project.founderId === currentUserId);
    const isMember = Boolean(
      currentUserId &&
        (isFounder ||
          project.members.some(
            (m) => m.userId === currentUserId && m.status === ProjectMemberStatus.ACTIVE,
          )),
    );
    const isAdmin = currentUserRole === Role.ADMINISTRATOR;

    // Authorization rule: Non-published projects are only visible to Founder, Members, or Admins.
    if (project.moderationStatus !== ProjectModerationStatus.PUBLISHED) {
      if (!isFounder && !isMember && !isAdmin) {
        throw new NotFoundException('Project not found.');
      }
    }

    const founderDisplayName =
      project.founder.profile?.displayName ||
      `${project.founder.profile?.firstName || ''} ${project.founder.profile?.lastName || ''}`.trim() ||
      project.founder.username;

    const [allProjectRoles, acceptedApps, acceptedInvs] = await Promise.all([
      this.prisma.projectRole.findMany({
        where: { projectId: project.id },
        include: { role: true },
      }),
      this.prisma.projectApplication.findMany({
        where: { projectId: project.id, status: 'ACCEPTED' as any },
        select: { applicantId: true, projectRoleId: true },
      }),
      this.prisma.projectInvitation.findMany({
        where: { projectId: project.id, status: 'ACCEPTED' as any },
        select: { inviteeId: true, projectRoleId: true },
      }),
    ]);

    const mappedMembers = project.members.map((m) => {
      const displayName =
        m.user.profile?.displayName ||
        `${m.user.profile?.firstName || ''} ${m.user.profile?.lastName || ''}`.trim() ||
        m.user.username;

      const roleMap = new Map<string, any>();
      for (const r of m.assignedRoles || []) {
        if (r && r.id) roleMap.set(r.id, r);
      }
      if (m.projectRole && !roleMap.has(m.projectRole.id)) {
        roleMap.set(m.projectRole.id, m.projectRole);
      }
      for (const pr of allProjectRoles) {
        if (!roleMap.has(pr.id)) {
          const isDirect = pr.assignedMemberId === m.id || pr.assignedMemberId === m.userId;
          const isApp = acceptedApps.some((a) => a.applicantId === m.userId && a.projectRoleId === pr.id);
          const isInv = acceptedInvs.some((i) => i.inviteeId === m.userId && i.projectRoleId === pr.id);
          const isTitle =
            pr.status === ProjectRoleStatus.FILLED &&
            !pr.assignedMemberId &&
            m.role &&
            m.role !== 'Member' &&
            m.role !== 'Founder' &&
            (pr.title?.toLowerCase() === m.role.toLowerCase() ||
              pr.role?.name?.toLowerCase() === m.role.toLowerCase());
          if (isDirect || isApp || isInv || isTitle) {
            roleMap.set(pr.id, pr);
          }
        }
      }

      const assignedRolesList = Array.from(roleMap.values());
      const primaryRole = assignedRolesList[0] || null;
      const isFounderMember = m.userId === project.founderId;
      const primaryRoleTitle =
        primaryRole?.title ||
        primaryRole?.role?.name ||
        (m.role && m.role !== 'Member' ? m.role : isFounderMember ? 'Founder' : 'Member');

      return {
        id: m.id,
        userId: m.userId,
        username: m.user.username,
        displayName,
        avatarUrl: m.user.profile?.avatarUrl || null,
        headline: m.user.profile?.headline || null,
        role: primaryRoleTitle,
        projectRoleId: primaryRole?.id || m.projectRoleId || null,
        projectRoleTitle: primaryRole?.title || m.projectRole?.title || null,
        projectRoleName: primaryRole?.role?.name || m.projectRole?.role?.name || null,
        status: m.status,
        joinedAt: m.joinedAt.toISOString(),
        leftAt: m.leftAt ? m.leftAt.toISOString() : null,
      };
    });

    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      coverUrl: project.coverUrl,
      status: project.status,
      moderationStatus: project.moderationStatus,
      genre: project.genre,
      platform: project.platform,
      gameEngine: project.gameEngine,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      founder: {
        id: project.founder.id,
        username: project.founder.username,
        displayName: founderDisplayName,
        avatarUrl: project.founder.profile?.avatarUrl || null,
      },
      members: mappedMembers,
      memberCount: project.members.length,
      isFounder,
      isMember,
    };
  }

  async updateProject(
    projectId: string,
    userId: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectDetailResponseDto> {
    const existing = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existing) {
      throw new NotFoundException('Project record not found.');
    }

    if (existing.founderId !== userId) {
      throw new ForbiddenException('Only the project founder can edit project details.');
    }

    // Taxonomy validations if updated
    if (dto.genre?.trim()) {
      const genreExists = await this.prisma.genre.findFirst({
        where: { name: dto.genre.trim(), isActive: true },
      });
      if (!genreExists) {
        throw new BadRequestException(`Unrecognized genre taxonomy value: "${dto.genre}"`);
      }
    }

    if (dto.platform?.trim()) {
      const platformExists = await this.prisma.platform.findFirst({
        where: { name: dto.platform.trim(), isActive: true },
      });
      if (!platformExists) {
        throw new BadRequestException(`Unrecognized platform taxonomy value: "${dto.platform}"`);
      }
    }

    if (dto.gameEngine?.trim()) {
      const engineExists = await this.prisma.gameEngine.findFirst({
        where: { name: dto.gameEngine.trim(), isActive: true },
      });
      if (!engineExists) {
        throw new BadRequestException(`Unrecognized game engine taxonomy value: "${dto.gameEngine}"`);
      }
    }

    let slug = existing.slug;
    if (dto.name && dto.name.trim() !== existing.name) {
      slug = this.generateSlug(dto.name);
      const slugCollision = await this.prisma.project.findFirst({
        where: {
          slug,
          NOT: { id: projectId },
        },
      });
      if (slugCollision) {
        const suffix = Math.floor(1000 + Math.random() * 9000);
        slug = `${slug}-${suffix}`;
      }
    }

    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...(dto.name && { name: dto.name.trim(), slug }),
        ...(dto.description && { description: dto.description.trim() }),
        ...(dto.coverUrl !== undefined && { coverUrl: dto.coverUrl?.trim() || null }),
        ...(dto.status && { status: dto.status }),
        ...(dto.genre !== undefined && { genre: dto.genre?.trim() || null }),
        ...(dto.platform !== undefined && { platform: dto.platform?.trim() || null }),
        ...(dto.gameEngine !== undefined && { gameEngine: dto.gameEngine?.trim() || null }),
      },
    });

    return this.getProjectDetails(projectId, userId);
  }

  async createProjectRole(
    projectId: string,
    userId: string,
    dto: CreateProjectRoleDto,
  ): Promise<ProjectRoleResponseDto> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (project.founderId !== userId) {
      throw new ForbiddenException('Only the project founder can manage open roles.');
    }

    // Validate ProfessionalRole taxonomy ID
    const professionalRole = await this.prisma.professionalRole.findFirst({
      where: { id: dto.roleId, isActive: true },
    });
    if (!professionalRole) {
      throw new BadRequestException(`Unrecognized or inactive ProfessionalRole ID: "${dto.roleId}"`);
    }

    // Validate Skill IDs if provided
    const uniqueSkillIds = Array.from(new Set(dto.skillIds || []));
    if (uniqueSkillIds.length > 0) {
      const skillsCount = await this.prisma.skill.count({
        where: { id: { in: uniqueSkillIds }, isActive: true },
      });
      if (skillsCount !== uniqueSkillIds.length) {
        throw new BadRequestException('One or more skill IDs are invalid or inactive taxonomy entries.');
      }
    }

    // Validate Tool IDs if provided
    const uniqueToolIds = Array.from(new Set(dto.toolIds || []));
    if (uniqueToolIds.length > 0) {
      const toolsCount = await this.prisma.tool.count({
        where: { id: { in: uniqueToolIds }, isActive: true },
      });
      if (toolsCount !== uniqueToolIds.length) {
        throw new BadRequestException('One or more tool IDs are invalid or inactive taxonomy entries.');
      }
    }

    // Transaction-backed creation with 15s timeout
    const createdRole = await this.prisma.$transaction(
      async (tx) => {
        const roleRecord = await tx.projectRole.create({
          data: {
            projectId,
            roleId: dto.roleId,
            title: dto.title?.trim() || null,
            description: dto.description?.trim() || null,
            experienceLevel:
              dto.experienceLevel || ProjectRoleExperienceLevel.MID,
            commitment: dto.commitment || ProjectRoleCommitment.PART_TIME,
            status: dto.status || ProjectRoleStatus.OPEN,
            requiredSkills: {
              create: uniqueSkillIds.map((skillId) => ({ skillId })),
            },
            requiredTools: {
              create: uniqueToolIds.map((toolId) => ({ toolId })),
            },
          },
          include: {
            role: true,
            requiredSkills: { include: { skill: true } },
            requiredTools: { include: { tool: true } },
          },
        });

        return roleRecord;
      },
      { timeout: 15000 },
    );

    // Sync saved AI recommendations to remove the created role if it was recommended
    if ((project as any).savedAiRecommendations && Array.isArray((project as any).savedAiRecommendations)) {
      const remaining = ((project as any).savedAiRecommendations as any[]).filter(
        (r) => r.roleId !== dto.roleId && r.roleName !== professionalRole.name,
      );
      await (this.prisma.project as any)
        .update({
          where: { id: projectId },
          data: { savedAiRecommendations: remaining },
        })
        .catch(() => {});
    }

    return this.mapProjectRoleToDto(createdRole);
  }

  async getProjectRoles(
    projectId: string,
    currentUserId?: string,
    currentUserRole?: string,
  ): Promise<ProjectRoleResponseDto[]> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { select: { userId: true } },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const isFounder = Boolean(currentUserId && project.founderId === currentUserId);
    const isMember = Boolean(
      currentUserId && (isFounder || project.members.some((m) => m.userId === currentUserId)),
    );
    const isAdmin = currentUserRole === Role.ADMINISTRATOR;

    // Authorization rule matching project details
    if (project.moderationStatus !== ProjectModerationStatus.PUBLISHED) {
      if (!isFounder && !isMember && !isAdmin) {
        throw new NotFoundException('Project not found.');
      }
    }

    const [roles, allMembers, acceptedApps, acceptedInvs] = await Promise.all([
      this.prisma.projectRole.findMany({
        where: { projectId },
        include: {
          role: true,
          requiredSkills: { include: { skill: true } },
          requiredTools: { include: { tool: true } },
          assignedMember: {
            select: {
              id: true,
              userId: true,
              user: {
                select: {
                  username: true,
                  profile: {
                    select: {
                      displayName: true,
                    },
                  },
                },
              },
            },
          },
          primaryMembers: {
            where: { status: ProjectMemberStatus.ACTIVE },
            select: {
              id: true,
              userId: true,
              user: {
                select: {
                  username: true,
                  profile: {
                    select: {
                      displayName: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.projectMember.findMany({
        where: { projectId, status: ProjectMemberStatus.ACTIVE },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profile: { select: { displayName: true } },
            },
          },
        },
      }),
      this.prisma.projectApplication.findMany({
        where: { projectId, status: 'ACCEPTED' as any },
        select: { applicantId: true, projectRoleId: true },
      }),
      this.prisma.projectInvitation.findMany({
        where: { projectId, status: 'ACCEPTED' as any },
        select: { inviteeId: true, projectRoleId: true },
      }),
    ]);

    return roles.map((r) => this.mapProjectRoleToDto(r, allMembers, acceptedApps, acceptedInvs));
  }

  async updateProjectRole(
    projectId: string,
    roleId: string,
    userId: string,
    dto: UpdateProjectRoleDto,
  ): Promise<ProjectRoleResponseDto> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (project.founderId !== userId) {
      throw new ForbiddenException('Only the project founder can manage open roles.');
    }

    const existingRole = await this.prisma.projectRole.findFirst({
      where: { id: roleId, projectId },
    });

    if (!existingRole) {
      throw new NotFoundException('Project role record not found.');
    }

    if (dto.roleId) {
      const professionalRole = await this.prisma.professionalRole.findFirst({
        where: { id: dto.roleId, isActive: true },
      });
      if (!professionalRole) {
        throw new BadRequestException(`Unrecognized or inactive ProfessionalRole ID: "${dto.roleId}"`);
      }
    }

    let uniqueSkillIds: string[] | undefined;
    if (dto.skillIds !== undefined) {
      uniqueSkillIds = Array.from(new Set(dto.skillIds));
      if (uniqueSkillIds.length > 0) {
        const skillsCount = await this.prisma.skill.count({
          where: { id: { in: uniqueSkillIds }, isActive: true },
        });
        if (skillsCount !== uniqueSkillIds.length) {
          throw new BadRequestException('One or more skill IDs are invalid or inactive taxonomy entries.');
        }
      }
    }

    let uniqueToolIds: string[] | undefined;
    if (dto.toolIds !== undefined) {
      uniqueToolIds = Array.from(new Set(dto.toolIds));
      if (uniqueToolIds.length > 0) {
        const toolsCount = await this.prisma.tool.count({
          where: { id: { in: uniqueToolIds }, isActive: true },
        });
        if (toolsCount !== uniqueToolIds.length) {
          throw new BadRequestException('One or more tool IDs are invalid or inactive taxonomy entries.');
        }
      }
    }

    // Transaction-backed update with diffing on skill/tool junction tables
    const updatedRole = await this.prisma.$transaction(async (tx) => {
      if (uniqueSkillIds !== undefined) {
        await tx.projectRoleSkill.deleteMany({ where: { projectRoleId: roleId } });
        if (uniqueSkillIds.length > 0) {
          await tx.projectRoleSkill.createMany({
            data: uniqueSkillIds.map((skillId) => ({ projectRoleId: roleId, skillId })),
          });
        }
      }

      if (uniqueToolIds !== undefined) {
        await tx.projectRoleTool.deleteMany({ where: { projectRoleId: roleId } });
        if (uniqueToolIds.length > 0) {
          await tx.projectRoleTool.createMany({
            data: uniqueToolIds.map((toolId) => ({ projectRoleId: roleId, toolId })),
          });
        }
      }

      const roleRecord = await tx.projectRole.update({
        where: { id: roleId },
        data: {
          ...(dto.roleId && { roleId: dto.roleId }),
          ...(dto.title !== undefined && { title: dto.title?.trim() || null }),
          ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
          ...(dto.experienceLevel && { experienceLevel: dto.experienceLevel }),
          ...(dto.commitment && { commitment: dto.commitment }),
          ...(dto.status && { status: dto.status }),
        },
        include: {
          role: true,
          requiredSkills: { include: { skill: true } },
          requiredTools: { include: { tool: true } },
        },
      });

      return roleRecord;
    }, { timeout: 15000 });

    return this.mapProjectRoleToDto(updatedRole);
  }

  async deleteProjectRole(
    projectId: string,
    roleId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (project.founderId !== userId) {
      throw new ForbiddenException('Only the project founder can manage open roles.');
    }

    const existingRole = await this.prisma.projectRole.findFirst({
      where: { id: roleId, projectId },
    });

    if (!existingRole) {
      throw new NotFoundException('Project role record not found.');
    }

    await this.prisma.projectRole.delete({
      where: { id: roleId },
    });

    return { success: true };
  }

  private mapProjectRoleToDto(
    roleRecord: any,
    allMembers: any[] = [],
    acceptedApps: any[] = [],
    acceptedInvs: any[] = [],
  ): ProjectRoleResponseDto {
    let assignedMember =
      roleRecord.assignedMember || roleRecord.primaryMembers?.[0] || null;

    if (!assignedMember && roleRecord.status === ProjectRoleStatus.FILLED) {
      const matchedApp = acceptedApps.find((a) => a.projectRoleId === roleRecord.id);
      if (matchedApp) {
        assignedMember = allMembers.find((m) => m.userId === matchedApp.applicantId) || null;
      }
      if (!assignedMember) {
        const matchedInv = acceptedInvs.find((i) => i.projectRoleId === roleRecord.id);
        if (matchedInv) {
          assignedMember = allMembers.find((m) => m.userId === matchedInv.inviteeId) || null;
        }
      }
      if (!assignedMember) {
        assignedMember =
          allMembers.find(
            (m) =>
              m.role &&
              m.role !== 'Member' &&
              m.role !== 'Founder' &&
              (roleRecord.title?.toLowerCase() === m.role.toLowerCase() ||
                roleRecord.role?.name?.toLowerCase() === m.role.toLowerCase()),
          ) || null;
      }
    }

    const assignedMemberId = assignedMember ? assignedMember.id : (roleRecord.assignedMemberId || null);
    const assignedMemberName =
      assignedMember?.user?.profile?.displayName ||
      assignedMember?.user?.username ||
      null;

    return {
      id: roleRecord.id,
      projectId: roleRecord.projectId,
      roleId: roleRecord.roleId,
      roleName: roleRecord.role.name,
      title: roleRecord.title,
      description: roleRecord.description,
      experienceLevel: roleRecord.experienceLevel,
      commitment: roleRecord.commitment,
      status: roleRecord.status,
      assignedMemberId,
      assignedMemberName,
      createdAt: roleRecord.createdAt.toISOString(),
      updatedAt: roleRecord.updatedAt.toISOString(),
      requiredSkills: (roleRecord.requiredSkills || []).map((s: any) => ({
        id: s.skill.id,
        name: s.skill.name,
      })),
      requiredTools: (roleRecord.requiredTools || []).map((t: any) => ({
        id: t.tool.id,
        name: t.tool.name,
      })),
    };
  }

  async getAiRoleRecommendations(
    projectId: string,
    userId: string,
  ): Promise<AiRoleRecommendationsResponseDto> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (project.founderId !== userId) {
      throw new ForbiddenException(
        'Only the project founder can view AI role recommendations.',
      );
    }

    const saved = (project as any).savedAiRecommendations;
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return { recommendedRoles: saved };
    }

    // If no saved recommendations exist yet, run initial scan and persist
    return this.generateAiRoleRecommendations(projectId, userId);
  }

  async generateAiRoleRecommendations(
    projectId: string,
    userId: string,
  ): Promise<AiRoleRecommendationsResponseDto> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        openRoles: {
          include: { role: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (project.founderId !== userId) {
      throw new ForbiddenException(
        'Only the project founder can request AI role recommendations.',
      );
    }

    const [rolesTaxonomy, skillsTaxonomy, toolsTaxonomy] = await Promise.all([
      this.prisma.professionalRole.findMany({
        where: { isActive: true },
        select: { id: true, name: true, description: true },
      }),
      this.prisma.skill.findMany({
        where: { isActive: true },
        select: { id: true, name: true, description: true },
      }),
      this.prisma.tool.findMany({
        where: { isActive: true },
        select: { id: true, name: true, description: true },
      }),
    ]);

    const existingRoleNames = project.openRoles.map((r) => r.role.name);

    // AI execution
    const recommendedRoles = await this.aiService.generateRoleRecommendations(
      {
        name: project.name,
        description: project.description,
        genre: project.genre,
        platform: project.platform,
        gameEngine: project.gameEngine,
        status: project.status,
        existingRoleNames,
      },
      rolesTaxonomy,
      skillsTaxonomy,
      toolsTaxonomy,
    );

    // Concurrently match candidate developers for each recommended role specification
    const enhancedRecommendedRoles = await Promise.all(
      recommendedRoles.map(async (draft) => {
        try {
          const topCandidates = await this.talentMatchingService.getRankedCandidatesForRoleSpec(
            projectId,
            {
              roleId: draft.roleId,
              roleName: draft.roleName,
              experienceLevel: draft.experienceLevel,
              commitment: draft.commitment,
              requiredSkills: draft.requiredSkills || [],
              requiredTools: draft.requiredTools || [],
            },
            3,
          );
          return {
            ...draft,
            topCandidates,
          };
        } catch (matchErr) {
          this.logger.warn(`Failed to match candidates for role ${draft.roleName}:`, matchErr);
          return {
            ...draft,
            topCandidates: [],
          };
        }
      }),
    );

    // Persist saved recommendations to DB so they stay there whenever the project opens
    try {
      await (this.prisma.project as any).update({
        where: { id: projectId },
        data: {
          savedAiRecommendations: enhancedRecommendedRoles,
        },
      });
    } catch (saveErr) {
      this.logger.warn(`Failed to persist AI role recommendations for project ${projectId}:`, saveErr);
    }

    return { recommendedRoles: enhancedRecommendedRoles };
  }
}
