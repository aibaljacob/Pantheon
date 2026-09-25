import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TasksModule } from '../tasks/tasks.module';
import { PlaytestController } from './playtest.controller';
import { PlaytestService } from './playtest.service';

@Module({
  imports: [PrismaModule, AuthModule, TasksModule],
  controllers: [PlaytestController],
  providers: [PlaytestService]
})
export class PlaytestModule {}
