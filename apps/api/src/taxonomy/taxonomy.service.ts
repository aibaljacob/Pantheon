import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaxonomyQueryDto } from './taxonomy.dto';

@Injectable()
export class TaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhereClause(search?: string) {
    const trimmed = search?.trim();
    return {
      isActive: true,
      ...(trimmed
        ? {
            OR: [
              { name: { contains: trimmed, mode: 'insensitive' as const } },
              { description: { contains: trimmed, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
  }

  private formatResponse<T extends { id: string; name: string; description: string | null }>(
    items: T[],
    total: number,
    page: number,
    limit: number,
  ) {
    return {
      data: items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async searchRoles(query: TaxonomyQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(query.search);

    const [items, total] = await Promise.all([
      this.prisma.professionalRole.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.professionalRole.count({ where }),
    ]);

    return this.formatResponse(items, total, page, limit);
  }

  async searchSpecializations(query: TaxonomyQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(query.search);

    const [items, total] = await Promise.all([
      this.prisma.specialization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.specialization.count({ where }),
    ]);

    return this.formatResponse(items, total, page, limit);
  }

  async searchSkills(query: TaxonomyQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(query.search);

    const [items, total] = await Promise.all([
      this.prisma.skill.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.skill.count({ where }),
    ]);

    return this.formatResponse(items, total, page, limit);
  }

  async searchTools(query: TaxonomyQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(query.search);

    const [items, total] = await Promise.all([
      this.prisma.tool.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.tool.count({ where }),
    ]);

    return this.formatResponse(items, total, page, limit);
  }

  async searchGameEngines(query: TaxonomyQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(query.search);

    const [items, total] = await Promise.all([
      this.prisma.gameEngine.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.gameEngine.count({ where }),
    ]);

    return this.formatResponse(items, total, page, limit);
  }

  async searchGenres(query: TaxonomyQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(query.search);

    const [items, total] = await Promise.all([
      this.prisma.genre.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.genre.count({ where }),
    ]);

    return this.formatResponse(items, total, page, limit);
  }

  async searchPlatforms(query: TaxonomyQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(query.search);

    const [items, total] = await Promise.all([
      this.prisma.platform.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.platform.count({ where }),
    ]);

    return this.formatResponse(items, total, page, limit);
  }
}
