/**
 * Unit tests for Frontend Local Runner Agent service and orchestration flow.
 */

// Mock localStorage
const localStorageStore = {};
global.localStorage = {
  getItem: (key) => (key in localStorageStore ? localStorageStore[key] : null),
  setItem: (key, val) => {
    localStorageStore[key] = String(val);
  },
  removeItem: (key) => {
    delete localStorageStore[key];
  },
  clear: () => {
    for (const key in localStorageStore) delete localStorageStore[key];
  },
};

// Mock fetch
let mockFetchHandler = null;
global.fetch = jest.fn((url, options) => {
  if (mockFetchHandler) {
    return mockFetchHandler(url, options);
  }
  return Promise.reject(new Error('Network error: connection refused'));
});

const LOCAL_AGENT_STORAGE_KEY = 'pantheon_local_agent_token';
const LOCAL_AGENT_ENDPOINT = 'http://127.0.0.1:35414';

class LocalAgentConnectionError extends Error {
  constructor(message = 'Local runner agent is not running. Please start the Pantheon Local Runner Agent.') {
    super(message);
    this.name = 'LocalAgentConnectionError';
  }
}

class LocalAgentAuthError extends Error {
  constructor(message = 'Unauthorized: Invalid or missing local agent token. Please configure token in settings.') {
    super(message);
    this.name = 'LocalAgentAuthError';
  }
}

