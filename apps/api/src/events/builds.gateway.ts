import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { BuildPlatform } from '@prisma/client';

export interface RunnerStatusEventPayload {
  platform: BuildPlatform;
  status: 'ONLINE' | 'BUILDING' | 'OFFLINE';
  online: boolean;
  runnerId?: string;
  runnerName?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class BuildsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(BuildsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly authService: AuthService) {}

  async handleConnection(client: Socket) {
    try {
      const rawAuth =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization;

      let token: string | undefined;
      if (rawAuth) {
        token = rawAuth.startsWith('Bearer ') ? rawAuth.slice(7) : rawAuth;
      }

      if (token) {
        const session = await this.authService.findValidSession(token);
        client.data.user = session.user;
      }
    } catch {
      // Disconnect clients with invalid tokens
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe_project')
  handleSubscribeProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    if (data?.projectId) {
      const room = `project:${data.projectId}`;
      client.join(room);
      return { event: 'subscribed', room };
    }
  }

  @SubscribeMessage('unsubscribe_project')
  handleUnsubscribeProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    if (data?.projectId) {
      const room = `project:${data.projectId}`;
      client.leave(room);
      return { event: 'unsubscribed', room };
    }
  }

  emitBuildCreated(projectId: string, build: unknown) {
    if (!this.server) return;
    this.server.to(`project:${projectId}`).emit('build.created', build);
  }

  emitBuildUpdated(projectId: string, build: unknown) {
    if (!this.server) return;
    this.server.to(`project:${projectId}`).emit('build.updated', build);
  }

  emitRunnerStatus(payload: RunnerStatusEventPayload) {
    if (!this.server) return;
    this.server.emit('runner.status_changed', payload);
  }
}
