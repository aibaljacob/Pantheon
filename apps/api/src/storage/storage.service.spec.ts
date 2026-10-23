import { BadRequestException } from '@nestjs/common';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';
import { CloudinaryStorageProvider } from './cloudinary-storage.provider';
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

  describe('CloudinaryStorageProvider', () => {
    it('should throw an informative error if Cloudinary credentials are missing', () => {
      const provider = CloudinaryStorageProvider.create({});
      expect(() => provider.validateConfig()).toThrow(
        /missing configuration: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET/,
      );
    });

    it('should validate successfully when full credentials or URL are present', () => {
      const provider = CloudinaryStorageProvider.create({
        cloudName: 'test-cloud',
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      });
      expect(() => provider.validateConfig()).not.toThrow();

      const urlProvider = CloudinaryStorageProvider.create({
        cloudinaryUrl: 'cloudinary://key:secret@test-cloud',
      });
      expect(() => urlProvider.validateConfig()).not.toThrow();
    });

    it('should resolve URLs properly without prepending localhost or API url', () => {
      const provider = CloudinaryStorageProvider.create({
        cloudName: 'demo',
        apiKey: 'key',
        apiSecret: 'sec',
      });

      expect(
        provider.resolveUrl('https://res.cloudinary.com/demo/image/upload/v1/sample.jpg'),
      ).toBe('https://res.cloudinary.com/demo/image/upload/v1/sample.jpg');

      expect(provider.resolveUrl('/uploads/avatars/legacy.jpg')).toBe(
        '/uploads/avatars/legacy.jpg',
      );
    });

    it('should reject files exceeding maxSizeBytes before calling Cloudinary', async () => {
      const provider = CloudinaryStorageProvider.create({
        cloudName: 'demo',
        apiKey: 'key',
        apiSecret: 'sec',
      });

      const mockFile: StorageFile = {
        buffer: Buffer.from('large'),
        originalname: 'big.jpg',
        mimetype: 'image/jpeg',
        size: 5000,
      };

      await expect(
        provider.saveFile(mockFile, {
          folder: 'avatars',
          maxSizeBytes: 1000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject files with unsupported mime types', async () => {
      const provider = CloudinaryStorageProvider.create({
        cloudName: 'demo',
        apiKey: 'key',
        apiSecret: 'sec',
      });

      const mockFile: StorageFile = {
        buffer: Buffer.from('malicious'),
        originalname: 'malware.sh',
        mimetype: 'application/x-sh',
        size: 100,
      };

      await expect(
        provider.saveFile(mockFile, {
          folder: 'avatars',
          allowedMimes: ['image/jpeg', 'image/png'],
        }),
      ).rejects.toThrow(BadRequestException);
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
      const service = new StorageService(
        new LocalStorageProvider(),
        new S3StorageProvider(),
        new CloudinaryStorageProvider(),
      );
      service.onModuleInit();

      expect(service.activeProvider.name).toBe('local');
    });

    it('should activate CloudinaryStorageProvider when STORAGE_PROVIDER is cloudinary', () => {
      process.env.STORAGE_PROVIDER = 'cloudinary';
      process.env.CLOUDINARY_CLOUD_NAME = 'demo';
      process.env.CLOUDINARY_API_KEY = 'test-key';
      process.env.CLOUDINARY_API_SECRET = 'test-secret';

      const service = new StorageService(
        new LocalStorageProvider(),
        new S3StorageProvider(),
        new CloudinaryStorageProvider(),
      );
      service.onModuleInit();

      expect(service.activeProvider.name).toBe('cloudinary');
    });

    it('should fail fast if STORAGE_PROVIDER is cloudinary but credentials are missing', () => {
      process.env.STORAGE_PROVIDER = 'cloudinary';
      delete process.env.CLOUDINARY_CLOUD_NAME;
      delete process.env.CLOUDINARY_API_KEY;
      delete process.env.CLOUDINARY_API_SECRET;
      delete process.env.CLOUDINARY_URL;

      const service = new StorageService(
        new LocalStorageProvider(),
        new S3StorageProvider(),
        new CloudinaryStorageProvider(),
      );
      expect(() => service.onModuleInit()).toThrow(/missing configuration/);
    });

    it('should fail fast if STORAGE_PROVIDER is s3 but credentials are missing', () => {
      process.env.STORAGE_PROVIDER = 's3';
      delete process.env.S3_BUCKET;
      delete process.env.S3_ACCESS_KEY_ID;
      delete process.env.S3_SECRET_ACCESS_KEY;

      const service = new StorageService(
        new LocalStorageProvider(),
        new S3StorageProvider(),
        new CloudinaryStorageProvider(),
      );
      expect(() => service.onModuleInit()).toThrow(/missing configuration/);
    });
  });
});
