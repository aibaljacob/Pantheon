import { Module } from '@nestjs/common';
import { BuildsGateway } from './builds.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [BuildsGateway],
  exports: [BuildsGateway],
})
export class EventsModule {}
