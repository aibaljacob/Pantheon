import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ProjectRepositoryRepository } from './project-repository.repository';
import {
  CommitFileDto,
  DeleteFileDto,
  CreateBranchDto,
  CreatePullRequestDto,
  CreateReleaseDto,
} from './project-repository.dto';

export interface RepoAuthor {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface RepoCommitItem {
  hash: string;
  message: string;
  author: RepoAuthor;
  date: string;
  branch: string;
  changedFiles: string[];
}

export interface RepoFileItem {
  path: string;
  content: string;
  size: number;
  linesCount: number;
  lastCommit: {
    hash: string;
    message: string;
    author: string;
    date: string;
  };
}

export interface RepoBranchItem {
  name: string;
  isDefault: boolean;
  lastCommitHash: string;
  updatedAt: string;
}

export interface RepoPullRequestItem {
  id: string;
  number: number;
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  status: 'OPEN' | 'MERGED' | 'CLOSED';
  author: RepoAuthor;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string | null;
  mergedBy?: string | null;
  commentsCount: number;
  changedFilesCount: number;
}

export interface RepoReleaseItem {
  id: string;
  tagName: string;
  title: string;
  description: string;
  targetBranch: string;
  author: RepoAuthor;
  publishedAt: string;
  assets: {
    name: string;
    size: string;
    downloadUrl: string;
  }[];
}

@Injectable()
export class ProjectRepositoryService {
  constructor(private readonly repoRepository: ProjectRepositoryRepository) {}

  private generateSha(seed: string): string {
    return crypto
      .createHash('sha1')
      .update(`${seed}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`)
      .digest('hex')
      .substring(0, 7);
  }

  private generateStarterFiles(
    projectName: string,
    projectSlug: string,
    gameEngine: string | null,
    description: string,
  ) {
    const isUnity = gameEngine?.toLowerCase().includes('unity');
    const isGodot = gameEngine?.toLowerCase().includes('godot');
    const engineLabel = isUnity
      ? 'Unity LTS'
      : isGodot
      ? 'Godot Engine 4.x'
      : 'Unreal Engine 5.x';

    const readmeContent = `# ${projectName}

${description || 'A collaborative game production project on Pantheon.'}

## Game Overview
- **Engine**: ${engineLabel}
- **VCS & Architecture**: Git Monorepo Architecture
- **Production Studio**: Pantheon Studio

## Getting Started
1. Clone the repository:
\`\`\`bash
git clone https://git.pantheon.studio/projects/${projectSlug}.git
\`\`\`
2. Checkout the default branch:
\`\`\`bash
git checkout main
\`\`\`
3. Open the project in ${engineLabel} to verify engine compatibility.
`;

    let gitignoreContent = `# Pantheon Default VCS Ignore Rules\nBinaries/\nBuild/\nSaved/\nIntermediate/\n.idea/\n.vs/\n*.log\n`;
    if (isUnity) {
      gitignoreContent = `[Ll]ibrary/\n[Tt]emp/\n[Oo]bj/\n[Bb]uild/\n[Bb]uilds/\n[Mm]emoryCaptures/\nUserSettings/\n*.csproj\n*.unityproj\n*.sln\n`;
    } else if (isGodot) {
      gitignoreContent = `.godot/\n*.translation\nexport_presets.cfg\n.import/\n`;
    }

    const gitattributesContent = `# Git LFS & Text Tracking\n*.fbx filter=lfs diff=lfs merge=lfs -text\n*.png filter=lfs diff=lfs merge=lfs -text\n*.wav filter=lfs diff=lfs merge=lfs -text\n*.psd filter=lfs diff=lfs merge=lfs -text\n*.blend filter=lfs diff=lfs merge=lfs -text\n*.uasset filter=lfs diff=lfs merge=lfs -text\n*.umap filter=lfs diff=lfs merge=lfs -text\n`;

    return [
      { path: 'README.md', content: readmeContent },
      { path: '.gitignore', content: gitignoreContent },
      { path: '.gitattributes', content: gitattributesContent },
    ];
  }

