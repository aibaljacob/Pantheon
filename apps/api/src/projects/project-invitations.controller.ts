import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator';
import { ProjectInvitationsService } from './project-invitations.service';
import {
  ProjectInvitationResponseDto,
  RespondInvitationDto,
  UserInvitationsResponseDto,
} from './projects.dto';

@Controller('users')
export class UserInvitationsController {
  constructor(private readonly projectInvitationsService: ProjectInvitationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me/invitations')
  getUserInvitations(@CurrentUser() user: AuthenticatedUser): Promise<UserInvitationsResponseDto> {
    return this.projectInvitationsService.getUserInvitations(user.id);
  }
}

@Controller('invitations')
export class ProjectInvitationsController {
  constructor(private readonly projectInvitationsService: ProjectInvitationsService) {}

  @UseGuards(JwtAuthGuard)
  @Patch(':id/respond')
  respondToInvitation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RespondInvitationDto,
  ): Promise<ProjectInvitationResponseDto> {
    return this.projectInvitationsService.respondToInvitation(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancelInvitation(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectInvitationResponseDto> {
    return this.projectInvitationsService.cancelInvitation(id, user.id, user.role);
  }
}
