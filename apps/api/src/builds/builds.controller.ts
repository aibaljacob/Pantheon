import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator';
import { BuildsService } from './builds.service';
import { CreateBuildDto } from './dto/create-build.dto';
import { UpdateBuildStatusDto } from './dto/update-build-status.dto';
import { CreatePlayableBuildDto } from './dto/create-playable-build.dto';
import { BuildQueryDto } from './dto/build-query.dto';
import { BuildJobResponseDto } from './dto/build-response.dto';
import { PlayableBuildResponseDto } from './dto/playable-build-response.dto';

@ApiTags('Project Builds')
@Controller('projects/:projectId')
export class BuildsController {
  constructor(private readonly buildsService: BuildsService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trigger a new build job in QUEUED status' })
  @ApiResponse({ status: 201, description: 'Build job created in QUEUED status' })
  @UseGuards(JwtAuthGuard)
  @Post('builds')
  createBuild(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBuildDto,
  ): Promise<BuildJobResponseDto> {
    return this.buildsService.createBuild(projectId, dto, user.id, user.role);
  }

  @ApiOperation({ summary: 'Get all build jobs for a project with optional filters' })
  @ApiResponse({ status: 200, description: 'Returns array of build jobs' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get('builds')
  getBuilds(
    @Param('projectId') projectId: string,
    @Query() query: BuildQueryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<BuildJobResponseDto[]> {
    return this.buildsService.getBuilds(projectId, query, user?.id, user?.role);
  }

  @ApiOperation({ summary: 'Get a single build job by ID' })
  @ApiResponse({ status: 200, description: 'Returns build job details' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get('builds/:buildId')
  getBuild(
    @Param('projectId') projectId: string,
    @Param('buildId') buildId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<BuildJobResponseDto> {
    return this.buildsService.getBuild(projectId, buildId, user?.id, user?.role);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update build status with transition validation' })
  @ApiResponse({ status: 200, description: 'Build status updated successfully' })
  @UseGuards(JwtAuthGuard)
  @Patch('builds/:buildId/status')
  updateBuildStatus(
    @Param('projectId') projectId: string,
    @Param('buildId') buildId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateBuildStatusDto,
  ): Promise<BuildJobResponseDto> {
    return this.buildsService.updateBuildStatus(
      projectId,
      buildId,
      dto,
      user.id,
      user.role,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a queued or running build job' })
  @ApiResponse({ status: 200, description: 'Build job cancelled' })
  @UseGuards(JwtAuthGuard)
  @Post('builds/:buildId/cancel')
  cancelBuild(
    @Param('projectId') projectId: string,
    @Param('buildId') buildId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BuildJobResponseDto> {
    return this.buildsService.cancelBuild(projectId, buildId, user.id, user.role);
  }

  @ApiOperation({ summary: 'Get logs for a specific build job' })
  @ApiResponse({ status: 200, description: 'Returns build logs' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get('builds/:buildId/logs')
  getBuildLogs(
    @Param('projectId') projectId: string,
    @Param('buildId') buildId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<{ buildId: string; status: string; buildLogs: string }> {
    return this.buildsService.getBuildLogs(projectId, buildId, user?.id, user?.role);
  }

  // ==========================================
  // PLAYABLE BUILDS
  // ==========================================

  @ApiOperation({ summary: 'Get all playable builds for a project' })
  @ApiResponse({ status: 200, description: 'Returns array of playable builds' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get('playable-builds')
  getPlayableBuilds(
    @Param('projectId') projectId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<PlayableBuildResponseDto[]> {
    return this.buildsService.getPlayableBuilds(projectId, user?.id, user?.role);
  }

  @ApiOperation({ summary: 'Get a single playable build by ID' })
  @ApiResponse({ status: 200, description: 'Returns playable build details' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get('playable-builds/:buildId')
  getPlayableBuild(
    @Param('projectId') projectId: string,
    @Param('buildId') buildId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<PlayableBuildResponseDto> {
    return this.buildsService.getPlayableBuild(projectId, buildId, user?.id, user?.role);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a playable build release' })
  @ApiResponse({ status: 201, description: 'Playable build registered successfully' })
  @UseGuards(JwtAuthGuard)
  @Post('playable-builds')
  createPlayableBuild(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePlayableBuildDto,
  ): Promise<PlayableBuildResponseDto> {
    return this.buildsService.createPlayableBuild(
      projectId,
      dto,
      user.id,
      user.role,
    );
  }
}
