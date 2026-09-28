import { AuthSessionCache } from './auth-session.cache';
import type { SessionWithUser } from './auth-session.cache';
import { Role, AuthProvider } from '@prisma/client';

describe('AuthSessionCache', () => {
  let currentTime = 1000000;
  const nowFn = () => currentTime;

  function createMockSession(
    id: string,
    userId: string = 'user-1',
    expiryMs = 3600000,
  ): SessionWithUser {
    return {
      id,
      userId,
      accessToken: `token-${id}`,
      refreshToken: `rt-${id}`,
      rememberMe: false,
      expiresAt: new Date(currentTime + expiryMs),
      createdAt: new Date(currentTime),
      user: {
        id: userId,
        username: `user_${userId}`,
        email: `${userId}@pantheon.dev`,
        passwordHash: 'hash',
        role: Role.USER,
        refreshTokenVersion: 1,
        provider: AuthProvider.LOCAL,
        providerId: null,
        emailVerified: true,
        createdAt: new Date(currentTime),
        updatedAt: new Date(currentTime),
        profile: {
          id: `profile-${userId}`,
          userId,
          firstName: 'Dev',
          lastName: 'User',
          displayName: 'Dev User',
          avatarUrl: null,
          bannerUrl: null,
          headline: null,
          bio: null,
          location: null,
          timezone: null,
          experienceYears: 2,
          availability: 'Available',
          createdAt: new Date(currentTime),
          updatedAt: new Date(currentTime),
        },
      },
    };
  }

  beforeEach(() => {
    currentTime = 1000000;
  });

  it('1. should store and retrieve valid cached session before TTL expires', () => {
    const cache = new AuthSessionCache({
      ttlMs: 30000,
      maxEntries: 100,
      nowFn,
    });
    const session = createMockSession('sid-1');

    cache.set('sid-1', session, 'token-sid-1');
    const cached = cache.get('sid-1');

    expect(cached).not.toBeNull();
    expect(cached?.session.id).toBe('sid-1');
    expect(cached?.accessToken).toBe('token-sid-1');
    expect(cached?.refreshTokenVersion).toBe(1);
  });

  it('2. should expire cache entry after TTL and return null', () => {
    const cache = new AuthSessionCache({
      ttlMs: 30000,
      maxEntries: 100,
      nowFn,
    });
    const session = createMockSession('sid-1');

    cache.set('sid-1', session, 'token-sid-1');
    expect(cache.get('sid-1')).not.toBeNull();

    // Advance time past 30s TTL
    currentTime += 30001;

    expect(cache.get('sid-1')).toBeNull();
    expect(cache.size()).toBe(0);
  });

  it('3. should not cache session whose DB expiresAt is already in the past', () => {
    const cache = new AuthSessionCache({
      ttlMs: 30000,
      maxEntries: 100,
      nowFn,
    });
    const expiredSession = createMockSession('sid-expired', 'user-1', -1000);

    cache.set('sid-expired', expiredSession, 'token-expired');
    expect(cache.get('sid-expired')).toBeNull();
    expect(cache.size()).toBe(0);
  });

  it('4. should cap cache TTL to database session expiresAt if it expires sooner than TTL', () => {
    const cache = new AuthSessionCache({
      ttlMs: 30000,
      maxEntries: 100,
      nowFn,
    });
    // Session expires in 5 seconds in database
    const session = createMockSession('sid-quick', 'user-1', 5000);

    cache.set('sid-quick', session, 'token-quick');

    currentTime += 4000;
    expect(cache.get('sid-quick')).not.toBeNull();

    currentTime += 2000; // Total 6000ms > 5000ms DB expiry
    expect(cache.get('sid-quick')).toBeNull();
  });

  it('5. should immediately remove session on invalidate(sid)', () => {
    const cache = new AuthSessionCache({
      ttlMs: 30000,
      maxEntries: 100,
      nowFn,
    });
    const session = createMockSession('sid-1');

    cache.set('sid-1', session, 'token-sid-1');
    expect(cache.get('sid-1')).not.toBeNull();

    cache.invalidate('sid-1');
    expect(cache.get('sid-1')).toBeNull();
  });

  it('6. should invalidate all sessions for a specific user via invalidateByUserId(userId)', () => {
    const cache = new AuthSessionCache({
      ttlMs: 30000,
      maxEntries: 100,
      nowFn,
    });
    const session1 = createMockSession('sid-1', 'user-A');
    const session2 = createMockSession('sid-2', 'user-A');
    const sessionOther = createMockSession('sid-3', 'user-B');

    cache.set('sid-1', session1, 'token-1');
    cache.set('sid-2', session2, 'token-2');
    cache.set('sid-3', sessionOther, 'token-3');

    expect(cache.size()).toBe(3);

    // Invalidate user A (e.g. password reset)
    cache.invalidateByUserId('user-A');

    expect(cache.get('sid-1')).toBeNull();
    expect(cache.get('sid-2')).toBeNull();
    expect(cache.get('sid-3')).not.toBeNull();
  });

  it('7. should invalidate session by accessToken via invalidateByAccessToken', () => {
    const cache = new AuthSessionCache({
      ttlMs: 30000,
      maxEntries: 100,
      nowFn,
    });
    const session = createMockSession('sid-1');

    cache.set('sid-1', session, 'specific-access-token');
    cache.invalidateByAccessToken('specific-access-token');

    expect(cache.get('sid-1')).toBeNull();
  });

  it('8. should enforce max capacity by pruning expired entries and evicting oldest (LRU)', () => {
    const maxEntries = 3;
    const cache = new AuthSessionCache({ ttlMs: 30000, maxEntries, nowFn });

    cache.set('sid-1', createMockSession('sid-1'), 'token-1');
    cache.set('sid-2', createMockSession('sid-2'), 'token-2');
    cache.set('sid-3', createMockSession('sid-3'), 'token-3');

    expect(cache.size()).toBe(3);

    // Access sid-1 to make it most recently used (LRU)
    cache.get('sid-1');

    // Add sid-4; sid-2 should be evicted as the least recently used
    cache.set('sid-4', createMockSession('sid-4'), 'token-4');

    expect(cache.size()).toBe(3);
    expect(cache.get('sid-1')).not.toBeNull();
    expect(cache.get('sid-3')).not.toBeNull();
    expect(cache.get('sid-4')).not.toBeNull();
    expect(cache.get('sid-2')).toBeNull();
  });

  it('9. should deduplicate concurrent requests for the same session ID', async () => {
    const cache = new AuthSessionCache({
      ttlMs: 30000,
      maxEntries: 100,
      nowFn,
    });
    const session = createMockSession('sid-dedupe');
    let dbCallCount = 0;

    const mockFetch = async () => {
      dbCallCount++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return session;
    };

    // Fire 3 simultaneous lookups
    const [res1, res2, res3] = await Promise.all([
      cache.dedupe('sid-dedupe', mockFetch),
      cache.dedupe('sid-dedupe', mockFetch),
      cache.dedupe('sid-dedupe', mockFetch),
    ]);

    expect(dbCallCount).toBe(1);
    expect(res1.id).toBe('sid-dedupe');
    expect(res2.id).toBe('sid-dedupe');
    expect(res3.id).toBe('sid-dedupe');
  });

  it('10. should clean up in-flight request when fetchFn fails and propagate rejection', async () => {
    const cache = new AuthSessionCache({
      ttlMs: 30000,
      maxEntries: 100,
      nowFn,
    });

    const failingFetch = async () => {
      throw new Error('Database connection failed');
    };

    await expect(cache.dedupe('sid-fail', failingFetch)).rejects.toThrow(
      'Database connection failed',
    );

    // Subsequent call should not reuse the failed promise
    let calledSecondTime = false;
    const secondFetch = async () => {
      calledSecondTime = true;
      return createMockSession('sid-fail');
    };

    const res = await cache.dedupe('sid-fail', secondFetch);
    expect(calledSecondTime).toBe(true);
    expect(res.id).toBe('sid-fail');
  });
});
