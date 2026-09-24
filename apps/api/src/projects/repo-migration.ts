import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { GitService } from './git.service';
import * as path from 'path';
import { Logger } from '@nestjs/common';

const logger = new Logger('RepoMigration');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const gitService = app.get(GitService);

  const repoRoot = process.env.PANTHEON_REPO_ROOT || path.resolve(process.cwd(), 'repos');

  logger.log(`Starting repository migration. Repo Root: ${repoRoot}`);

  const repos = await prisma.projectRepository.findMany({
    include: {
      project: {
        include: {
          founder: true,
        },
      },
      branches: true,
      files: true,
    },
  });

  logger.log(`Found ${repos.length} repositories to migrate/check.`);

  for (const repo of repos) {
    const slug = repo.project.slug;
    const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, '');
    const repoDiskPath = path.resolve(repoRoot, `${safeSlug}.git`);

    if (!repo.repoDiskPath) {
      await prisma.projectRepository.update({
        where: { id: repo.id },
        data: { repoDiskPath },
      });
      logger.log(`Updated repoDiskPath for ${repo.project.name}`);
    }

    const isValid = await gitService.isValidRepository(repoDiskPath);
    if (!isValid) {
      logger.log(`Initializing bare git repository for ${repo.project.name} at ${repoDiskPath}`);
      await gitService.initBareRepository(repoDiskPath, repo.defaultBranch || 'main');

      // Migrate existing virtual files
      const defaultBranch = repo.branches.find((b) => b.name === repo.defaultBranch) || repo.branches[0];
      let filesToCommit: { path: string; content: string }[] = [];

      if (defaultBranch) {
        const virtualFiles = await prisma.repoFile.findMany({ where: { branchId: defaultBranch.id } });
        if (virtualFiles.length > 0) {
          logger.log(`Migrating ${virtualFiles.length} virtual files...`);
          filesToCommit = virtualFiles.map((f) => ({
            path: f.path,
            content: f.content,
          }));
        }
      }

      if (filesToCommit.length === 0) {
        // Fallback to starter files if no virtual files exist
        logger.log(`No virtual files found. Creating starter files...`);
        const isUnity = repo.project.gameEngine?.toLowerCase().includes('unity');
        const isGodot = repo.project.gameEngine?.toLowerCase().includes('godot');
        const engineLabel = isUnity
          ? 'Unity LTS'
          : isGodot
          ? 'Godot Engine 4.x'
          : 'Unreal Engine 5.x';

        filesToCommit = [
          { path: 'README.md', content: `# ${repo.project.name}\n\nMigrated to Pantheon Native Git.` },
        ];
      }

      try {
        await gitService.createInitialCommitFromFiles(
          repoDiskPath,
          filesToCommit,
          `chore: initialize repository and migrate virtual files`,
          repo.project.founder.username,
          `${repo.project.founder.username}@pantheon.studio`,
          repo.defaultBranch || 'main'
        );
        logger.log(`Migration commit created for ${repo.project.name}`);
      } catch (err: any) {
        logger.error(`Failed to create migration commit for ${repo.project.name}: ${err.message}`);
      }
    } else {
      logger.log(`Repository ${repo.project.name} is already valid on disk.`);
    }
  }

  logger.log('Migration complete.');
  await app.close();
}

bootstrap().catch((err) => {
  logger.error(err);
  process.exit(1);
});
