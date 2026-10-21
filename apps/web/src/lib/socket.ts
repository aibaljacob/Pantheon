import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../features/auth/store/authStore';

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
}

let socketInstance: Socket | null = null;

export function getAppSocket(): Socket {
  if (!socketInstance) {
    const token = useAuthStore.getState().accessToken;
    socketInstance = io(getApiBaseUrl(), {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      auth: {
        token: token || undefined,
      },
    });

    // Update socket auth token when auth store changes
    useAuthStore.subscribe((state) => {
      if (socketInstance && state.accessToken) {
        socketInstance.auth = { token: state.accessToken };
      }
    });
  }

  return socketInstance;
}
