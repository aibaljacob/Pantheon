import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileStorageService } from './storage/profile-storage.service';
import type { UploadedFileFile } from './profile-file.interface';
import {
  CreateEducationDto,
  CreateExperienceDto,
  CreateLinkDto,
  CreatePortfolioItemDto,
  UpdateEducationDto,
  UpdateExperienceDto,
  UpdateIdentityDto,
  UpdateLinkDto,
  UpdatePortfolioItemDto,
  UpdateProfileDto,
  UpdateResumeVisibilityDto,
} from './profile.dto';

export interface RawProfileQueryResult {
  user: {
    id: string;
    username: string;
    email: string;
    emailVerified: boolean;
    role: string;
    createdAt: string;
  };
  profile: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    displayName: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    headline: string | null;
    bio: string | null;
    location: string | null;
    timezone: string | null;
    experienceYears: number | null;
    availability: string | null;
    identity: {
      roles: string[];
      specializations: string[];
      skills: string[];
      tools: string[];
      gameEngines: string[];
      genres: string[];
      platforms: string[];
    } | null;
    experiences: any[];
    education: any[];
    portfolio: any[];
    resume: any | null;
    links: any[];
  };
  stats: {
    followers: number;
    following: number;
  };
  isOwner: boolean;
  isFollowing: boolean;
}

