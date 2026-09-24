import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { GitHttpController } from './git-http.controller';
import { GitHttpService } from './git-http.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [PrismaModule, ProjectsModule, TasksModule],
  controllers: [GitHttpController],
  providers: [GitHttpService],
})
export class GitHttpModule {}
