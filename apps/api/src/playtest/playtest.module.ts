import { Module } from '@nestjs/common';
import { PlaytestController } from './playtest.controller';
import { PlaytestService } from './playtest.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [PrismaModule, AuthModule, TasksModule],
  controllers: [PlaytestController],
  providers: [PlaytestService]
})
export class PlaytestModule {}
