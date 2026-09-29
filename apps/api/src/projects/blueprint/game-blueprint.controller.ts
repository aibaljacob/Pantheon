import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../auth/optional-jwt-auth.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../auth/current-user.decorator';
import { GameBlueprintService } from './game-blueprint.service';
import {
  GameBlueprintResponseDto,
  UpsertGameBlueprintDto,
} from './game-blueprint.dto';

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
}
