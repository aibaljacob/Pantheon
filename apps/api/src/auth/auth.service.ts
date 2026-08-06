import { BadRequestException, ConflictException, ForbiddenException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type AuthSession, type User, type UserProfile } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type {
  ApiResponse,
  AuthCurrentUser,
  AuthLoginInput,
  AuthRegisterInput,
  AuthRegistrationResult,
  AuthResetPasswordInput,
  AuthSession as AuthSessionResponse,
  AuthUserAccount,
  AuthUserProfile,
  GoogleOAuthProfile,
} from './auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';
import {
  AUTH_ACCESS_TOKEN_REMEMBER_ME_TTL_MS,
  AUTH_ACCESS_TOKEN_TTL_MS,
  AUTH_EMAIL_VERIFICATION_TTL_MS,
  AUTH_JWT_ISSUER,
  AUTH_PASSWORD_RESET_TTL_MS,
  getAuthJwtSecret,
  getFrontendBaseUrl,
} from './auth.constants';
import {
  addMilliseconds,
  buildDisplayName,
  createSecureToken,
  createUsernameSlug,
  hashPassword,
  hashToken,
  normalizeEmail,
  normalizeUsername,
  toIsoExpiration,
  verifyPassword,
} from './auth.utils';
type UserWithProfile = User & { profile?: UserProfile | null };
type SessionWithUser = AuthSession & { user: UserWithProfile };
interface AccessTokenPayload {
  sub: string;
  sid: string;
  ver: number;
}
@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}
  async onModuleInit(): Promise<void> {
    await this.seedDemoUser();
  }
  async register(input: AuthRegisterInput): Promise<ApiResponse<AuthRegistrationResult>> {
    const normalizedEmail = normalizeEmail(input.email);
    const normalizedUsername = normalizeUsername(input.username);
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { username: normalizedUsername }],
      },
      select: { id: true, email: true, username: true },
    });
    if (existingUser?.email === normalizedEmail) {
      throw new ConflictException('An account with this email already exists.');
    }
    if (existingUser?.username === normalizedUsername) {
      throw new ConflictException('That username is already taken.');
    }
    const passwordHash = await hashPassword(input.password);
    const verificationToken = createSecureToken();
    const created = await this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          username: normalizedUsername,
          email: normalizedEmail,
          passwordHash,
          provider: 'LOCAL',
          providerId: null,
          emailVerified: false,
          role: 'USER',
        },
      });
      const profile = await transaction.userProfile.create({
        data: {
          userId: user.id,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          displayName: buildDisplayName(input.firstName, input.lastName),
        },
      });
      await transaction.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(verificationToken),
          expiresAt: addMilliseconds(new Date(), AUTH_EMAIL_VERIFICATION_TTL_MS),
        },
      });
      return { user, profile };
    });
    await this.mailService.sendVerificationEmail(normalizedEmail, this.buildVerificationLink(verificationToken));
    return {
      success: true,
      data: {
        user: this.toPublicUser(created.user),
        profile: this.toPublicProfile(created.profile),
        emailVerificationSent: true,
      },
      message: 'Registration successful. Please verify your email address before signing in.',
    };
  }
  async login(input: AuthLoginInput): Promise<ApiResponse<AuthSessionResponse>> {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(input.email) },
      include: { profile: true },
    });
    if (!user || !user.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (!user.emailVerified) {
      throw new ForbiddenException('Email address must be verified before signing in.');
    }
    return this.buildSessionResponse(user, input.rememberMe ?? false, 'Login successful.');
  }
  async verifyEmail(token: string): Promise<ApiResponse<{ verified: true }>> {
    const tokenHash = hashToken(token);
    const verificationToken = await this.prisma.emailVerificationToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });
    if (!verificationToken) {
      throw new BadRequestException('Verification token is invalid.');
    }
    if (verificationToken.expiresAt <= new Date()) {
      await this.prisma.emailVerificationToken.delete({ where: { id: verificationToken.id } }).catch(() => undefined);
      throw new BadRequestException('Verification token has expired.');
    }
    await this.prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true },
      });
      await transaction.emailVerificationToken.delete({ where: { id: verificationToken.id } });
    });
    return {
      success: true,
      data: { verified: true },
      message: 'Email verified successfully.',
    };
  }
  async resendVerification(email: string): Promise<ApiResponse<{ verificationSent: boolean }>> {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    });
    if (!user || user.emailVerified) {
      return {
        success: true,
        data: { verificationSent: true },
        message: 'If an account exists and is unverified, a verification email has been sent.',
      };
    }
    const verificationToken = createSecureToken();
    await this.prisma.$transaction(async (transaction) => {
      await transaction.emailVerificationToken.deleteMany({ where: { userId: user.id } });
      await transaction.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(verificationToken),
          expiresAt: addMilliseconds(new Date(), AUTH_EMAIL_VERIFICATION_TTL_MS),
        },
      });
    });
    await this.mailService.sendVerificationEmail(user.email, this.buildVerificationLink(verificationToken));
    return {
      success: true,
      data: { verificationSent: true },
      message: 'If an account exists and is unverified, a verification email has been sent.',
    };
  }
  async forgotPassword(email: string): Promise<ApiResponse<{ emailSent: boolean }>> {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    });
    if (!user) {
      return {
        success: true,
        data: { emailSent: true },
        message: 'If an account exists, a password reset email has been sent.',
      };
    }
    const resetToken = createSecureToken();
    await this.prisma.$transaction(async (transaction) => {
      await transaction.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await transaction.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(resetToken),
          expiresAt: addMilliseconds(new Date(), AUTH_PASSWORD_RESET_TTL_MS),
        },
      });
    });
    await this.mailService.sendPasswordResetEmail(user.email, this.buildPasswordResetLink(resetToken));
    return {
      success: true,
      data: { emailSent: true },
      message: 'If an account exists, a password reset email has been sent.',
    };
  }
  async resetPassword(input: AuthResetPasswordInput): Promise<ApiResponse<{ passwordReset: true }>> {
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash: hashToken(input.token) },
      include: { user: true },
    });
    if (!resetToken) {
      throw new BadRequestException('Reset token is invalid.');
    }
    if (resetToken.expiresAt <= new Date()) {
      await this.prisma.passwordResetToken.delete({ where: { id: resetToken.id } }).catch(() => undefined);
      throw new BadRequestException('Reset token has expired.');
    }
    const passwordHash = await hashPassword(input.password);
    await this.prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
          refreshTokenVersion: { increment: 1 },
        },
      });
      await transaction.passwordResetToken.delete({ where: { id: resetToken.id } });
      await transaction.authSession.deleteMany({ where: { userId: resetToken.userId } });
    });
    return {
      success: true,
      data: { passwordReset: true },
      message: 'Password reset successfully. Please sign in again.',
    };
  }
  async checkUsernameAvailability(username: string): Promise<ApiResponse<{ available: boolean; username: string }>> {
    const normalized = normalizeUsername(username);
    const existing = await this.prisma.user.findUnique({
      where: { username: normalized },
      select: { id: true },
    });
    const available = !existing;
    return {
      success: true,
      data: { available, username: normalized },
      message: available ? 'Username is available.' : 'Username is already taken.',
    };
  }
  async checkEmailAvailability(email: string): Promise<ApiResponse<{ available: boolean; email: string }>> {
    const normalized = normalizeEmail(email);
    const existing = await this.prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true },
    });
    const available = !existing;
    return {
      success: true,
      data: { available, email: normalized },
      message: available ? 'Email is available.' : 'An account with this email already exists.',
    };
  }
  async authenticateGoogleUser(profile: GoogleOAuthProfile): Promise<ApiResponse<AuthSessionResponse>> {
    const user = await this.findOrCreateGoogleUser(profile);
    return this.buildSessionResponse(user, true, 'Google sign-in successful.');
  }
  async me(accessToken: string | null): Promise<ApiResponse<AuthCurrentUser>> {
    if (!accessToken) {
      throw new UnauthorizedException('No active session found.');
    }
    const session = await this.findValidSession(accessToken);
    return {
      success: true,
      data: {
        user: this.toPublicUser(session.user),
        profile: this.toPublicProfileOrNull(session.user.profile),
      },
      message: 'Current user loaded.',
    };
  }
  async logout(accessToken: string | null): Promise<ApiResponse<{ loggedOut: boolean }>> {
    if (accessToken) {
      await this.prisma.authSession.deleteMany({ where: { accessToken } });
    }
    return {
      success: true,
      data: { loggedOut: true },
      message: 'Logged out successfully.',
    };
  }
  private async buildSessionResponse(user: UserWithProfile, rememberMe: boolean, message: string): Promise<ApiResponse<AuthSessionResponse>> {
    const sessionId = randomUUID();
    const expiresAt = addMilliseconds(new Date(), rememberMe ? AUTH_ACCESS_TOKEN_REMEMBER_ME_TTL_MS : AUTH_ACCESS_TOKEN_TTL_MS);
    const payload: AccessTokenPayload = {
      sub: user.id,
      sid: sessionId,
      ver: user.refreshTokenVersion,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      issuer: AUTH_JWT_ISSUER,
      secret: getAuthJwtSecret(),
      expiresIn: rememberMe ? '30d' : '1d',
    });
    const refreshToken = createSecureToken();
    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        accessToken,
        refreshToken,
        rememberMe,
        expiresAt,
      },
    });
    return {
      success: true,
      data: {
        user: this.toPublicUser(user),
        profile: this.toPublicProfile(user.profile),
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresAt: toIsoExpiration(expiresAt),
      },
      message,
    };
  }
  private async findValidSession(accessToken: string): Promise<SessionWithUser> {
    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(accessToken, {
        issuer: AUTH_JWT_ISSUER,
        secret: getAuthJwtSecret(),
      });
    } catch {
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }
    const session = await this.prisma.authSession.findUnique({
      where: { id: payload.sid },
      include: { user: { include: { profile: true } } },
    });
    if (!session || session.accessToken !== accessToken || session.expiresAt <= new Date()) {
      if (session) {
        await this.prisma.authSession.delete({ where: { id: session.id } }).catch(() => undefined);
      }
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }
    if (session.user.refreshTokenVersion !== payload.ver) {
      await this.prisma.authSession.delete({ where: { id: session.id } }).catch(() => undefined);
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }
    return session;
  }
  private async seedDemoUser(): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: 'demo@pantheon.dev' },
      include: { profile: true },
    });
    if (existingUser) {
      return;
    }
    const passwordHash = await hashPassword('password123');
    await this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          id: 'demo-user-001',
          username: 'ava.sol',
          email: 'demo@pantheon.dev',
          passwordHash,
          provider: 'LOCAL',
          providerId: null,
          emailVerified: true,
          role: 'USER',
        },
      });
      await transaction.userProfile.create({
        data: {
          userId: user.id,
          firstName: 'Ava',
          lastName: 'Sol',
          displayName: 'Ava Sol',
          headline: 'Gameplay Generalist',
          bio: 'Demo account for Pantheon development.',
        },
      });
    });
  }
  private async findOrCreateGoogleUser(profile: GoogleOAuthProfile): Promise<UserWithProfile> {
    const normalizedEmail = normalizeEmail(profile.email);
    const existingByProviderId = await this.prisma.user.findUnique({
      where: { providerId: profile.id },
      include: { profile: true },
    });
    if (existingByProviderId) {
      const updatedUser = await this.prisma.user.update({
        where: { id: existingByProviderId.id },
        data: {
          provider: 'GOOGLE',
          providerId: profile.id,
          emailVerified: true,
        },
        include: { profile: true },
      });
      if (!updatedUser.profile) {
        const createdProfile = await this.prisma.userProfile.create({
          data: {
            userId: updatedUser.id,
            firstName: profile.firstName,
            lastName: profile.lastName,
            displayName: buildDisplayName(profile.firstName, profile.lastName),
            avatarUrl: profile.avatarUrl,
          },
        });
        return { ...updatedUser, profile: createdProfile };
      }
      return updatedUser;
    }
    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });
    if (existingByEmail) {
      const updatedUser = await this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          provider: 'GOOGLE',
          providerId: profile.id,
          emailVerified: true,
        },
        include: { profile: true },
      });
      if (!updatedUser.profile) {
        const createdProfile = await this.prisma.userProfile.create({
          data: {
            userId: updatedUser.id,
            firstName: profile.firstName,
            lastName: profile.lastName,
            displayName: buildDisplayName(profile.firstName, profile.lastName),
            avatarUrl: profile.avatarUrl,
          },
        });
        return { ...updatedUser, profile: createdProfile };
      }
      return updatedUser;
    }
    const usernameBase = createUsernameSlug(`${profile.firstName}.${profile.lastName}` || normalizedEmail.split('@')[0] || 'pantheon');
    const username = await this.createUniqueUsername(usernameBase);
    return this.prisma.user.create({
      data: {
        username,
        email: normalizedEmail,
        passwordHash: null,
        provider: 'GOOGLE',
        providerId: profile.id,
        emailVerified: true,
        role: 'USER',
        profile: {
          create: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            displayName: buildDisplayName(profile.firstName, profile.lastName),
            avatarUrl: profile.avatarUrl,
          },
        },
      },
      include: { profile: true },
    });
  }
  private async createUniqueUsername(baseUsername: string): Promise<string> {
    const normalizedBase = createUsernameSlug(baseUsername);
    let candidate = normalizedBase;
    let suffix = 2;
    while (await this.prisma.user.findUnique({ where: { username: candidate }, select: { id: true } })) {
      candidate = `${normalizedBase}${suffix}`;
      suffix += 1;
    }
    return candidate;
  }
  private toPublicUser(user: UserWithProfile): AuthUserAccount {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      provider: user.provider,
      emailVerified: user.emailVerified,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }
  private toPublicProfile(profile: UserProfile | null | undefined): AuthUserProfile {
    if (!profile) {
      return {
        firstName: '',
        lastName: '',
      };
    }
    return {
      firstName: profile.firstName,
      lastName: profile.lastName,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      bannerUrl: profile.bannerUrl,
      headline: profile.headline,
      bio: profile.bio,
      location: profile.location,
      timezone: profile.timezone,
      experienceYears: profile.experienceYears,
    };
  }
  private toPublicProfileOrNull(profile: UserProfile | null | undefined): AuthUserProfile | null {
    return profile ? this.toPublicProfile(profile) : null;
  }
  private buildVerificationLink(token: string): string {
    const url = new URL('/auth/verify-email', getFrontendBaseUrl());
    url.searchParams.set('token', token);
    return url.toString();
  }
  private buildPasswordResetLink(token: string): string {
    const url = new URL('/auth/reset-password', getFrontendBaseUrl());
    url.searchParams.set('token', token);
    return url.toString();
  }
}