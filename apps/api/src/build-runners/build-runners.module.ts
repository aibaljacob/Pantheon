import { Module } from '@nestjs/common';
import { BuildRunnersController } from './build-runners.controller';
import { BuildRunnersService } from './build-runners.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, EventsModule, AuthModule],
  controllers: [BuildRunnersController],
  providers: [BuildRunnersService],
  exports: [BuildRunnersService],
})
export class BuildRunnersModule {}