const identityInclude = {
  roles: { include: { role: true } },
  specializations: { include: { specialization: true } },
  skills: { include: { skill: true } },
  tools: { include: { tool: true } },
  gameEngines: { include: { engine: true } },
  genres: { include: { genre: true } },
  platforms: { include: { platform: true } },
};

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: ProfileStorageService,
  ) {}

  // ---------------------------------------------------------------------------
  // PUBLIC PROFILE
  // ---------------------------------------------------------------------------

  async getPublicProfile(username: string, viewerUserId?: string) {
    const normalizedUsername = username.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { username: normalizedUsername },
      include: {
        profile: {
          include: {
            identity: { include: identityInclude },
            experiences: { orderBy: { startDate: 'desc' } },
            education: { orderBy: { startDate: 'desc' } },
            portfolio: { orderBy: { title: 'asc' } },
            resume: true,
            links: true,
          },
        },
      },
    });

    if (!user || !user.profile) {
      throw new NotFoundException(`User profile for '@${username}' not found.`);
    }

    const [followersCount, followingCount, isFollowing] = await Promise.all([
      this.prisma.userFollow.count({ where: { followingId: user.id } }),
      this.prisma.userFollow.count({ where: { followerId: user.id } }),
      viewerUserId && viewerUserId !== user.id
        ? this.prisma.userFollow
            .findUnique({
              where: {
                followerId_followingId: {
                  followerId: viewerUserId,
                  followingId: user.id,
                },
              },
            })
            .then(Boolean)
        : Promise.resolve(false),
    ]);

    const isOwner = viewerUserId === user.id;

    // Filter private resume for non-owner
    const resumeData = user.profile.resume
      ? {
          ...user.profile.resume,
          downloadUrl:
            !isOwner && user.profile.resume.visibility === 'Private'
              ? null
              : user.profile.resume.downloadUrl,
        }
      : null;

    const completion = this.calculateCompletion(user.profile);

    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
      profile: {
        id: user.profile.id,
        userId: user.profile.userId,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        displayName: user.profile.displayName,
        avatarUrl: user.profile.avatarUrl,
        bannerUrl: user.profile.bannerUrl,
        headline: user.profile.headline,
        bio: user.profile.bio,
        location: user.profile.location,
        timezone: user.profile.timezone,
        experienceYears: user.profile.experienceYears,
        availability: user.profile.availability,
        identity: this.formatFormattedIdentity(user.profile.identity),
        experiences: user.profile.experiences,
        education: user.profile.education,
        portfolio: user.profile.portfolio,
        resume: resumeData,
        links: user.profile.links,
      },
      stats: {
        followers: followersCount,
        following: followingCount,
      },
      completion,
      isOwner,
      isFollowing,
    };
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATED OWNER PROFILE (SINGLE RAW SQL QUERY)
  // ---------------------------------------------------------------------------

  async getOwnProfile(userId: string) {
    const totalStart = performance.now();

    const sqlStart = performance.now();
    const result = await this.prisma.$queryRaw<Array<{ data: RawProfileQueryResult }>>`
      SELECT json_build_object(
        'user', json_build_object(
          'id', u."id",
          'username', u."username",
          'email', u."email",
          'emailVerified', u."emailVerified",
          'role', u."role",
          'createdAt', u."createdAt"
        ),
        'profile', json_build_object(
          'id', p."id",
          'userId', p."userId",
          'firstName', p."firstName",
          'lastName', p."lastName",
          'displayName', p."displayName",
          'avatarUrl', p."avatarUrl",
          'bannerUrl', p."bannerUrl",
          'headline', p."headline",
          'bio', p."bio",
          'location', p."location",
          'timezone', p."timezone",
          'experienceYears', p."experienceYears",
          'availability', p."availability",
          'identity', (
            SELECT json_build_object(
              'roles', COALESCE((SELECT json_agg(pr."name") FROM "UserRole" ur JOIN "ProfessionalRole" pr ON pr."id" = ur."roleId" WHERE ur."profileId" = iden."id"), '[]'::json),
              'specializations', COALESCE((SELECT json_agg(spec."name") FROM "UserSpecialization" us JOIN "Specialization" spec ON spec."id" = us."specializationId" WHERE us."profileId" = iden."id"), '[]'::json),
              'skills', COALESCE((SELECT json_agg(sk."name") FROM "UserSkill" usk JOIN "Skill" sk ON sk."id" = usk."skillId" WHERE usk."profileId" = iden."id"), '[]'::json),
              'tools', COALESCE((SELECT json_agg(tl."name") FROM "UserTool" ut JOIN "Tool" tl ON tl."id" = ut."toolId" WHERE ut."profileId" = iden."id"), '[]'::json),
              'gameEngines', COALESCE((SELECT json_agg(ge."name") FROM "UserGameEngine" uge JOIN "GameEngine" ge ON ge."id" = uge."engineId" WHERE uge."profileId" = iden."id"), '[]'::json),
              'genres', COALESCE((SELECT json_agg(gn."name") FROM "UserGenre" ugn JOIN "Genre" gn ON gn."id" = ugn."genreId" WHERE ugn."profileId" = iden."id"), '[]'::json),
              'platforms', COALESCE((SELECT json_agg(pl."name") FROM "UserPlatform" upl JOIN "Platform" pl ON pl."id" = upl."platformId" WHERE upl."profileId" = iden."id"), '[]'::json)
            )
            FROM "UserProfessionalIdentity" iden
            WHERE iden."profileId" = p."id"
          ),
          'experiences', COALESCE((
            SELECT json_agg(json_build_object(
              'id', exp."id",
              'profileId', exp."profileId",
              'position', exp."position",
              'company', exp."company",
              'location', exp."location",
              'startDate', exp."startDate",
              'endDate', exp."endDate",
              'isCurrent', exp."isCurrent",
              'description', exp."description",
              'technologies', exp."technologies"
            ) ORDER BY exp."startDate" DESC)
            FROM "UserExperience" exp WHERE exp."profileId" = p."id"
          ), '[]'::json),
          'education', COALESCE((
            SELECT json_agg(json_build_object(
              'id', edu."id",
              'profileId', edu."profileId",
              'institution', edu."institution",
              'degree', edu."degree",
              'startDate', edu."startDate",
              'endDate', edu."endDate",
              'description', edu."description"
            ) ORDER BY edu."startDate" DESC)
            FROM "UserEducation" edu WHERE edu."profileId" = p."id"
          ), '[]'::json),
          'portfolio', COALESCE((
            SELECT json_agg(json_build_object(
              'id', port."id",
              'profileId', port."profileId",
              'title', port."title",
              'coverUrl', port."coverUrl",
              'description', port."description",
              'role', port."role",
              'technologies', port."technologies",
              'gameEngine', port."gameEngine",
              'genre', port."genre",
              'platform', port."platform",
              'status', port."status",
              'projectUrl', port."projectUrl"
            ) ORDER BY port."title" ASC)
            FROM "UserPortfolioItem" port WHERE port."profileId" = p."id"
          ), '[]'::json),
          'resume', (
            SELECT to_jsonb(res) FROM "UserResume" res WHERE res."profileId" = p."id"
          ),
          'links', COALESCE((
            SELECT json_agg(to_jsonb(lnk)) FROM "UserLink" lnk WHERE lnk."profileId" = p."id"
          ), '[]'::json)
        ),
        'stats', json_build_object(
          'followers', (SELECT COUNT(*) FROM "UserFollow" WHERE "followingId" = u."id"),
          'following', (SELECT COUNT(*) FROM "UserFollow" WHERE "followerId" = u."id")
        ),
        'isOwner', true,
        'isFollowing', false
      ) AS data
      FROM "User" u
      JOIN "UserProfile" p ON p."userId" = u."id"
      WHERE u."id" = ${userId};
    `;
    const sqlDuration = performance.now() - sqlStart;

    if (!result || result.length === 0 || !result[0].data) {
      throw new NotFoundException('Profile not found.');
    }

    const transformStart = performance.now();
    const raw = result[0].data;

    const completion = this.calculateCompletion(raw.profile);
    const transformDuration = performance.now() - transformStart;

    const totalDuration = performance.now() - totalStart;
    this.logger.debug(
      `[PERF][PROFILE] getOwnProfile raw SQL query: ${sqlDuration.toFixed(2)} ms, transform: ${transformDuration.toFixed(2)} ms, total: ${totalDuration.toFixed(2)} ms`,
    );

    return {
      user: raw.user,
      profile: {
        ...raw.profile,
        identity: raw.profile.identity
          ? {
              roles: raw.profile.identity.roles || [],
              specializations: raw.profile.identity.specializations || [],
              skills: raw.profile.identity.skills || [],
              tools: raw.profile.identity.tools || [],
              gameEngines: raw.profile.identity.gameEngines || [],
              genres: raw.profile.identity.genres || [],
              platforms: raw.profile.identity.platforms || [],
            }
          : null,
        experiences: raw.profile.experiences || [],
        education: raw.profile.education || [],
        portfolio: raw.profile.portfolio || [],
        resume: raw.profile.resume || null,
        links: raw.profile.links || [],
      },
      stats: {
        followers: Number(raw.stats?.followers || 0),
        following: Number(raw.stats?.following || 0),
      },
      completion,
      isOwner: true,
      isFollowing: false,
    };
  }

  async updateBasicProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.ensureProfileExists(userId);

    const updatedProfile = await this.prisma.userProfile.update({
      where: { id: profile.id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName.trim() }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName.trim() }),
        ...(dto.displayName !== undefined && { displayName: dto.displayName.trim() }),
        ...(dto.headline !== undefined && { headline: dto.headline.trim() }),
        ...(dto.bio !== undefined && { bio: dto.bio.trim() }),
        ...(dto.location !== undefined && { location: dto.location.trim() }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone.trim() }),
        ...(dto.experienceYears !== undefined && { experienceYears: dto.experienceYears }),
        ...(dto.availability !== undefined && { availability: dto.availability.trim() }),
      },
    });

    return updatedProfile;
  }

  // ---------------------------------------------------------------------------
  // PROFESSIONAL IDENTITY (CONTROLLED TAXONOMY VALIDATION)
  // ---------------------------------------------------------------------------

  async getOwnIdentity(userId: string) {
    const start = performance.now();
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        identity: {
          include: identityInclude,
        },
      },
    });

    const duration = performance.now() - start;
    this.logger.debug(`[PERF][PROFILE] getOwnIdentity total: ${duration.toFixed(2)} ms`);

    if (!profile || !profile.identity) {
      return {
        roles: [],
        specializations: [],
        skills: [],
        tools: [],
        gameEngines: [],
        genres: [],
        platforms: [],
      };
    }

    return this.formatFormattedIdentity(profile.identity);
  }

  async updateIdentity(userId: string, dto: UpdateIdentityDto) {
    const totalStart = performance.now();

    // 1. Deduplicate ID arrays
    const roleIds = Array.from(new Set(dto.roleIds || []));
    const specializationIds = Array.from(new Set(dto.specializationIds || []));
    const skillIds = Array.from(new Set(dto.skillIds || []));
    const toolIds = Array.from(new Set(dto.toolIds || []));
    const gameEngineIds = Array.from(new Set(dto.gameEngineIds || []));
    const genreIds = Array.from(new Set(dto.genreIds || []));
    const platformIds = Array.from(new Set(dto.platformIds || []));

    // 2. Validate every non-empty taxonomy ID array exists in DB and isActive === true
    const valStart = performance.now();
    await Promise.all([
      this.validateTaxonomyIds(roleIds, 'professionalRole', 'Role'),
      this.validateTaxonomyIds(specializationIds, 'specialization', 'Specialization'),
      this.validateTaxonomyIds(skillIds, 'skill', 'Skill'),
      this.validateTaxonomyIds(toolIds, 'tool', 'Tool'),
      this.validateTaxonomyIds(gameEngineIds, 'gameEngine', 'Game Engine'),
      this.validateTaxonomyIds(genreIds, 'genre', 'Genre'),
      this.validateTaxonomyIds(platformIds, 'platform', 'Platform'),
    ]);
    const valDuration = performance.now() - valStart;

    // 3. Ensure profile exists and fetch existing identity junction relationships
    const lookStart = performance.now();
    const profile = await this.ensureProfileExists(userId);

    let identity = await this.prisma.userProfessionalIdentity.findUnique({
      where: { profileId: profile.id },
      include: {
        roles: { select: { roleId: true } },
        specializations: { select: { specializationId: true } },
        skills: { select: { skillId: true } },
        tools: { select: { toolId: true } },
        gameEngines: { select: { engineId: true } },
        genres: { select: { genreId: true } },
        platforms: { select: { platformId: true } },
      },
    });

    if (!identity) {
      identity = await this.prisma.userProfessionalIdentity.create({
        data: { profileId: profile.id },
        include: {
          roles: { select: { roleId: true } },
          specializations: { select: { specializationId: true } },
          skills: { select: { skillId: true } },
          tools: { select: { toolId: true } },
          gameEngines: { select: { engineId: true } },
          genres: { select: { genreId: true } },
          platforms: { select: { platformId: true } },
        },
      });
    }
    const lookDuration = performance.now() - lookStart;

    // 4. Update junction tables in transaction using diff strategy
    const txStart = performance.now();
    let hasChanges = false;

    await this.prisma.$transaction(
      async (tx) => {
        if (dto.roleIds !== undefined) {
          const existingIds = new Set(identity.roles.map((r) => r.roleId));
          const toDelete = Array.from(existingIds).filter((id) => !roleIds.includes(id));
          const toCreate = roleIds.filter((id) => !existingIds.has(id));

          if (toDelete.length > 0) {
            hasChanges = true;
            await tx.userRole.deleteMany({
              where: { profileId: identity.id, roleId: { in: toDelete } },
            });
          }
          if (toCreate.length > 0) {
            hasChanges = true;
            await tx.userRole.createMany({
              data: toCreate.map((roleId) => ({ profileId: identity.id, roleId })),
              skipDuplicates: true,
            });
          }
        }

        if (dto.specializationIds !== undefined) {
          const existingIds = new Set(identity.specializations.map((s) => s.specializationId));
          const toDelete = Array.from(existingIds).filter((id) => !specializationIds.includes(id));
          const toCreate = specializationIds.filter((id) => !existingIds.has(id));

          if (toDelete.length > 0) {
            hasChanges = true;
            await tx.userSpecialization.deleteMany({
              where: { profileId: identity.id, specializationId: { in: toDelete } },
            });
          }
          if (toCreate.length > 0) {
            hasChanges = true;
            await tx.userSpecialization.createMany({
              data: toCreate.map((specializationId) => ({
                profileId: identity.id,
                specializationId,
              })),
              skipDuplicates: true,
            });
          }
        }

        if (dto.skillIds !== undefined) {
          const existingIds = new Set(identity.skills.map((s) => s.skillId));
          const toDelete = Array.from(existingIds).filter((id) => !skillIds.includes(id));
          const toCreate = skillIds.filter((id) => !existingIds.has(id));

          if (toDelete.length > 0) {
            hasChanges = true;
            await tx.userSkill.deleteMany({
              where: { profileId: identity.id, skillId: { in: toDelete } },
            });
          }
          if (toCreate.length > 0) {
            hasChanges = true;
            await tx.userSkill.createMany({
              data: toCreate.map((skillId) => ({ profileId: identity.id, skillId })),
              skipDuplicates: true,
            });
          }
        }

        if (dto.toolIds !== undefined) {
          const existingIds = new Set(identity.tools.map((t) => t.toolId));
          const toDelete = Array.from(existingIds).filter((id) => !toolIds.includes(id));
          const toCreate = toolIds.filter((id) => !existingIds.has(id));

          if (toDelete.length > 0) {
            hasChanges = true;
            await tx.userTool.deleteMany({
              where: { profileId: identity.id, toolId: { in: toDelete } },
            });
          }
          if (toCreate.length > 0) {
            hasChanges = true;
            await tx.userTool.createMany({
              data: toCreate.map((toolId) => ({ profileId: identity.id, toolId })),
              skipDuplicates: true,
            });
          }
        }

        if (dto.gameEngineIds !== undefined) {
          const existingIds = new Set(identity.gameEngines.map((e) => e.engineId));
          const toDelete = Array.from(existingIds).filter((id) => !gameEngineIds.includes(id));
          const toCreate = gameEngineIds.filter((id) => !existingIds.has(id));

          if (toDelete.length > 0) {
            hasChanges = true;
            await tx.userGameEngine.deleteMany({
              where: { profileId: identity.id, engineId: { in: toDelete } },
            });
          }
          if (toCreate.length > 0) {
            hasChanges = true;
            await tx.userGameEngine.createMany({
              data: toCreate.map((engineId) => ({ profileId: identity.id, engineId })),
              skipDuplicates: true,
            });
          }
        }

        if (dto.genreIds !== undefined) {
          const existingIds = new Set(identity.genres.map((g) => g.genreId));
          const toDelete = Array.from(existingIds).filter((id) => !genreIds.includes(id));
          const toCreate = genreIds.filter((id) => !existingIds.has(id));

          if (toDelete.length > 0) {
            hasChanges = true;
            await tx.userGenre.deleteMany({
              where: { profileId: identity.id, genreId: { in: toDelete } },
            });
          }
          if (toCreate.length > 0) {
            hasChanges = true;
            await tx.userGenre.createMany({
              data: toCreate.map((genreId) => ({ profileId: identity.id, genreId })),
              skipDuplicates: true,
            });
          }
        }

        if (dto.platformIds !== undefined) {
          const existingIds = new Set(identity.platforms.map((p) => p.platformId));
          const toDelete = Array.from(existingIds).filter((id) => !platformIds.includes(id));
          const toCreate = platformIds.filter((id) => !existingIds.has(id));

          if (toDelete.length > 0) {
            hasChanges = true;
            await tx.userPlatform.deleteMany({
              where: { profileId: identity.id, platformId: { in: toDelete } },
            });
          }
          if (toCreate.length > 0) {
            hasChanges = true;
            await tx.userPlatform.createMany({
              data: toCreate.map((platformId) => ({ profileId: identity.id, platformId })),
              skipDuplicates: true,
            });
          }
        }
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    );
    const txDuration = performance.now() - txStart;

    // 5. Refetch formatted identity
    const refetchStart = performance.now();
    const updated = await this.prisma.userProfessionalIdentity.findUnique({
      where: { id: identity.id },
      include: identityInclude,
    });
    const refetchDuration = performance.now() - refetchStart;

    const totalDuration = performance.now() - totalStart;
    this.logger.debug(`[PERF][PROFILE] updateIdentity validation: ${valDuration.toFixed(2)} ms`);
    this.logger.debug(`[PERF][PROFILE] updateIdentity lookup: ${lookDuration.toFixed(2)} ms`);
    this.logger.debug(
      `[PERF][PROFILE] updateIdentity transaction: ${txDuration.toFixed(2)} ms (hasChanges=${hasChanges})`,
    );
    this.logger.debug(`[PERF][PROFILE] updateIdentity refetch: ${refetchDuration.toFixed(2)} ms`);
    this.logger.debug(`[PERF][PROFILE] updateIdentity total: ${totalDuration.toFixed(2)} ms`);

    return this.formatFormattedIdentity(updated);
  }

  private async validateTaxonomyIds(
    ids: string[],
    modelKey: keyof PrismaService,
    label: string,
  ): Promise<void> {
    if (ids.length === 0) return;

    const delegate = this.prisma[modelKey] as any;
    const found = await delegate.findMany({
      where: {
        id: { in: ids },
        isActive: true,
      },
      select: { id: true },
    });

    const foundIds = new Set(found.map((f: { id: string }) => f.id));
    const invalid = ids.filter((id) => !foundIds.has(id));

    if (invalid.length > 0) {
      throw new BadRequestException(
        `Invalid or inactive ${label} taxonomy ID(s): ${invalid.join(', ')}. User custom values are not allowed.`,
      );
    }
  }

  private formatFormattedIdentity(identity: any) {
    if (!identity) {
      return {
        roles: [],
        specializations: [],
        skills: [],
        tools: [],
        gameEngines: [],
        genres: [],
        platforms: [],
      };
    }

    return {
      roles: (identity.roles || []).map((r: any) => ({
        id: r.role.id,
        name: r.role.name,
        description: r.role.description,
      })),
      specializations: (identity.specializations || []).map((s: any) => ({
        id: s.specialization.id,
        name: s.specialization.name,
        description: s.specialization.description,
      })),
      skills: (identity.skills || []).map((s: any) => ({
        id: s.skill.id,
        name: s.skill.name,
        description: s.skill.description,
      })),
      tools: (identity.tools || []).map((t: any) => ({
        id: t.tool.id,
        name: t.tool.name,
        description: t.tool.description,
      })),
      gameEngines: (identity.gameEngines || []).map((e: any) => ({
        id: e.engine.id,
        name: e.engine.name,
        description: e.engine.description,
      })),
      genres: (identity.genres || []).map((g: any) => ({
        id: g.genre.id,
        name: g.genre.name,
        description: g.genre.description,
      })),
      platforms: (identity.platforms || []).map((p: any) => ({
        id: p.platform.id,
        name: p.platform.name,
        description: p.platform.description,
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // AVATAR & BANNER UPLOADS
  // ---------------------------------------------------------------------------

  async uploadAvatar(userId: string, file: UploadedFileFile) {
    const profile = await this.ensureProfileExists(userId);

    if (profile.avatarUrl) {
      this.storageService.deleteFileByUrl(profile.avatarUrl);
    }

    const avatarUrl = await this.storageService.saveAvatar(file);

    const updated = await this.prisma.userProfile.update({
      where: { id: profile.id },
      data: { avatarUrl },
    });

    return { avatarUrl: updated.avatarUrl };
  }

  async deleteAvatar(userId: string) {
    const profile = await this.ensureProfileExists(userId);

    if (profile.avatarUrl) {
      this.storageService.deleteFileByUrl(profile.avatarUrl);
    }

    await this.prisma.userProfile.update({
      where: { id: profile.id },
      data: { avatarUrl: null },
    });

    return { avatarUrl: null };
  }

  async uploadBanner(userId: string, file: UploadedFileFile) {
    const profile = await this.ensureProfileExists(userId);

    if (profile.bannerUrl) {
      this.storageService.deleteFileByUrl(profile.bannerUrl);
    }

    const bannerUrl = await this.storageService.saveBanner(file);

    const updated = await this.prisma.userProfile.update({
      where: { id: profile.id },
      data: { bannerUrl },
    });

    return { bannerUrl: updated.bannerUrl };
  }

  async deleteBanner(userId: string) {
    const profile = await this.ensureProfileExists(userId);

    if (profile.bannerUrl) {
      this.storageService.deleteFileByUrl(profile.bannerUrl);
    }

    await this.prisma.userProfile.update({
      where: { id: profile.id },
      data: { bannerUrl: null },
    });

    return { bannerUrl: null };
  }

  async uploadPortfolioCover(userId: string, file: UploadedFileFile) {
    await this.ensureProfileExists(userId);
    const coverUrl = await this.storageService.savePortfolioCover(file);
    return { coverUrl };
  }

  // ---------------------------------------------------------------------------
  // EXPERIENCE CRUD
  // ---------------------------------------------------------------------------

  async getExperiences(userId: string) {
    const profile = await this.ensureProfileExists(userId);
    return this.prisma.userExperience.findMany({
      where: { profileId: profile.id },
      orderBy: { startDate: 'desc' },
    });
  }

  async createExperience(userId: string, dto: CreateExperienceDto) {
    const profile = await this.ensureProfileExists(userId);

    return this.prisma.userExperience.create({
      data: {
        profileId: profile.id,
        position: dto.position.trim(),
        company: dto.company.trim(),
        location: dto.location?.trim() || null,
        startDate: dto.startDate.trim(),
        endDate: dto.isCurrent ? null : dto.endDate?.trim() || null,
        isCurrent: dto.isCurrent ?? false,
        description: dto.description.trim(),
        technologies: dto.technologies || [],
      },
    });
  }

  async updateExperience(userId: string, experienceId: string, dto: UpdateExperienceDto) {
    const profile = await this.ensureProfileExists(userId);

    const existing = await this.prisma.userExperience.findFirst({
      where: { id: experienceId, profileId: profile.id },
    });

    if (!existing) {
      throw new NotFoundException('Experience record not found or not owned by user.');
    }

    return this.prisma.userExperience.update({
      where: { id: experienceId },
      data: {
        ...(dto.position && { position: dto.position.trim() }),
        ...(dto.company && { company: dto.company.trim() }),
        ...(dto.location !== undefined && { location: dto.location?.trim() || null }),
        ...(dto.startDate && { startDate: dto.startDate.trim() }),
        ...(dto.isCurrent !== undefined && {
          isCurrent: dto.isCurrent,
          endDate: dto.isCurrent ? null : dto.endDate?.trim() || existing.endDate,
        }),
        ...(dto.endDate !== undefined && !dto.isCurrent && { endDate: dto.endDate?.trim() || null }),
        ...(dto.description && { description: dto.description.trim() }),
        ...(dto.technologies && { technologies: dto.technologies }),
      },
    });
  }

  async deleteExperience(userId: string, experienceId: string) {
    const profile = await this.ensureProfileExists(userId);

    const existing = await this.prisma.userExperience.findFirst({
      where: { id: experienceId, profileId: profile.id },
    });

    if (!existing) {
      throw new NotFoundException('Experience record not found or not owned by user.');
    }

    await this.prisma.userExperience.delete({ where: { id: experienceId } });
    return { success: true, deletedId: experienceId };
  }

  // ---------------------------------------------------------------------------
  // EDUCATION CRUD
  // ---------------------------------------------------------------------------

  async getEducation(userId: string) {
    const profile = await this.ensureProfileExists(userId);
    return this.prisma.userEducation.findMany({
      where: { profileId: profile.id },
      orderBy: { startDate: 'desc' },
    });
  }

  async createEducation(userId: string, dto: CreateEducationDto) {
    const profile = await this.ensureProfileExists(userId);

    return this.prisma.userEducation.create({
      data: {
        profileId: profile.id,
        institution: dto.institution.trim(),
        degree: dto.degree.trim(),
        startDate: dto.startDate.trim(),
        endDate: dto.endDate?.trim() || null,
        description: dto.description?.trim() || null,
      },
    });
  }

  async updateEducation(userId: string, educationId: string, dto: UpdateEducationDto) {
    const profile = await this.ensureProfileExists(userId);

    const existing = await this.prisma.userEducation.findFirst({
      where: { id: educationId, profileId: profile.id },
    });

    if (!existing) {
      throw new NotFoundException('Education record not found or not owned by user.');
    }

    return this.prisma.userEducation.update({
      where: { id: educationId },
      data: {
        ...(dto.institution && { institution: dto.institution.trim() }),
        ...(dto.degree && { degree: dto.degree.trim() }),
        ...(dto.startDate && { startDate: dto.startDate.trim() }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate?.trim() || null }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
      },
    });
  }

  async deleteEducation(userId: string, educationId: string) {
    const profile = await this.ensureProfileExists(userId);

    const existing = await this.prisma.userEducation.findFirst({
      where: { id: educationId, profileId: profile.id },
    });

    if (!existing) {
      throw new NotFoundException('Education record not found or not owned by user.');
    }

    await this.prisma.userEducation.delete({ where: { id: educationId } });
    return { success: true, deletedId: educationId };
  }

  // ---------------------------------------------------------------------------
  // PORTFOLIO CRUD (EXTERNAL WORK)
  // ---------------------------------------------------------------------------

  async getPortfolio(userId: string) {
    const profile = await this.ensureProfileExists(userId);
    return this.prisma.userPortfolioItem.findMany({
      where: { profileId: profile.id },
      orderBy: { title: 'asc' },
    });
  }

  async createPortfolioItem(userId: string, dto: CreatePortfolioItemDto) {
    const profile = await this.ensureProfileExists(userId);

    return this.prisma.userPortfolioItem.create({
      data: {
        profileId: profile.id,
        title: dto.title.trim(),
        coverUrl: dto.coverUrl?.trim() || null,
        description: dto.description.trim(),
        role: dto.role.trim(),
        technologies: dto.technologies || [],
        tools: dto.tools || [],
        gameEngine: dto.gameEngine.trim(),
        genre: dto.genre.trim(),
        platform: dto.platform.trim(),
        status: dto.status?.trim() || 'Prototype',
        projectUrl: dto.projectUrl?.trim() || null,
      },
    });
  }

  async updatePortfolioItem(userId: string, itemId: string, dto: UpdatePortfolioItemDto) {
    const profile = await this.ensureProfileExists(userId);

    const existing = await this.prisma.userPortfolioItem.findFirst({
      where: { id: itemId, profileId: profile.id },
    });

    if (!existing) {
      throw new NotFoundException('Portfolio item not found or not owned by user.');
    }

    return this.prisma.userPortfolioItem.update({
      where: { id: itemId },
      data: {
        ...(dto.title && { title: dto.title.trim() }),
        ...(dto.coverUrl !== undefined && { coverUrl: dto.coverUrl?.trim() || null }),
        ...(dto.description && { description: dto.description.trim() }),
        ...(dto.role && { role: dto.role.trim() }),
        ...(dto.technologies && { technologies: dto.technologies }),
        ...(dto.tools !== undefined && { tools: dto.tools }),
        ...(dto.gameEngine && { gameEngine: dto.gameEngine.trim() }),
        ...(dto.genre && { genre: dto.genre.trim() }),
        ...(dto.platform && { platform: dto.platform.trim() }),
        ...(dto.status && { status: dto.status.trim() }),
        ...(dto.projectUrl !== undefined && { projectUrl: dto.projectUrl?.trim() || null }),
      },
    });
  }

  async deletePortfolioItem(userId: string, itemId: string) {
    const profile = await this.ensureProfileExists(userId);

    const existing = await this.prisma.userPortfolioItem.findFirst({
      where: { id: itemId, profileId: profile.id },
    });

    if (!existing) {
      throw new NotFoundException('Portfolio item not found or not owned by user.');
    }

    await this.prisma.userPortfolioItem.delete({ where: { id: itemId } });
    return { success: true, deletedId: itemId };
  }

  // ---------------------------------------------------------------------------
  // RESUME
  // ---------------------------------------------------------------------------

  async getResume(userId: string) {
    const profile = await this.ensureProfileExists(userId);
    return this.prisma.userResume.findUnique({
      where: { profileId: profile.id },
    });
  }

  async uploadResume(userId: string, file: UploadedFileFile) {
    const profile = await this.ensureProfileExists(userId);

    const existingResume = await this.prisma.userResume.findUnique({
      where: { profileId: profile.id },
    });

    if (existingResume?.downloadUrl) {
      this.storageService.deleteFileByUrl(existingResume.downloadUrl);
    }

    const savedFile = await this.storageService.saveResume(file);

    return this.prisma.userResume.upsert({
      where: { profileId: profile.id },
      create: {
        profileId: profile.id,
        fileName: savedFile.fileName,
        fileType: savedFile.fileType,
        fileSize: savedFile.fileSize,
        downloadUrl: savedFile.downloadUrl,
        visibility: 'Public',
      },
      update: {
        fileName: savedFile.fileName,
        fileType: savedFile.fileType,
        fileSize: savedFile.fileSize,
        downloadUrl: savedFile.downloadUrl,
      },
    });
  }

  async updateResumeVisibility(userId: string, dto: UpdateResumeVisibilityDto) {
    const profile = await this.ensureProfileExists(userId);

    const existing = await this.prisma.userResume.findUnique({
      where: { profileId: profile.id },
    });

    if (!existing) {
      throw new NotFoundException('No resume found to update visibility.');
    }

    return this.prisma.userResume.update({
      where: { profileId: profile.id },
      data: { visibility: dto.visibility },
    });
  }

  async deleteResume(userId: string) {
    const profile = await this.ensureProfileExists(userId);

    const existing = await this.prisma.userResume.findUnique({
      where: { profileId: profile.id },
    });

    if (!existing) {
      throw new NotFoundException('No resume found.');
    }

    if (existing.downloadUrl) {
      this.storageService.deleteFileByUrl(existing.downloadUrl);
    }

    await this.prisma.userResume.delete({ where: { profileId: profile.id } });
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // LINKS CRUD
  // ---------------------------------------------------------------------------

  async getLinks(userId: string) {
    const profile = await this.ensureProfileExists(userId);
    return this.prisma.userLink.findMany({
      where: { profileId: profile.id },
    });
  }

  async createLink(userId: string, dto: CreateLinkDto) {
    const profile = await this.ensureProfileExists(userId);

    return this.prisma.userLink.create({
      data: {
        profileId: profile.id,
        platform: dto.platform.trim().toLowerCase(),
        displayName: dto.displayName.trim(),
        url: dto.url.trim(),
      },
    });
  }

  async updateLink(userId: string, linkId: string, dto: UpdateLinkDto) {
    const profile = await this.ensureProfileExists(userId);

    const existing = await this.prisma.userLink.findFirst({
      where: { id: linkId, profileId: profile.id },
    });

    if (!existing) {
      throw new NotFoundException('Link not found or not owned by user.');
    }

    return this.prisma.userLink.update({
      where: { id: linkId },
      data: {
        ...(dto.platform && { platform: dto.platform.trim().toLowerCase() }),
        ...(dto.displayName && { displayName: dto.displayName.trim() }),
        ...(dto.url && { url: dto.url.trim() }),
      },
    });
  }

  async deleteLink(userId: string, linkId: string) {
    const profile = await this.ensureProfileExists(userId);

    const existing = await this.prisma.userLink.findFirst({
      where: { id: linkId, profileId: profile.id },
    });

    if (!existing) {
      throw new NotFoundException('Link not found or not owned by user.');
    }

    await this.prisma.userLink.delete({ where: { id: linkId } });
    return { success: true, deletedId: linkId };
  }

  // ---------------------------------------------------------------------------
  // FOLLOW / UNFOLLOW
  // ---------------------------------------------------------------------------

  async followUser(followerId: string, targetUsername: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername.trim().toLowerCase() },
    });

    if (!targetUser) {
      throw new NotFoundException(`User '@${targetUsername}' not found.`);
    }

    if (followerId === targetUser.id) {
      throw new BadRequestException('You cannot follow yourself.');
    }

    await this.prisma.userFollow.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUser.id,
        },
      },
      create: {
        followerId,
        followingId: targetUser.id,
      },
      update: {},
    });

    const followersCount = await this.prisma.userFollow.count({
      where: { followingId: targetUser.id },
    });

    return {
      isFollowing: true,
      followersCount,
      targetUsername: targetUser.username,
    };
  }

  async unfollowUser(followerId: string, targetUsername: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { username: targetUsername.trim().toLowerCase() },
    });

    if (!targetUser) {
      throw new NotFoundException(`User '@${targetUsername}' not found.`);
    }

    await this.prisma.userFollow
      .delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: targetUser.id,
          },
        },
      })
      .catch(() => undefined);

    const followersCount = await this.prisma.userFollow.count({
      where: { followingId: targetUser.id },
    });

    return {
      isFollowing: false,
      followersCount,
      targetUsername: targetUser.username,
    };
  }

  // ---------------------------------------------------------------------------
  // INTERNAL HELPERS
  // ---------------------------------------------------------------------------

  private async ensureProfileExists(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found.');
    }

    return profile;
  }

  private calculateCompletion(profile: any) {
    let score = 0;
    let max = 100;

    if (profile.firstName && profile.lastName) score += 15;
    if (profile.avatarUrl) score += 15;
    if (profile.bannerUrl) score += 10;
    if (profile.headline) score += 15;
    if (profile.bio) score += 15;
    if (profile.location) score += 10;

    const hasSkills =
      profile.identity?.skills && profile.identity.skills.length > 0;
    if (hasSkills) score += 10;
    if (profile.resume) score += 10;

    const profilePercent = Math.min(100, Math.round((score / max) * 100));

    let portfolioScore = 0;
    if (profile.portfolio && profile.portfolio.length > 0) {
      portfolioScore = Math.min(100, profile.portfolio.length * 34);
    }

    return {
      profile: profilePercent,
      portfolio: portfolioScore,
    };
  }
}
