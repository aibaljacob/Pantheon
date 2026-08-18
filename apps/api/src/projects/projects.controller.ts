import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  CreateProjectRoleDto,
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
  constructor(private readonly projectsService: ProjectsService) {}

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
  @Post(':id/roles/ai-recommendations')
  generateAiRoleRecommendations(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AiRoleRecommendationsResponseDto> {
    return this.projectsService.generateAiRoleRecommendations(id, user.id);
  }
}
