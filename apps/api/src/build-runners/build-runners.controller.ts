import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { BuildRunnersService } from './build-runners.service';
import { RegisterRunnerDto } from './dto/register-runner.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { BuildRunnerAuthGuard } from './build-runner-auth.guard';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Build Runners')
@Controller('build-runners')
export class BuildRunnersController {
  constructor(private readonly buildRunnersService: BuildRunnersService) {}

  @ApiOperation({ summary: 'Register a new local build runner' })
  @ApiResponse({ status: 201, description: 'Runner registered. Token is returned ONCE.' })
  @Post('register')
  registerRunner(@Body() dto: RegisterRunnerDto) {
    return this.buildRunnersService.registerRunner(dto);
  }

  @ApiOperation({ summary: 'Runner heartbeat to mark as online' })
  @ApiResponse({ status: 200 })
  @UseGuards(BuildRunnerAuthGuard)
  @Post('heartbeat')
  heartbeat(@Request() req: any) {
    return this.buildRunnersService.heartbeat(req.runner.id);
  }

  @ApiOperation({ summary: 'Claim the oldest queued build job for this runner platform' })
  @ApiResponse({ status: 200, description: 'Returns the claimed job or null if no jobs.' })
  @UseGuards(BuildRunnerAuthGuard)
  @Post('jobs/claim')
  claimJob(@Request() req: any) {
    return this.buildRunnersService.claimJob(req.runner.id);
  }

  @ApiOperation({ summary: 'Update the status, logs, or errors of a claimed job' })
  @ApiResponse({ status: 200, description: 'Job updated.' })
  @UseGuards(BuildRunnerAuthGuard)
  @Patch('jobs/:jobId/status')
  updateJobStatus(
    @Request() req: any,
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
    @Request() req: any,
    @Param('jobId') jobId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // For local MVP, just save the file to a local "uploads" directory
    // In production, this would go to S3 or a robust storage bucket.
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const safeJobId = jobId.replace(/[^a-z0-9-]/gi, '_');
    const fileName = `build_${safeJobId}.zip`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    // After uploading, register this as a PlayableBuild for the project.
    // Convert BigInt to string in response to avoid JSON stringify errors
    
    // The storagePath should be a URL the frontend can download from.
    // Since we statically serve /uploads in main.ts, the path is /uploads/fileName
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;

    const playableBuild = await this.buildRunnersService.saveArtifactAsPlayableBuild(
      jobId, 
      fileUrl, 
      file.size
    );
    
    return { 
      success: true, 
      filePath, 
      fileName, 
      playableBuild: {
        ...playableBuild,
        fileSizeBytes: playableBuild.fileSizeBytes?.toString()
      }
    };
  }
}

