import { Body, Controller, Get, Headers, HttpCode, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { EmailQueryDto, EmailValueDto, LoginAuthDto, RegisterAuthDto, ResetPasswordDto, UsernameQueryDto, VerifyEmailQueryDto } from './auth.dto';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './google-auth.guard';
import { GOOGLE_OAUTH_STATE_COOKIE } from './google-auth.constants';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a local Pantheon account' })
  register(@Body() body: RegisterAuthDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign in with email and password' })
  login(@Body() body: LoginAuthDto) {
    return this.authService.login(body);
  }

  @Get('check-username')
  @HttpCode(200)
  @ApiOperation({ summary: 'Check if a username is available' })
  checkUsername(@Query() query: UsernameQueryDto) {
    return this.authService.checkUsernameAvailability(query.username);
  }

  @Get('check-email')
  @HttpCode(200)
  @ApiOperation({ summary: 'Check if an email is available' })
  checkEmail(@Query() query: EmailQueryDto) {
    return this.authService.checkEmailAvailability(query.email);
  }

  @Get('verify-email')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify a registration email token' })
  verifyEmail(@Query() query: VerifyEmailQueryDto) {
    return this.authService.verifyEmail(query.token);
  }

  @Post('resend-verification')
  @HttpCode(200)
  @ApiOperation({ summary: 'Resend a registration verification email' })
  resendVerification(@Body() body: EmailValueDto) {
    return this.authService.resendVerification(body.email);
  }

  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Send a password reset email' })
  forgotPassword(@Body() body: EmailValueDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reset a password with a valid token' })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Redirect the user to Google OAuth' })
  @ApiResponse({ status: 302, description: 'Redirects to Google Sign-In.' })
  googleLogin() {
    return undefined;
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Handle the Google OAuth callback and redirect to the frontend' })
  @ApiResponse({ status: 302, description: 'Redirects back to the frontend with the new session tokens.' })
  async googleCallback(@Req() request: Request, @Res() response: Response) {
    if (response.headersSent) {
      return;
    }

    const payload = request.user as { id: string; email: string; firstName: string; lastName: string; avatarUrl: string | null; emailVerified: boolean } | undefined;
    if (!payload) {
      response.redirect(this.buildFrontendErrorRedirect('google_auth_failed'));
      return;
    }

    const session = await this.authService.authenticateGoogleUser(payload);
    const redirectUrl = new URL('/auth/google/callback', this.getFrontendBaseUrl());
    redirectUrl.hash = new URLSearchParams({
      accessToken: session.data.accessToken,
      refreshToken: session.data.refreshToken ?? '',
      rememberMe: 'true',
    }).toString();

    response.clearCookie(GOOGLE_OAUTH_STATE_COOKIE, { path: '/auth/google' });
    response.redirect(redirectUrl.toString());
  }

  @Get('me')
  @ApiOperation({ summary: 'Load the current authenticated user' })
  me(@Headers('authorization') authorization?: string) {
    return this.authService.me(this.extractBearerToken(authorization));
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'End the current authentication session' })
  logout(@Headers('authorization') authorization?: string) {
    return this.authService.logout(this.extractBearerToken(authorization));
  }

  private extractBearerToken(authorization?: string): string | null {
    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }

  private buildFrontendErrorRedirect(error: string): string {
    const redirectUrl = new URL('/auth/google/callback', this.getFrontendBaseUrl());
    redirectUrl.hash = new URLSearchParams({ error }).toString();
    return redirectUrl.toString();
  }

  private getFrontendBaseUrl(): string {
    return process.env.FRONTEND_URL ?? 'http://localhost:5173';
  }
}
