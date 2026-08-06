export const AUTH_PASSWORD_MIN_LENGTH = 8;
export const AUTH_USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{1,28}[a-z0-9])?$/;
export const AUTH_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const AUTH_ACCESS_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;
export const AUTH_ACCESS_TOKEN_REMEMBER_ME_TTL_MS = 1000 * 60 * 60 * 24 * 30;
export const AUTH_EMAIL_VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24;
export const AUTH_PASSWORD_RESET_TTL_MS = 1000 * 60 * 60 * 2;

export const AUTH_JWT_ISSUER = 'pantheon-api';

export function getAuthJwtSecret(): string {
  const secret = process.env.AUTH_JWT_SECRET;

  if (!secret) {
    throw new Error('AUTH_JWT_SECRET is not configured.');
  }

  return secret;
}

export function getFrontendBaseUrl(): string {
  return process.env.FRONTEND_URL ?? 'http://localhost:5173';
}
