import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter!: nodemailer.Transporter;

  async onModuleInit(): Promise<void> {
    this.initTransporter();
    await this.verifyConnection();
  }

  private initTransporter(): void {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number.parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP mail service connected successfully.');
    } catch (error) {
      this.logger.error(
        'Failed to connect to SMTP mail server. Please verify SMTP configuration.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async sendVerificationEmail(
    email: string,
    verificationLink: string,
  ): Promise<void> {
    const subject = 'Verify your email address - Pantheon';
    const html = this.buildVerificationEmailHtml(verificationLink);
    const text = `Welcome to Pantheon! Please verify your email address by visiting the following link: ${verificationLink}\n\nThis link will expire in 24 hours.\n\nIf you did not register for a Pantheon account, please ignore this email.`;

    await this.sendMail({ to: email, subject, html, text });
    this.logger.log(`Verification email sent successfully to ${email}`);
  }

  async sendPasswordResetEmail(
    email: string,
    resetLink: string,
  ): Promise<void> {
    const subject = 'Reset your password - Pantheon';
    const html = this.buildPasswordResetEmailHtml(resetLink);
    const text = `You requested a password reset for your Pantheon account. Click the following link to reset your password: ${resetLink}\n\nThis link will expire in 2 hours.\n\nSECURITY NOTICE: If you did not request a password reset, please ignore this email or contact support immediately if you suspect unauthorized activity.`;

    await this.sendMail({ to: email, subject, html, text });
    this.logger.log(`Password reset email sent successfully to ${email}`);
  }

  /**
   * Reusable helper for sending emails. Can be used for future notifications, invitations, etc.
   */
  async sendMail(options: SendMailOptions): Promise<void> {
    const from =
      process.env.MAIL_FROM ||
      process.env.SMTP_USER ||
      'Pantheon <no-reply@pantheon.dev>';

    try {
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to} (Subject: "${options.subject}")`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        `Failed to send email to ${options.to}.`,
      );
    }
  }

  private buildVerificationEmailHtml(verificationLink: string): string {
    const content = `
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #e6e2df;">Welcome to Pantheon</h2>
      <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #cac6bc;">
        Thank you for joining Pantheon. Please verify your email address to complete registration and start collaborating on your game production projects.
      </p>
      ${this.buildButtonComponent(verificationLink, 'Verify Email')}
      <p style="margin: 24px 0 8px 0; font-size: 13px; color: #939188;">
        Or copy and paste this link into your browser:
      </p>
      <div style="margin: 0 0 24px 0; padding: 12px; background-color: #141312; border: 1px solid #363433; border-radius: 6px; word-break: break-all;">
        <a href="${verificationLink}" style="color: #ccc6bc; font-family: monospace; font-size: 12px; text-decoration: underline;">${verificationLink}</a>
      </div>
      <p style="margin: 0 0 16px 0; font-size: 13px; color: #939188;">
        ⏱️ Note: This verification link will expire in 24 hours.
      </p>
      <p style="margin: 0; font-size: 12px; color: #939188; border-top: 1px solid #2b2a29; padding-top: 16px;">
        If you did not register for a Pantheon account, you can safely ignore this email.
      </p>
    `;
    return this.buildHtmlLayout('Email Verification', content);
  }

  private buildPasswordResetEmailHtml(resetLink: string): string {
    const content = `
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #e6e2df;">Reset Your Password</h2>
      <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #cac6bc;">
        We received a request to reset the password for your Pantheon account. Click the button below to choose a new password.
      </p>
      ${this.buildButtonComponent(resetLink, 'Reset Password')}
      <p style="margin: 24px 0 8px 0; font-size: 13px; color: #939188;">
        Or copy and paste this link into your browser:
      </p>
      <div style="margin: 0 0 24px 0; padding: 12px; background-color: #141312; border: 1px solid #363433; border-radius: 6px; word-break: break-all;">
        <a href="${resetLink}" style="color: #ccc6bc; font-family: monospace; font-size: 12px; text-decoration: underline;">${resetLink}</a>
      </div>
      <p style="margin: 0 0 16px 0; font-size: 13px; color: #939188;">
        ⏱️ Note: This password reset link will expire in 2 hours.
      </p>
      <div style="margin: 0; padding: 12px 16px; background-color: #2b2a29; border-left: 3px solid #ffb4ab; border-radius: 4px;">
        <p style="margin: 0; font-size: 12px; line-height: 18px; color: #e6e2df;">
          <strong>Security Warning:</strong> If you did not request a password reset, please ignore this email or contact support immediately if you suspect unauthorized activity.
        </p>
      </div>
    `;
    return this.buildHtmlLayout('Password Reset', content);
  }

  private buildButtonComponent(url: string, label: string): string {
    return `
      <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto 24px 0;">
        <tr>
          <td align="center" style="border-radius: 6px; background-color: #e6e2d7;">
            <a href="${url}" target="_blank" style="display: inline-block; padding: 12px 24px; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 600; color: #141312; text-decoration: none; border-radius: 6px; background-color: #e6e2d7;">
              ${label}
            </a>
          </td>
        </tr>
      </table>
    `;
  }

  private buildHtmlLayout(title: string, contentHtml: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Pantheon</title>
</head>
<body style="margin: 0; padding: 0; background-color: #141312; font-family: 'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #e6e2df;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #141312; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #1c1b1a; border: 1px solid #363433; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="padding: 28px 32px; background-color: #141312; border-bottom: 1px solid #2b2a29;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="font-family: 'Manrope', sans-serif; font-size: 22px; font-weight: 800; letter-spacing: 0.05em; color: #ffffff; text-transform: uppercase;">
                      PANTHEON
                    </span>
                    <span style="font-family: monospace; font-size: 11px; color: #939188; margin-left: 8px; vertical-align: middle;">
                      PRODUCTION SUITE
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              ${contentHtml}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background-color: #141312; border-top: 1px solid #2b2a29; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #939188; font-family: monospace;">
                &copy; ${new Date().getFullYear()} Pantheon Collaborative Game Production. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}
