import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async globalSearch(query: string, userId: string) {
    if (!query || query.trim().length === 0) {
      return { projects: [], users: [], tasks: [], roles: [], builds: [] };
    }

    const searchQuery = query.trim();
    const mode = 'insensitive';

    // 1. Projects search (auth: only projects the user can access)
    const accessibleProjects = await this.prisma.project.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: searchQuery, mode } },
              { description: { contains: searchQuery, mode } },
            ],
          },
          {
            OR: [
              { founderId: userId },
              { members: { some: { userId } } },
              // Could also add public projects if that concept exists
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
      take: 5,
    });

    // Extract project IDs the user has access to for scoping other searches
    const userProjectIds = await this.prisma.projectMember
      .findMany({
        where: { userId },
        select: { projectId: true },
      })
      .then((members) => members.map((m) => m.projectId));

    const foundedProjectIds = await this.prisma.project
      .findMany({
        where: { founderId: userId },
        select: { id: true },
      })
      .then((projects) => projects.map((p) => p.id));

    const accessibleProjectIds = Array.from(
      new Set([...userProjectIds, ...foundedProjectIds]),
    );

    // 2. Tasks search (auth: only within accessible projects)
    const tasks = await this.prisma.task.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: searchQuery, mode } },
              { description: { contains: searchQuery, mode } },
            ],
          },
          { projectId: { in: accessibleProjectIds } },
        ],
      },
      select: {
        id: true,
        title: true,
        taskNumber: true,
        status: true,
        projectId: true,
        project: { select: { slug: true } },
      },
      take: 5,
    });

    // 3. Project roles search (auth: within accessible projects)
    const roles = await this.prisma.projectRole.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: searchQuery, mode } },
              { description: { contains: searchQuery, mode } },
              { role: { name: { contains: searchQuery, mode } } },
            ],
          },
          { projectId: { in: accessibleProjectIds } },
        ],
      },
      select: {
        id: true,
        title: true,
        role: { select: { name: true } },
        projectId: true,
        project: { select: { slug: true } },
      },
      take: 5,
    });

    // 4. Playable builds search
    const builds = await this.prisma.playableBuild.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: searchQuery, mode } },
              { version: { contains: searchQuery, mode } },
            ],
          },
          { projectId: { in: accessibleProjectIds } },
        ],
      },
      select: {
        id: true,
        title: true,
        version: true,
        projectId: true,
        project: { select: { slug: true } },
      },
      take: 5,
    });

    // 5. Users search
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: searchQuery, mode } },
          { profile: { firstName: { contains: searchQuery, mode } } },
          { profile: { lastName: { contains: searchQuery, mode } } },
          { profile: { displayName: { contains: searchQuery, mode } } },
        ],
      },
      select: {
        id: true,
        username: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      take: 5,
    });

    return {
      projects: accessibleProjects,
      tasks,
      roles,
      builds,
      users,
    };
  }
}
