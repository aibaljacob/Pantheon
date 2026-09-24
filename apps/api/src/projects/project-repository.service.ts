import {
  Injectable,
  NotFoundException,
  BadRequestException,
  NotImplementedException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as path from 'path';
import { ProjectRepositoryRepository } from './project-repository.repository';
import { PrismaService } from '../prisma/prisma.service';
import { GitService, GitTreeItem } from './git.service';
import { ProjectAuthorizationService } from '../tasks/project-authorization.service';
import type { AuthenticatedUser } from '../auth/current-user.decorator';
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
  private readonly logger = new Logger(ProjectRepositoryService.name);
  private readonly repoRoot = process.env.PANTHEON_REPO_ROOT || path.resolve(process.cwd(), 'repos');

  constructor(
    private readonly repoRepository: ProjectRepositoryRepository,
    private readonly gitService: GitService,
    private readonly prisma: PrismaService,
    private readonly authService: ProjectAuthorizationService,
  ) {}

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

    const readmeContent = `# ${projectName}\n\n${description || 'A collaborative game production project on Pantheon.'}\n\n## Game Overview\n- **Engine**: ${engineLabel}\n- **VCS & Architecture**: Git Monorepo Architecture\n- **Production Studio**: Pantheon Studio\n\n## Getting Started\n1. Clone the repository:\n\`\`\`bash\ngit clone https://git.pantheon.studio/projects/${projectSlug}.git\n\`\`\`\n2. Checkout the default branch:\n\`\`\`bash\ngit checkout main\n\`\`\`\n3. Open the project in ${engineLabel} to verify engine compatibility.\n`;

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

  private resolveSafeRepoPath(slug: string): string {
    // Basic sanitization
    const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, '');
    const repoPath = path.resolve(this.repoRoot, `${safeSlug}.git`);
    // Ensure it doesn't escape the repoRoot
    if (!repoPath.startsWith(this.repoRoot)) {
      throw new BadRequestException('Invalid project slug');
    }
    return repoPath;
  }

  async getOrCreateRepository(projectId: string) {
    const project = await this.repoRepository.findProjectWithDetails(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    let repo = await this.repoRepository.findRepositoryByProjectId(projectId);
    let repoDiskPath = repo?.repoDiskPath;

    // If repository doesn't exist in DB, create it
    if (!repo) {
      repoDiskPath = this.resolveSafeRepoPath(project.slug);
      
      const createdRepo = await this.repoRepository.createRepository(projectId, 'main');
      
      // Update with repoDiskPath
      await this.prisma.projectRepository.update({
        where: { id: createdRepo.id },
        data: { repoDiskPath }
      });
      
      repo = await this.repoRepository.findRepositoryByProjectId(projectId);
    }

    // Ensure repoDiskPath is populated
    if (!repoDiskPath) {
      repoDiskPath = this.resolveSafeRepoPath(project.slug);
      await this.prisma.projectRepository.update({
        where: { id: repo!.id },
        data: { repoDiskPath }
      });
      repo!.repoDiskPath = repoDiskPath;
    }

    // Initialize physical bare repository if it doesn't exist
    const isValid = await this.gitService.isValidRepository(repoDiskPath);
    if (!isValid) {
      this.logger.log(`Initializing bare git repository at ${repoDiskPath}`);
      await this.gitService.initBareRepository(repoDiskPath, repo!.defaultBranch || 'main');
      
      const starterFiles = this.generateStarterFiles(
        project.name,
        project.slug,
        project.gameEngine,
        project.description,
      );

      // Create initial commit with starter files
      await this.gitService.createInitialCommitFromFiles(
        repoDiskPath,
        starterFiles,
        `chore: initialize repository for ${project.name}`,
        project.founder.username,
        `${project.founder.username}@pantheon.studio`,
        repo!.defaultBranch || 'main'
      );
    }

    return { project, repo: repo! };
  }
  async getRepository(projectId: string, user: AuthenticatedUser | undefined, branchName?: string) {
    await this.authService.assertCanView(projectId, user?.id, user?.role);

    const { project, repo } = await this.getOrCreateRepository(projectId);
    const repoPath = repo.repoDiskPath!;

    const gitBranches = await this.gitService.listBranches(repoPath);
    const activeBranchName = branchName || repo.defaultBranch || 'main';
    
    // Fetch commits
    const gitCommits = await this.gitService.listCommits(repoPath, activeBranchName, 50).catch(() => []);
    
    // Fetch tree
    const tree = await this.gitService.getTree(repoPath, activeBranchName).catch(() => []);

    const files: RepoFileItem[] = [];
    for (const item of tree) {
      if (item.type === 'blob') {
        const ext = path.extname(item.path);
        // Only load text files into memory to avoid huge payloads. 
        // For phase 3A, we'll try to fetch content. In production we'd paginate or only fetch on demand.
        const isText = ['.txt', '.md', '.json', '.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.cs', '.cpp', '.h', '.gitignore', '.gitattributes'].includes(ext);
        
        let content = '';
        let linesCount = 0;
        if (isText && (item.size || 0) < 100000) { // Limit to 100KB
          content = await this.gitService.getFileContent(repoPath, activeBranchName, item.path).catch(() => '');
          linesCount = content.split('\n').length;
        }

        // For this UI, we need the last commit that touched the file.
        // We'll approximate this by taking the latest commit on the branch since doing `git log -1 -- path` for every file is slow.
        // Or we could run git log once per file, but for Phase 3A let's use the top commit for simplicity.
        const topCommit = gitCommits[0];

        files.push({
          path: item.path,
          content,
          size: item.size || 0,
          linesCount,
          lastCommit: {
            hash: topCommit?.hash || 'init',
            message: topCommit?.message || 'initial commit',
            author: topCommit?.authorName || project.founder.username,
            date: topCommit?.date || repo.createdAt.toISOString(),
          },
        });
      }
    }

    const commits: RepoCommitItem[] = gitCommits.map((c) => ({
      hash: c.hash,
      message: c.message,
      author: {
        username: c.authorName,
        displayName: c.authorName,
      },
      date: new Date(c.date).toISOString(),
      branch: activeBranchName,
      changedFiles: [], // Omitted for brevity in listing
    }));

    const branches: RepoBranchItem[] = gitBranches.map((b) => ({
      name: b.name,
      isDefault: b.isDefault,
      lastCommitHash: b.lastCommitHash,
      updatedAt: repo.updatedAt.toISOString(), // Approximation
    }));

    const pullRequests: RepoPullRequestItem[] = []; // Virtual PRs not supported in Phase 3A
    const releases: RepoReleaseItem[] = []; // Virtual Releases not supported in Phase 3A

    const languages = this.calculateLanguages(files);
    const totalLines = files.reduce((acc, f) => acc + f.linesCount, 0);
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);

    return {
      name: project.name,
      slug: project.slug,
      gameEngine: project.gameEngine,
      currentBranch: activeBranchName,
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

  async getFileContent(projectId: string, filePath: string, user: AuthenticatedUser | undefined, branchName: string = 'main') {
    await this.authService.assertCanView(projectId, user?.id, user?.role);

    const { repo } = await this.getOrCreateRepository(projectId);
    const repoPath = repo.repoDiskPath!;
    
    try {
      const content = await this.gitService.getFileContent(repoPath, branchName, filePath);
      
      const commits = await this.gitService.listCommits(repoPath, branchName, 1);
      const topCommit = commits[0];

      return {
        path: filePath,
        content,
        size: Buffer.byteLength(content, 'utf8'),
        linesCount: content.split('\n').length,
        lastCommit: {
          hash: topCommit?.hash || 'init',
          message: topCommit?.message || 'initial commit',
          author: topCommit?.authorName || 'developer',
          date: topCommit?.date || new Date().toISOString(),
        },
      };
    } catch (err) {
      throw new NotFoundException(`File not found at path: ${filePath}`);
    }
  }

  async commitFile(
    projectId: string,
    dto: CommitFileDto,
    author: { id: string; username: string },
  ) {
    throw new NotImplementedException('Repository mutation via API is disabled in Phase 3A.');
  }

  async deleteFile(
    projectId: string,
    dto: DeleteFileDto,
    author: { id: string; username: string },
  ) {
    throw new NotImplementedException('Repository mutation via API is disabled in Phase 3A.');
  }

  async createBranch(
    projectId: string,
    dto: CreateBranchDto,
    author: { id: string; username: string },
  ) {
    throw new NotImplementedException('Repository mutation via API is disabled in Phase 3A.');
  }

  async createPullRequest(
    projectId: string,
    dto: CreatePullRequestDto,
    author: { id: string; username: string },
  ) {
    throw new NotImplementedException('Repository mutation via API is disabled in Phase 3A.');
  }

  async mergePullRequest(
    projectId: string,
    prNumber: number,
    author: { id: string; username: string },
  ) {
    throw new NotImplementedException('Repository mutation via API is disabled in Phase 3A.');
  }

  async createRelease(
    projectId: string,
    dto: CreateReleaseDto,
    author: { id: string; username: string },
  ) {
    throw new NotImplementedException('Repository mutation via API is disabled in Phase 3A.');
  }
}
