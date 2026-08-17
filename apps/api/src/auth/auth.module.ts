import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GoogleAuthGuard } from './google-auth.guard';
import { GoogleStrategy } from './google.strategy';
import { MailService } from './mail.service';
import { AdminAuthGuard } from './admin-auth.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';
import { getAuthJwtSecret } from './auth.constants';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: getAuthJwtSecret(),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, MailService, GoogleStrategy, GoogleAuthGuard, AdminAuthGuard, OptionalJwtAuthGuard],
  exports: [AuthService, MailService, AdminAuthGuard, OptionalJwtAuthGuard],
})
export class AuthModule {}
