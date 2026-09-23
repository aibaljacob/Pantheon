import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TasksController } from './tasks.controller';
import { MilestonesController } from './milestones.controller';
import { TasksService } from './tasks.service';
import { MilestonesService } from './milestones.service';
import { ProjectAuthorizationService } from './project-authorization.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TasksController, MilestonesController],
  providers: [
    TasksService,
    MilestonesService,
    ProjectAuthorizationService,
  ],
  exports: [
    TasksService,
    MilestonesService,
    ProjectAuthorizationService,
  ],
})
export class TasksModule {}
