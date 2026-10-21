const fs = require('fs');
const path = require('path');
const http = require('http');
const {
  createAgentServer,
  getOrCreateAgentToken,
  isAuthorized,
  PORT,
  HOST,
} = require('./agent');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      ...options,
      agent: false,
      headers: {
        Connection: 'close',
        ...(options.headers || {}),
      },
    };
    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
          });
        } catch {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            rawBody: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

describe('Pantheon Local Runner Agent', () => {
  const testDir = path.join(__dirname, 'test-scratch-' + Date.now());
  const testConfigPath = path.join(testDir, '.agent-config.json');
  const dummyRunnerPath = path.join(testDir, 'dummy-runner.js');

  let agentInstance = null;
  let testPort = 0;

  beforeAll(() => {
    fs.mkdirSync(testDir, { recursive: true });
    // Write a mock child runner script that listens to SIGINT/SIGTERM and exits cleanly
    fs.writeFileSync(
      dummyRunnerPath,
      `
      console.log('Mock runner started');
      process.on('SIGINT', () => {
        console.log('Mock runner handling SIGINT');
        process.exit(0);
      });
      process.on('SIGTERM', () => {
        console.log('Mock runner handling SIGTERM');
        process.exit(0);
      });
      setInterval(() => {}, 1000);
      `,
      'utf8'
    );
  });

  afterAll(() => {
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  afterEach(async () => {
    if (agentInstance) {
      if (agentInstance.isRunnerRunning()) {
        await agentInstance.stopRunnerProcess(1000);
      }
      await new Promise((resolve) => agentInstance.server.close(resolve));
      agentInstance = null;
    }
  });

  describe('1. Token Generation and Persistence', () => {
    it('generates a 64-character hex cryptographic token and persists to file', () => {
      const res1 = getOrCreateAgentToken(testConfigPath);
      expect(res1.isNew).toBe(true);
      expect(res1.token).toMatch(/^[0-9a-f]{64}$/);
      expect(fs.existsSync(testConfigPath)).toBe(true);

      // Verify second call loads the same token
      const res2 = getOrCreateAgentToken(testConfigPath);
      expect(res2.isNew).toBe(false);
      expect(res2.token).toBe(res1.token);
    });
  });

  describe('2. Localhost Binding & Server Security', () => {
    it('binds strictly to 127.0.0.1 and enforces configured port', () => {
      expect(HOST).toBe('127.0.0.1');
      expect(PORT).toBe(35414);
    });
  });

  describe('3. Agent API & Authentication', () => {
    let authToken;

    beforeEach(async () => {
      authToken = 'test-secret-token-' + 'a'.repeat(46);
      agentInstance = createAgentServer({
        configPath: testConfigPath,
        runnerScript: dummyRunnerPath,
        token: authToken,
      });

      await new Promise((resolve) => {
        agentInstance.server.listen(0, '127.0.0.1', () => {
          testPort = agentInstance.server.address().port;
          resolve();
        });
      });
    });

    it('rejects unauthorized GET /status with 401', async () => {
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: testPort,
        path: '/status',
        method: 'GET',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toMatch(/Unauthorized/);
    });

    it('rejects unauthorized POST /start with 401', async () => {
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: testPort,
        path: '/start',
        method: 'POST',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toMatch(/Unauthorized/);
    });

    it('rejects unauthorized POST /stop with 401', async () => {
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: testPort,
        path: '/stop',
        method: 'POST',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toMatch(/Unauthorized/);
    });

    it('rejects request with invalid token', async () => {
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: testPort,
        path: '/status',
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid-token-xyz',
        },
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toMatch(/Unauthorized/);
    });

    it('allows authorized GET /status with Bearer token', async () => {
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: testPort,
        path: '/status',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        agent: 'online',
        runner: 'stopped',
      });
    });

    it('allows authorized GET /status with x-agent-token header', async () => {
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: testPort,
        path: '/status',
        method: 'GET',
        headers: {
          'x-agent-token': authToken,
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.agent).toBe('online');
    });

    it('handles OPTIONS preflight with CORS headers for allowed origins', async () => {
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: testPort,
        path: '/start',
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:5173',
          'Access-Control-Request-Method': 'POST',
        },
      });

      expect(res.statusCode).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-methods']).toMatch(/POST/);
    });
  });

  describe('4. Runner Process Lifecycle & Concurrency Protection', () => {
    let authToken;

    beforeEach(async () => {
      authToken = 'test-secret-token-' + 'b'.repeat(46);
      agentInstance = createAgentServer({
        configPath: testConfigPath,
        runnerScript: dummyRunnerPath,
        token: authToken,
      });

      await new Promise((resolve) => {
        agentInstance.server.listen(0, '127.0.0.1', () => {
          testPort = agentInstance.server.address().port;
          resolve();
        });
      });
    });

    it('starts child runner on POST /start and prevents duplicate starts', async () => {
      // 1. First start
      const res1 = await makeRequest({
        hostname: '127.0.0.1',
        port: testPort,
        path: '/start',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res1.statusCode).toBe(200);
      expect(res1.body.alreadyRunning).toBe(false);
      expect(agentInstance.isRunnerRunning()).toBe(true);

      // 2. Status check shows running
      const resStatus = await makeRequest({
        hostname: '127.0.0.1',
        port: testPort,
        path: '/status',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      expect(resStatus.body.runner).toBe('running');

      // 3. Second start attempt must NOT spawn duplicate process
      const res2 = await makeRequest({
        hostname: '127.0.0.1',
        port: testPort,
        path: '/start',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(res2.statusCode).toBe(200);
      expect(res2.body.alreadyRunning).toBe(true);
      expect(res2.body.message).toMatch(/already running/);

      // 4. Graceful stop on POST /stop
      const resStop = await makeRequest({
        hostname: '127.0.0.1',
        port: testPort,
        path: '/stop',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(resStop.statusCode).toBe(200);
      expect(resStop.body.runner).toBe('stopped');
      expect(agentInstance.isRunnerRunning()).toBe(false);

      // 5. Stopping again returns already stopped
      const resStopAgain = await makeRequest({
        hostname: '127.0.0.1',
        port: testPort,
        path: '/stop',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(resStopAgain.statusCode).toBe(200);
      expect(resStopAgain.body.alreadyStopped).toBe(true);
    });
  });
});