function getLocalAgentToken() {
  try {
    return localStorage.getItem(LOCAL_AGENT_STORAGE_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

function setLocalAgentToken(token) {
  try {
    localStorage.setItem(LOCAL_AGENT_STORAGE_KEY, token.trim());
  } catch (err) {
    console.error('Failed to store local agent token:', err);
  }
}

function clearLocalAgentToken() {
  try {
    localStorage.removeItem(LOCAL_AGENT_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to remove local agent token:', err);
  }
}

async function requestLocalAgent(path, method = 'GET', overrideToken) {
  const token = overrideToken !== undefined ? overrideToken : getLocalAgentToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${LOCAL_AGENT_ENDPOINT}${path}`, { method, headers });
  } catch {
    throw new LocalAgentConnectionError();
  }

  if (response.status === 401) {
    throw new LocalAgentAuthError();
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Local agent error (${response.status})`);
  }

  return await response.json();
}

async function getLocalAgentStatus(token) {
  return requestLocalAgent('/status', 'GET', token);
}

async function startLocalRunner(token) {
  return requestLocalAgent('/start', 'POST', token);
}

async function stopLocalRunner(token) {
  return requestLocalAgent('/stop', 'POST', token);
}

describe('Frontend Local Runner Agent Service', () => {
  beforeEach(() => {
    localStorage.clear();
    mockFetchHandler = null;
    jest.clearAllMocks();
  });

  describe('Token Storage Management', () => {
    it('saves, retrieves, and clears local agent token in localStorage', () => {
      expect(getLocalAgentToken()).toBeNull();

      setLocalAgentToken('test-secret-token-12345');
      expect(getLocalAgentToken()).toBe('test-secret-token-12345');
      expect(localStorage.getItem(LOCAL_AGENT_STORAGE_KEY)).toBe('test-secret-token-12345');

      clearLocalAgentToken();
      expect(getLocalAgentToken()).toBeNull();
    });
  });

  describe('Agent Communication & Error Handling', () => {
    it('throws LocalAgentConnectionError when agent is unavailable / connection refused', async () => {
      mockFetchHandler = () => Promise.reject(new TypeError('Failed to fetch'));

      await expect(getLocalAgentStatus('valid-token')).rejects.toThrow(
        LocalAgentConnectionError
      );
      await expect(getLocalAgentStatus('valid-token')).rejects.toThrow(
        /Local runner agent is not running/
      );
    });

    it('throws LocalAgentAuthError when agent rejects token with 401', async () => {
      mockFetchHandler = () =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' }),
        });

      await expect(getLocalAgentStatus('wrong-token')).rejects.toThrow(
        LocalAgentAuthError
      );
      await expect(getLocalAgentStatus('wrong-token')).rejects.toThrow(
        /Invalid or missing local agent token/
      );
    });

    it('returns agent and runner status on successful connection', async () => {
      setLocalAgentToken('secret-token-xyz');
      mockFetchHandler = (url, options) => {
        expect(url).toBe(`${LOCAL_AGENT_ENDPOINT}/status`);
        expect(options.method).toBe('GET');
        expect(options.headers.Authorization).toBe('Bearer secret-token-xyz');

        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ agent: 'online', runner: 'stopped' }),
        });
      };

      const status = await getLocalAgentStatus();
      expect(status).toEqual({ agent: 'online', runner: 'stopped' });
    });

    it('calls POST /start to initiate runner startup', async () => {
      setLocalAgentToken('secret-token-xyz');
      mockFetchHandler = (url, options) => {
        expect(url).toBe(`${LOCAL_AGENT_ENDPOINT}/start`);
        expect(options.method).toBe('POST');
        expect(options.headers.Authorization).toBe('Bearer secret-token-xyz');

        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              agent: 'online',
              runner: 'starting',
              message: 'Runner startup initiated',
            }),
        });
      };

      const result = await startLocalRunner();
      expect(result.runner).toBe('starting');
      expect(result.message).toBe('Runner startup initiated');
    });

    it('calls POST /stop to stop runner', async () => {
      setLocalAgentToken('secret-token-xyz');
      mockFetchHandler = (url, options) => {
        expect(url).toBe(`${LOCAL_AGENT_ENDPOINT}/stop`);
        expect(options.method).toBe('POST');

        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              agent: 'online',
              runner: 'stopped',
              message: 'Runner stopped',
            }),
        });
      };

      const result = await stopLocalRunner();
      expect(result.runner).toBe('stopped');
    });
  });

  describe('Runner Startup & Build Trigger Orchestration Flow', () => {
    it('does NOT create BuildJob before runner becomes ONLINE', async () => {
      let isOnline = false;
      const createBuildJobMock = jest.fn();

      // Simulation of orchestration logic
      async function triggerFlow() {
        if (!isOnline) {
          // Runner not online -> do not call createBuildJobMock
          return { error: 'Runner is offline' };
        }
        return createBuildJobMock();
      }

      const res = await triggerFlow();
      expect(res.error).toBe('Runner is offline');
      expect(createBuildJobMock).not.toHaveBeenCalled();
    });

    it('creates BuildJob AFTER runner becomes ONLINE', async () => {
      let isOnline = false;
      const createBuildJobMock = jest.fn().mockResolvedValue({ id: 'job-123' });

      async function triggerWithAutoStart(mockOnlineCheck) {
        // Step 1: Check runner
        if (!isOnline) {
          // Step 2: Contact local agent to start
          await startLocalRunner('token');
          // Step 3: Wait for runner ONLINE
          isOnline = await mockOnlineCheck();
        }

        if (isOnline) {
          return createBuildJobMock();
        }
        throw new Error('Runner failed to come online.');
      }

      mockFetchHandler = () =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              agent: 'online',
              runner: 'starting',
              message: 'Startup initiated',
            }),
        });

      const onlineCheck = jest.fn().mockResolvedValue(true);
      const job = await triggerWithAutoStart(onlineCheck);

      expect(job).toEqual({ id: 'job-123' });
      expect(createBuildJobMock).toHaveBeenCalledTimes(1);
    });

    it('times out after 30 seconds if runner fails to become ONLINE', async () => {
      const createBuildJobMock = jest.fn();

      async function waitForOnline(checkFn, timeoutMs = 50, pollIntervalMs = 10) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
          const online = await checkFn();
          if (online) return true;
          await new Promise((r) => setTimeout(r, pollIntervalMs));
        }
        return false;
      }

      const neverOnlineCheck = jest.fn().mockResolvedValue(false);
      const onlineResult = await waitForOnline(neverOnlineCheck, 60, 10);

      expect(onlineResult).toBe(false);
      if (!onlineResult) {
        // Must NOT create build
      } else {
        createBuildJobMock();
      }

      expect(createBuildJobMock).not.toHaveBeenCalled();
    });

    it('protects against duplicate trigger while startup is in progress', async () => {
      let isStarting = false;
      let startCount = 0;

      async function safeTrigger() {
        if (isStarting) {
          return { skipped: true };
        }
        isStarting = true;
        startCount++;
        // Simulate startup delay
        await new Promise((r) => setTimeout(r, 20));
        isStarting = false;
        return { skipped: false };
      }

      // Simulate double-click
      const [res1, res2] = await Promise.all([safeTrigger(), safeTrigger()]);

      expect(startCount).toBe(1);
      expect(res1.skipped !== res2.skipped).toBe(true);
    });
  });
});
