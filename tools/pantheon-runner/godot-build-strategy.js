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

  // Derive normal Godot engine executable from GODOT_EXECUTABLE (which may point to _console.exe)
  const mainEngineExe = godotExe.replace(/_console\.exe$/i, '.exe');
  if (!fs.existsSync(mainEngineExe)) {
    throw new Error(`The normal Windows Godot executable was not found at: ${mainEngineExe}. It is required as the export template.`);
  }

  const templatePath = mainEngineExe.replace(/\\/g, '/');

  // Disable PCK embedding so the main Godot executable can load the companion .pck file
  if (presetsContent.includes('binary_format/embed_pck=')) {
    presetsContent = presetsContent.replace(/binary_format\/embed_pck=(true|false)/g, 'binary_format/embed_pck=false');
  } else {
    presetsContent += '\nbinary_format/embed_pck=false';
  }

  // Point release and debug custom templates to the normal Godot engine binary
  if (presetsContent.includes('custom_template/release=')) {
    presetsContent = presetsContent.replace(/custom_template\/release="[^"]*"/g, `custom_template/release="${templatePath}"`);
  } else {
    presetsContent += `\ncustom_template/release="${templatePath}"`;
  }

  if (presetsContent.includes('custom_template/debug=')) {
    presetsContent = presetsContent.replace(/custom_template\/debug="[^"]*"/g, `custom_template/debug="${templatePath}"`);
  } else {
    presetsContent += `\ncustom_template/debug="${templatePath}"`;
  }

  // Disable export_console_wrapper to prevent exporting wrapper stub
  if (presetsContent.includes('debug/export_console_wrapper=')) {
    presetsContent = presetsContent.replace(/debug\/export_console_wrapper=\d+/g, 'debug/export_console_wrapper=0');
  } else {
    presetsContent += '\ndebug/export_console_wrapper=0';
  }

  // Disable application/modify_resources to prevent requiring rcedit during headless export
  if (presetsContent.includes('application/modify_resources=')) {
    presetsContent = presetsContent.replace(/application\/modify_resources=(true|false)/g, 'application/modify_resources=false');
  } else {
    presetsContent += '\napplication/modify_resources=false';
  }

  fs.writeFileSync(exportPresetFile, presetsContent);
  
  logFn(`[runner] Windows export preset configured (main engine template: ${templatePath}, embed_pck=false, console_wrapper=0, modify_resources=false)`);

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
