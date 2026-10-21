/**
 * Pantheon Local Runner Agent
 *
 * Lightweight local process to start, stop, and monitor the Pantheon build runner.
 * Binds strictly to 127.0.0.1:35414 and requires a local agent token.
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = parseInt(process.env.LOCAL_AGENT_PORT || '35414', 10);
const HOST = '127.0.0.1'; // Strictly localhost only
const CONFIG_FILE = path.join(__dirname, '.agent-config.json');
const RUNNER_SCRIPT = path.join(__dirname, 'index.js');

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

/**
 * Loads or generates the cryptographically secure local agent token.
 */
function getOrCreateAgentToken(configPath = CONFIG_FILE) {
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.token === 'string' && parsed.token.length >= 32) {
        return { token: parsed.token, isNew: false };
      }
    }
  } catch (err) {
    console.warn('[agent] Could not read existing config, generating new token:', err.message);
  }

  // Generate 32 cryptographically secure random bytes (64 hex characters)
  const token = crypto.randomBytes(32).toString('hex');
  try {
    fs.writeFileSync(configPath, JSON.stringify({ token }, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
    });
  } catch (err) {
    console.error('[agent] Failed to save agent config file:', err.message);
  }

  return { token, isNew: true };
}

/**
 * Validates request authorization token using constant-time comparison.
 */
function isAuthorized(req, expectedToken) {
  if (!expectedToken) return false;

  const authHeader = req.headers['authorization'];
  let providedToken = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedToken = authHeader.substring(7).trim();
  } else if (req.headers['x-agent-token']) {
    providedToken = String(req.headers['x-agent-token']).trim();
  }

  if (!providedToken) return false;

  const expectedBuffer = Buffer.from(expectedToken);
  const providedBuffer = Buffer.from(providedToken);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

/**
 * Retrieves configured allowed origins.
 */
function getAllowedOrigins() {
  const custom = process.env.ALLOWED_ORIGINS;
  if (!custom) return DEFAULT_ALLOWED_ORIGINS;
  const split = custom.split(',').map((o) => o.trim()).filter(Boolean);
  return Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...split]));
}

/**
 * Checks whether an origin is permitted.
 */
function isOriginAllowed(origin) {
  if (!origin) return true; // Direct local calls (curl, tests, script) have no origin
  const allowed = getAllowedOrigins();
  return allowed.includes(origin);
}

/**
 * Creates the HTTP request handler and runner lifecycle manager.
 */
