import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import type { Request } from 'express';
import { GOOGLE_OAUTH_STATE_COOKIE } from './google-auth.constants';
import type { GoogleOAuthProfile } from './auth.types';

interface GoogleStrategyRequest extends Request {
  oauthState?: string;
}

function readCookieValue(
  cookieHeader: string | undefined,
  cookieName: string,
): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const pair of cookieHeader.split(';')) {
    const [rawName, ...rawValue] = pair.trim().split('=');
    if (rawName === cookieName) {
      return decodeURIComponent(rawValue.join('='));
    }
  }

  return null;
}

function splitName(value: string): { firstName: string; lastName: string } {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' ') || parts[0] || '',
  };
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ??
        'http://localhost:3000/auth/google/callback',
      passReqToCallback: true,
    });
  }

  async validate(
    request: GoogleStrategyRequest,
    accessToken: string,
    refreshToken: string,
    profile: {
      id: string;
      displayName?: string;
      name?: { givenName?: string; familyName?: string };
      emails?: Array<{ value?: string; verified?: boolean }>;
      photos?: Array<{ value?: string }>;
    },
  ): Promise<GoogleOAuthProfile> {
    const expectedState = readCookieValue(
      request.headers.cookie,
      GOOGLE_OAUTH_STATE_COOKIE,
    );
    const returnedState =
      typeof request.query.state === 'string' ? request.query.state : null;

    if (!expectedState || !returnedState || expectedState !== returnedState) {
      throw new UnauthorizedException('Invalid Google OAuth state.');
    }

    const email = profile.emails?.[0]?.value?.trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException('Google account email is required.');
    }

    const emailVerified = Boolean(profile.emails?.[0]?.verified);
    const firstName =
      profile.name?.givenName?.trim() ||
      splitName(profile.displayName ?? email.split('@')[0] ?? '').firstName ||
      'Google';
    const lastName =
      profile.name?.familyName?.trim() ||
      splitName(profile.displayName ?? email.split('@')[0] ?? '').lastName ||
      'User';
    const avatarUrl = profile.photos?.[0]?.value ?? null;

    return {
      id: profile.id,
      email,
      firstName,
      lastName,
      avatarUrl,
      emailVerified,
    };
  }
}
