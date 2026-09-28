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
import { BuildStatus, BuildRunner, Prisma } from '@prisma/client';

@Injectable()
export class BuildRunnersService {
  private readonly logger = new Logger(BuildRunnersService.name);

  constructor(private prisma: PrismaService) {}

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

    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      select: { id: true, slug: true },
    });

    if (!project) {
      throw new NotFoundException(
        `Project with ID "${dto.projectId}" not found.`,
      );
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);

    const runner = await this.prisma.buildRunner.create({
      data: {
        projectId: project.id,
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

  async heartbeat(runnerId: string) {
    await this.prisma.buildRunner.update({
      where: { id: runnerId },
      data: {
        isOnline: true,
        lastSeenAt: new Date(),
      },
    });
    return { success: true };
  }

  async claimJob(runnerId: string) {
    // 1. Verify runner exists and get its assigned project and platform
    const runner = await this.prisma.buildRunner.findUnique({
      where: { id: runnerId },
    });
    if (!runner) throw new NotFoundException('Runner not found');

    // Update last seen
    await this.heartbeat(runnerId);

    // 2. Atomically find and claim the oldest QUEUED job for this runner's project and platform
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.buildJob.findFirst({
        where: {
          status: BuildStatus.QUEUED,
          targetPlatform: runner.platform,
          projectId: runner.projectId,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (!job) {
        return { job: null }; // No jobs available for this runner's project and platform
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
        },
      });

      return { job: claimedJob };
    });
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
    if (job.projectId !== runner.projectId) {
      throw new UnauthorizedException('Job belongs to another project');
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

    return this.prisma.buildJob.update({
      where: { id: jobId },
      data: updateData,
    });
  }

  async assertJobOwnedByRunner(
    jobId: string,
    runnerId: string,
    runnerProjectId: string,
  ) {
    const job = await this.prisma.buildJob.findUnique({
      where: { id: jobId },
      include: { project: true },
    });

    if (!job) throw new NotFoundException('Job not found');
    if (job.buildRunnerId !== runnerId) {
      throw new UnauthorizedException('Job belongs to another runner');
    }
    if (job.projectId !== runnerProjectId) {
      throw new UnauthorizedException('Job belongs to another project');
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
    if (job.projectId !== runner.projectId) {
      throw new UnauthorizedException('Job belongs to another project');
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
