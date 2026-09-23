import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAuthorizationService } from '../tasks/project-authorization.service';
import { BuildPlatform, BuildStatus } from '@prisma/client';
import { CreateBuildDto } from './dto/create-build.dto';
import { UpdateBuildStatusDto } from './dto/update-build-status.dto';
import { CreatePlayableBuildDto } from './dto/create-playable-build.dto';
import { BuildQueryDto } from './dto/build-query.dto';
import { BuildJobResponseDto } from './dto/build-response.dto';
import { PlayableBuildResponseDto } from './dto/playable-build-response.dto';

const VALID_TRANSITIONS: Record<BuildStatus, BuildStatus[]> = {
  QUEUED: [BuildStatus.RUNNING, BuildStatus.CANCELLED],
  RUNNING: [BuildStatus.SUCCESS, BuildStatus.FAILED, BuildStatus.CANCELLED],
  SUCCESS: [],
  FAILED: [],
  CANCELLED: [],
};

@Injectable()
export class BuildsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: ProjectAuthorizationService,
  ) {}

  private calculateDuration(
    startedAt?: Date | null,
    completedAt?: Date | null,
  ): number | null {
    if (!startedAt || !completedAt) return null;
    return Math.max(0, Math.round((completedAt.getTime() - startedAt.getTime()) / 1000));
  }

  private mapBuildJob(build: any): BuildJobResponseDto {
    return {
      id: build.id,
      projectId: build.projectId,
      buildRunnerId: build.buildRunnerId,
      commitHash: build.commitHash,
      branchName: build.branchName,
      targetPlatform: build.targetPlatform,
      status: build.status,
      triggeredById: build.triggeredById,
      triggeredBy: {
        id: build.triggeredBy.id,
        username: build.triggeredBy.username,
        displayName:
          build.triggeredBy.profile?.displayName ||
          build.triggeredBy.profile?.firstName ||
          build.triggeredBy.username,
        avatarUrl: build.triggeredBy.profile?.avatarUrl,
      },
      milestoneId: build.milestoneId,
      milestone: build.milestone
        ? {
            id: build.milestone.id,
            title: build.milestone.title,
          }
        : null,
      buildRunner: build.buildRunner
        ? {
            id: build.buildRunner.id,
            name: build.buildRunner.name,
            platform: build.buildRunner.platform,
            isOnline: build.buildRunner.isOnline,
          }
        : null,
      buildLogs: build.buildLogs,
      errorMessage: build.errorMessage,
      startedAt: build.startedAt ? build.startedAt.toISOString() : null,
      completedAt: build.completedAt ? build.completedAt.toISOString() : null,
      durationSeconds: this.calculateDuration(build.startedAt, build.completedAt),
      createdAt: build.createdAt.toISOString(),
      updatedAt: build.updatedAt.toISOString(),
    };
  }

  private mapPlayableBuild(pb: any): PlayableBuildResponseDto {
    return {
      id: pb.id,
      projectId: pb.projectId,
      buildJobId: pb.buildJobId,
      milestoneId: pb.milestoneId,
      milestone: pb.milestone
        ? {
            id: pb.milestone.id,
            title: pb.milestone.title,
          }
        : null,
      version: pb.version,
      title: pb.title,
      platform: pb.platform,
      storagePath: pb.storagePath,
      fileSizeBytes: pb.fileSizeBytes != null ? Number(pb.fileSizeBytes) : null,
      fileChecksum: pb.fileChecksum,
      releaseNotes: pb.releaseNotes,
      uploadedById: pb.uploadedById,
      uploadedBy: pb.uploadedBy
        ? {
            id: pb.uploadedBy.id,
            username: pb.uploadedBy.username,
            displayName:
              pb.uploadedBy.profile?.displayName ||
              pb.uploadedBy.profile?.firstName ||
              pb.uploadedBy.username,
            avatarUrl: pb.uploadedBy.profile?.avatarUrl,
          }
        : null,
      createdAt: pb.createdAt.toISOString(),
      updatedAt: pb.updatedAt.toISOString(),
    };
  }

  // ==========================================
  // BUILD JOBS
  // ==========================================

  async createBuild(
    projectId: string,
    dto: CreateBuildDto,
    userId: string,
    userRole?: string,
  ): Promise<BuildJobResponseDto> {
    const access = await this.authService.assertCanView(projectId, userId, userRole);

    // Active member, founder, or administrator can trigger builds
    if (!access.isFounder && !access.isMember && !access.isAdmin) {
      throw new ForbiddenException('You do not have permission to trigger builds for this project.');
    }

    // Validate milestone if provided
    if (dto.milestoneId) {
      const milestone = await this.prisma.milestone.findUnique({
        where: { id: dto.milestoneId },
        select: { id: true, projectId: true },
      });
      if (!milestone || milestone.projectId !== projectId) {
        throw new BadRequestException('Milestone does not belong to this project.');
      }
    }

    const created = await this.prisma.buildJob.create({
      data: {
        projectId,
        targetPlatform: dto.targetPlatform,
        branchName: dto.branchName?.trim() || null,
        commitHash: dto.commitHash?.trim() || null,
        status: BuildStatus.QUEUED,
        triggeredById: userId,
        milestoneId: dto.milestoneId || null,
      },
      include: {
        triggeredBy: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                firstName: true,
                avatarUrl: true,
              },
            },
          },
        },
        milestone: {
          select: {
            id: true,
            title: true,
          },
        },
        buildRunner: true,
      },
    });

    return this.mapBuildJob(created);
  }

  async getBuilds(
    projectId: string,
    query: BuildQueryDto,
    userId?: string,
    userRole?: string,
  ): Promise<BuildJobResponseDto[]> {
    await this.authService.assertCanView(projectId, userId, userRole);

    const where: any = { projectId };
    if (query.status) where.status = query.status;
    if (query.platform) where.targetPlatform = query.platform;
    if (query.milestoneId) where.milestoneId = query.milestoneId;

    const builds = await this.prisma.buildJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        triggeredBy: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                firstName: true,
                avatarUrl: true,
              },
            },
          },
        },
        milestone: {
          select: {
            id: true,
            title: true,
          },
        },
        buildRunner: true,
      },
    });

    return builds.map((b) => this.mapBuildJob(b));
  }

  async getBuild(
    projectId: string,
    buildId: string,
    userId?: string,
    userRole?: string,
  ): Promise<BuildJobResponseDto> {
    await this.authService.assertCanView(projectId, userId, userRole);

    const build = await this.prisma.buildJob.findUnique({
      where: { id: buildId },
      include: {
        triggeredBy: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                firstName: true,
                avatarUrl: true,
              },
            },
          },
        },
        milestone: {
          select: {
            id: true,
            title: true,
          },
        },
        buildRunner: true,
      },
    });

    if (!build || build.projectId !== projectId) {
      throw new NotFoundException('Build not found in this project.');
    }

    return this.mapBuildJob(build);
  }

  async updateBuildStatus(
    projectId: string,
    buildId: string,
    dto: UpdateBuildStatusDto,
    userId: string,
    userRole?: string,
  ): Promise<BuildJobResponseDto> {
    const access = await this.authService.assertCanView(projectId, userId, userRole);

    // Only founder or admin can update status directly from the API
    if (!access.isFounder && !access.isAdmin) {
      throw new ForbiddenException('Only project founders or administrators can update build state.');
    }

    const build = await this.prisma.buildJob.findUnique({
      where: { id: buildId },
    });

    if (!build || build.projectId !== projectId) {
      throw new NotFoundException('Build not found in this project.');
    }

    // Check terminal states
    if (
      build.status === BuildStatus.SUCCESS ||
      build.status === BuildStatus.FAILED ||
      build.status === BuildStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Build is in terminal state '${build.status}' and cannot be modified.`,
      );
    }

    // Validate transition
    const allowedTransitions = VALID_TRANSITIONS[build.status] || [];
    if (!allowedTransitions.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid status transition from '${build.status}' to '${dto.status}'.`,
      );
    }

    const now = new Date();
    const updateData: any = {
      status: dto.status,
    };

    if (dto.errorMessage !== undefined) {
      updateData.errorMessage = dto.errorMessage;
    }
    if (dto.buildLogs !== undefined) {
      updateData.buildLogs = dto.buildLogs;
    }

    if (dto.status === BuildStatus.RUNNING) {
      if (!build.startedAt) updateData.startedAt = now;
    } else if (
      dto.status === BuildStatus.SUCCESS ||
      dto.status === BuildStatus.FAILED ||
      dto.status === BuildStatus.CANCELLED
    ) {
      updateData.completedAt = now;
      if (!build.startedAt) updateData.startedAt = now;
    }

    const updated = await this.prisma.buildJob.update({
      where: { id: buildId },
      data: updateData,
      include: {
        triggeredBy: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                firstName: true,
                avatarUrl: true,
              },
            },
          },
        },
        milestone: {
          select: {
            id: true,
            title: true,
          },
        },
        buildRunner: true,
      },
    });

    return this.mapBuildJob(updated);
  }

  async cancelBuild(
    projectId: string,
    buildId: string,
    userId: string,
    userRole?: string,
  ): Promise<BuildJobResponseDto> {
    const access = await this.authService.assertCanView(projectId, userId, userRole);

    const build = await this.prisma.buildJob.findUnique({
      where: { id: buildId },
    });

    if (!build || build.projectId !== projectId) {
      throw new NotFoundException('Build not found in this project.');
    }

    // Permission: Founder, Admin, or the user who triggered the build (if still queued)
    const isOwnerOfQueued =
      access.isMember &&
      build.triggeredById === userId &&
      build.status === BuildStatus.QUEUED;

    if (!access.isFounder && !access.isAdmin && !isOwnerOfQueued) {
      throw new ForbiddenException(
        'Only project founders, administrators, or the build initiator can cancel this build.',
      );
    }

    // Check terminal
    if (
      build.status === BuildStatus.SUCCESS ||
      build.status === BuildStatus.FAILED ||
      build.status === BuildStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Build is already in terminal state '${build.status}' and cannot be cancelled.`,
      );
    }

    const now = new Date();
    const updated = await this.prisma.buildJob.update({
      where: { id: buildId },
      data: {
        status: BuildStatus.CANCELLED,
        completedAt: now,
        startedAt: build.startedAt || now,
      },
      include: {
        triggeredBy: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                firstName: true,
                avatarUrl: true,
              },
            },
          },
        },
        milestone: {
          select: {
            id: true,
            title: true,
          },
        },
        buildRunner: true,
      },
    });

    return this.mapBuildJob(updated);
  }

  async getBuildLogs(
    projectId: string,
    buildId: string,
    userId?: string,
    userRole?: string,
  ): Promise<{ buildId: string; status: BuildStatus; buildLogs: string }> {
    await this.authService.assertCanView(projectId, userId, userRole);

    const build = await this.prisma.buildJob.findUnique({
      where: { id: buildId },
      select: {
        id: true,
        projectId: true,
        status: true,
        buildLogs: true,
      },
    });

    if (!build || build.projectId !== projectId) {
      throw new NotFoundException('Build not found in this project.');
    }

    return {
      buildId: build.id,
      status: build.status,
      buildLogs: build.buildLogs || '',
    };
  }

  // ==========================================
  // PLAYABLE BUILDS
  // ==========================================

  async getPlayableBuilds(
    projectId: string,
    userId?: string,
    userRole?: string,
  ): Promise<PlayableBuildResponseDto[]> {
    await this.authService.assertCanView(projectId, userId, userRole);

    const playableBuilds = await this.prisma.playableBuild.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        milestone: {
          select: {
            id: true,
            title: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                firstName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return playableBuilds.map((pb) => this.mapPlayableBuild(pb));
  }

  async getPlayableBuild(
    projectId: string,
    playableBuildId: string,
    userId?: string,
    userRole?: string,
  ): Promise<PlayableBuildResponseDto> {
    await this.authService.assertCanView(projectId, userId, userRole);

    const pb = await this.prisma.playableBuild.findUnique({
      where: { id: playableBuildId },
      include: {
        milestone: {
          select: {
            id: true,
            title: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                firstName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!pb || pb.projectId !== projectId) {
      throw new NotFoundException('Playable build not found in this project.');
    }

    return this.mapPlayableBuild(pb);
  }

  async createPlayableBuild(
    projectId: string,
    dto: CreatePlayableBuildDto,
    userId: string,
    userRole?: string,
  ): Promise<PlayableBuildResponseDto> {
    const access = await this.authService.assertCanView(projectId, userId, userRole);

    if (!access.isFounder && !access.isAdmin) {
      throw new ForbiddenException(
        'Only project founders or administrators can register playable builds.',
      );
    }

    if (dto.milestoneId) {
      const milestone = await this.prisma.milestone.findUnique({
        where: { id: dto.milestoneId },
        select: { id: true, projectId: true },
      });
      if (!milestone || milestone.projectId !== projectId) {
        throw new BadRequestException('Milestone does not belong to this project.');
      }
    }

    if (dto.buildJobId) {
      const buildJob = await this.prisma.buildJob.findUnique({
        where: { id: dto.buildJobId },
        select: { id: true, projectId: true },
      });
      if (!buildJob || buildJob.projectId !== projectId) {
        throw new BadRequestException('Originating build job does not belong to this project.');
      }
    }

    const created = await this.prisma.playableBuild.create({
      data: {
        projectId,
        version: dto.version.trim(),
        title: dto.title.trim(),
        platform: dto.platform,
        buildJobId: dto.buildJobId || null,
        milestoneId: dto.milestoneId || null,
        storagePath: dto.storagePath?.trim() || null,
        fileSizeBytes: dto.fileSizeBytes != null ? BigInt(dto.fileSizeBytes) : null,
        fileChecksum: dto.fileChecksum?.trim() || null,
        releaseNotes: dto.releaseNotes?.trim() || null,
        uploadedById: userId,
      },
      include: {
        milestone: {
          select: {
            id: true,
            title: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                firstName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return this.mapPlayableBuild(created);
  }
}