  private calculateLanguages(files: RepoFileItem[]): Record<string, number> {
    const extensionWeights: Record<string, number> = {};
    let totalBytes = 0;

    for (const f of files) {
      const ext = f.path.split('.').pop()?.toLowerCase() || '';
      let lang = 'Other';
      if (['cpp', 'cxx', 'cc'].includes(ext)) lang = 'C++';
      else if (['h', 'hpp', 'hxx'].includes(ext)) lang = 'C/C++ Header';
      else if (['cs'].includes(ext)) lang = 'C#';
      else if (['hlsl', 'usf', 'ush', 'shader'].includes(ext)) lang = 'HLSL / Shaders';
      else if (['ini', 'config', 'cfg'].includes(ext)) lang = 'Configuration';
      else if (['json', 'uproject'].includes(ext)) lang = 'JSON / Meta';
      else if (['md'].includes(ext)) lang = 'Markdown';
      else if (['gd'].includes(ext)) lang = 'GDScript';
      else if (['py'].includes(ext)) lang = 'Python';

      const weight = Math.max(f.size, 50);
      extensionWeights[lang] = (extensionWeights[lang] || 0) + weight;
      totalBytes += weight;
    }

    if (totalBytes === 0) return { Markdown: 100 };

    const result: Record<string, number> = {};
    for (const [lang, weight] of Object.entries(extensionWeights)) {
      result[lang] = Math.round((weight / totalBytes) * 1000) / 10;
    }
    return result;
  }

  async getOrCreateRepository(projectId: string) {
    const project = await this.repoRepository.findProjectWithDetails(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    let repo = await this.repoRepository.findRepositoryByProjectId(projectId);
    if (!repo) {
      // Create new real repository in database
      const createdRepo = await this.repoRepository.createRepository(projectId, 'main');
      const defaultBranch = createdRepo.branches[0];

      // Generate real initial commit
      const initialSha = this.generateSha(`${project.slug}-init`);
      const starterFiles = this.generateStarterFiles(
        project.name,
        project.slug,
        project.gameEngine,
        project.description,
      );

      const commit = await this.repoRepository.createCommit({
        repositoryId: createdRepo.id,
        hash: initialSha,
        message: `chore: initialize repository for ${project.name}`,
        branchName: defaultBranch.name,
        authorId: project.founderId,
        changedFiles: starterFiles.map((f) => f.path),
      });

      // Insert starter files into default branch
      for (const starter of starterFiles) {
        await this.repoRepository.upsertFile({
          repositoryId: createdRepo.id,
          branchId: defaultBranch.id,
          path: starter.path,
          content: starter.content,
          size: Buffer.byteLength(starter.content, 'utf8'),
          linesCount: starter.content.split('\n').length,
          lastCommitId: commit.id,
        });
      }

      repo = await this.repoRepository.findRepositoryByProjectId(projectId);
    }

    return { project, repo: repo! };
  }

  async getRepository(projectId: string, branchName?: string) {
    const { project, repo } = await this.getOrCreateRepository(projectId);

    const activeBranchName = branchName || repo.defaultBranch || 'main';
    let branch = await this.repoRepository.findBranchByName(repo.id, activeBranchName);

    if (!branch && repo.branches.length > 0) {
      branch = await this.repoRepository.findBranchByName(repo.id, repo.branches[0].name);
    }

    const branchFiles = branch ? await this.repoRepository.getBranchFiles(branch.id) : [];

    const files: RepoFileItem[] = branchFiles.map((f) => ({
      path: f.path,
      content: f.content,
      size: f.size,
      linesCount: f.linesCount,
      lastCommit: {
        hash: f.lastCommit?.hash || 'init',
        message: f.lastCommit?.message || 'initial commit',
        author: f.lastCommit?.author?.username || project.founder.username,
        date: f.lastCommit?.createdAt?.toISOString() || f.createdAt.toISOString(),
      },
    }));

    const commits: RepoCommitItem[] = repo.commits.map((c) => ({
      hash: c.hash,
      message: c.message,
      author: {
        username: c.author.username,
        displayName: c.author.profile?.displayName || c.author.username,
        avatarUrl: c.author.profile?.avatarUrl,
      },
      date: c.createdAt.toISOString(),
      branch: c.branchName,
      changedFiles: c.changedFiles,
    }));

    const branches: RepoBranchItem[] = repo.branches.map((b) => {
      const branchCommits = repo.commits.filter((c) => c.branchName === b.name);
      return {
        name: b.name,
        isDefault: b.isDefault,
        lastCommitHash: branchCommits[0]?.hash || repo.commits[0]?.hash || 'init',
        updatedAt: b.updatedAt.toISOString(),
      };
    });

    const pullRequests: RepoPullRequestItem[] = repo.pullRequests.map((pr) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      description: pr.description || '',
      sourceBranch: pr.sourceBranch,
      targetBranch: pr.targetBranch,
      status: pr.status as 'OPEN' | 'MERGED' | 'CLOSED',
      author: {
        username: pr.author.username,
        displayName: pr.author.profile?.displayName || pr.author.username,
        avatarUrl: pr.author.profile?.avatarUrl,
      },
      createdAt: pr.createdAt.toISOString(),
      updatedAt: pr.updatedAt.toISOString(),
      mergedAt: pr.mergedAt?.toISOString() || null,
      mergedBy: pr.mergedBy?.username || null,
      commentsCount: 0,
      changedFilesCount: 1,
    }));

