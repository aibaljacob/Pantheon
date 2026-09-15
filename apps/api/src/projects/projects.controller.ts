import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator';
import { ProjectsService } from './projects.service';
import { TalentMatchingService } from './talent-matching.service';
import { ProjectInvitationsService } from './project-invitations.service';
import { ProjectMembersService } from './project-members.service';
import {
  AssignProjectMemberRolesDto,
  AssignRoleToUserDto,
  CandidateQueryDto,
  ChangeProjectMemberRoleDto,
  CreateProjectDto,
  CreateProjectRoleDto,
  ProjectActiveTeamMemberDto,
  ProjectFormerTeamMemberDto,
  ProjectInvitationResponseDto,
  ProjectTeamResponseDto,
  RankedCandidatesResponseDto,
  SendInvitationDto,
  UpdateProjectDto,
  UpdateProjectRoleDto,
} from './projects.dto';
import type {
  AiRoleRecommendationsResponseDto,
  DashboardProjectDto,
  DashboardProjectsResponseDto,
  ProjectDetailResponseDto,
  ProjectRoleResponseDto,
} from './projects.dto';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly talentMatchingService: TalentMatchingService,
    private readonly projectInvitationsService: ProjectInvitationsService,
    private readonly projectMembersService: ProjectMembersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getUserDashboardProjects(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DashboardProjectsResponseDto> {
    return this.projectsService.getUserDashboardProjects(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createProject(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProjectDto,
  ): Promise<DashboardProjectDto> {
    return this.projectsService.createProject(user.id, dto);
  }

  @Get('public')
  getPublicProjects(@Query('search') search?: string): Promise<DashboardProjectsResponseDto> {
    return this.projectsService.getPublicProjects(search);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  getProjectDetails(
    @Param('id') id: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<ProjectDetailResponseDto> {
    return this.projectsService.getProjectDetails(id, user?.id, user?.role);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateProject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectDetailResponseDto> {
    return this.projectsService.updateProject(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/roles')
  createProjectRole(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProjectRoleDto,
  ): Promise<ProjectRoleResponseDto> {
    return this.projectsService.createProjectRole(id, user.id, dto);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/roles')
  getProjectRoles(
    @Param('id') id: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<ProjectRoleResponseDto[]> {
    return this.projectsService.getProjectRoles(id, user?.id, user?.role);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/roles/:roleId')
  updateProjectRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProjectRoleDto,
  ): Promise<ProjectRoleResponseDto> {
    return this.projectsService.updateProjectRole(id, roleId, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/roles/:roleId')
  deleteProjectRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    return this.projectsService.deleteProjectRole(id, roleId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/roles/ai-recommendations')
  getAiRoleRecommendations(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AiRoleRecommendationsResponseDto> {
    return this.projectsService.getAiRoleRecommendations(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/roles/ai-recommendations')
  generateAiRoleRecommendations(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AiRoleRecommendationsResponseDto> {
    return this.projectsService.generateAiRoleRecommendations(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/roles/:roleId/candidates')
  getRankedCandidates(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CandidateQueryDto,
  ): Promise<RankedCandidatesResponseDto> {
    return this.talentMatchingService.getRankedCandidates(
      id,
      roleId,
      user.id,
      user.role,
      query,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/roles/:roleId/candidates/rescan')
  rescanRankedCandidates(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RankedCandidatesResponseDto> {
    return this.talentMatchingService.rescanRankedCandidates(
      id,
      roleId,
      user.id,
      user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/roles/:roleId/invitations')
  sendInvitation(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendInvitationDto,
  ): Promise<ProjectInvitationResponseDto> {
    return this.projectInvitationsService.sendInvitation(
      id,
      roleId,
      user.id,
      user.role,
      dto,
    );
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/members')
  getProjectTeamMembers(
    @Param('id') id: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<ProjectTeamResponseDto> {
    return this.projectMembersService.getTeamMembers(id, user?.id, user?.role);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/members/me')
  leaveProject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string }> {
    return this.projectMembersService.leaveProject(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/members/:memberId')
  removeProjectMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProjectFormerTeamMemberDto> {
    return this.projectMembersService.removeMember(id, memberId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/members/:memberId/role')
  changeProjectMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AssignProjectMemberRolesDto,
  ): Promise<ProjectActiveTeamMemberDto> {
    return this.projectMembersService.assignMemberRoles(
      id,
      memberId,
      user.id,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/members/:memberId/roles')
  assignProjectMemberRoles(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AssignProjectMemberRolesDto,
  ): Promise<ProjectActiveTeamMemberDto> {
    return this.projectMembersService.assignMemberRoles(
      id,
      memberId,
      user.id,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/roles/:projectRoleId/assign')
  assignRoleToUser(
    @Param('id') id: string,
    @Param('projectRoleId') projectRoleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AssignRoleToUserDto,
  ): Promise<ProjectActiveTeamMemberDto> {
    return this.projectMembersService.assignRoleToUser(
      id,
      projectRoleId,
      dto.userId,
      user.id,
    );
  }
}
