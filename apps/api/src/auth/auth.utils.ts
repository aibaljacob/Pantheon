import { createHash, randomUUID, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';

export function createAvatarDataUrl(firstName: string, lastName: string): string {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const safeInitials = initials.replace(/[^A-Z0-9]/g, '').slice(0, 2) || 'P';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#2b2a29" />
          <stop offset="100%" stop-color="#141312" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="44" fill="url(#bg)" />
      <rect x="10" y="10" width="140" height="140" rx="36" fill="none" stroke="#48473f" stroke-width="2" />
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#e6e2df" font-family="Manrope, Arial, sans-serif" font-size="54" font-weight="700">${safeInitials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function createUsernameSlug(value: string): string {
  return normalizeUsername(value)
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '') || 'pantheon';
}

export function createToken(prefix: string, userId: string): string {
  return `${prefix}.${userId}.${randomUUID()}`;
}

export function createSecureToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return bcrypt.compare(password, storedHash);
}

export function buildDisplayName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export function addMilliseconds(date: Date, milliseconds: number): Date {
  return new Date(date.getTime() + milliseconds);
}

export function toIsoExpiration(date: Date): string {
  return date.toISOString();
}
