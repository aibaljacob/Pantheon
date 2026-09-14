import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator';
import { ProjectRepositoryService } from './project-repository.service';
import {
  CommitFileDto,
  DeleteFileDto,
  CreateBranchDto,
  CreatePullRequestDto,
  CreateReleaseDto,
} from './project-repository.dto';

@ApiTags('Project Repository')
@Controller('projects')
export class ProjectRepositoryController {
  constructor(private readonly repositoryService: ProjectRepositoryService) {}

  @ApiOperation({ summary: 'Get repository data for a project' })
  @ApiResponse({ status: 200, description: 'Returns repository tree, branches, commits, stats, and files' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/repo')
  getRepository(
    @Param('id') projectId: string,
    @Query('branch') branch?: string,
  ) {
    return this.repositoryService.getRepository(projectId, branch);
  }

  @ApiOperation({ summary: 'Get raw content of a specific file in the repository' })
  @ApiResponse({ status: 200, description: 'Returns file content, size, and commit info' })
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/repo/file')
  getFileContent(
    @Param('id') projectId: string,
    @Query('path') path: string,
    @Query('branch') branch?: string,
  ) {
    return this.repositoryService.getFileContent(projectId, path, branch);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Commit a new or updated file to the repository' })
  @ApiResponse({ status: 201, description: 'File committed successfully' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/repo/files')
  commitFile(
    @Param('id') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CommitFileDto,
  ) {
    const author = {
      id: user.id,
      username: user.username,
    };
    return this.repositoryService.commitFile(projectId, dto, author);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a file from the repository with a commit' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id/repo/files')
  deleteFile(
    @Param('id') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeleteFileDto,
  ) {
    const author = {
      id: user.id,
      username: user.username,
    };
    return this.repositoryService.deleteFile(projectId, dto, author);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new branch in the repository' })
  @ApiResponse({ status: 201, description: 'Branch created successfully' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/repo/branches')
  createBranch(
    @Param('id') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBranchDto,
  ) {
    const author = {
      id: user.id,
      username: user.username,
    };
    return this.repositoryService.createBranch(projectId, dto, author);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new pull request' })
  @ApiResponse({ status: 201, description: 'Pull request created successfully' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/repo/pulls')
  createPullRequest(
    @Param('id') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePullRequestDto,
  ) {
    const author = {
      id: user.id,
      username: user.username,
    };
    return this.repositoryService.createPullRequest(projectId, dto, author);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Merge an existing pull request' })
  @ApiResponse({ status: 200, description: 'Pull request merged successfully' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/repo/pulls/:prNumber/merge')
  mergePullRequest(
    @Param('id') projectId: string,
    @Param('prNumber') prNumber: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const author = {
      id: user.id,
      username: user.username,
    };
    return this.repositoryService.mergePullRequest(projectId, parseInt(prNumber, 10), author);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Draft and publish a new game release' })
  @ApiResponse({ status: 201, description: 'Release created successfully' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/repo/releases')
  createRelease(
    @Param('id') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReleaseDto,
  ) {
    const author = {
      id: user.id,
      username: user.username,
    };
    return this.repositoryService.createRelease(projectId, dto, author);
  }
}
