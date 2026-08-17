import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AdminActivityItemDto,
  AdminDashboardMetricsDto,
  AdminPaginatedProjectsResponseDto,
  AdminPaginatedTaxonomyResponseDto,
  AdminPaginatedUsersResponseDto,
  AdminProjectDetailDto,
  AdminProjectItemDto,
  AdminTaxonomyItemDto,
  AdminUserItemDto,
  AdminProjectsQueryDto,
  AdminTaxonomyQueryDto,
  AdminUsersQueryDto,
  CreateTaxonomyEntryDto,
  UpdateTaxonomyEntryDto,
} from './admin.dto';
import { ProjectModerationStatus, ProjectStatus, Role } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  // 1. DASHBOARD METRICS
  async getDashboardMetrics(): Promise<AdminDashboardMetricsDto> {
    const totalUsers = await this.prisma.user.count();
    const activeVerifiedUsers = await this.prisma.user.count({
      where: { emailVerified: true },
    });
    const totalProjects = await this.prisma.project.count();
    const activeProjects = await this.prisma.project.count({
      where: {
        status: {
          in: [
            ProjectStatus.IN_DEVELOPMENT,
            ProjectStatus.PROTOTYPE,
            ProjectStatus.PLANNING,
            ProjectStatus.PRE_PRODUCTION,
            ProjectStatus.ALPHA,
            ProjectStatus.BETA,
          ],
        },
      },
    });

    const [
      rolesCount,
      specsCount,
      skillsCount,
      toolsCount,
      enginesCount,
      genresCount,
      platformsCount,
    ] = await Promise.all([
      this.prisma.professionalRole.count(),
      this.prisma.specialization.count(),
      this.prisma.skill.count(),
      this.prisma.tool.count(),
      this.prisma.gameEngine.count(),
      this.prisma.genre.count(),
      this.prisma.platform.count(),
    ]);

    const totalTaxonomyEntries =
      rolesCount +
      specsCount +
      skillsCount +
      toolsCount +
      enginesCount +
      genresCount +
      platformsCount;

    return {
      totalUsers,
      activeVerifiedUsers,
      totalProjects,
      activeProjects,
      totalTaxonomyEntries,
    };
  }

  // 2. USER MANAGEMENT
  async getPaginatedUsers(query: AdminUsersQueryDto): Promise<AdminPaginatedUsersResponseDto> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.role && (query.role === 'USER' || query.role === 'ADMINISTRATOR')) {
      where.role = query.role as Role;
    }

    if (query.emailVerified !== undefined && query.emailVerified !== '') {
      where.emailVerified = query.emailVerified === 'true';
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { username: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { profile: { firstName: { contains: s, mode: 'insensitive' } } },
        { profile: { lastName: { contains: s, mode: 'insensitive' } } },
        { profile: { displayName: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: true,
          _count: {
            select: {
              foundedProjects: true,
              projectMemberships: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const mappedUsers: AdminUserItemDto[] = users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      emailVerified: u.emailVerified,
      provider: u.provider,
      createdAt: u.createdAt.toISOString(),
      firstName: u.profile?.firstName,
      lastName: u.profile?.lastName,
      displayName: u.profile?.displayName,
      avatarUrl: u.profile?.avatarUrl,
      location: u.profile?.location,
      headline: u.profile?.headline,
      foundedProjectsCount: u._count.foundedProjects,
      joinedProjectsCount: u._count.projectMemberships,
    }));

    return {
      users: mappedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getUserAdminDetails(userId: string): Promise<AdminUserItemDto> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        _count: {
          select: {
            foundedProjects: true,
            projectMemberships: true,
          },
        },
      },
    });

    if (!u) {
      throw new NotFoundException('User record not found.');
    }

    return {
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      emailVerified: u.emailVerified,
      provider: u.provider,
      createdAt: u.createdAt.toISOString(),
      firstName: u.profile?.firstName,
      lastName: u.profile?.lastName,
      displayName: u.profile?.displayName,
      avatarUrl: u.profile?.avatarUrl,
      location: u.profile?.location,
      headline: u.profile?.headline,
      foundedProjectsCount: u._count.foundedProjects,
      joinedProjectsCount: u._count.projectMemberships,
    };
  }

  // 3. PROJECT MANAGEMENT
  async getPaginatedProjects(query: AdminProjectsQueryDto): Promise<AdminPaginatedProjectsResponseDto> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status && Object.values(ProjectStatus).includes(query.status as ProjectStatus)) {
      where.status = query.status as ProjectStatus;
    }

    if (query.moderationStatus && Object.values(ProjectModerationStatus).includes(query.moderationStatus as ProjectModerationStatus)) {
      where.moderationStatus = query.moderationStatus as ProjectModerationStatus;
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { genre: { contains: s, mode: 'insensitive' } },
        { platform: { contains: s, mode: 'insensitive' } },
        { gameEngine: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          founder: {
            select: {
              username: true,
              email: true,
              profile: {
                select: {
                  displayName: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    const mappedProjects: AdminProjectItemDto[] = projects.map((p) => {
      const founderDisplayName =
        p.founder.profile?.displayName ||
        `${p.founder.profile?.firstName || ''} ${p.founder.profile?.lastName || ''}`.trim() ||
        p.founder.username;

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
        founderId: p.founderId,
        founderUsername: p.founder.username,
        founderDisplayName,
        founderEmail: p.founder.email,
        memberCount: p._count.members,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    });

    return {
      projects: mappedProjects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getProjectAdminDetails(projectId: string): Promise<AdminProjectDetailDto> {
    const p = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        founder: {
          select: {
            username: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        members: {
          include: {
            user: {
              select: {
                username: true,
                email: true,
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

    if (!p) {
      throw new NotFoundException('Project record not found.');
    }

    const founderDisplayName =
      p.founder.profile?.displayName ||
      `${p.founder.profile?.firstName || ''} ${p.founder.profile?.lastName || ''}`.trim() ||
      p.founder.username;

    const membersMapped = p.members.map((m) => {
      const mDisplayName =
        m.user.profile?.displayName ||
        `${m.user.profile?.firstName || ''} ${m.user.profile?.lastName || ''}`.trim() ||
        m.user.username;

      return {
        id: m.id,
        userId: m.userId,
        username: m.user.username,
        displayName: mDisplayName,
        email: m.user.email,
        avatarUrl: m.user.profile?.avatarUrl,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
      };
    });

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
      founderId: p.founderId,
      founderUsername: p.founder.username,
      founderDisplayName,
      founderEmail: p.founder.email,
      memberCount: p.members.length,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      members: membersMapped,
    };
  }

  async approveProject(projectId: string): Promise<AdminProjectDetailDto> {
    const existing = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!existing) {
      throw new NotFoundException('Project record not found.');
    }

    await this.prisma.project.update({
      where: { id: projectId },
      data: { moderationStatus: ProjectModerationStatus.PUBLISHED },
    });

    return this.getProjectAdminDetails(projectId);
  }

  async rejectProject(projectId: string): Promise<AdminProjectDetailDto> {
    const existing = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!existing) {
      throw new NotFoundException('Project record not found.');
    }

    await this.prisma.project.update({
      where: { id: projectId },
      data: { moderationStatus: ProjectModerationStatus.REJECTED },
    });

    return this.getProjectAdminDetails(projectId);
  }

  // 4. TAXONOMY MANAGEMENT
  private getTaxonomyModel(type: string): any {
    switch (type) {
      case 'roles':
        return this.prisma.professionalRole;
      case 'specializations':
        return this.prisma.specialization;
      case 'skills':
        return this.prisma.skill;
      case 'tools':
        return this.prisma.tool;
      case 'game-engines':
        return this.prisma.gameEngine;
      case 'genres':
        return this.prisma.genre;
      case 'platforms':
        return this.prisma.platform;
      default:
        throw new BadRequestException(`Invalid taxonomy category: ${type}`);
    }
  }

  async getTaxonomyEntries(
    type: string,
    query: AdminTaxonomyQueryDto,
  ): Promise<AdminPaginatedTaxonomyResponseDto> {
    const model = this.getTaxonomyModel(type);
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search && query.search.trim()) {
      where.name = { contains: query.search.trim(), mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      model.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      model.count({ where }),
    ]);

    const mapped: AdminTaxonomyItemDto[] = items.map((i: any) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      isActive: i.isActive,
      createdAt: i.createdAt.toISOString(),
    }));

    return {
      items: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async createTaxonomyEntry(type: string, dto: CreateTaxonomyEntryDto): Promise<AdminTaxonomyItemDto> {
    const model = this.getTaxonomyModel(type);
    const name = dto.name.trim();

    const existing = await model.findUnique({ where: { name } });
    if (existing) {
      throw new BadRequestException(`Taxonomy entry "${name}" already exists.`);
    }

    const created = await model.create({
      data: {
        name,
        description: dto.description?.trim() || null,
        isActive: true,
      },
    });

    return {
      id: created.id,
      name: created.name,
      description: created.description,
      isActive: created.isActive,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async updateTaxonomyEntry(
    type: string,
    id: string,
    dto: UpdateTaxonomyEntryDto,
  ): Promise<AdminTaxonomyItemDto> {
    const model = this.getTaxonomyModel(type);

    const existing = await model.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Taxonomy entry not found.`);
    }

    const updated = await model.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async toggleTaxonomyActive(type: string, id: string, isActive: boolean): Promise<AdminTaxonomyItemDto> {
    const model = this.getTaxonomyModel(type);

    const existing = await model.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Taxonomy entry not found.`);
    }

    const updated = await model.update({
      where: { id },
      data: { isActive },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  // 5. RECENT ACTIVITY STREAM
  async getRecentPlatformActivity(): Promise<AdminActivityItemDto[]> {
    const [recentUsers, recentProjects] = await Promise.all([
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
      }),
      this.prisma.project.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const activityItems: AdminActivityItemDto[] = [];

    recentUsers.forEach((u) => {
      activityItems.push({
        id: `user-${u.id}`,
        type: 'USER_REGISTERED',
        title: `New User Registered: @${u.username}`,
        description: `Account created (${u.emailVerified ? 'Email Verified' : 'Pending Verification'})`,
        timestamp: u.createdAt.toISOString(),
      });
    });

    recentProjects.forEach((p) => {
      activityItems.push({
        id: `proj-${p.id}`,
        type: 'PROJECT_CREATED',
        title: `New Project Launched: ${p.name}`,
        description: `Status: ${p.status} · ${p.genre || 'Game Project'}`,
        timestamp: p.createdAt.toISOString(),
      });
    });

    return activityItems.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }
}
