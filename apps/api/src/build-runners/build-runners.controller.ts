import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request as ExpressRequest } from 'express';
import { BuildRunnersService } from './build-runners.service';
import { RegisterRunnerDto } from './dto/register-runner.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { BuildRunnerAuthGuard } from './build-runner-auth.guard';
import type { RunnerRequest } from './build-runner-auth.guard';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Build Runners')
@Controller('build-runners')
export class BuildRunnersController {
  constructor(private readonly buildRunnersService: BuildRunnersService) {}

  @ApiOperation({ summary: 'Register a new project-associated build runner' })
  @ApiResponse({
    status: 201,
    description: 'Runner registered. Token is returned ONCE.',
  })
  @Post('register')
  registerRunner(@Body() dto: RegisterRunnerDto, @Req() req: ExpressRequest) {
    const headerSecret = req.headers['x-runner-bootstrap-secret'] as
      string | undefined;
    return this.buildRunnersService.registerRunner(dto, headerSecret);
  }

  @ApiOperation({ summary: 'Runner heartbeat to mark as online' })
  @ApiResponse({ status: 200 })
  @UseGuards(BuildRunnerAuthGuard)
  @Post('heartbeat')
  heartbeat(@Req() req: RunnerRequest) {
    return this.buildRunnersService.heartbeat(req.runner.id);
  }

  @ApiOperation({
    summary:
      'Claim the oldest queued build job for this runner platform and project',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the claimed job or null if no jobs.',
  })
  @UseGuards(BuildRunnerAuthGuard)
  @Post('jobs/claim')
  claimJob(@Req() req: RunnerRequest) {
    return this.buildRunnersService.claimJob(req.runner.id);
  }

  @ApiOperation({
    summary: 'Update the status, logs, or errors of a claimed job',
  })
  @ApiResponse({ status: 200, description: 'Job updated.' })
  @UseGuards(BuildRunnerAuthGuard)
  @Patch('jobs/:jobId/status')
  updateJobStatus(
    @Req() req: RunnerRequest,
    @Param('jobId') jobId: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.buildRunnersService.updateJobStatus(req.runner.id, jobId, dto);
  }

  @ApiOperation({ summary: 'Upload the final playable build artifact (ZIP)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Artifact uploaded.' })
  @UseGuards(BuildRunnerAuthGuard)
  @Post('jobs/:jobId/artifacts')
  @UseInterceptors(FileInterceptor('file'))
  async uploadArtifact(
    @Req() req: RunnerRequest,
    @Param('jobId') jobId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('fileChecksum') fileChecksum?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Artifact file is required.');
    }

    // Verify job exists, is assigned to this runner, and matches the runner's project
    await this.buildRunnersService.assertJobOwnedByRunner(
      jobId,
      req.runner.id,
      req.runner.projectId,
    );

    // Save the file to the local "uploads" directory
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const safeJobId = jobId.replace(/[^a-z0-9-]/gi, '_');
    const fileName = `build_${safeJobId}.zip`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    const host = req.get('host') || 'localhost:3000';
    const fileUrl = `${req.protocol}://${host}/uploads/${fileName}`;

    const playableBuild =
      await this.buildRunnersService.saveArtifactAsPlayableBuild(
        jobId,
        req.runner.id,
        fileUrl,
        file.size,
        fileChecksum,
      );

    return {
      success: true,
      filePath,
      fileName,
      playableBuild: {
        ...playableBuild,
        fileSizeBytes: playableBuild.fileSizeBytes?.toString(),
      },
    };
  }
}
