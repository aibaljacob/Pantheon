require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const FormData = require('form-data');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const RUNNER_NAME = process.env.RUNNER_NAME || 'Local Windows Runner';
const PLATFORM = process.env.PLATFORM || 'WINDOWS';

let RUNNER_ID = process.env.RUNNER_ID;
let RUNNER_TOKEN = process.env.RUNNER_TOKEN;

async function registerRunner() {
  console.log('Registering new runner...');
  try {
    const res = await axios.post(`${API_URL}/build-runners/register`, {
      name: RUNNER_NAME,
      platform: PLATFORM
    });
    
    RUNNER_ID = res.data.id;
    RUNNER_TOKEN = res.data.token;
    
    // Save to .env
    const envContent = `API_URL=${API_URL}\nRUNNER_NAME=${RUNNER_NAME}\nPLATFORM=${PLATFORM}\nRUNNER_ID=${RUNNER_ID}\nRUNNER_TOKEN=${RUNNER_TOKEN}\n`;
    fs.writeFileSync(path.join(__dirname, '.env'), envContent);
    console.log(`Registered successfully as ${RUNNER_ID}`);
  } catch (err) {
    console.error('Failed to register runner:', err.response?.data || err.message);
    process.exit(1);
  }
}

function getHeaders() {
  return {
    'x-runner-id': RUNNER_ID,
    'x-runner-token': RUNNER_TOKEN
  };
}

async function heartbeat() {
  try {
    await axios.post(`${API_URL}/build-runners/heartbeat`, {}, { headers: getHeaders() });
    console.log('Heartbeat OK');
  } catch (err) {
    console.error('Heartbeat failed:', err.response?.data || err.message);
  }
}

const util = require('util');
const execFile = util.promisify(require('child_process').execFile);

async function checkoutSource(job, buildDir, logFn) {
  const commitHash = job.commitHash;
  if (!commitHash || !/^[0-9a-f]{5,40}$/i.test(commitHash)) {
    throw new Error('Invalid or missing commitHash in job.');
  }
  const slug = job.project?.slug;
  if (!slug) {
    throw new Error('Project slug missing in job.');
  }

  const repoUrl = `${API_URL}/repos/${slug}.git`;
  const repoDir = path.join(buildDir, 'repo');

  logFn(`[runner] Starting build job ${job.id}`);
  logFn(`[runner] Preparing workspace`);
  logFn(`[runner] Repository: ${API_URL}/repos/${slug}.git`);

  const b64 = Buffer.from(`${RUNNER_ID}:${RUNNER_TOKEN}`).toString('base64');
  const authArg = `http.extraHeader=Authorization: Basic ${b64}`;

  logFn(`[runner] Fetching source`);
  try {
    await execFile('git', [
      '-c', authArg,
      'clone',
      '--no-checkout',
      repoUrl,
      repoDir
    ], { shell: false });
  } catch (err) {
    throw new Error(`Git clone failed.`);
  }

  logFn(`[runner] Checking out commit ${commitHash.substring(0, 7)}`);
  try {
    await execFile('git', ['checkout', commitHash], { cwd: repoDir, shell: false });
  } catch (err) {
    throw new Error(`Git checkout failed for commit ${commitHash}.`);
  }

  const { stdout } = await execFile('git', ['rev-parse', 'HEAD'], { cwd: repoDir, shell: false });
  const headHash = stdout.trim();
  
  // We use startsWith because commitHash could be a short hash
  if (!headHash.startsWith(commitHash)) {
    throw new Error(`HEAD verification failed. Expected ${commitHash}, got ${headHash}`);
  }
  
  logFn(`[runner] HEAD verified: ${headHash.substring(0, 7)}`);
  logFn(`[runner] Source checkout complete`);
  
  return repoDir;
}

