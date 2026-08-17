import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { DashboardProjectDto, DashboardProjectsResponseDto } from './projects.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

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

      // Add founder to team count if not explicitly counted in ProjectMember table
      const hasFounderInMembers = p.members.some((m) => m.userId === p.founderId);
      const totalTeamCount = hasFounderInMembers ? p._count.members : p._count.members + 1;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        coverUrl: p.coverUrl,
        status: p.status,
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
}
