import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../auth/optional-jwt-auth.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../auth/current-user.decorator';
import { GameBlueprintService } from './game-blueprint.service';
import {
  ApproveProductionPlanDto,
  GameBlueprintResponseDto,
  SkillCoverageResponseDto,
  UpsertGameBlueprintDto,
  UpdateNarrativeDto,
  AiProposeNarrativeDto,
} from './game-blueprint.dto';
import {
  ProductionPlanDraftOutput,
  ProposedGameplayLoopOutput,
  VisualDirectionOutput,
  NarrativeAiOutput,
} from '../../ai/game-vision-ai.service';

@Controller('projects/:projectId/blueprint')
export class GameBlueprintController {
  constructor(private readonly blueprintService: GameBlueprintService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async getBlueprint(
    @Param('projectId') projectId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<GameBlueprintResponseDto | null> {
    return this.blueprintService.getBlueprint(projectId, user?.id, user?.role);
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  async upsertBlueprint(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertGameBlueprintDto,
  ): Promise<GameBlueprintResponseDto> {
    return this.blueprintService.upsertBlueprint(
      projectId,
      user.id,
      user.role,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('visual-direction/generate')
  async generateVisualDirection(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<VisualDirectionOutput> {
    return this.blueprintService.generateVisualDirection(
      projectId,
      user.id,
      user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('gameplay-loop/propose')
  async proposeGameplayLoop(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProposedGameplayLoopOutput> {
    return this.blueprintService.proposeGameplayLoop(
      projectId,
      user.id,
      user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('production-plan/generate')
  async generateProductionPlan(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProductionPlanDraftOutput> {
    return this.blueprintService.generateProductionPlan(
      projectId,
      user.id,
      user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('production-plan/approve')
  async approveProductionPlan(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApproveProductionPlanDto,
  ): Promise<{
    milestoneId: string;
    milestoneTitle: string;
    taskCount: number;
    tasks: Array<{
      id: string;
      taskNumber: number;
      taskCode: string;
      title: string;
    }>;
  }> {
    return this.blueprintService.approveProductionPlan(
      projectId,
      user.id,
      user.role,
      dto,
    );
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('skill-coverage')
  async getSkillCoverage(
    @Param('projectId') projectId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<SkillCoverageResponseDto> {
    return this.blueprintService.getSkillCoverage(
      projectId,
      user?.id,
      user?.role,
    );
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('narrative')
  async getNarrative(
    @Param('projectId') projectId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<Record<string, any> | null> {
    return this.blueprintService.getNarrative(projectId, user?.id, user?.role);
  }

  @UseGuards(JwtAuthGuard)
  @Put('narrative')
  async updateNarrative(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNarrativeDto,
  ): Promise<Record<string, any>> {
    return this.blueprintService.updateNarrative(
      projectId,
      user.id,
      user.role,
      dto.narrative,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('narrative/ai-propose')
  async aiProposeNarrative(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AiProposeNarrativeDto,
  ): Promise<NarrativeAiOutput> {
    return this.blueprintService.aiProposeNarrative(
      projectId,
      user.id,
      user.role,
      dto,
    );
  }
}
