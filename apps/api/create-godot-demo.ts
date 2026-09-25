import { PrismaClient, BuildStatus, BuildPlatform } from '@prisma/client';
import * as child_process from 'child_process';
import * as util from 'util';
import * as fs from 'fs';
import * as path from 'path';

const exec = util.promisify(child_process.exec);
const prisma = new PrismaClient();

async function run() {
  const project = await prisma.project.findFirst({
    where: { slug: 'godot-demo' },
  });

  let projectId;
  if (!project) {
    const newProject = await prisma.project.create({
      data: {
        name: 'Godot Demo',
        slug: 'godot-demo',
        description: 'Test project description',
        founderId: (await prisma.user.findFirst())!.id,
      },
    });
    projectId = newProject.id;
    console.log('Created project', projectId);
  } else {
    projectId = project.id;
  }

  // Create local repo, add project.godot, export_presets.cfg, scenes
  const repoSlug = 'godot-demo';
  const localRepoPath = path.join(__dirname, '..', '..', 'temp-demo-repo');
  
  if (fs.existsSync(localRepoPath)) {
    fs.rmSync(localRepoPath, { recursive: true, force: true });
  }
  fs.mkdirSync(localRepoPath, { recursive: true });

  await exec('git init', { cwd: localRepoPath });
  
  fs.writeFileSync(path.join(localRepoPath, 'project.godot'), `
; Engine configuration file.

[application]

config/name="GodotDemo"
run/main_scene="res://Main.tscn"

[rendering]

renderer/rendering_method="gl_compatibility"
`);

  fs.writeFileSync(path.join(localRepoPath, 'export_presets.cfg'), `
[preset.0]

name="Windows Desktop"
platform="Windows Desktop"
runnable=true
dedicated_server=false
custom_features=""
export_filter="all_resources"
include_filter=""
exclude_filter=""
export_path="PantheonGame.exe"
encryption_include_filters=""
encryption_exclude_filters=""
encrypt_pck=false
encrypt_directory=false

[preset.0.options]

custom_template/debug=""
custom_template/release=""
debug/export_console_wrapper=1
binary_format/embed_pck=true
texture_format/bptc=false
texture_format/s3tc=true
texture_format/etc=false
texture_format/etc2=false
texture_format/no_bptc_fallbacks=true
`);

  fs.writeFileSync(path.join(localRepoPath, 'Main.tscn'), `
[gd_scene format=3 uid="uid://cyb1r483k"]

[node name="Node2D" type="Node2D"]
`);

  await exec('git add .', { cwd: localRepoPath });
  await exec('git commit -m "Initial Godot Demo commit"', { cwd: localRepoPath });
  
  // Set remote to push to pantheon
  // Wait, I don't have PAT in this script easily. Let's just push directly to bare repo path.
  const bareRepoPath = `d:\\Projects\\Pantheon\\repos\\${repoSlug}.git`;
  
  if (!fs.existsSync(bareRepoPath)) {
    // Actually the backend creates it when the project is created via API, but here we used Prisma directly!
    // So we need to init bare repo.
    await exec(`git init --bare ${bareRepoPath}`);
    await prisma.projectRepository.create({
      data: {
        projectId,
        repoDiskPath: bareRepoPath
      }
    });
  }
  
  await exec(`git push ${bareRepoPath} master:main`, { cwd: localRepoPath });

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
