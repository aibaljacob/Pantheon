import { PrismaClient, BuildStatus, BuildPlatform } from '@prisma/client';
import * as child_process from 'child_process';
import * as util from 'util';

const exec = util.promisify(child_process.exec);
const prisma = new PrismaClient();

async function run() {
  const project = await prisma.project.findFirst({
    where: { slug: 'test-project' },
  });

  let projectId;
  if (!project) {
    const newProject = await prisma.project.create({
      data: {
        name: 'Test Project',
        slug: 'test-project',
        description: 'Test project description',
        founderId: (await prisma.user.findFirst())!.id,
      },
    });
    projectId = newProject.id;
    console.log('Created project', projectId);
  } else {
    projectId = project.id;
  }

  // Find a commit from the repo.
  const repoSlug = 'test-project';
  const repoPath = `d:\\Projects\\Pantheon\\repos\\${repoSlug}.git`;
  try {
    const { stdout } = await exec('git rev-parse HEAD', { cwd: repoPath });
    const commitHash = stdout.trim();

    const job = await prisma.buildJob.create({
      data: {
        projectId,
        commitHash,
        branchName: 'main',
        targetPlatform: BuildPlatform.WINDOWS,
        status: BuildStatus.QUEUED,
        triggeredById: (await prisma.user.findFirst())!.id,
      },
    });
    console.log('Created job', job.id);
  } catch (e) {
    console.log('Error', e);
  }
}
run().then(() => process.exit(0)).catch(e => console.error(e));
