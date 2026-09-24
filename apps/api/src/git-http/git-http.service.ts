import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import type { Request, Response } from 'express';
import { ProjectAuthorizationService } from '../tasks/project-authorization.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GitHttpService {
  private readonly logger = new Logger(GitHttpService.name);
  private readonly repoRoot = process.env.PANTHEON_REPO_ROOT || path.resolve(process.cwd(), 'repos');

  constructor(
    private readonly authService: ProjectAuthorizationService,
    private readonly prisma: PrismaService,
  ) {}

  async resolveRepoPath(projectSlug: string, user: any, pat: any, runner: any, accessType: 'read' | 'write') {
    const project = await this.prisma.project.findUnique({
      where: { slug: projectSlug },
      include: { repository: true },
    });

    if (!project || !project.repository || !project.repository.repoDiskPath) {
      throw new NotFoundException('Repository not found');
    }

    // Runner access: runners are allowed 'read' access to any project since they fetch for builds.
    // Runners should not be pushing code (write access).
    if (runner) {
      if (accessType === 'write') {
        throw new ForbiddenException('Runners cannot push code');
      }
      // Allowed read access
    } else {
      if (accessType === 'read') {
        if (!pat.scopes.includes('repo:read') && !pat.scopes.includes('repo:write')) {
          throw new ForbiddenException('Token lacks repo:read scope');
        }
        await this.authService.assertCanView(project.id, user.id, user.role);
      } else if (accessType === 'write') {
        if (!pat.scopes.includes('repo:write')) {
          throw new ForbiddenException('Token lacks repo:write scope');
        }
        
        if (user.role === 'ADMINISTRATOR' || project.founderId === user.id) {
          // allowed
        } else {
          const member = await this.prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId: project.id, userId: user.id } },
          });

          if (!member || member.status !== 'ACTIVE') {
            throw new ForbiddenException('Write access requires active project membership');
          }
        }
      }
    }

    // Path traversal check
    const normalizedTarget = path.normalize(project.repository.repoDiskPath);
    if (!normalizedTarget.startsWith(this.repoRoot)) {
      throw new ForbiddenException('Invalid repository path');
    }

    return normalizedTarget;
  }

  async handleInfoRefs(
    projectSlug: string,
    service: string,
    user: any,
    pat: any,
    runner: any,
    req: Request,
    res: Response,
  ) {
    if (service !== 'git-upload-pack' && service !== 'git-receive-pack') {
      res.status(400).send('Unsupported service');
      return;
    }

    const accessType = service === 'git-receive-pack' ? 'write' : 'read';
    const repoPath = await this.resolveRepoPath(projectSlug, user, pat, runner, accessType);

    res.setHeader('Content-Type', `application/x-${service}-advertisement`);
    res.setHeader('Cache-Control', 'no-cache');

    const serviceLine = `# service=${service}\n`;
    const length = (serviceLine.length + 4).toString(16).padStart(4, '0');
    res.write(`${length}${serviceLine}0000`);

    const git = spawn('git', [service.replace('git-', ''), '--stateless-rpc', '--advertise-refs', repoPath], {
      shell: false,
    });

    git.stdout.pipe(res, { end: false });

    git.on('close', () => {
      res.end();
    });
  }

  async handleUploadPack(
    projectSlug: string,
    user: any,
    pat: any,
    runner: any,
    req: Request,
    res: Response,
  ) {
    const repoPath = await this.resolveRepoPath(projectSlug, user, pat, runner, 'read');

    res.setHeader('Content-Type', 'application/x-git-upload-pack-result');
    res.setHeader('Cache-Control', 'no-cache');

    const git = spawn('git', ['upload-pack', '--stateless-rpc', repoPath], {
      shell: false,
    });

    req.pipe(git.stdin);
    git.stdout.pipe(res);

    git.on('close', () => {
      res.end();
    });
  }

  async handleReceivePack(
    projectSlug: string,
    user: any,
    pat: any,
    runner: any,
    req: Request,
    res: Response,
  ) {
    const repoPath = await this.resolveRepoPath(projectSlug, user, pat, runner, 'write');

    const refsBefore = await this.getRefs(repoPath);

    res.setHeader('Content-Type', 'application/x-git-receive-pack-result');
    res.setHeader('Cache-Control', 'no-cache');

    const git = spawn('git', ['receive-pack', '--stateless-rpc', repoPath], {
      shell: false,
    });

    req.pipe(git.stdin);
    git.stdout.pipe(res);

    git.on('close', async (code) => {
      res.end();
      if (code === 0) {
        const refsAfter = await this.getRefs(repoPath);
        this.processPushedCommits(projectSlug, repoPath, refsBefore, refsAfter, user).catch((err) => {
          this.logger.error(`Failed to process pushed commits: ${err.message}`, err.stack);
        });
      }
    });
  }

  private async getRefs(repoPath: string): Promise<Record<string, string>> {
    return new Promise((resolve) => {
      const git = spawn('git', ['show-ref'], { cwd: repoPath });
      let output = '';
      git.stdout.on('data', (data) => {
        output += data.toString();
      });
      git.on('close', (code) => {
        const refs: Record<string, string> = {};
        if (code === 0 && output) {
          const lines = output.trim().split('\n');
          for (const line of lines) {
            const [hash, ref] = line.split(' ');
            if (hash && ref) {
              refs[ref] = hash;
            }
          }
        }
        resolve(refs);
      });
    });
  }

  private async processPushedCommits(
    projectSlug: string,
    repoPath: string,
    refsBefore: Record<string, string>,
    refsAfter: Record<string, string>,
    user: any,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { slug: projectSlug },
    });
    if (!project) return;

    for (const [ref, newHash] of Object.entries(refsAfter)) {
      const oldHash = refsBefore[ref];
      
      if (oldHash === newHash) continue;

      let revListArgs: string[] = [];
      if (!oldHash) {
        revListArgs = [newHash, '--not', '--all'];
      } else {
        revListArgs = [`${oldHash}..${newHash}`];
      }

      await this.extractCommitsAndLinkTasks(project.id, repoPath, ref, revListArgs);
    }
  }

  private async extractCommitsAndLinkTasks(projectId: string, repoPath: string, ref: string, revListArgs: string[]) {
    return new Promise<void>((resolve) => {
      const git = spawn('git', ['log', ...revListArgs, '--format=%H%x00%an%x00%ae%x00%at%x00%B%x00'], {
        cwd: repoPath,
      });

      let output = '';
      git.stdout.on('data', (data) => {
        output += data.toString();
      });

      git.on('close', async (code) => {
        if (code !== 0) {
          this.logger.error(`git log failed with code ${code}`);
          return resolve();
        }

        const commitDataList = output.split('\x00\n').filter(s => s.trim().length > 0);
        
        for (const commitRaw of commitDataList) {
          const parts = commitRaw.split('\x00');
          if (parts.length < 5) continue;

          const [hash, authorName, authorEmail, authorTime, message] = parts;
          
          await this.linkCommitToTasks(projectId, ref, {
            hash,
            authorName,
            authorEmail,
            timestamp: new Date(parseInt(authorTime, 10) * 1000),
            message: message.trim(),
          });
        }
        resolve();
      });
    });
  }

  private async linkCommitToTasks(
    projectId: string,
    ref: string,
    commit: { hash: string; authorName: string; authorEmail: string; timestamp: Date; message: string }
  ) {
    const branchName = ref.replace('refs/heads/', '');
    const taskRegex = /\[?TASK-(\d+)\]?/g;
    let match;
    const taskNumbers = new Set<number>();

    while ((match = taskRegex.exec(commit.message)) !== null) {
      taskNumbers.add(parseInt(match[1], 10));
    }

    if (taskNumbers.size === 0) return;

    const authorUser = await this.prisma.user.findFirst({
      where: { email: commit.authorEmail },
    });

    for (const taskNumber of taskNumbers) {
      const task = await this.prisma.task.findUnique({
        where: { projectId_taskNumber: { projectId, taskNumber } },
      });

      if (!task) continue;

      const existing = await this.prisma.taskCommitLink.findUnique({
        where: { taskId_commitHash: { taskId: task.id, commitHash: commit.hash } },
      });

      if (!existing) {
        await this.prisma.taskCommitLink.create({
          data: {
            taskId: task.id,
            commitHash: commit.hash,
            commitMsg: commit.message,
            authorId: authorUser?.id,
            authorName: commit.authorName,
            branchName: branchName,
            timestamp: commit.timestamp,
          },
        });
      }
    }
  }
}
