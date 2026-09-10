import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AiRecommendationService } from '../ai/ai-recommendation.service';
import { TalentMatchingService } from './talent-matching.service';
import { ProjectInvitationsService } from './project-invitations.service';
import { ProjectInvitationsController, UserInvitationsController } from './project-invitations.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProjectsController, ProjectInvitationsController, UserInvitationsController],
  providers: [ProjectsService, AiRecommendationService, TalentMatchingService, ProjectInvitationsService],
  exports: [ProjectsService, AiRecommendationService, TalentMatchingService, ProjectInvitationsService],
})
export class ProjectsModule {}
