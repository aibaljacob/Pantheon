import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AiRecommendationService } from '../ai/ai-recommendation.service';
import { TalentMatchingService } from './talent-matching.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, AiRecommendationService, TalentMatchingService],
  exports: [ProjectsService, AiRecommendationService, TalentMatchingService],
})
export class ProjectsModule {}
