import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './projects.dto';
import type {
  DashboardProjectDto,
  DashboardProjectsResponseDto,
  ProjectDetailResponseDto,
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
}
