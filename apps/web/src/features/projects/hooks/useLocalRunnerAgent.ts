import { useState, useCallback, useRef, useEffect } from 'react';
import {
  localRunnerAgent,
  LocalAgentConnectionError,
  LocalAgentAuthError,
  type LocalAgentStatusResponse,
} from '../../../lib/localRunnerAgent';
import { buildService, type RunnerStatusInfo } from '../services/buildService';
import type { BuildPlatform } from '../types';

export type LocalRunnerStartupPhase =
  | 'idle'
  | 'checking_agent'
  | 'starting_runner'
  | 'waiting_online'
  | 'ready'
  | 'error';

export interface UseLocalRunnerAgentResult {
  phase: LocalRunnerStartupPhase;
  statusMessage: string | null;
  error: string | null;
  isStarting: boolean;
  agentStatus: LocalAgentStatusResponse | null;
  checkAgentReachability: (tokenOverride?: string | null) => Promise<boolean>;
  ensureRunnerOnline: (options?: {
    platform?: BuildPlatform;
    timeoutMs?: number;
    currentRunnerStatus?: RunnerStatusInfo | null;
  }) => Promise<boolean>;
  reset: () => void;
}

const DEFAULT_TIMEOUT_MS = 30000;
const POLL_INTERVAL_MS = 1000;

export function useLocalRunnerAgent(): UseLocalRunnerAgentResult {
  const [phase, setPhase] = useState<LocalRunnerStartupPhase>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<LocalAgentStatusResponse | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setPhase('idle');
    setStatusMessage(null);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const checkAgentReachability = useCallback(
    async (tokenOverride?: string | null): Promise<boolean> => {
      try {
        const res = await localRunnerAgent.getStatus(tokenOverride);
        setAgentStatus(res);
        return true;
      } catch {
        setAgentStatus(null);
        return false;
      }
    },
    [],
  );

  const ensureRunnerOnline = useCallback(
    async (options?: {
      platform?: BuildPlatform;
      timeoutMs?: number;
      currentRunnerStatus?: RunnerStatusInfo | null;
    }): Promise<boolean> => {
      const platform = options?.platform || 'WINDOWS';
      const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

      // STEP 1: If existing runner is already ONLINE, proceed immediately
      if (options?.currentRunnerStatus?.online) {
        setPhase('ready');
        setError(null);
        return true;
      }

      setError(null);
      setPhase('checking_agent');
      setStatusMessage('Checking Local Runner Agent...');

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // STEP 2: Verify local agent reachability
      try {
        const agentState = await localRunnerAgent.getStatus();
        setAgentStatus(agentState);
      } catch (err: unknown) {
        const msg =
          err instanceof LocalAgentConnectionError
            ? 'Local runner agent is not running. Please start the Pantheon Local Runner Agent.'
            : err instanceof LocalAgentAuthError
            ? 'Unauthorized: Invalid or missing local agent token. Please configure token in settings.'
            : err instanceof Error
            ? err.message
            : 'Failed to connect to Local Runner Agent.';

        setPhase('error');
        setError(msg);
        setStatusMessage(null);
        return false;
      }

      // STEP 3: Request agent to start child runner
      setPhase('starting_runner');
      setStatusMessage('Starting build runner...');

      try {
        await localRunnerAgent.startRunner();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to start runner process.';
        setPhase('error');
        setError(msg);
        setStatusMessage(null);
        return false;
      }

      // STEP 4: Wait for Pantheon backend to report runner ONLINE (max 30s)
      setPhase('waiting_online');
      setStatusMessage('Starting build runner...');

      const startTime = Date.now();

      while (Date.now() - startTime < timeoutMs) {
        if (controller.signal.aborted) {
          setPhase('idle');
          return false;
        }

        try {
          const remoteStatus = await buildService.getRunnerStatus(platform);
          if (remoteStatus?.online) {
            setPhase('ready');
            setStatusMessage('Build runner is online!');
            return true;
          }
        } catch {
          // Retry until timeout
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }

      // STEP 6: Timeout reached without runner becoming ONLINE
      setPhase('error');
      setError('Runner failed to come online.');
      setStatusMessage(null);
      return false;
    },
    [],
  );

  return {
    phase,
    statusMessage,
    error,
    isStarting: phase === 'checking_agent' || phase === 'starting_runner' || phase === 'waiting_online',
    agentStatus,
    checkAgentReachability,
    ensureRunnerOnline,
    reset,
  };
}
