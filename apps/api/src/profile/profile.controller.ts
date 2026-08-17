import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator';
import { ProfileService } from './profile.service';
import { AuthService } from '../auth/auth.service';
import type { UploadedFileFile } from './profile-file.interface';
import {
  CreateEducationDto,
  CreateExperienceDto,
  CreateLinkDto,
  CreatePortfolioItemDto,
  UpdateEducationDto,
  UpdateExperienceDto,
  UpdateIdentityDto,
  UpdateLinkDto,
  UpdatePortfolioItemDto,
  UpdateProfileDto,
  UpdateResumeVisibilityDto,
} from './profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly authService: AuthService,
  ) {}

  // ---------------------------------------------------------------------------
  // AUTHENTICATED OWNER PROFILE (/profile/me)
  // ---------------------------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getOwnProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getOwnProfile(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateBasicProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateBasicProfile(user.id, dto);
  }

  // ---------------------------------------------------------------------------
  // PUBLIC PROFILE
  // ---------------------------------------------------------------------------

  @Get(':username')
  async getPublicProfile(
    @Param('username') username: string,
    @Headers('authorization') authorization?: string,
  ) {
    let viewerUserId: string | undefined;
    if (authorization && authorization.startsWith('Bearer ')) {
      const token = authorization.substring(7);
      try {
        const session = await this.authService.findValidSession(token);
        viewerUserId = session.user.id;
      } catch {
        // Unauthenticated visitor viewing public profile
      }
    }

    return this.profileService.getPublicProfile(username, viewerUserId);
  }

  // ---------------------------------------------------------------------------
  // FOLLOW / UNFOLLOW
  // ---------------------------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Post(':username/follow')
  followUser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('username') username: string,
  ) {
    return this.profileService.followUser(user.id, username);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':username/follow')
  unfollowUser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('username') username: string,
  ) {
    return this.profileService.unfollowUser(user.id, username);
  }

  // ---------------------------------------------------------------------------
  // AVATAR & BANNER UPLOADS
  // ---------------------------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedFileFile,
  ) {
    return this.profileService.uploadAvatar(user.id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/avatar')
  deleteAvatar(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.deleteAvatar(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/banner')
  @UseInterceptors(FileInterceptor('file'))
  uploadBanner(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedFileFile,
  ) {
    return this.profileService.uploadBanner(user.id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/banner')
  deleteBanner(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.deleteBanner(user.id);
  }

  // ---------------------------------------------------------------------------
  // PROFESSIONAL IDENTITY
  // ---------------------------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Get('me/identity')
  getIdentity(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getOwnIdentity(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/identity')
  updateIdentity(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateIdentityDto,
  ) {
    return this.profileService.updateIdentity(user.id, dto);
  }

  // ---------------------------------------------------------------------------
  // EXPERIENCE
  // ---------------------------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Get('me/experience')
  getExperiences(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getExperiences(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/experience')
  createExperience(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExperienceDto,
  ) {
    return this.profileService.createExperience(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/experience/:id')
  updateExperience(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateExperienceDto,
  ) {
    return this.profileService.updateExperience(user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/experience/:id')
  deleteExperience(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.profileService.deleteExperience(user.id, id);
  }

  // ---------------------------------------------------------------------------
  // EDUCATION
  // ---------------------------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Get('me/education')
  getEducation(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getEducation(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/education')
  createEducation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEducationDto,
  ) {
    return this.profileService.createEducation(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/education/:id')
  updateEducation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateEducationDto,
  ) {
    return this.profileService.updateEducation(user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/education/:id')
  deleteEducation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.profileService.deleteEducation(user.id, id);
  }

  // ---------------------------------------------------------------------------
  // PORTFOLIO (EXTERNAL WORK)
  // ---------------------------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Get('me/portfolio')
  getPortfolio(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getPortfolio(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/portfolio')
  createPortfolioItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePortfolioItemDto,
  ) {
    return this.profileService.createPortfolioItem(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/portfolio/cover')
  @UseInterceptors(FileInterceptor('file'))
  uploadPortfolioCover(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedFileFile,
  ) {
    return this.profileService.uploadPortfolioCover(user.id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/portfolio/:id')
  updatePortfolioItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePortfolioItemDto,
  ) {
    return this.profileService.updatePortfolioItem(user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/portfolio/:id')
  deletePortfolioItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.profileService.deletePortfolioItem(user.id, id);
  }

  // ---------------------------------------------------------------------------
  // RESUME
  // ---------------------------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Get('me/resume')
  getResume(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getResume(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/resume')
  @UseInterceptors(FileInterceptor('file'))
  uploadResume(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedFileFile,
  ) {
    return this.profileService.uploadResume(user.id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/resume')
  updateResumeVisibility(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateResumeVisibilityDto,
  ) {
    return this.profileService.updateResumeVisibility(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/resume')
  deleteResume(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.deleteResume(user.id);
  }

  // ---------------------------------------------------------------------------
  // LINKS
  // ---------------------------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Get('me/links')
  getLinks(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getLinks(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/links')
  createLink(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLinkDto,
  ) {
    return this.profileService.createLink(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/links/:id')
  updateLink(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateLinkDto,
  ) {
    return this.profileService.updateLink(user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/links/:id')
  deleteLink(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.profileService.deleteLink(user.id, id);
  }
}
