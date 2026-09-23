import { Module } from '@nestjs/common';
import { BuildRunnersController } from './build-runners.controller';
import { BuildRunnersService } from './build-runners.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BuildsModule } from '../builds/builds.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [PrismaModule, BuildsModule, TasksModule],
  controllers: [BuildRunnersController],
  providers: [BuildRunnersService],
  exports: [BuildRunnersService],
})
export class BuildRunnersModule {}
