import { Injectable, Logger, Optional } from '@nestjs/common';
import type { AuthSession, User, UserProfile } from '@prisma/client';

export type UserWithProfile = User & { profile?: UserProfile | null };
export type SessionWithUser = AuthSession & { user: UserWithProfile };

export interface CachedSessionEntry {
  session: SessionWithUser;
  expiresAtMs: number;
  accessToken: string;
  refreshTokenVersion: number;
  userId: string;
}

export interface AuthSessionCacheOptions {
  ttlMs?: number;
  maxEntries?: number;
  nowFn?: () => number;
}

export const DEFAULT_AUTH_SESSION_CACHE_TTL_MS = 30 * 1000; // 30 seconds
export const DEFAULT_AUTH_SESSION_CACHE_MAX_ENTRIES = 5000;

@Injectable()
export class AuthSessionCache {
  private readonly logger = new Logger(AuthSessionCache.name);
  private readonly cache = new Map<string, CachedSessionEntry>();
  private readonly userSessions = new Map<string, Set<string>>();
  private readonly inFlight = new Map<string, Promise<SessionWithUser>>();

  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly nowFn: () => number;

  constructor(@Optional() options?: AuthSessionCacheOptions) {
    this.ttlMs = options?.ttlMs ?? DEFAULT_AUTH_SESSION_CACHE_TTL_MS;
    this.maxEntries =
      options?.maxEntries ?? DEFAULT_AUTH_SESSION_CACHE_MAX_ENTRIES;
    this.nowFn = options?.nowFn ?? (() => Date.now());
  }

  get(sessionId: string): CachedSessionEntry | null {
    const entry = this.cache.get(sessionId);
    if (!entry) {
      return null;
    }

    const now = this.nowFn();
    if (now >= entry.expiresAtMs) {
      this.invalidate(sessionId);
      return null;
    }

    // Refresh LRU ordering: re-insert into Map
    this.cache.delete(sessionId);
    this.cache.set(sessionId, entry);

    return entry;
  }

  set(
    sessionId: string,
    session: SessionWithUser,
    accessToken: string,
    customTtlMs?: number,
  ): void {
    const now = this.nowFn();
    const effectiveTtl = customTtlMs ?? this.ttlMs;
    const sessionDbExpiryMs =
      session.expiresAt instanceof Date
        ? session.expiresAt.getTime()
        : new Date(session.expiresAt).getTime();

    // Cache entry must not live longer than the configured TTL or the DB session expiry
    const expiresAtMs = Math.min(now + effectiveTtl, sessionDbExpiryMs);

    // If the session has already expired in the DB, do not cache
    if (expiresAtMs <= now) {
      return;
    }

    // Eviction if limit reached
    this.ensureCapacity();

    const userId = session.userId || session.user.id;
    const entry: CachedSessionEntry = {
      session,
      expiresAtMs,
      accessToken,
      refreshTokenVersion: session.user.refreshTokenVersion,
      userId,
    };

    this.cache.set(sessionId, entry);

    // Track session for user-level bulk invalidation
    let userSet = this.userSessions.get(userId);
    if (!userSet) {
      userSet = new Set<string>();
      this.userSessions.set(userId, userSet);
    }
    userSet.add(sessionId);
  }

  invalidate(sessionId: string): void {
    const entry = this.cache.get(sessionId);
    if (entry) {
      this.cache.delete(sessionId);
      const userSet = this.userSessions.get(entry.userId);
      if (userSet) {
        userSet.delete(sessionId);
        if (userSet.size === 0) {
          this.userSessions.delete(entry.userId);
        }
      }
    }
  }

  invalidateByUserId(userId: string): void {
    const userSet = this.userSessions.get(userId);
    if (userSet) {
      for (const sid of userSet) {
        this.cache.delete(sid);
      }
      this.userSessions.delete(userId);
    }
  }

  invalidateByAccessToken(accessToken: string): void {
    for (const [sid, entry] of this.cache.entries()) {
      if (entry.accessToken === accessToken) {
        this.invalidate(sid);
      }
    }
  }

  dedupe(
    sessionId: string,
    fetchFn: () => Promise<SessionWithUser>,
  ): Promise<SessionWithUser> {
    const existing = this.inFlight.get(sessionId);
    if (existing) {
      return existing;
    }

    const promise = fetchFn().finally(() => {
      this.inFlight.delete(sessionId);
    });

    this.inFlight.set(sessionId, promise);
    return promise;
  }

  size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
    this.userSessions.clear();
    this.inFlight.clear();
  }

  private ensureCapacity(): void {
    if (this.cache.size < this.maxEntries) {
      return;
    }

    // Prune expired entries first
    const now = this.nowFn();
    for (const [sid, entry] of this.cache.entries()) {
      if (now >= entry.expiresAtMs) {
        this.invalidate(sid);
      }
    }

    // If still at capacity, evict oldest entry (LRU)
    while (this.cache.size >= this.maxEntries) {
      const firstEntry = this.cache.keys().next();
      if (!firstEntry.done && typeof firstEntry.value === 'string') {
        this.invalidate(firstEntry.value);
      } else {
        break;
      }
    }
  }
}
