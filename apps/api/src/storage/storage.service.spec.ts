import { BadRequestException } from '@nestjs/common';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';
import { StorageService } from './storage.service';
import type { StorageFile } from './storage.interface';

describe('Storage System', () => {
  describe('LocalStorageProvider', () => {
    let provider: LocalStorageProvider;

    beforeEach(() => {
      provider = new LocalStorageProvider();
    });

    it('should save a valid image file and return a browser-accessible relative path', async () => {
      const mockFile: StorageFile = {
        buffer: Buffer.from('fake-image-bytes'),
        originalname: 'test-avatar.png',
        mimetype: 'image/png',
        size: 16,
      };

      const result = await provider.saveFile(mockFile, {
        folder: 'avatars',
        allowedMimes: ['image/png', 'image/jpeg'],
        maxSizeBytes: 1024 * 1024,
      });

      expect(result.url).toMatch(/^\/uploads\/avatars\/[a-f0-9-]+\.png$/);
      expect(result.key).toBe(result.url);
      expect(result.sizeBytes).toBe(16);
      expect(result.mimetype).toBe('image/png');

      // Cleanup
      await provider.deleteFile(result.key);
    });

    it('should reject files exceeding maxSizeBytes', async () => {
      const mockFile: StorageFile = {
        buffer: Buffer.from('large-bytes'),
        originalname: 'large.jpg',
        mimetype: 'image/jpeg',
        size: 2000,
      };

      await expect(
        provider.saveFile(mockFile, {
          folder: 'banners',
          maxSizeBytes: 1000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject files with unsupported mime types', async () => {
      const mockFile: StorageFile = {
        buffer: Buffer.from('script'),
        originalname: 'hack.exe',
        mimetype: 'application/x-msdownload',
        size: 50,
      };

      await expect(
        provider.saveFile(mockFile, {
          folder: 'avatars',
          allowedMimes: ['image/jpeg', 'image/png'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should resolve local paths to root-relative URLs', () => {
      expect(provider.resolveUrl('/uploads/avatars/123.jpg')).toBe('/uploads/avatars/123.jpg');
      expect(provider.resolveUrl('uploads/avatars/123.jpg')).toBe('/uploads/avatars/123.jpg');
      expect(provider.resolveUrl('https://lh3.googleusercontent.com/avatar')).toBe(
        'https://lh3.googleusercontent.com/avatar',
      );
    });
  });

  describe('S3StorageProvider', () => {
    it('should throw an informative error if required S3 credentials are missing', () => {
      const provider = S3StorageProvider.create({
        bucket: '',
        accessKeyId: '',
        secretAccessKey: '',
      });

      expect(() => provider.validateConfig()).toThrow(
        /missing configuration: S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY/,
      );
    });

    it('should construct public CDN URLs correctly when S3_PUBLIC_URL is configured', () => {
      const provider = S3StorageProvider.create({
        bucket: 'pantheon-media',
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        publicUrl: 'https://cdn.pantheon.dev',
      });

      expect(provider.resolveUrl('uploads/avatars/avatar.jpg')).toBe(
        'https://cdn.pantheon.dev/uploads/avatars/avatar.jpg',
      );
    });

    it('should construct endpoint URLs correctly when custom endpoint is configured', () => {
      const provider = S3StorageProvider.create({
        bucket: 'pantheon-media',
        endpoint: 'https://r2.cloudflarestorage.com',
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
      });

      expect(provider.resolveUrl('uploads/avatars/avatar.jpg')).toBe(
        'https://r2.cloudflarestorage.com/pantheon-media/uploads/avatars/avatar.jpg',
      );
    });
  });

  describe('StorageService', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should initialize LocalStorageProvider by default', () => {
      delete process.env.STORAGE_PROVIDER;
      const service = new StorageService(new LocalStorageProvider(), new S3StorageProvider());
      service.onModuleInit();

      expect(service.activeProvider.name).toBe('local');
    });

    it('should fail fast if STORAGE_PROVIDER is s3 but credentials are missing', () => {
      process.env.STORAGE_PROVIDER = 's3';
      delete process.env.S3_BUCKET;
      delete process.env.S3_ACCESS_KEY_ID;
      delete process.env.S3_SECRET_ACCESS_KEY;

      const service = new StorageService(new LocalStorageProvider(), new S3StorageProvider());
      expect(() => service.onModuleInit()).toThrow(/missing configuration/);
    });
  });
});
