import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TasksModule } from '../tasks/tasks.module';
import { BuildRunnersModule } from '../build-runners/build-runners.module';
import { EventsModule } from '../events/events.module';
import { BuildsController } from './builds.controller';
import { BuildsService } from './builds.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TasksModule,
    BuildRunnersModule,
    EventsModule,
  ],
  controllers: [BuildsController],
  providers: [BuildsService],
  exports: [BuildsService],
})
export class BuildsModule {}
