import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    const retries = 5;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Successfully connected to Database.');
        return;
      } catch (err: any) {
        if (attempt === retries) {
          this.logger.error(`Failed to connect to Database after ${retries} attempts.`);
          throw err;
        }
        this.logger.warn(
          `Database connection attempt ${attempt}/${retries} failed (${err.message}). Retrying in 2s (waking serverless DB)...`,
        );
        await new Promise((res) => setTimeout(res, 2000));
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
