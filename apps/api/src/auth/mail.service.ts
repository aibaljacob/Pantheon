import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendVerificationEmail(email: string, verificationLink: string): Promise<void> {
    // TODO: Replace this stub with the production email provider integration.
    this.logger.log(`Verification email placeholder queued for ${email}: ${verificationLink}`);
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    // TODO: Replace this stub with the production email provider integration.
    this.logger.log(`Password reset email placeholder queued for ${email}: ${resetLink}`);
  }
}
