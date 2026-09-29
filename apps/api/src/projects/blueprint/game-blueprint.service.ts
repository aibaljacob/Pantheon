import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAuthorizationService } from '../../tasks/project-authorization.service';
import { GameBlueprint, Prisma, ProjectModerationStatus } from '@prisma/client';
import {
  GameBlueprintResponseDto,
  GameFeatureDto,
  GamePillarDto,
  UpsertGameBlueprintDto,
} from './game-blueprint.dto';

@Injectable()
export class GameBlueprintService {
  private readonly logger = new Logger(GameBlueprintService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAuthService: ProjectAuthorizationService,
  ) {}

  async getBlueprint(
    projectIdOrSlug: string,
    currentUserId?: string,
    currentUserRole?: string,
  ): Promise<GameBlueprintResponseDto | null> {
    const context = await this.projectAuthService.getProjectAccess(
      projectIdOrSlug,
      currentUserId,
      currentUserRole,
    );

    // Follow existing project access rules:
    // Non-published projects are only visible to Founder, active Members, or Admins.
    if (
      context.project.moderationStatus !== ProjectModerationStatus.PUBLISHED
    ) {
      if (!context.isFounder && !context.isMember && !context.isAdmin) {
        throw new NotFoundException('Project not found.');
      }
    }

    const blueprint = await this.prisma.gameBlueprint.findUnique({
      where: { projectId: context.project.id },
    });

    if (!blueprint) {
      return null;
    }

    return this.mapToResponse(blueprint);
  }

  async upsertBlueprint(
    projectIdOrSlug: string,
    currentUserId: string,
    currentUserRole: string | undefined,
    dto: UpsertGameBlueprintDto,
  ): Promise<GameBlueprintResponseDto> {
    const context = await this.projectAuthService.getProjectAccess(
      projectIdOrSlug,
      currentUserId,
      currentUserRole,
    );

    // Founder only rule
    if (!context.isFounder) {
      throw new ForbiddenException(
        'Only the project founder can modify the game blueprint.',
      );
    }

    const payload: Prisma.GameBlueprintUpdateInput = {
      tagline:
        dto.tagline !== undefined ? dto.tagline?.trim() || null : undefined,
      targetAudience:
        dto.targetAudience !== undefined
          ? dto.targetAudience?.trim() || null
          : undefined,
      cameraPerspective:
        dto.cameraPerspective !== undefined
          ? dto.cameraPerspective?.trim() || null
          : undefined,
      artStyle:
        dto.artStyle !== undefined ? dto.artStyle?.trim() || null : undefined,
      audioTone:
        dto.audioTone !== undefined ? dto.audioTone?.trim() || null : undefined,
      networkModel:
        dto.networkModel !== undefined
          ? dto.networkModel?.trim() || null
          : undefined,
      targetFps: dto.targetFps !== undefined ? dto.targetFps : undefined,
      targetResolution:
        dto.targetResolution !== undefined
          ? dto.targetResolution?.trim() || null
          : undefined,
      coreLoop:
        dto.coreLoop !== undefined ? dto.coreLoop?.trim() || null : undefined,
      summary:
        dto.summary !== undefined ? dto.summary?.trim() || null : undefined,
      pillars:
        dto.pillars !== undefined
          ? (dto.pillars as unknown as Prisma.InputJsonValue)
          : undefined,
      keyFeatures:
        dto.keyFeatures !== undefined
          ? (dto.keyFeatures as unknown as Prisma.InputJsonValue)
          : undefined,
      targetSpecs: dto.targetSpecs !== undefined ? dto.targetSpecs : undefined,
    };

    const saved = await this.prisma.gameBlueprint.upsert({
      where: { projectId: context.project.id },
      create: {
        projectId: context.project.id,
        tagline: dto.tagline?.trim() || null,
        targetAudience: dto.targetAudience?.trim() || null,
        cameraPerspective: dto.cameraPerspective?.trim() || null,
        artStyle: dto.artStyle?.trim() || null,
        audioTone: dto.audioTone?.trim() || null,
        networkModel: dto.networkModel?.trim() || null,
        targetFps: dto.targetFps ?? 60,
        targetResolution: dto.targetResolution?.trim() || null,
        coreLoop: dto.coreLoop?.trim() || null,
        summary: dto.summary?.trim() || null,
        pillars: dto.pillars
          ? (dto.pillars as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        keyFeatures: dto.keyFeatures
          ? (dto.keyFeatures as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        targetSpecs: dto.targetSpecs
          ? (dto.targetSpecs as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
      update: payload,
    });

    this.logger.log(
      `[BLUEPRINT] Upserted blueprint for project=${context.project.id} by user=${currentUserId}`,
    );

    return this.mapToResponse(saved);
  }

  private mapToResponse(blueprint: GameBlueprint): GameBlueprintResponseDto {
    return {
      id: blueprint.id,
      projectId: blueprint.projectId,
      tagline: blueprint.tagline,
      targetAudience: blueprint.targetAudience,
      cameraPerspective: blueprint.cameraPerspective,
      artStyle: blueprint.artStyle,
      audioTone: blueprint.audioTone,
      networkModel: blueprint.networkModel,
      targetFps: blueprint.targetFps,
      targetResolution: blueprint.targetResolution,
      coreLoop: blueprint.coreLoop,
      summary: blueprint.summary,
      pillars: Array.isArray(blueprint.pillars)
        ? (blueprint.pillars as unknown as GamePillarDto[])
        : null,
      keyFeatures: Array.isArray(blueprint.keyFeatures)
        ? (blueprint.keyFeatures as unknown as GameFeatureDto[])
        : null,
      targetSpecs:
        blueprint.targetSpecs && typeof blueprint.targetSpecs === 'object'
          ? (blueprint.targetSpecs as Record<string, any>)
          : null,
      createdAt: blueprint.createdAt.toISOString(),
      updatedAt: blueprint.updatedAt.toISOString(),
    };
  }
}
