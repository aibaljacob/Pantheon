import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import type { Request } from 'express';

@Injectable()
export class GitBasicAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      request.res?.setHeader('WWW-Authenticate', 'Basic realm="Pantheon Git Repository"');
      throw new UnauthorizedException('Basic authentication required');
    }

    if (!authHeader.startsWith('Basic ')) {
      request.res?.setHeader('WWW-Authenticate', 'Basic realm="Pantheon Git Repository"');
      throw new UnauthorizedException('Invalid authentication method');
    }

    const b64auth = authHeader.split(' ')[1];
    const [username, token] = Buffer.from(b64auth, 'base64').toString().split(':');

    if (!token || !token.startsWith('pht_')) {
      throw new UnauthorizedException('Invalid token format');
    }

    const prefix = token.substring(0, 12);
    const patRecord = await this.prisma.personalAccessToken.findUnique({
      where: { prefix },
      include: { user: true },
    });

    if (!patRecord) {
      throw new UnauthorizedException('Token not found');
    }

    if (patRecord.expiresAt && patRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Token expired');
    }

    const isMatch = await bcrypt.compare(token, patRecord.tokenHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid token');
    }

    // Attach user and PAT info to request
    (request as any).user = patRecord.user;
    (request as any).pat = patRecord;

    // Update lastUsedAt asynchronously
    this.prisma.personalAccessToken.update({
      where: { id: patRecord.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {});

    return true;
  }
}
