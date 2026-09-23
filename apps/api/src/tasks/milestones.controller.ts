import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator';
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { MilestoneResponseDto } from './dto/milestone-response.dto';

@ApiTags('Project Milestones')
@Controller('projects/:projectId/milestones')
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a milestone for a project' })
  @ApiResponse({ status: 201, description: 'Milestone created successfully' })
  @UseGuards(JwtAuthGuard)
  @Post()
  createMilestone(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMilestoneDto,
  ): Promise<MilestoneResponseDto> {
    return this.milestonesService.createMilestone(projectId, dto, user.id, user.role);
  }

  @ApiOperation({ summary: 'Get all milestones for a project with progress statistics' })
  @ApiResponse({ status: 200, description: 'Returns array of milestones with progress' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  getMilestones(
    @Param('projectId') projectId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<MilestoneResponseDto[]> {
    return this.milestonesService.getMilestones(projectId, user?.id, user?.role);
  }

  @ApiOperation({ summary: 'Get a single milestone by ID' })
  @ApiResponse({ status: 200, description: 'Returns single milestone with progress' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':milestoneId')
  getMilestone(
    @Param('projectId') projectId: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<MilestoneResponseDto> {
    return this.milestonesService.getMilestone(projectId, milestoneId, user?.id, user?.role);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a milestone' })
  @ApiResponse({ status: 200, description: 'Milestone updated successfully' })
  @UseGuards(JwtAuthGuard)
  @Patch(':milestoneId')
  updateMilestone(
    @Param('projectId') projectId: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMilestoneDto,
  ): Promise<MilestoneResponseDto> {
    return this.milestonesService.updateMilestone(
      projectId,
      milestoneId,
      dto,
      user.id,
      user.role,
    );
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a milestone' })
  @ApiResponse({ status: 200, description: 'Milestone deleted successfully' })
  @UseGuards(JwtAuthGuard)
  @Delete(':milestoneId')
  deleteMilestone(
    @Param('projectId') projectId: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string }> {
    return this.milestonesService.deleteMilestone(projectId, milestoneId, user.id, user.role);
  }
}
