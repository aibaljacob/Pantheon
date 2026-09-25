import { Controller, Post, Put, Get, Body, Param, UseGuards } from '@nestjs/common';
import { PlaytestService } from './playtest.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateFeedbackDto, ConvertToTaskDto } from './dto/playtest.dto';

@Controller('projects/:projectId')
@UseGuards(JwtAuthGuard)
export class PlaytestController {
  constructor(private readonly playtestService: PlaytestService) {}

  @Post('playable-builds/:buildId/playtest-sessions')
  async startSession(
    @Param('projectId') projectId: string,
    @Param('buildId') buildId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.playtestService.startSession(projectId, buildId, userId);
  }

  @Put('playtest-sessions/:sessionId/end')
  async endSession(
    @Param('projectId') projectId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.playtestService.endSession(projectId, sessionId, userId);
  }

  @Post('playtest-sessions/:sessionId/feedback')
  async submitFeedback(
    @Param('projectId') projectId: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.playtestService.submitFeedback(projectId, sessionId, userId, dto);
  }

  @Get('feedback')
  async getFeedback(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.playtestService.getFeedbackForProject(projectId, userId);
  }

  @Post('feedback/:feedbackId/convert-to-task')
  async convertToTask(
    @Param('projectId') projectId: string,
    @Param('feedbackId') feedbackId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ConvertToTaskDto,
  ) {
    return this.playtestService.convertToTask(projectId, feedbackId, userId, dto);
  }
}