function createAgentServer(options = {}) {
  const configPath = options.configPath || CONFIG_FILE;
  const runnerScript = options.runnerScript || RUNNER_SCRIPT;
  const expectedToken = options.token || getOrCreateAgentToken(configPath).token;

  let runnerProcess = null;
  let isStarting = false;

  function isRunnerRunning() {
    return runnerProcess !== null && !runnerProcess.killed && runnerProcess.exitCode === null;
  }

  function startRunnerProcess() {
    if (isRunnerRunning() || isStarting) {
      return {
        alreadyRunning: true,
        message: 'Runner is already running',
        runner: isStarting ? 'starting' : 'running',
      };
    }

    isStarting = true;
    console.log('[agent] Spawning Pantheon build runner child process...');

    const child = spawn(process.execPath, [runnerScript], {
      cwd: path.dirname(runnerScript),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    runnerProcess = child;

    child.stdout.on('data', (chunk) => {
      process.stdout.write(chunk);
    });

    child.stderr.on('data', (chunk) => {
      process.stderr.write(chunk);
    });

    child.on('spawn', () => {
      isStarting = false;
      console.log(`[agent] Build runner started (PID: ${child.pid})`);
    });

    child.on('exit', (code, signal) => {
      console.log(`[agent] Build runner exited (code: ${code}, signal: ${signal})`);
      if (runnerProcess === child) {
        runnerProcess = null;
      }
      isStarting = false;
    });

    child.on('error', (err) => {
      console.error('[agent] Failed to spawn build runner:', err.message);
      if (runnerProcess === child) {
        runnerProcess = null;
      }
      isStarting = false;
    });

    return {
      alreadyRunning: false,
      message: 'Runner startup initiated',
      runner: 'starting',
    };
  }

  async function stopRunnerProcess(timeoutMs = 5000) {
    if (!isRunnerRunning()) {
      return {
        alreadyStopped: true,
        message: 'Runner is not running',
        runner: 'stopped',
      };
    }

    const proc = runnerProcess;
    console.log(`[agent] Requesting graceful shutdown of runner (PID: ${proc.pid})...`);

    return new Promise((resolve) => {
      let resolved = false;

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.warn('[agent] Runner graceful shutdown timed out. Forcing termination...');
          try {
            proc.kill('SIGKILL');
          } catch {}
          runnerProcess = null;
          resolve({
            alreadyStopped: false,
            message: 'Runner forcibly terminated after timeout',
            runner: 'stopped',
          });
        }
      }, timeoutMs);

      proc.once('exit', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          runnerProcess = null;
          resolve({
            alreadyStopped: false,
            message: 'Runner stopped gracefully',
            runner: 'stopped',
          });
        }
      });

      // Send SIGINT to invoke existing runner's handleShutdown('SIGINT')
      try {
        proc.kill('SIGINT');
      } catch (err) {
        console.error('[agent] Error sending SIGINT to runner:', err.message);
        try {
          proc.kill('SIGTERM');
        } catch {}
      }
    });
  }

  const server = http.createServer(async (req, res) => {
    const origin = req.headers['origin'];

    // CORS & Origin validation
    if (origin && isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, x-agent-token');
      res.setHeader('Access-Control-Max-Age', '86400');
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const sendJson = (statusCode, data) => {
      res.writeHead(statusCode, {
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify(data));
    };

    // Route matching
    const url = new URL(req.url, `http://${HOST}:${PORT}`);
    const pathname = url.pathname;

    // Authentication enforcement
    if (!isAuthorized(req, expectedToken)) {
      sendJson(401, {
        error: 'Unauthorized: Invalid or missing local agent token',
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/status') {
      sendJson(200, {
        agent: 'online',
        runner: isRunnerRunning() ? 'running' : 'stopped',
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/start') {
      const result = startRunnerProcess();
      sendJson(200, {
        agent: 'online',
        runner: result.runner,
        message: result.message,
        alreadyRunning: result.alreadyRunning,
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/stop') {
      const result = await stopRunnerProcess();
      sendJson(200, {
        agent: 'online',
        runner: result.runner,
        message: result.message,
        alreadyStopped: result.alreadyStopped,
      });
      return;
    }

    sendJson(404, { error: 'Not Found' });
  });

  return {
    server,
    token: expectedToken,
    isRunnerRunning,
    startRunnerProcess,
    stopRunnerProcess,
  };
}

// Standalone execution entry point
if (require.main === module) {
  const { token, isNew } = getOrCreateAgentToken();
  const { server, stopRunnerProcess, isRunnerRunning } = createAgentServer({ token });

  server.listen(PORT, HOST, () => {
    console.log('\n=======================================================');
    console.log('Pantheon Local Runner Agent');
    console.log(`Local endpoint: http://${HOST}:${PORT}`);
    console.log('Local agent token:');
    console.log(token);
    console.log('=======================================================\n');
    if (isNew) {
      console.log('New local agent token generated. Copy this into Pantheon Web UI settings.');
    } else {
      console.log('Existing local agent token loaded from .agent-config.json.');
    }
  });

  let isExiting = false;
  const cleanExit = async (signal) => {
    if (isExiting) return;
    isExiting = true;
    console.log(`\n[agent] Received ${signal}. Shutting down agent and child runner...`);
    if (isRunnerRunning()) {
      await stopRunnerProcess(4000);
    }
    server.close(() => {
      console.log('[agent] Server stopped. Goodbye.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => cleanExit('SIGINT'));
  process.on('SIGTERM', () => cleanExit('SIGTERM'));
}

module.exports = {
  createAgentServer,
  getOrCreateAgentToken,
  isAuthorized,
  PORT,
  HOST,
};
