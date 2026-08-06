import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { ExecutionContext } from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_STATE_TTL_MS,
} from './google-auth.constants';

interface GoogleAuthRequest extends Request {
  oauthState?: string;
}

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<GoogleAuthRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const isInitialRedirect =
      request.originalUrl.includes('/auth/google') &&
      !request.originalUrl.includes('/callback');

    if (isInitialRedirect) {
      const state = randomUUID();
      request.oauthState = state;
      response.cookie(GOOGLE_OAUTH_STATE_COOKIE, state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/auth/google',
        maxAge: GOOGLE_OAUTH_STATE_TTL_MS,
      });
    }

    return super.canActivate(context);
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<GoogleAuthRequest>();
    const options: Record<string, unknown> = {
      scope: ['openid', 'email', 'profile'],
      session: false,
      prompt: 'select_account',
    };

    if (request.oauthState) {
      options.state = request.oauthState;
    }

    return options;
  }

  override handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
    _status?: unknown,
  ): TUser {
    if (err || !user) {
      const request = context.switchToHttp().getRequest<GoogleAuthRequest>();
      const response = context.switchToHttp().getResponse<Response>();

      response.redirect(this.getFailureRedirect(request, err, info));

      throw new Error('OAuth flow terminated');
    }

    return user;
  }

  private getFailureRedirect(
    request: GoogleAuthRequest,
    err?: unknown,
    info?: unknown,
  ): string {
    const frontendBaseUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const redirectUrl = new URL('/auth/google/callback', frontendBaseUrl);
    const error = this.resolveErrorCode(request, err, info);
    redirectUrl.hash = new URLSearchParams({ error }).toString();
    return redirectUrl.toString();
  }

  private resolveErrorCode(
    request: GoogleAuthRequest,
    err?: unknown,
    info?: unknown,
  ): string {
    const errorMessage = err instanceof Error ? err.message : '';
    const infoMessage =
      typeof info === 'string'
        ? info
        : info && typeof info === 'object' && 'message' in info
          ? String((info as { message?: unknown }).message ?? '')
          : '';
    const combinedMessage = `${errorMessage} ${infoMessage}`.toLowerCase();

    if (combinedMessage.includes('state')) {
      return 'google_auth_state_invalid';
    }

    if (
      combinedMessage.includes('access_denied') ||
      combinedMessage.includes('cancel')
    ) {
      return 'google_auth_cancelled';
    }

    return request.originalUrl.includes('/callback')
      ? 'google_auth_failed'
      : 'google_auth_unavailable';
  }
}