    const releases: RepoReleaseItem[] = repo.releases.map((rel) => ({
      id: rel.id,
      tagName: rel.tagName,
      title: rel.title,
      description: rel.description || '',
      targetBranch: rel.targetBranch,
      author: {
        username: rel.author.username,
        displayName: rel.author.profile?.displayName || rel.author.username,
        avatarUrl: rel.author.profile?.avatarUrl,
      },
      publishedAt: rel.publishedAt.toISOString(),
      assets: (rel.assets as any) || [],
    }));

    const languages = this.calculateLanguages(files);
    const totalLines = files.reduce((acc, f) => acc + f.linesCount, 0);
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);

    return {
      name: project.name,
      slug: project.slug,
      gameEngine: project.gameEngine,
      currentBranch: branch?.name || activeBranchName,
      defaultBranch: repo.defaultBranch,
      branches,
      files,
      recentCommits: commits,
      pullRequests,
      releases,
      languages,
      stats: {
        totalCommits: commits.length,
        totalBranches: branches.length,
        totalPullRequests: pullRequests.length,
        totalReleases: releases.length,
        totalFiles: files.length,
        totalLines,
        totalSize,
        contributorsCount: Math.max(1, project.members.length + 1),
      },
      cloneUrls: {
        https: `https://git.pantheon.studio/projects/${project.slug}.git`,
        ssh: `git@git.pantheon.studio:projects/${project.slug}.git`,
      },
    };
  }

  async getFileContent(projectId: string, path: string, branchName: string = 'main') {
    const { repo } = await this.getOrCreateRepository(projectId);
    const branch = await this.repoRepository.findBranchByName(repo.id, branchName);
    if (!branch) {
      throw new NotFoundException(`Branch '${branchName}' not found`);
    }

    const file = await this.repoRepository.findFile(branch.id, path);
    if (!file) {
      throw new NotFoundException(`File not found at path: ${path}`);
    }

    return {
      path: file.path,
      content: file.content,
      size: file.size,
      linesCount: file.linesCount,
      lastCommit: {
        hash: file.lastCommit?.hash || 'init',
        message: file.lastCommit?.message || 'initial commit',
        author: file.lastCommit?.author?.username || 'developer',
        date: file.lastCommit?.createdAt?.toISOString() || file.createdAt.toISOString(),
      },
    };
  }

  async commitFile(
    projectId: string,
    dto: CommitFileDto,
    author: { id: string; username: string },
  ) {
    const { repo } = await this.getOrCreateRepository(projectId);
    const branchName = dto.branch || repo.defaultBranch;
    let branch = await this.repoRepository.findBranchByName(repo.id, branchName);

    if (!branch) {
      await this.repoRepository.createBranch(repo.id, branchName, false);
      branch = await this.repoRepository.findBranchByName(repo.id, branchName);
    }

    if (!branch) {
      throw new NotFoundException(`Failed to resolve branch '${branchName}'`);
    }

    const sha = this.generateSha(dto.path);
    const commit = await this.repoRepository.createCommit({
      repositoryId: repo.id,
      hash: sha,
      message: dto.commitMessage,
      branchName: branch.name,
      authorId: author.id,
      changedFiles: [dto.path],
    });

    const linesCount = dto.content.split('\n').length;
    const size = Buffer.byteLength(dto.content, 'utf8');

    const file = await this.repoRepository.upsertFile({
      repositoryId: repo.id,
      branchId: branch.id,
      path: dto.path,
      content: dto.content,
      size,
      linesCount,
      lastCommitId: commit.id,
    });

    return {
      commit: {
        hash: commit.hash,
        message: commit.message,
        author: {
          username: commit.author.username,
          displayName: commit.author.profile?.displayName || commit.author.username,
          avatarUrl: commit.author.profile?.avatarUrl,
        },
        date: commit.createdAt.toISOString(),
        branch: commit.branchName,
        changedFiles: commit.changedFiles,
      },
      file: {
        path: file.path,
        content: file.content,
        size: file.size,
        linesCount: file.linesCount,
        lastCommit: {
          hash: commit.hash,
          message: commit.message,
          author: commit.author.username,
          date: commit.createdAt.toISOString(),
        },
      },
    };
  }

  async deleteFile(
    projectId: string,
    dto: DeleteFileDto,
    author: { id: string; username: string },
  ) {
    const { repo } = await this.getOrCreateRepository(projectId);
    const branchName = dto.branch || repo.defaultBranch;
    const branch = await this.repoRepository.findBranchByName(repo.id, branchName);

    if (!branch) {
      throw new NotFoundException(`Branch '${branchName}' not found`);
    }

    const file = await this.repoRepository.findFile(branch.id, dto.path);
    if (!file) {
      throw new NotFoundException(`File '${dto.path}' not found on branch '${branchName}'`);
    }

    await this.repoRepository.deleteFile(branch.id, dto.path);

    const sha = this.generateSha(dto.path);
    const commit = await this.repoRepository.createCommit({
      repositoryId: repo.id,
      hash: sha,
      message: dto.commitMessage,
      branchName: branch.name,
      authorId: author.id,
      changedFiles: [dto.path],
    });

    return {
      success: true,
      commit: {
        hash: commit.hash,
        message: commit.message,
        author: {
          username: commit.author.username,
          displayName: commit.author.profile?.displayName || commit.author.username,
          avatarUrl: commit.author.profile?.avatarUrl,
        },
        date: commit.createdAt.toISOString(),
        branch: commit.branchName,
        changedFiles: commit.changedFiles,
      },
    };
  }

  async createBranch(
    projectId: string,
    dto: CreateBranchDto,
    author: { id: string; username: string },
  ) {
    const { repo } = await this.getOrCreateRepository(projectId);
    const existing = await this.repoRepository.findBranchByName(repo.id, dto.name);
    if (existing) {
      throw new BadRequestException(`Branch '${dto.name}' already exists.`);
    }

    const sourceBranchName = dto.sourceBranch || repo.defaultBranch;
    const sourceBranch = await this.repoRepository.findBranchByName(repo.id, sourceBranchName);
    if (!sourceBranch) {
      throw new NotFoundException(`Source branch '${sourceBranchName}' not found.`);
    }

    const newBranch = await this.repoRepository.createBranch(repo.id, dto.name, false);
    const sourceFiles = await this.repoRepository.getBranchFiles(sourceBranch.id);

    await this.repoRepository.cloneFilesToBranch(
      repo.id,
      newBranch.id,
      sourceFiles.map((f) => ({
        path: f.path,
        content: f.content,
        size: f.size,
        linesCount: f.linesCount,
        lastCommitId: f.lastCommitId,
      })),
    );

    const sourceCommits = repo.commits.filter((c) => c.branchName === sourceBranch.name);
    const lastCommitHash = sourceCommits[0]?.hash || repo.commits[0]?.hash || 'init';

    return {
      name: newBranch.name,
      isDefault: newBranch.isDefault,
      lastCommitHash,
      updatedAt: newBranch.updatedAt.toISOString(),
    };
  }

  async createPullRequest(
    projectId: string,
    dto: CreatePullRequestDto,
    author: { id: string; username: string },
  ) {
    const { repo } = await this.getOrCreateRepository(projectId);
    const sourceBranch = await this.repoRepository.findBranchByName(repo.id, dto.sourceBranch);
    if (!sourceBranch) {
      throw new NotFoundException(`Source branch '${dto.sourceBranch}' not found.`);
    }

    const targetBranchName = dto.targetBranch || repo.defaultBranch;
    const targetBranch = await this.repoRepository.findBranchByName(repo.id, targetBranchName);
    if (!targetBranch) {
      throw new NotFoundException(`Target branch '${targetBranchName}' not found.`);
    }

    const number = repo.pullRequests.length + 1;
    const pr = await this.repoRepository.createPullRequest({
      repositoryId: repo.id,
      number,
      title: dto.title,
      description: dto.description,
      sourceBranch: dto.sourceBranch,
      targetBranch: targetBranchName,
      authorId: author.id,
    });

    return {
      id: pr.id,
      number: pr.number,
      title: pr.title,
      description: pr.description || '',
      sourceBranch: pr.sourceBranch,
      targetBranch: pr.targetBranch,
      status: pr.status as 'OPEN' | 'MERGED' | 'CLOSED',
      author: {
        username: pr.author.username,
        displayName: pr.author.profile?.displayName || pr.author.username,
        avatarUrl: pr.author.profile?.avatarUrl,
      },
      createdAt: pr.createdAt.toISOString(),
      updatedAt: pr.updatedAt.toISOString(),
      mergedAt: null,
      mergedBy: null,
      commentsCount: 0,
      changedFilesCount: 1,
    };
  }

  async mergePullRequest(
    projectId: string,
    prNumber: number,
    author: { id: string; username: string },
  ) {
    const { repo } = await this.getOrCreateRepository(projectId);
    const pr = await this.repoRepository.findPullRequestByNumber(repo.id, prNumber);
    if (!pr) {
      throw new NotFoundException(`Pull request #${prNumber} not found.`);
    }

    if (pr.status === 'MERGED') {
      throw new BadRequestException('Pull request has already been merged.');
    }

    const sourceBranch = await this.repoRepository.findBranchByName(repo.id, pr.sourceBranch);
    const targetBranch = await this.repoRepository.findBranchByName(repo.id, pr.targetBranch);

    if (!sourceBranch || !targetBranch) {
      throw new NotFoundException('Branches for pull request not found.');
    }

    // Merge source files into target branch
    const sourceFiles = await this.repoRepository.getBranchFiles(sourceBranch.id);
    for (const sf of sourceFiles) {
      await this.repoRepository.upsertFile({
        repositoryId: repo.id,
        branchId: targetBranch.id,
        path: sf.path,
        content: sf.content,
        size: sf.size,
        linesCount: sf.linesCount,
        lastCommitId: sf.lastCommitId || undefined,
      });
    }

    // Generate merge commit
    const mergeSha = this.generateSha(`merge-pr-${prNumber}`);
    await this.repoRepository.createCommit({
      repositoryId: repo.id,
      hash: mergeSha,
      message: `Merge pull request #${prNumber} from ${pr.sourceBranch} into ${pr.targetBranch}`,
      branchName: targetBranch.name,
      authorId: author.id,
      changedFiles: sourceFiles.map((f) => f.path),
    });

    const updatedPr = await this.repoRepository.markPullRequestMerged(pr.id, author.id);

    return {
      id: updatedPr.id,
      number: updatedPr.number,
      title: updatedPr.title,
      description: updatedPr.description || '',
      sourceBranch: updatedPr.sourceBranch,
      targetBranch: updatedPr.targetBranch,
      status: 'MERGED' as const,
      author: {
        username: updatedPr.author.username,
        displayName: updatedPr.author.profile?.displayName || updatedPr.author.username,
        avatarUrl: updatedPr.author.profile?.avatarUrl,
      },
      createdAt: updatedPr.createdAt.toISOString(),
      updatedAt: updatedPr.updatedAt.toISOString(),
      mergedAt: updatedPr.mergedAt?.toISOString() || null,
      mergedBy: author.username,
      commentsCount: 0,
      changedFilesCount: sourceFiles.length,
    };
  }

  async createRelease(
    projectId: string,
    dto: CreateReleaseDto,
    author: { id: string; username: string },
  ) {
    const { repo, project } = await this.getOrCreateRepository(projectId);
    const existing = repo.releases.find((r) => r.tagName === dto.tagName);
    if (existing) {
      throw new BadRequestException(`Release tag '${dto.tagName}' already exists.`);
    }

    const targetBranchName = dto.targetBranch || repo.defaultBranch;
    const defaultAssets = [
      {
        name: `${project.slug}-${dto.tagName}-build.zip`,
        size: '150 MB',
        downloadUrl: '#',
      },
    ];

    const release = await this.repoRepository.createRelease({
      repositoryId: repo.id,
      tagName: dto.tagName,
      title: dto.title,
      description: dto.description,
      targetBranch: targetBranchName,
      authorId: author.id,
      assets: defaultAssets,
    });

    return {
      id: release.id,
      tagName: release.tagName,
      title: release.title,
      description: release.description || '',
      targetBranch: release.targetBranch,
      author: {
        username: release.author.username,
        displayName: release.author.profile?.displayName || release.author.username,
        avatarUrl: release.author.profile?.avatarUrl,
      },
      publishedAt: release.publishedAt.toISOString(),
      assets: defaultAssets,
    };
  }
}
