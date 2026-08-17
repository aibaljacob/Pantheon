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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AdminService } from './admin.service';
import {
  AdminActivityItemDto,
  AdminDashboardMetricsDto,
  AdminPaginatedProjectsResponseDto,
  AdminPaginatedTaxonomyResponseDto,
  AdminPaginatedUsersResponseDto,
  AdminProjectDetailDto,
  AdminProjectsQueryDto,
  AdminTaxonomyItemDto,
  AdminTaxonomyQueryDto,
  AdminUserItemDto,
  AdminUsersQueryDto,
  CreateTaxonomyEntryDto,
  ToggleTaxonomyActiveDto,
  UpdateTaxonomyEntryDto,
} from './admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // 1. Dashboard Overview Metrics
  @Get('dashboard/metrics')
  getDashboardMetrics(): Promise<AdminDashboardMetricsDto> {
    return this.adminService.getDashboardMetrics();
  }

  // 2. User Management
  @Get('users')
  getUsers(@Query() query: AdminUsersQueryDto): Promise<AdminPaginatedUsersResponseDto> {
    return this.adminService.getPaginatedUsers(query);
  }

  @Get('users/:id')
  getUserDetails(@Param('id') id: string): Promise<AdminUserItemDto> {
    return this.adminService.getUserAdminDetails(id);
  }

  // 3. Project Management
  @Get('projects')
  getProjects(@Query() query: AdminProjectsQueryDto): Promise<AdminPaginatedProjectsResponseDto> {
    return this.adminService.getPaginatedProjects(query);
  }

  @Get('projects/:id')
  getProjectDetails(@Param('id') id: string): Promise<AdminProjectDetailDto> {
    return this.adminService.getProjectAdminDetails(id);
  }

  @Patch('projects/:id/approve')
  approveProject(@Param('id') id: string): Promise<AdminProjectDetailDto> {
    return this.adminService.approveProject(id);
  }

  @Patch('projects/:id/reject')
  rejectProject(@Param('id') id: string): Promise<AdminProjectDetailDto> {
    return this.adminService.rejectProject(id);
  }

  // 4. Taxonomy Management
  @Get('taxonomy/:type')
  getTaxonomyEntries(
    @Param('type') type: string,
    @Query() query: AdminTaxonomyQueryDto,
  ): Promise<AdminPaginatedTaxonomyResponseDto> {
    return this.adminService.getTaxonomyEntries(type, query);
  }

  @Post('taxonomy/:type')
  createTaxonomyEntry(
    @Param('type') type: string,
    @Body() dto: CreateTaxonomyEntryDto,
  ): Promise<AdminTaxonomyItemDto> {
    return this.adminService.createTaxonomyEntry(type, dto);
  }

  @Patch('taxonomy/:type/:id')
  updateTaxonomyEntry(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaxonomyEntryDto,
  ): Promise<AdminTaxonomyItemDto> {
    return this.adminService.updateTaxonomyEntry(type, id, dto);
  }

  @Patch('taxonomy/:type/:id/toggle')
  toggleTaxonomyActive(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() dto: ToggleTaxonomyActiveDto,
  ): Promise<AdminTaxonomyItemDto> {
    return this.adminService.toggleTaxonomyActive(type, id, dto.isActive);
  }

  // 5. Recent Activity Stream
  @Get('activity')
  getRecentActivity(): Promise<AdminActivityItemDto[]> {
    return this.adminService.getRecentPlatformActivity();
  }
}
