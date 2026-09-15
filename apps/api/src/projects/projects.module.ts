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
import { ProjectMembersService } from './project-members.service';
import { CooccurrenceService } from './graph-team-formation/cooccurrence.service';
import { GraphBuilderService } from './graph-team-formation/graph-builder';
import { RWRSolver } from './graph-team-formation/rwr-solver';
import { AssignmentSolver } from './graph-team-formation/assignment-solver';
import { TeamEvaluator } from './graph-team-formation/team-evaluator';
import { BaselineComparisonService } from './graph-team-formation/baseline-comparison.service';
import { ResearchExperimentRunner } from './graph-team-formation/research-experiment-runner';

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
    ProjectMembersService,
    AiRecommendationService,
    TalentMatchingService,
    ProjectInvitationsService,
    ProjectRepositoryService,
    ProjectRepositoryRepository,
    ProjectApplicationsService,
    CooccurrenceService,
    GraphBuilderService,
    RWRSolver,
    AssignmentSolver,
    TeamEvaluator,
    BaselineComparisonService,
    ResearchExperimentRunner,
  ],
  exports: [
    ProjectsService,
    ProjectMembersService,
    AiRecommendationService,
    TalentMatchingService,
    ProjectInvitationsService,
    ProjectRepositoryService,
    ProjectRepositoryRepository,
    ProjectApplicationsService,
    CooccurrenceService,
    GraphBuilderService,
    RWRSolver,
    AssignmentSolver,
    TeamEvaluator,
    BaselineComparisonService,
    ResearchExperimentRunner,
  ],
})
export class ProjectsModule {}

