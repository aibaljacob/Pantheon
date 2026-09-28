import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role, AuthProvider } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';
import { createMockPrismaService } from '../../test/mocks/prisma.mock';
import { hashPassword } from './auth.utils';
import { AuthSessionCache } from './auth-session.cache';

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: any;
  let jwtServiceMock: any;
  let mailServiceMock: any;

  beforeEach(async () => {
    prismaMock = createMockPrismaService();
    // Default demo user check so seedDemoUser skips in onModuleInit
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'demo-user-001',
      email: 'demo@pantheon.dev',
      profile: { id: 'demo-profile-1' },
    });

    jwtServiceMock = {
      signAsync: jest.fn().mockResolvedValue('mocked-jwt-token'),
      verifyAsync: jest.fn(),
      decode: jest.fn((token: string) => {
        if (token === 'valid-token')
          return { sid: 'session-123', sub: 'user-123', ver: 1 };
        return null;
      }),
    };
    mailServiceMock = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        AuthSessionCache,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: MailService, useValue: mailServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    const validRegisterInput = {
      firstName: 'Jane',
      lastName: 'Doe',
      username: 'janedoe',
      email: 'jane.doe@example.com',
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      acceptTerms: true,
    };

    it('should successfully register a new user and send verification email', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'new-user-uuid',
        username: 'janedoe',
        email: 'jane.doe@example.com',
        role: Role.USER,
        provider: AuthProvider.LOCAL,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prismaMock.userProfile.create.mockResolvedValue({
        id: 'new-profile-uuid',
        userId: 'new-user-uuid',
        firstName: 'Jane',
        lastName: 'Doe',
        displayName: 'Jane Doe',
      });
      prismaMock.emailVerificationToken.create.mockResolvedValue({
        id: 'token-uuid',
        tokenHash: 'hashed-token',
        expiresAt: new Date(Date.now() + 86400000),
      });

      const response = await service.register(validRegisterInput);

      expect(response.success).toBe(true);
      expect(response.data.user.email).toBe('jane.doe@example.com');
      expect(response.data.user.emailVerified).toBe(false);
      expect(mailServiceMock.sendVerificationEmail).toHaveBeenCalledTimes(1);
    });

    it('should reject registration if email is already taken', async () => {
      prismaMock.user.findFirst.mockResolvedValueOnce({
        id: 'existing-id',
        email: 'jane.doe@example.com',
        username: 'someoneelse',
      });

      await expect(service.register(validRegisterInput)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should reject registration if username is already taken', async () => {
      prismaMock.user.findFirst.mockResolvedValueOnce({
        id: 'existing-id',
        username: 'janedoe',
        email: 'other@example.com',
      });

      await expect(service.register(validRegisterInput)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should successfully log in an active user with valid credentials', async () => {
      const plainPassword = 'CorrectPassword123!';
      const hashedPassword = await hashPassword(plainPassword);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-123',
        username: 'testgamer',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        emailVerified: true,
        role: Role.USER,
        provider: AuthProvider.LOCAL,
        refreshTokenVersion: 1,
        createdAt: new Date(),
        profile: {
          firstName: 'Test',
          lastName: 'Gamer',
          displayName: 'Test Gamer',
          avatarUrl: null,
        },
      });

      prismaMock.authSession.create.mockResolvedValue({
        id: 'session-123',
        userId: 'user-123',
        accessToken: 'mocked-jwt-token',
        refreshToken: 'hashed-rt',
        expiresAt: new Date(Date.now() + 86400000),
      });

      const result = await service.login({
        email: 'test@example.com',
        password: plainPassword,
      });

      expect(result.success).toBe(true);
      expect(result.data.accessToken).toBe('mocked-jwt-token');
      expect(result.data.user.email).toBe('test@example.com');
      expect(jwtServiceMock.signAsync).toHaveBeenCalled();
    });

    it('should reject login if user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@example.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login with wrong password', async () => {
      const hashedPassword = await hashPassword('ActualPassword123!');

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        passwordHash: hashedPassword,
        emailVerified: true,
      });

      await expect(
        service.login({
          email: 'user@example.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login with ForbiddenException if email is not verified', async () => {
      const plainPassword = 'Password123!';
      const hashedPassword = await hashPassword(plainPassword);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'unverified@example.com',
        passwordHash: hashedPassword,
        emailVerified: false,
      });

      await expect(
        service.login({
          email: 'unverified@example.com',
          password: plainPassword,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('me', () => {
    it('should return authenticated user profile for valid session token', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-123',
        sid: 'session-123',
        ver: 1,
      });

      prismaMock.authSession.findUnique.mockResolvedValue({
        id: 'session-123',
        userId: 'user-123',
        accessToken: 'valid-token',
        expiresAt: new Date(Date.now() + 100000),
        user: {
          id: 'user-123',
          username: 'game_dev',
          email: 'dev@studio.com',
          role: Role.USER,
          provider: AuthProvider.LOCAL,
          emailVerified: true,
          refreshTokenVersion: 1,
          createdAt: new Date(),
          profile: {
            firstName: 'Game',
            lastName: 'Dev',
            displayName: 'Game Dev',
            avatarUrl: 'https://example.com/avatar.jpg',
          },
        },
      });

      const response = await service.me('valid-token');

      expect(response.success).toBe(true);
      expect(response.data.user.id).toBe('user-123');
      expect((response.data.user as any).passwordHash).toBeUndefined();
    });

    it('should hit cache on subsequent requests and avoid repeated database lookups', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-123',
        sid: 'session-123',
        ver: 1,
      });

      prismaMock.authSession.findUnique.mockResolvedValue({
        id: 'session-123',
        userId: 'user-123',
        accessToken: 'valid-token',
        expiresAt: new Date(Date.now() + 100000),
        user: {
          id: 'user-123',
          username: 'game_dev',
          email: 'dev@studio.com',
          role: Role.USER,
          provider: AuthProvider.LOCAL,
          emailVerified: true,
          refreshTokenVersion: 1,
          createdAt: new Date(),
          profile: null,
        },
      });

      // 1. First request: Cache MISS -> calls DB
      const res1 = await service.me('valid-token');
      expect(res1.success).toBe(true);
      expect(prismaMock.authSession.findUnique).toHaveBeenCalledTimes(1);

      // 2. Second request: Cache HIT -> does NOT call DB
      const res2 = await service.me('valid-token');
      expect(res2.success).toBe(true);
      expect(prismaMock.authSession.findUnique).toHaveBeenCalledTimes(1);

      // 3. Third request: Still Cache HIT
      const res3 = await service.me('valid-token');
      expect(res3.success).toBe(true);
      expect(prismaMock.authSession.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should re-query database when cache entry expires', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-123',
        sid: 'session-123',
        ver: 1,
      });

      prismaMock.authSession.findUnique.mockResolvedValue({
        id: 'session-123',
        userId: 'user-123',
        accessToken: 'valid-token',
        expiresAt: new Date(Date.now() + 100000),
        user: {
          id: 'user-123',
          username: 'game_dev',
          email: 'dev@studio.com',
          role: Role.USER,
          provider: AuthProvider.LOCAL,
          emailVerified: true,
          refreshTokenVersion: 1,
          createdAt: new Date(),
          profile: null,
        },
      });

      await service.me('valid-token');
      expect(prismaMock.authSession.findUnique).toHaveBeenCalledTimes(1);

      // Invalidate cache (simulating expiration)
      service.getSessionCache().invalidate('session-123');

      // Next request triggers fresh DB query
      await service.me('valid-token');
      expect(prismaMock.authSession.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should invalidate cache when logout is called', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-123',
        sid: 'session-123',
        ver: 1,
      });

      prismaMock.authSession.findUnique.mockResolvedValue({
        id: 'session-123',
        userId: 'user-123',
        accessToken: 'valid-token',
        expiresAt: new Date(Date.now() + 100000),
        user: {
          id: 'user-123',
          username: 'game_dev',
          email: 'dev@studio.com',
          role: Role.USER,
          provider: AuthProvider.LOCAL,
          emailVerified: true,
          refreshTokenVersion: 1,
          createdAt: new Date(),
          profile: null,
        },
      });

      await service.me('valid-token');
      expect(service.getSessionCache().get('session-123')).not.toBeNull();

      // Logout
      await service.logout('valid-token');
      expect(service.getSessionCache().get('session-123')).toBeNull();
    });

    it('should deduplicate concurrent requests for the same session', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 'user-123',
        sid: 'session-concurrent',
        ver: 1,
      });

      let dbCalls = 0;
      prismaMock.authSession.findUnique.mockImplementation(async () => {
        dbCalls++;
        await new Promise((r) => setTimeout(r, 10));
        return {
          id: 'session-concurrent',
          userId: 'user-123',
          accessToken: 'valid-concurrent-token',
          expiresAt: new Date(Date.now() + 100000),
          user: {
            id: 'user-123',
            username: 'game_dev',
            email: 'dev@studio.com',
            role: Role.USER,
            provider: AuthProvider.LOCAL,
            emailVerified: true,
            refreshTokenVersion: 1,
            createdAt: new Date(),
            profile: null,
          },
        };
      });

      const [r1, r2, r3] = await Promise.all([
        service.findValidSession('valid-concurrent-token'),
        service.findValidSession('valid-concurrent-token'),
        service.findValidSession('valid-concurrent-token'),
      ]);

      expect(dbCalls).toBe(1);
      expect(r1.id).toBe('session-concurrent');
      expect(r2.id).toBe('session-concurrent');
      expect(r3.id).toBe('session-concurrent');
    });

    it('should throw UnauthorizedException if no token is supplied', async () => {
      await expect(service.me(null)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if session is invalid or expired', async () => {
      jwtServiceMock.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.me('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify user email when valid token is supplied', async () => {
      const mockExpiry = new Date(Date.now() + 100000);
      prismaMock.emailVerificationToken.findFirst.mockResolvedValue({
        id: 'token-id-1',
        userId: 'user-123',
        expiresAt: mockExpiry,
      });

      prismaMock.user.update.mockResolvedValue({
        id: 'user-123',
        emailVerified: true,
      });

      const response = await service.verifyEmail('raw-token-string');
      expect(response.success).toBe(true);
      expect(response.data.verified).toBe(true);
    });

    it('should reject invalid verification token', async () => {
      prismaMock.emailVerificationToken.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject expired verification token', async () => {
      const mockPastExpiry = new Date(Date.now() - 100000);
      prismaMock.emailVerificationToken.findFirst.mockResolvedValue({
        id: 'token-id-1',
        userId: 'user-123',
        expiresAt: mockPastExpiry,
      });

      await expect(service.verifyEmail('expired-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('resetPassword', () => {
    it('should reject password reset when token is expired or invalid', async () => {
      prismaMock.passwordResetToken.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          token: 'expired-token',
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully reset password with valid token', async () => {
      const mockExpiry = new Date(Date.now() + 100000);
      prismaMock.passwordResetToken.findFirst.mockResolvedValue({
        id: 'reset-token-id',
        userId: 'user-123',
        expiresAt: mockExpiry,
      });

      const response = await service.resetPassword({
        token: 'valid-reset-token',
        password: 'NewBrandNewPassword123!',
        confirmPassword: 'NewBrandNewPassword123!',
      });

      expect(response.success).toBe(true);
      expect(response.data.passwordReset).toBe(true);
    });
  });

  describe('username and email availability', () => {
    it('should report username as available when not taken', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await service.checkUsernameAvailability('new_handle');
      expect(res.data.available).toBe(true);
    });

    it('should report email as unavailable when already registered', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      const res = await service.checkEmailAvailability('taken@example.com');
      expect(res.data.available).toBe(false);
    });
  });
});
