/**
 * Playtest Response Serialization Utilities
 *
 * Ensures that BigInt values (such as PlayableBuild.fileSizeBytes) originating
 * from Prisma entities are safely converted to exact string representations
 * before NestJS / Express executes JSON.stringify().
 */

export interface PlaytestBuildSerialized {
  id?: string;
  projectId?: string;
  buildJobId?: string | null;
  milestoneId?: string | null;
  version?: string;
  title?: string;
  platform?: string;
  storagePath?: string | null;
  fileSizeBytes?: string | null;
  fileChecksum?: string | null;
  releaseNotes?: string | null;
  uploadedById?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  buildJob?: {
    id?: string;
    commitHash?: string | null;
    branchName?: string | null;
    status?: string;
  } | null;
  [key: string]: unknown;
}

export interface PlaytestSessionSerialized {
  id: string;
  projectId: string;
  playableBuildId?: string | null;
  title: string;
  instructions?: string | null;
  isActive: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  createdById?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  playableBuild?: PlaytestBuildSerialized | null;
  _count?: {
    feedback: number;
  };
  [key: string]: unknown;
}

/**
 * Recursively converts any BigInt values in an object or array to strings,
 * ensuring complete JSON-serializability without precision loss.
 */
export function serializeBigInts<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'bigint') {
    return (data as bigint).toString() as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item: unknown) => serializeBigInts(item)) as unknown as T;
  }

  if (typeof data === 'object' && !(data instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = serializeBigInts(value);
    }
    return result as T;
  }

  return data;
}

/**
 * Serializes a PlaytestSession entity and its related PlayableBuild,
 * specifically guaranteeing that fileSizeBytes is represented as a string or null.
 */
export function serializePlaytestSession<T extends Record<string, unknown>>(
  session: T | null | undefined,
): (T & { playableBuild?: PlaytestBuildSerialized | null }) | null {
  if (!session) {
    return null;
  }

  // First perform recursive BigInt transformation to ensure any nested BigInts are safe
  const sanitized = serializeBigInts(session);

  if (sanitized.playableBuild && typeof sanitized.playableBuild === 'object') {
    const rawBuild = sanitized.playableBuild as Record<string, unknown>;
    const rawSize = rawBuild.fileSizeBytes;

    let fileSizeBytes: string | null = null;
    if (typeof rawSize === 'string') {
      fileSizeBytes = rawSize;
    } else if (typeof rawSize === 'number' || typeof rawSize === 'bigint') {
      fileSizeBytes = rawSize.toString();
    }

    return {
      ...sanitized,
      playableBuild: {
        ...rawBuild,
        fileSizeBytes,
      },
    };
  }

  return sanitized;
}
