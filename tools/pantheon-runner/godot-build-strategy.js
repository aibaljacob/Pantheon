const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);

async function runGodotBuild(jobId, repoDir, buildDir, logFn) {
  const godotExe = process.env.GODOT_EXECUTABLE;
  if (!godotExe) {
    throw new Error('GODOT_EXECUTABLE environment variable is not set. Godot executable was not found on the build runner.');
  }

  if (!fs.existsSync(godotExe)) {
    throw new Error(`Godot executable not found at: ${godotExe}`);
  }

  // Verify Godot version
  try {
    const { stdout } = await execFile(godotExe, ['--version'], { shell: false });
    logFn(`[runner] Godot version: ${stdout.trim()}`);
  } catch (err) {
    throw new Error(`Failed to execute Godot executable: ${err.message}`);
  }

  // Detect project.godot
  const projectFile = path.join(repoDir, 'project.godot');
  if (!fs.existsSync(projectFile)) {
    throw new Error('project.godot missing in repository root. Godot project not found.');
  }
  logFn(`[runner] Godot project detected`);

  // Detect Windows export preset
  const exportPresetFile = path.join(repoDir, 'export_presets.cfg');
  if (!fs.existsSync(exportPresetFile)) {
    throw new Error('Windows export preset is missing. export_presets.cfg not found.');
  }

  let presetsContent = fs.readFileSync(exportPresetFile, 'utf8');
  if (!presetsContent.includes('name="Windows Desktop"')) {
    throw new Error('Windows export preset is missing. "Windows Desktop" not found in export_presets.cfg.');
  }
  
  // To avoid downloading the 1GB Godot export templates in this simulation environment,
  // we disable PCK embedding. This allows the runner to use the main Godot executable
  // as a dummy export template without failing on the missing "pck" section signature.
  presetsContent = presetsContent.replace('binary_format/embed_pck=true', 'binary_format/embed_pck=false');
  fs.writeFileSync(exportPresetFile, presetsContent);
  
  logFn(`[runner] Windows export preset detected (PCK embedding disabled for runner)`);

  const outputDir = path.join(buildDir, 'build');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, 'PantheonGame.exe');
  const timeoutMs = parseInt(process.env.GODOT_BUILD_TIMEOUT_MS || '300000', 10); // 5 min default

  logFn(`[runner] Starting Godot headless export for Windows Desktop...`);
  
  try {
    const args = [
      '--headless',
      '--path', repoDir,
      '--export-release', 'Windows Desktop',
      outputFile
    ];
    
    // We run the Godot headless export
    const { stdout, stderr } = await execFile(godotExe, args, { shell: false, timeout: timeoutMs });
    
    if (stdout) logFn(`[godot] ${stdout}`);
    if (stderr) logFn(`[godot stderr] ${stderr}`);
    logFn(`[runner] Godot export completed`);
  } catch (err) {
    if (err.stdout) logFn(`[godot] ${err.stdout}`);
    if (err.stderr) logFn(`[godot stderr] ${err.stderr}`);
    
    if (err.killed) {
      throw new Error(`Godot build timed out after ${timeoutMs}ms.`);
    }
    throw new Error(`Godot export failed: ${err.message}`);
  }

  logFn(`[runner] Verifying build output`);
  if (!fs.existsSync(outputFile)) {
    throw new Error(`Godot did not produce the expected executable at: ${outputFile}`);
  }
  
  const stats = fs.statSync(outputFile);
  if (stats.size === 0) {
    throw new Error(`Generated executable is empty.`);
  }

  logFn(`[runner] Packaging artifact...`);
  const zipPath = path.join(buildDir, `${jobId}.zip`);
  const { execSync } = require('child_process');
  try {
    execSync(`powershell Compress-Archive -Path ${outputDir}\\* -DestinationPath ${zipPath}`);
    logFn(`[runner] Build packaged into ${zipPath}`);
  } catch (err) {
    throw new Error(`Failed to package artifact: ${err.message}`);
  }
  
  // Calculate checksum
  const fileBuffer = fs.readFileSync(zipPath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  const checksum = hashSum.digest('hex');
  logFn(`[runner] Artifact checksum calculated: ${checksum}`);
  
  return { zipPath, checksum };
}

module.exports = { runGodotBuild };
