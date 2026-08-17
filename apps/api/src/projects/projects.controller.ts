import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './projects.dto';
import type { DashboardProjectDto, DashboardProjectsResponseDto } from './projects.dto';

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
}
