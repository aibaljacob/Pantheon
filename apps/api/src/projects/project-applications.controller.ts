import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator';
import { ProjectApplicationsService } from './project-applications.service';
import {
  CandidateApplicationDetailDto,
  CreateProjectApplicationDto,
  FounderApplicationDetailDto,
  ProjectApplicationResponseDto,
  RespondProjectApplicationDto,
} from './project-applications.dto';

@ApiTags('Project Applications')
@Controller()
export class ProjectApplicationsController {
  constructor(private readonly applicationsService: ProjectApplicationsService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply to an open project role' })
  @ApiResponse({ status: 201, type: ProjectApplicationResponseDto })
  @UseGuards(JwtAuthGuard)
  @Post('projects/:id/roles/:roleId/applications')
  applyToRole(
    @Param('id') projectId: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProjectApplicationDto,
  ): Promise<ProjectApplicationResponseDto> {
    return this.applicationsService.applyToRole(projectId, roleId, user.id, user.role, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get candidate submitted applications' })
  @ApiResponse({ status: 200, type: [CandidateApplicationDetailDto] })
  @UseGuards(JwtAuthGuard)
  @Get('users/me/applications')
  getCandidateApplications(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CandidateApplicationDetailDto[]> {
    return this.applicationsService.getCandidateApplications(user.id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw a submitted application' })
  @ApiResponse({ status: 200, type: ProjectApplicationResponseDto })
  @UseGuards(JwtAuthGuard)
  @Patch('applications/:id/withdraw')
  withdrawApplication(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectApplicationResponseDto> {
    return this.applicationsService.withdrawApplication(id, user.id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all applications for a project (Founder/Admin only)' })
  @ApiResponse({ status: 200, type: [FounderApplicationDetailDto] })
  @UseGuards(JwtAuthGuard)
  @Get('projects/:id/applications')
  getProjectApplications(
    @Param('id') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FounderApplicationDetailDto[]> {
    return this.applicationsService.getProjectApplications(projectId, user.id, user.role);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept or reject an application (Founder/Admin only)' })
  @ApiResponse({ status: 200, type: ProjectApplicationResponseDto })
  @UseGuards(JwtAuthGuard)
  @Patch('applications/:id/respond')
  respondToApplication(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RespondProjectApplicationDto,
  ): Promise<ProjectApplicationResponseDto> {
    return this.applicationsService.respondToApplication(id, user.id, user.role, dto);
  }
}
