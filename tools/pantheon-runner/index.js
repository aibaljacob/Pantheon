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

async function simulateBuild(jobId) {
  return new Promise((resolve, reject) => {
    console.log(`Starting build for job ${jobId}...`);
    
    // Create a dummy game executable file and zipping it.
    const buildDir = path.join(__dirname, 'workspace', jobId);
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(buildDir, 'game.exe'), 'MZ... this is a dummy executable content');
    fs.writeFileSync(path.join(buildDir, 'game.pck'), 'dummy resource pack');

    const zipPath = path.join(__dirname, 'workspace', `${jobId}.zip`);
    const { execSync } = require('child_process');
    try {
      execSync(`powershell Compress-Archive -Path ${buildDir}\\* -DestinationPath ${zipPath}`);
      console.log(`Build packaged into ${zipPath}`);
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
        await updateJobStatus(job.id, 'RUNNING', 'Starting build process...');
        
        // Wait a bit to simulate processing time
        await new Promise(r => setTimeout(r, 2000));
        
        const zipPath = await simulateBuild(job.id);
        
        await updateJobStatus(job.id, 'RUNNING', 'Build completed. Uploading artifact...');
        await uploadArtifact(job.id, zipPath);
        
        await updateJobStatus(job.id, 'SUCCESS', 'Build finished and uploaded successfully.');
        console.log(`Job ${job.id} completed successfully.`);
        
        // Cleanup
        fs.rmSync(zipPath, { force: true });
        fs.rmSync(path.join(__dirname, 'workspace', job.id), { recursive: true, force: true });
        
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
