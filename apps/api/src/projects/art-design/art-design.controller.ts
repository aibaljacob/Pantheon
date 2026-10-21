import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../auth/optional-jwt-auth.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../auth/current-user.decorator';
import { ArtDesignService } from './art-design.service';
import { ArtDesignStorageService } from './art-design-storage.service';
import {
  ArtProposalCategory,
  ArtProposalStatus,
  CommentArtProposalDto,
  ConvertProposalToTaskDto,
  CreateArtProposalDto,
  CreateDesignAssetDto,
  DesignAssetCategory,
  DesignAssetStatus,
  FounderDecisionDto,
  ReviseArtProposalDto,
  UpdateArtProposalDto,
  UpdateDesignAssetDto,
  VoteArtProposalDto,
} from './art-design.dto';
import type { UploadedFileFile } from '../../profile/profile-file.interface';

@Controller('projects/:projectId/art-design')
export class ArtDesignController {
  constructor(
    private readonly artDesignService: ArtDesignService,
    private readonly storageService: ArtDesignStorageService,
  ) {}

  // ---------------------------------------------------------------------------
  // FILE UPLOAD FOR ART & DESIGN REFERENCES
  // ---------------------------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadReferenceFile(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedFileFile,
  ) {
    await this.artDesignService.assertActiveMember(projectId, user.id);
    return this.storageService.saveReferenceFile(file);
  }

  // ---------------------------------------------------------------------------
  // 1. ART PROPOSALS & VOTING
  // ---------------------------------------------------------------------------

  @UseGuards(OptionalJwtAuthGuard)
  @Get('proposals')
  async getProposals(
    @Param('projectId') projectId: string,
    @Query('category') category?: ArtProposalCategory,
    @Query('status') status?: ArtProposalStatus,
    @Query('search') search?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.artDesignService.getProposals(
      projectId,
      { category, status, search },
      user?.id,
    );
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('proposals/:proposalId')
  async getProposal(
    @Param('projectId') projectId: string,
    @Param('proposalId') proposalId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.artDesignService.getProposal(projectId, proposalId, user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('proposals')
  async createProposal(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateArtProposalDto,
  ) {
    return this.artDesignService.createProposal(projectId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('proposals/:proposalId')
  async updateProposal(
    @Param('projectId') projectId: string,
    @Param('proposalId') proposalId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateArtProposalDto,
  ) {
    return this.artDesignService.updateProposal(projectId, proposalId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('proposals/:proposalId')
  async deleteProposal(
    @Param('projectId') projectId: string,
    @Param('proposalId') proposalId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.artDesignService.deleteProposal(projectId, proposalId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('proposals/:proposalId/vote')
  async voteProposal(
    @Param('projectId') projectId: string,
    @Param('proposalId') proposalId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VoteArtProposalDto,
  ) {
    return this.artDesignService.voteProposal(
      projectId,
      proposalId,
      dto,
      user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('proposals/:proposalId/comment')
  async commentProposal(
    @Param('projectId') projectId: string,
    @Param('proposalId') proposalId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CommentArtProposalDto,
  ) {
    return this.artDesignService.commentProposal(
      projectId,
      proposalId,
      dto,
      user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('proposals/:proposalId/revision')
  async reviseProposal(
    @Param('projectId') projectId: string,
    @Param('proposalId') proposalId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviseArtProposalDto,
  ) {
    return this.artDesignService.reviseProposal(
      projectId,
      proposalId,
      dto,
      user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('proposals/:proposalId/founder-decision')
  async founderDecision(
    @Param('projectId') projectId: string,
    @Param('proposalId') proposalId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: FounderDecisionDto,
  ) {
    return this.artDesignService.founderDecision(
      projectId,
      proposalId,
      dto,
      user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('proposals/:proposalId/convert-to-task')
  async convertProposalToTask(
    @Param('projectId') projectId: string,
    @Param('proposalId') proposalId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConvertProposalToTaskDto,
  ) {
    return this.artDesignService.convertProposalToTask(
      projectId,
      proposalId,
      dto,
      user.id,
      user.role,
    );
  }

  // ---------------------------------------------------------------------------
  // 2. DESIGN LIBRARIES
  // ---------------------------------------------------------------------------

  @UseGuards(OptionalJwtAuthGuard)
  @Get('assets')
  async getAssets(
    @Param('projectId') projectId: string,
    @Query('category') category?: DesignAssetCategory,
    @Query('status') status?: DesignAssetStatus,
    @Query('search') search?: string,
  ) {
    return this.artDesignService.getAssets(projectId, {
      category,
      status,
      search,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('assets')
  async createAsset(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDesignAssetDto,
  ) {
    return this.artDesignService.createAsset(projectId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('assets/:assetId')
  async updateAsset(
    @Param('projectId') projectId: string,
    @Param('assetId') assetId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateDesignAssetDto,
  ) {
    return this.artDesignService.updateAsset(projectId, assetId, dto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('assets/:assetId')
  async deleteAsset(
    @Param('projectId') projectId: string,
    @Param('assetId') assetId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.artDesignService.deleteAsset(projectId, assetId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('assets/:assetId/convert-to-task')
  async convertAssetToTask(
    @Param('projectId') projectId: string,
    @Param('assetId') assetId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConvertProposalToTaskDto,
  ) {
    return this.artDesignService.convertAssetToTask(
      projectId,
      assetId,
      dto,
      user.id,
      user.role,
    );
  }
}
