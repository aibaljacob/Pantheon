import { Injectable, NotFoundException, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterRunnerDto } from './dto/register-runner.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { BuildStatus, BuildPlatform } from '@prisma/client';

@Injectable()
export class BuildRunnersService {
  private readonly logger = new Logger(BuildRunnersService.name);

  constructor(private prisma: PrismaService) {}

  async registerRunner(dto: RegisterRunnerDto) {
    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);

    const runner = await this.prisma.buildRunner.create({
      data: {
        name: dto.name,
        platform: dto.platform,
        tokenHash,
        isOnline: true,
        lastSeenAt: new Date(),
      },
    });

    // Return the plain token ONLY once during registration
    return {
      id: runner.id,
      name: runner.name,
      platform: runner.platform,
      token, // Important: provide plain token
    };
  }

  async validateRunner(runnerId: string, token: string): Promise<boolean> {
    const runner = await this.prisma.buildRunner.findUnique({
      where: { id: runnerId },
    });
    
    if (!runner) return false;
    return bcrypt.compare(token, runner.tokenHash);
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
    // 1. Verify runner exists and get platform
    const runner = await this.prisma.buildRunner.findUnique({
      where: { id: runnerId },
    });
    if (!runner) throw new NotFoundException('Runner not found');

    // Update last seen
    await this.heartbeat(runnerId);

    // 2. Find oldest QUEUED job for this platform
    // In PostgreSQL we can use a transaction or simply rely on Prisma's atomic update if possible.
    // For simplicity, we find one first, then try to update it.
    
    // To prevent race conditions, we can do an updateMany where status is QUEUED
    // But updateMany doesn't support returning the updated row in a clean way without taking the whole list.
    // Since this is a prototype, we'll do findFirst then update, handling potential concurrency with a small risk.
    const job = await this.prisma.buildJob.findFirst({
      where: {
        status: BuildStatus.QUEUED,
        targetPlatform: runner.platform,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        project: true,
      }
    });

    if (!job) {
      return { job: null }; // No jobs available
    }

    // Try to claim it
    try {
      const updatedJob = await this.prisma.buildJob.update({
        where: { 
          id: job.id,
          status: BuildStatus.QUEUED // optimistic locking-ish
        },
        data: {
          status: BuildStatus.RUNNING,
          buildRunnerId: runnerId,
          startedAt: new Date(),
        },
        include: {
          project: true,
        }
      });
      return { job: updatedJob };
    } catch (error) {
      // Job might have been claimed or cancelled
      this.logger.warn(`Failed to claim job ${job.id}: ${error.message}`);
      return { job: null };
    }
  }

  async updateJobStatus(runnerId: string, jobId: string, dto: UpdateJobDto) {
    const job = await this.prisma.buildJob.findUnique({
      where: { id: jobId },
    });

    if (!job) throw new NotFoundException('Job not found');
    if (job.buildRunnerId !== runnerId) throw new UnauthorizedException('Job belongs to another runner');

    const updateData: any = {
      status: dto.status,
    };

    if (dto.buildLogs) {
      updateData.buildLogs = dto.buildLogs; // Could also append
    }
    if (dto.errorMessage) {
      updateData.errorMessage = dto.errorMessage;
    }

    if (dto.status === BuildStatus.SUCCESS || dto.status === BuildStatus.FAILED || dto.status === BuildStatus.CANCELLED) {
      if (!job.completedAt) {
        updateData.completedAt = new Date();
      }
    }

    return this.prisma.buildJob.update({
      where: { id: jobId },
      data: updateData,
    });
  }

  async saveArtifactAsPlayableBuild(jobId: string, filePath: string, fileSize: number) {
    const job = await this.prisma.buildJob.findUnique({
      where: { id: jobId },
      include: { project: true },
    });

    if (!job) throw new NotFoundException('Job not found');

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
        releaseNotes: 'Automatically uploaded by Build Runner.',
      },
    });
  }
}

