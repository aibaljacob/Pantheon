import { Module } from '@nestjs/common';
import { PersonalAccessTokensService } from './personal-access-tokens.service';
import { PersonalAccessTokensController } from './personal-access-tokens.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PersonalAccessTokensController],
  providers: [PersonalAccessTokensService],
  exports: [PersonalAccessTokensService],
})
export class PersonalAccessTokensModule {}
