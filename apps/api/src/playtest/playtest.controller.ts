import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PlaytestService } from './playtest.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/current-user.decorator';
import {
  CreatePlaytestSessionDto,
  UpdatePlaytestSessionDto,
  CreatePlaytestFeedbackDto,
  UpdatePlaytestFeedbackDto,
} from './dto/playtest.dto';

@ApiTags('Playtests')
@Controller('projects/:projectId')
export class PlaytestController {
  constructor(private readonly playtestService: PlaytestService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new playtest session for a specific build',
  })
  @UseGuards(JwtAuthGuard)
  @Post('playable-builds/:buildId/playtests')
  createPlaytest(
    @Param('projectId') projectId: string,
    @Param('buildId') buildId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePlaytestSessionDto,
  ) {
    return this.playtestService.createPlaytest(
      projectId,
      buildId,
      dto,
      user.id,
      user.role,
    );
  }

  @ApiOperation({ summary: 'Get all playtest sessions for a project' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get('playtests')
  getPlaytests(
    @Param('projectId') projectId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.playtestService.getPlaytests(projectId, user?.id, user?.role);
  }

  @ApiOperation({ summary: 'Get a single playtest session' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get('playtests/:playtestId')
  getPlaytest(
    @Param('projectId') projectId: string,
    @Param('playtestId') playtestId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.playtestService.getPlaytest(
      projectId,
      playtestId,
      user?.id,
      user?.role,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a playtest session' })
  @UseGuards(JwtAuthGuard)
  @Patch('playtests/:playtestId')
  updatePlaytest(
    @Param('projectId') projectId: string,
    @Param('playtestId') playtestId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePlaytestSessionDto,
  ) {
    return this.playtestService.updatePlaytest(
      projectId,
      playtestId,
      dto,
      user.id,
      user.role,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a playtest session' })
  @UseGuards(JwtAuthGuard)
  @Delete('playtests/:playtestId')
  deletePlaytest(
    @Param('projectId') projectId: string,
    @Param('playtestId') playtestId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.playtestService.deletePlaytest(
      projectId,
      playtestId,
      user.id,
      user.role,
    );
  }

  // ==========================================
  // FEEDBACK
  // ==========================================

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit feedback for a playtest session' })
  @UseGuards(JwtAuthGuard)
  @Post('playtests/:playtestId/feedback')
  createFeedback(
    @Param('projectId') projectId: string,
    @Param('playtestId') playtestId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePlaytestFeedbackDto,
  ) {
    return this.playtestService.createFeedback(
      projectId,
      playtestId,
      dto,
      user.id,
      user.role,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all feedback for a playtest session' })
  @UseGuards(JwtAuthGuard)
  @Get('playtests/:playtestId/feedback')
  getFeedback(
    @Param('projectId') projectId: string,
    @Param('playtestId') playtestId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.playtestService.getFeedbackList(
      projectId,
      playtestId,
      user.id,
      user.role,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update feedback status/severity' })
  @UseGuards(JwtAuthGuard)
  @Patch('playtests/:playtestId/feedback/:feedbackId')
  updateFeedback(
    @Param('projectId') projectId: string,
    @Param('playtestId') playtestId: string,
    @Param('feedbackId') feedbackId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePlaytestFeedbackDto,
  ) {
    return this.playtestService.updateFeedback(
      projectId,
      playtestId,
      feedbackId,
      dto,
      user.id,
      user.role,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Convert feedback to a task' })
  @UseGuards(JwtAuthGuard)
  @Post('playtests/:playtestId/feedback/:feedbackId/convert-to-task')
  convertFeedbackToTask(
    @Param('projectId') projectId: string,
    @Param('playtestId') playtestId: string,
    @Param('feedbackId') feedbackId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.playtestService.convertFeedbackToTask(
      projectId,
      playtestId,
      feedbackId,
      user.id,
      user.role,
    );
  }
}
