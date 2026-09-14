import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AiRecommendationService } from '../ai/ai-recommendation.service';
import { TalentMatchingService } from './talent-matching.service';
import { ProjectInvitationsService } from './project-invitations.service';
import { ProjectInvitationsController, UserInvitationsController } from './project-invitations.controller';
import { ProjectRepositoryController } from './project-repository.controller';
import { ProjectRepositoryService } from './project-repository.service';
import { ProjectRepositoryRepository } from './project-repository.repository';
import { ProjectApplicationsController } from './project-applications.controller';
import { ProjectApplicationsService } from './project-applications.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    ProjectsController,
    ProjectInvitationsController,
    UserInvitationsController,
    ProjectRepositoryController,
    ProjectApplicationsController,
  ],
  providers: [
    ProjectsService,
    AiRecommendationService,
    TalentMatchingService,
    ProjectInvitationsService,
    ProjectRepositoryService,
    ProjectRepositoryRepository,
    ProjectApplicationsService,
  ],
  exports: [
    ProjectsService,
    AiRecommendationService,
    TalentMatchingService,
    ProjectInvitationsService,
    ProjectRepositoryService,
    ProjectRepositoryRepository,
    ProjectApplicationsService,
  ],
})
export class ProjectsModule {}

