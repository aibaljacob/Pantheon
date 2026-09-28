import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TasksController } from './tasks.controller';
import { MilestonesController } from './milestones.controller';
import { TasksService } from './tasks.service';
import { MilestonesService } from './milestones.service';
import { ProjectAuthorizationService } from './project-authorization.service';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [TasksController, MilestonesController],
  providers: [TasksService, MilestonesService, ProjectAuthorizationService],
  exports: [TasksService, MilestonesService, ProjectAuthorizationService],
})
export class TasksModule {}
