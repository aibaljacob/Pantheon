import { useEffect, useRef, useState } from 'react';
import { getAppSocket } from '../../../lib/socket';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { BuildJobItem, BuildPlatform } from '../types';
import type { RunnerStatusInfo } from '../services/buildService';

interface UseProjectBuildSocketOptions {
  projectId: string;
  targetPlatform?: BuildPlatform;
  onReconcile?: () => void;
}

export function useProjectBuildSocket({
  projectId,
  targetPlatform = 'WINDOWS',
  onReconcile,
}: UseProjectBuildSocketOptions) {
  const addBuild = useWorkspaceStore((state) => state.addBuild);
  const updateBuild = useWorkspaceStore((state) => state.updateBuild);

  const [runnerStatus, setRunnerStatus] = useState<RunnerStatusInfo | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const hasConnectedOnce = useRef<boolean>(false);
  const onReconcileRef = useRef(onReconcile);
  onReconcileRef.current = onReconcile;

  useEffect(() => {
    if (!projectId) return;

    const socket = getAppSocket();
    setIsConnected(socket.connected);

    // If already connected when mounting, mark initial connection as established
    if (socket.connected) {
      hasConnectedOnce.current = true;
      socket.emit('subscribe_project', { projectId });
    }

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit('subscribe_project', { projectId });
      if (hasConnectedOnce.current) {
        onReconcileRef.current?.();
      } else {
        hasConnectedOnce.current = true;
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleBuildCreated = (build: BuildJobItem) => {
      if (build && build.projectId === projectId) {
        addBuild(projectId, build);
      }
    };

    const handleBuildUpdated = (build: BuildJobItem) => {
      if (build && build.projectId === projectId) {
        updateBuild(projectId, build);
      }
    };

    const handleRunnerStatus = (payload: RunnerStatusInfo) => {
      if (payload && payload.platform === targetPlatform) {
        setRunnerStatus(payload);
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('build.created', handleBuildCreated);
    socket.on('build.updated', handleBuildUpdated);
    socket.on('runner.status_changed', handleRunnerStatus);

    return () => {
      socket.emit('unsubscribe_project', { projectId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('build.created', handleBuildCreated);
      socket.off('build.updated', handleBuildUpdated);
      socket.off('runner.status_changed', handleRunnerStatus);
    };
  }, [projectId, targetPlatform, addBuild, updateBuild]);

  return {
    isConnected,
    runnerStatus,
    setRunnerStatus,
  };
}
