import { PrismaClient, BuildStatus, BuildPlatform } from '@prisma/client';
import * as child_process from 'child_process';
import * as util from 'util';

const exec = util.promisify(child_process.exec);
const prisma = new PrismaClient();

async function run() {
  const project = await prisma.project.findFirst({
    where: { slug: 'godot-demo' },
  });
  
  if (!project) return;
  const projectId = project.id;
  const bareRepoPath = `d:\\Projects\\Pantheon\\repos\\godot-demo.git`;

  try {
    const { stdout } = await exec('git rev-parse main', { cwd: bareRepoPath });
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
    console.log('Created build job', job.id);
  } catch (e) {
    console.log('Error getting commit or creating job', e);
  }
}
run().then(() => process.exit(0)).catch(e => console.error(e));
