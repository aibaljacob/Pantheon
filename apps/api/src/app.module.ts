import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { TaxonomyModule } from './taxonomy/taxonomy.module';
import { ProjectsModule } from './projects/projects.module';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { BuildsModule } from './builds/builds.module';
import { BuildRunnersModule } from './build-runners/build-runners.module';
import { PersonalAccessTokensModule } from './personal-access-tokens/personal-access-tokens.module';
import { GitHttpModule } from './git-http/git-http.module';
import { PlaytestModule } from './playtest/playtest.module';
import { SearchModule } from './search/search.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    AuthModule,
    ProfileModule,
    TaxonomyModule,
    ProjectsModule,
    AdminModule,
    PrismaModule,
    TasksModule,
    BuildsModule,
    BuildRunnersModule,
    PersonalAccessTokensModule,
    GitHttpModule,
    PlaytestModule,
    SearchModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
