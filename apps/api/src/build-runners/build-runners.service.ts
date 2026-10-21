import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterRunnerDto } from './dto/register-runner.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { BuildStatus, BuildRunner, Prisma, BuildPlatform } from '@prisma/client';
import { BuildsGateway } from '../events/builds.gateway';

@Injectable()
export class BuildRunnersService {
  private readonly logger = new Logger(BuildRunnersService.name);

  constructor(
    private prisma: PrismaService,
    private buildsGateway: BuildsGateway,
  ) {}

  async registerRunner(dto: RegisterRunnerDto, headerSecret?: string) {
    const configuredSecret = process.env.BUILD_RUNNER_BOOTSTRAP_SECRET;
    const providedSecret = dto.bootstrapSecret || headerSecret;

    if (!configuredSecret) {
      throw new UnauthorizedException(
        'Runner registration is disabled: BUILD_RUNNER_BOOTSTRAP_SECRET is not configured on the server.',
      );
    }

    if (!providedSecret || providedSecret !== configuredSecret) {
      throw new UnauthorizedException(
        'Invalid or missing runner bootstrap secret.',
      );
    }

    // Verify project exists or use default
    let assignedProjectId = dto.projectId;
    if (!assignedProjectId) {
      const defaultProject = await this.prisma.project.findFirst({
        select: { id: true },
      });
      if (!defaultProject) {
        throw new NotFoundException(
          'No projects exist to associate runner with.',
        );
      }
      assignedProjectId = defaultProject.id;
    } else {
      const project = await this.prisma.project.findUnique({
        where: { id: assignedProjectId },
        select: { id: true, slug: true },
      });

      if (!project) {
        throw new NotFoundException(
          `Project with ID "${assignedProjectId}" not found.`,
        );
      }
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);

    const runner = await this.prisma.buildRunner.create({
      data: {
        projectId: assignedProjectId,
        name: dto.name.trim(),
        platform: dto.platform,
        tokenHash,
        isOnline: true,
        lastSeenAt: new Date(),
      },
    });

    // Return the plain token ONLY once during registration
    return {
      id: runner.id,
      projectId: runner.projectId,
      name: runner.name,
      platform: runner.platform,
      token, // Important: provide plain token
    };
  }

  async validateRunner(
    runnerId: string,
    token: string,
  ): Promise<BuildRunner | null> {
    const runner = await this.prisma.buildRunner.findUnique({
      where: { id: runnerId },
    });

    if (!runner) return null;
    const isMatch = await bcrypt.compare(token, runner.tokenHash);
    return isMatch ? runner : null;
  }

  getLivenessTimeoutMs(): number {
    const val = process.env.BUILD_RUNNER_LIVENESS_TIMEOUT_MS;
    return val ? parseInt(val, 10) : 60000;
  }

  async getActiveRunnerForPlatform(
    platform: BuildPlatform,
  ): Promise<BuildRunner | null> {
    const cutoff = new Date(Date.now() - this.getLivenessTimeoutMs());
    return this.prisma.buildRunner.findFirst({
      where: {
        platform,
        isOnline: true,
        lastSeenAt: {
          gte: cutoff,
        },
      },
      orderBy: {
        lastSeenAt: 'desc',
      },
    });
  }