async function simulateBuild(jobId, buildDir, logFn) {
  return new Promise((resolve, reject) => {
    logFn(`[runner] Starting build stage for job ${jobId}...`);
    
    const artifactDir = path.join(buildDir, 'artifact');
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(artifactDir, 'game.exe'), 'MZ... this is a dummy executable content');
    fs.writeFileSync(path.join(artifactDir, 'game.pck'), 'dummy resource pack');

    const zipPath = path.join(buildDir, `${jobId}.zip`);
    const { execSync } = require('child_process');
    try {
      execSync(`powershell Compress-Archive -Path ${artifactDir}\\* -DestinationPath ${zipPath}`);
      logFn(`[runner] Build packaged into ${zipPath}`);
      resolve(zipPath);
    } catch(err) {
      reject(err);
    }
  });
}

async function uploadArtifact(jobId, zipPath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(zipPath));

  const headers = {
    ...getHeaders(),
    ...form.getHeaders()
  };

  try {
    const res = await axios.post(`${API_URL}/build-runners/jobs/${jobId}/artifacts`, form, { headers });
    console.log('Artifact uploaded successfully:', res.data);
  } catch (err) {
    console.error('Failed to upload artifact:', err.response?.data || err.message);
    throw err;
  }
}

async function updateJobStatus(jobId, status, logs = null, errorMessage = null) {
  try {
    const payload = { status };
    if (logs) payload.buildLogs = logs;
    if (errorMessage) payload.errorMessage = errorMessage;
    
    await axios.patch(`${API_URL}/build-runners/jobs/${jobId}/status`, payload, { headers: getHeaders() });
  } catch (err) {
    console.error(`Failed to update job ${jobId} status to ${status}:`, err.response?.data || err.message);
  }
}

async function pollJobs() {
  try {
    const res = await axios.post(`${API_URL}/build-runners/jobs/claim`, {}, { headers: getHeaders() });
    
    if (res.data.job) {
      const job = res.data.job;
      console.log(`Claimed job: ${job.id}`);
      
      try {
        let logs = '';
        const logFn = (msg) => {
          console.log(msg);
          logs += msg + '\n';
        };

        const buildDir = path.join(__dirname, 'workspace', job.id);
        if (fs.existsSync(buildDir)) {
          fs.rmSync(buildDir, { recursive: true, force: true });
        }
        fs.mkdirSync(buildDir, { recursive: true });

        await updateJobStatus(job.id, 'RUNNING', logs);
        
        // 1. Checkout Source
        await checkoutSource(job, buildDir, logFn);
        await updateJobStatus(job.id, 'RUNNING', logs);

        // 2. Build Execution (Simulated)
        const zipPath = await simulateBuild(job.id, buildDir, logFn);
        
        logFn('[runner] Build completed. Uploading artifact...');
        await updateJobStatus(job.id, 'RUNNING', logs);
        await uploadArtifact(job.id, zipPath);
        
        logFn('[runner] Build finished and uploaded successfully.');
        await updateJobStatus(job.id, 'SUCCESS', logs);
        console.log(`Job ${job.id} completed successfully.`);
        
        // Cleanup
        fs.rmSync(buildDir, { recursive: true, force: true });
        
      } catch (err) {
        console.error(`Job ${job.id} failed:`, err);
        await updateJobStatus(job.id, 'FAILED', null, err.message);
      }
    }
  } catch (err) {
    // Only log if it's not a standard 404/not found.
    if (err.response?.status !== 404) {
      console.error('Error polling jobs (message):', err.message);
      console.error('Error polling jobs (data):', err.response?.data);
      console.error(err);
    }
  }
}

async function start() {
  if (!RUNNER_ID || !RUNNER_TOKEN) {
    await registerRunner();
  } else {
    console.log(`Starting runner with ID ${RUNNER_ID}`);
  }

  // Initial heartbeat
  await heartbeat();

  setInterval(heartbeat, 30000); // 30s heartbeat
  setInterval(pollJobs, 5000);   // 5s poll interval

  console.log('Runner is active and polling for jobs...');
}

start();
