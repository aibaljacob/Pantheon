import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AiRecommendationService } from '../ai/ai-recommendation.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, AiRecommendationService],
  exports: [ProjectsService, AiRecommendationService],
})
export class ProjectsModule {}
