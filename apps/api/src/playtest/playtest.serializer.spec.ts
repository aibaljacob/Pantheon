import {
  serializeBigInts,
  serializePlaytestSession,
} from './playtest.serializer';

describe('Playtest Serializer (BUG-PLAYTEST-01)', () => {
  describe('serializeBigInts', () => {
    it('converts BigInt primitive to string', () => {
      expect(serializeBigInts(123456789n)).toBe('123456789');
    });

    it('preserves exact string representation for BigInt exceeding Number.MAX_SAFE_INTEGER without precision loss', () => {
      const largeBigInt = 9007199254740993n;
      const serialized = serializeBigInts(largeBigInt);
      expect(serialized).toBe('9007199254740993');
      // Number(9007199254740993n) would lose precision and become 9007199254740992
      expect(Number(largeBigInt).toString()).not.toBe('9007199254740993');
    });

    it('recursively converts nested BigInts in complex objects and arrays', () => {
      const complex = {
        id: 'session-1',
        size: 500n,
        metadata: {
          innerSize: 1000n,
          tags: ['build', 'alpha'],
        },
        sizes: [10n, 20n, 30n],
        created: new Date('2026-10-01T00:00:00Z'),
      };

      const result = serializeBigInts(complex);
      expect(result.size).toBe('500');
      expect(result.metadata.innerSize).toBe('1000');
      expect(result.sizes).toEqual(['10', '20', '30']);
      expect(result.created).toBeInstanceOf(Date);
      expect(() => JSON.stringify(result)).not.toThrow();
    });

    it('handles null and undefined safely', () => {
      expect(serializeBigInts(null)).toBeNull();
      expect(serializeBigInts(undefined)).toBeUndefined();
    });
  });

  describe('serializePlaytestSession', () => {
    it('serializes PlayableBuild.fileSizeBytes BigInt to string in playtest session', () => {
      const session = {
        id: 'pt-uuid-1',
        projectId: 'proj-1',
        playableBuildId: 'build-1',
        title: 'Combat Playtest',
        playableBuild: {
          id: 'build-1',
          version: 'v0.1.0',
          title: 'Combat Prototype',
          platform: 'WINDOWS',
          fileSizeBytes: 250000000n,
          buildJob: {
            commitHash: 'abc1234',
          },
        },
      };

      const result = serializePlaytestSession(session);
      expect(result).not.toBeNull();
      expect(result?.playableBuild?.fileSizeBytes).toBe('250000000');
      expect(typeof result?.playableBuild?.fileSizeBytes).toBe('string');

      // Crucial: NestJS / Express response JSON serialization must not throw
      expect(() => JSON.stringify(result)).not.toThrow();
      const parsed = JSON.parse(JSON.stringify(result));
      expect(parsed.playableBuild.fileSizeBytes).toBe('250000000');
    });

    it('handles session where fileSizeBytes is null', () => {
      const session = {
        id: 'pt-uuid-2',
        projectId: 'proj-1',
        title: 'Alpha Playtest',
        playableBuild: {
          id: 'build-2',
          version: 'v0.2.0',
          fileSizeBytes: null,
        },
      };

      const result = serializePlaytestSession(session);
      expect(result?.playableBuild?.fileSizeBytes).toBeNull();
      expect(() => JSON.stringify(result)).not.toThrow();
    });

    it('handles session where playableBuild is null or undefined', () => {
      const session = {
        id: 'pt-uuid-3',
        projectId: 'proj-1',
        title: 'Orphaned Session',
        playableBuild: null,
      };

      const result = serializePlaytestSession(session);
      expect(result?.playableBuild).toBeNull();
      expect(() => JSON.stringify(result)).not.toThrow();
    });
  });
});
