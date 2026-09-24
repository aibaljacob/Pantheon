import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { CreatePersonalAccessTokenDto } from './personal-access-tokens.dto';

@Injectable()
export class PersonalAccessTokensService {
  constructor(private readonly prisma: PrismaService) {}

  async createToken(userId: string, dto: CreatePersonalAccessTokenDto) {
    const rawToken = 'pht_' + crypto.randomBytes(32).toString('hex');
    const prefix = rawToken.substring(0, 12); // length 12
    const tokenHash = await bcrypt.hash(rawToken, 10);

    const tokenRecord = await this.prisma.personalAccessToken.create({
      data: {
        userId,
        name: dto.name,
        tokenHash,
        prefix,
        scopes: dto.scopes,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    return {
      id: tokenRecord.id,
      name: tokenRecord.name,
      token: rawToken, // Return raw token only once
      prefix: tokenRecord.prefix,
      scopes: tokenRecord.scopes,
      expiresAt: tokenRecord.expiresAt,
      createdAt: tokenRecord.createdAt,
    };
  }

  async listTokens(userId: string) {
    const tokens = await this.prisma.personalAccessToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return tokens.map(t => ({
      id: t.id,
      name: t.name,
      prefix: t.prefix,
      scopes: t.scopes,
      expiresAt: t.expiresAt,
      lastUsedAt: t.lastUsedAt,
      createdAt: t.createdAt,
    }));
  }

  async revokeToken(userId: string, tokenId: string) {
    const token = await this.prisma.personalAccessToken.findUnique({
      where: { id: tokenId },
    });

    if (!token || token.userId !== userId) {
      throw new NotFoundException('Personal access token not found');
    }

    await this.prisma.personalAccessToken.delete({
      where: { id: tokenId },
    });
  }
}