  async getRunnerStatus(platform: BuildPlatform) {
    const activeRunner = await this.getActiveRunnerForPlatform(platform);
    if (!activeRunner) {
      return {
        platform,
        online: false,
        status: 'OFFLINE' as const,
        runner: null,
        currentJob: null,
      };
    }

    const currentJob = await this.prisma.buildJob.findFirst({
      where: {
        targetPlatform: platform,
        status: BuildStatus.RUNNING,
      },
      select: {
        id: true,
        projectId: true,
        startedAt: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return {
      platform,
      online: true,
      status: (currentJob ? 'BUILDING' : 'ONLINE') as 'ONLINE' | 'BUILDING',
      runner: {
        id: activeRunner.id,
        name: activeRunner.name,
        platform: activeRunner.platform,
        lastSeenAt: activeRunner.lastSeenAt,
      },
      currentJob,
    };
  }

  async markRunnerOffline(runnerId: string) {
    const runner = await this.prisma.buildRunner.findUnique({
      where: { id: runnerId },
    });
    if (!runner) throw new NotFoundException('Runner not found');

    const updated = await this.prisma.buildRunner.update({
      where: { id: runnerId },
      data: {
        isOnline: false,
      },
    });

    this.buildsGateway.emitRunnerStatus({
      platform: updated.platform,
      status: 'OFFLINE',
      online: false,
      runnerId: updated.id,
      runnerName: updated.name,
    });

    return { success: true };
  }

  async heartbeat(runnerId: string) {
    const runner = await this.prisma.buildRunner.update({
      where: { id: runnerId },
      data: {
        isOnline: true,
        lastSeenAt: new Date(),
      },
    });

    const runningJob = await this.prisma.buildJob.findFirst({
      where: {
        buildRunnerId: runnerId,
        status: BuildStatus.RUNNING,
      },
      select: { id: true },
    });

    this.buildsGateway.emitRunnerStatus({
      platform: runner.platform,
      status: runningJob ? 'BUILDING' : 'ONLINE',
      online: true,
      runnerId: runner.id,
      runnerName: runner.name,
    });

    return { success: true };
  }

  async claimJob(runnerId: string) {
    // 1. Verify runner exists and get its platform
    const runner = await this.prisma.buildRunner.findUnique({
      where: { id: runnerId },
    });
    if (!runner) throw new NotFoundException('Runner not found');

    // Update last seen
    await this.prisma.buildRunner.update({
      where: { id: runnerId },
      data: {
        isOnline: true,
        lastSeenAt: new Date(),
      },
    });

    // 2. Atomically find and claim the oldest QUEUED job matching this runner's platform across any project
    const result = await this.prisma.$transaction(async (tx) => {
      const job = await tx.buildJob.findFirst({
        where: {
          status: BuildStatus.QUEUED,
          targetPlatform: runner.platform,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (!job) {
        return { job: null }; // No queued jobs available for this runner's platform
      }

      // Concurrency-safe atomic claim
      const updated = await tx.buildJob.updateMany({
        where: {
          id: job.id,
          status: BuildStatus.QUEUED,
        },
        data: {
          status: BuildStatus.RUNNING,
          buildRunnerId: runnerId,
          startedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        return { job: null }; // Job claimed by another concurrent runner or cancelled
      }

      const claimedJob = await tx.buildJob.findUnique({
        where: { id: job.id },
        include: {
          project: true,
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

      return { job: claimedJob };
    });

    if (result.job) {
      this.buildsGateway.emitBuildUpdated(result.job.projectId, result.job);
      this.buildsGateway.emitRunnerStatus({
        platform: runner.platform,
        status: 'BUILDING',
        online: true,
        runnerId: runner.id,
        runnerName: runner.name,
      });
    }

    return result;
  }

  async updateJobStatus(runnerId: string, jobId: string, dto: UpdateJobDto) {
    const runner = await this.prisma.buildRunner.findUnique({
      where: { id: runnerId },
    });
    if (!runner) throw new NotFoundException('Runner not found');

    const job = await this.prisma.buildJob.findUnique({
      where: { id: jobId },
    });

    if (!job) throw new NotFoundException('Job not found');
    if (job.buildRunnerId !== runnerId) {
      throw new UnauthorizedException('Job belongs to another runner');
    }

    const updateData: Prisma.BuildJobUpdateInput = {
      status: dto.status,
    };

    if (dto.buildLogs !== undefined) {
      updateData.buildLogs = dto.buildLogs;
    }
    if (dto.errorMessage !== undefined) {
      updateData.errorMessage = dto.errorMessage;
    }

    if (
      dto.status === BuildStatus.SUCCESS ||
      dto.status === BuildStatus.FAILED ||
      dto.status === BuildStatus.CANCELLED
    ) {
      if (!job.completedAt) {
        updateData.completedAt = new Date();
      }
    }

    const updatedJob = await this.prisma.buildJob.update({
      where: { id: jobId },
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

    this.buildsGateway.emitBuildUpdated(job.projectId, updatedJob);

    if (
      dto.status === BuildStatus.SUCCESS ||
      dto.status === BuildStatus.FAILED ||
      dto.status === BuildStatus.CANCELLED
    ) {
      this.buildsGateway.emitRunnerStatus({
        platform: runner.platform,
        status: 'ONLINE',
        online: true,
        runnerId: runner.id,
        runnerName: runner.name,
      });
    }

    return updatedJob;
  }

  async assertJobOwnedByRunner(jobId: string, runnerId: string) {
    const job = await this.prisma.buildJob.findUnique({
      where: { id: jobId },
      include: { project: true },
    });

    if (!job) throw new NotFoundException('Job not found');
    if (job.buildRunnerId !== runnerId) {
      throw new UnauthorizedException('Job belongs to another runner');
    }

    return job;
  }

  async saveArtifactAsPlayableBuild(
    jobId: string,
    runnerId: string,
    filePath: string,
    fileSize: number,
    fileChecksum?: string,
  ) {
    const runner = await this.prisma.buildRunner.findUnique({
      where: { id: runnerId },
    });
    if (!runner) throw new NotFoundException('Runner not found');

    const job = await this.prisma.buildJob.findUnique({
      where: { id: jobId },
      include: { project: true },
    });

    if (!job) throw new NotFoundException('Job not found');
    if (job.buildRunnerId !== runnerId) {
      throw new UnauthorizedException('Job belongs to another runner');
    }

    const version = job.commitHash
      ? `git-${job.commitHash.substring(0, 7)}`
      : `build-${jobId.substring(0, 8)}`;

    return this.prisma.playableBuild.create({
      data: {
        projectId: job.projectId,
        buildJobId: job.id,
        milestoneId: job.milestoneId,
        version,
        title: `Build ${version}`,
        platform: job.targetPlatform,
        storagePath: filePath,
        fileSizeBytes: BigInt(fileSize),
        fileChecksum: fileChecksum || null,
        releaseNotes: 'Automatically uploaded by Build Runner.',
      },
    });
  }
}
