import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateProjectDto,
  DashboardProjectDto,
  DashboardProjectsResponseDto,
  ProjectDetailResponseDto,
  UpdateProjectDto,
} from './projects.dto';
import { ProjectModerationStatus, ProjectStatus, Role } from '@prisma/client';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

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
          { members: { some: { userId } } },
        ],
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
          userRole = memberRecord.role ? `${memberRecord.role} · Member` : 'Member';
        }
      }

      const hasFounderInMembers = p.members.some((m) => m.userId === p.founderId);
      const totalTeamCount = hasFounderInMembers ? p._count.members : p._count.members + 1;

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
        memberCount: totalTeamCount,
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
                  },
                },
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
      currentUserId && (isFounder || project.members.some((m) => m.userId === currentUserId)),
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

    const mappedMembers = project.members.map((m) => {
      const displayName =
        m.user.profile?.displayName ||
        `${m.user.profile?.firstName || ''} ${m.user.profile?.lastName || ''}`.trim() ||
        m.user.username;

      return {
        id: m.id,
        userId: m.userId,
        username: m.user.username,
        displayName,
        avatarUrl: m.user.profile?.avatarUrl || null,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
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
}
