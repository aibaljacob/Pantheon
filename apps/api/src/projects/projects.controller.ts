import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator';
import { ProjectsService } from './projects.service';
import type { DashboardProjectsResponseDto } from './projects.dto';

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
}
