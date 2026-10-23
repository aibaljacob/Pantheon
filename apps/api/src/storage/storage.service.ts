import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';
import { CloudinaryStorageProvider } from './cloudinary-storage.provider';
import type {
  SavedFile,
  SaveFileOptions,
  StorageFile,
  StorageProvider,
} from './storage.interface';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private provider!: StorageProvider;

  constructor(
    private readonly localProvider: LocalStorageProvider,
    private readonly s3Provider: S3StorageProvider,
    private readonly cloudinaryProvider: CloudinaryStorageProvider,
  ) {}

  onModuleInit() {
    const rawProvider = process.env.STORAGE_PROVIDER?.toLowerCase();
    const hasCloudinaryEnv = Boolean(
      process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME,
    );

    // If explicitly set to cloudinary or if cloudinary credentials are present without explicit local override
    if (rawProvider === 'cloudinary' || (hasCloudinaryEnv && rawProvider !== 'local' && rawProvider !== 's3')) {
      this.cloudinaryProvider.validateConfig();
      this.provider = this.cloudinaryProvider;
      this.logger.log('Cloudinary media storage initialized successfully.');
    } else if (rawProvider === 's3' || rawProvider === 'r2') {
      this.s3Provider.validateConfig();
      this.provider = this.s3Provider;
      this.logger.log('Persistent S3 / Cloudflare R2 object storage initialized.');
    } else {
      this.provider = this.localProvider;
      if (process.env.NODE_ENV === 'production') {
        this.logger.warn(
          'WARNING: Application is running in PRODUCTION with local filesystem storage. ' +
          'Uploads stored on ephemeral container disks (e.g. Render) will be lost on container restart. ' +
          'Set STORAGE_PROVIDER=cloudinary along with Cloudinary credentials for persistent media storage.',
        );
      } else {
        this.logger.log('Local filesystem storage initialized for development.');
      }
    }
  }

  get activeProvider(): StorageProvider {
    if (!this.provider) {
      this.onModuleInit();
    }
    return this.provider;
  }

  async saveFile(file: StorageFile, options: SaveFileOptions): Promise<SavedFile> {
    return this.activeProvider.saveFile(file, options);
  }

  async deleteFile(pathOrKey?: string | null): Promise<void> {
    return this.activeProvider.deleteFile(pathOrKey);
  }

  resolveUrl(pathOrKey?: string | null): string | null {
    return this.activeProvider.resolveUrl(pathOrKey);
  }
}
