import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateProjectDto, DashboardProjectDto, DashboardProjectsResponseDto } from './projects.dto';
import { ProjectModerationStatus, ProjectStatus } from '@prisma/client';

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
}
