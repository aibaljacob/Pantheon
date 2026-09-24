import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import type { Request, Response } from 'express';
import { ProjectAuthorizationService } from '../tasks/project-authorization.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GitHttpService {
  private readonly repoRoot = process.env.PANTHEON_REPO_ROOT || path.resolve(process.cwd(), 'repos');

  constructor(
    private readonly authService: ProjectAuthorizationService,
    private readonly prisma: PrismaService,
  ) {}

  async resolveRepoPath(projectSlug: string, user: any, pat: any, accessType: 'read' | 'write') {
    const project = await this.prisma.project.findUnique({
      where: { slug: projectSlug },
      include: { repository: true },
    });

    if (!project || !project.repository || !project.repository.repoDiskPath) {
      throw new NotFoundException('Repository not found');
    }

    if (accessType === 'read') {
      if (!pat.scopes.includes('repo:read') && !pat.scopes.includes('repo:write')) {
        throw new ForbiddenException('Token lacks repo:read scope');
      }
      // Re-use Phase 3A logic which handles Founders, Members, Admin, Public
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
    req: Request,
    res: Response,
  ) {
    if (service !== 'git-upload-pack' && service !== 'git-receive-pack') {
      res.status(400).send('Unsupported service');
      return;
    }

    const accessType = service === 'git-receive-pack' ? 'write' : 'read';
    const repoPath = await this.resolveRepoPath(projectSlug, user, pat, accessType);

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
    req: Request,
    res: Response,
  ) {
    const repoPath = await this.resolveRepoPath(projectSlug, user, pat, 'read');

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
    req: Request,
    res: Response,
  ) {
    const repoPath = await this.resolveRepoPath(projectSlug, user, pat, 'write');

    res.setHeader('Content-Type', 'application/x-git-receive-pack-result');
    res.setHeader('Cache-Control', 'no-cache');

    const git = spawn('git', ['receive-pack', '--stateless-rpc', repoPath], {
      shell: false,
    });

    req.pipe(git.stdin);
    git.stdout.pipe(res);

    git.on('close', () => {
      res.end();
    });
  }
}
