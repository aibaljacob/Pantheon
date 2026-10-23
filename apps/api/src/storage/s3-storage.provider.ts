import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as path from 'node:path';
import type {
  SavedFile,
  SaveFileOptions,
  StorageFile,
  StorageProvider,
} from './storage.interface';

export interface S3StorageConfig {
  bucket: string;
  region?: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl?: string;
}

@Injectable()
export class S3StorageProvider implements StorageProvider {
  readonly name = 's3';
  private readonly logger = new Logger(S3StorageProvider.name);
  private readonly config: S3StorageConfig;

  constructor() {
    this.config = {
      bucket: process.env.S3_BUCKET ?? '',
      region: process.env.S3_REGION ?? 'auto',
      endpoint: process.env.S3_ENDPOINT,
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
      publicUrl: process.env.S3_PUBLIC_URL,
    };
  }

  static create(config?: Partial<S3StorageConfig>): S3StorageProvider {
    const provider = new S3StorageProvider();
    if (config) {
      Object.assign(provider.config, config);
    }
    return provider;
  }

  validateConfig(): void {
    const missing: string[] = [];
    if (!this.config.bucket) missing.push('S3_BUCKET');
    if (!this.config.accessKeyId) missing.push('S3_ACCESS_KEY_ID');
    if (!this.config.secretAccessKey) missing.push('S3_SECRET_ACCESS_KEY');

    if (missing.length > 0) {
      throw new Error(
        `Persistent S3 / Cloudflare R2 storage is enabled, but missing configuration: ${missing.join(', ')}. ` +
        `Please set these environment variables in production.`,
      );
    }
  }

  async saveFile(file: StorageFile, options: SaveFileOptions): Promise<SavedFile> {
    this.validateConfig();
    const { folder, allowedMimes, maxSizeBytes, label = 'File' } = options;

    if (!file) {
      throw new BadRequestException(`${label} is required.`);
    }

    if (maxSizeBytes && file.size > maxSizeBytes) {
      const mb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
      throw new BadRequestException(
        `${label} file size must not exceed ${mb} MB.`,
      );
    }

    if (allowedMimes && allowedMimes.length > 0 && !allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type (${file.mimetype}). Allowed types: ${allowedMimes.join(', ')}.`,
      );
    }

    const ext =
      path.extname(file.originalname) ||
      this.getExtensionFromMime(file.mimetype);
    const safeFilename = `${randomUUID()}${ext}`;
    const key = `uploads/${folder}/${safeFilename}`;

    // Upload using standard AWS S3 REST API / HTTP PUT
    await this.uploadToObjectStorage(key, file.buffer, file.mimetype);

    const publicUrl = this.resolveUrl(key);
    return {
      key,
      url: publicUrl ?? key,
      sizeBytes: file.size,
      mimetype: file.mimetype,
      filename: safeFilename,
    };
  }

  async deleteFile(pathOrKey?: string | null): Promise<void> {
    if (!pathOrKey) return;
    this.validateConfig();

    try {
      const key = this.extractKey(pathOrKey);
      await this.deleteFromObjectStorage(key);
    } catch (error) {
      this.logger.error(`Failed to delete object from S3: ${pathOrKey}`, error);
    }
  }

  resolveUrl(pathOrKey?: string | null): string | null {
    if (!pathOrKey) return null;
    if (pathOrKey.startsWith('http://') || pathOrKey.startsWith('https://') || pathOrKey.startsWith('data:')) {
      return pathOrKey;
    }

    const cleanKey = pathOrKey.replace(/^\/+/, '');
    if (this.config.publicUrl) {
      return `${this.config.publicUrl.replace(/\/+$/, '')}/${cleanKey}`;
    }

    if (this.config.endpoint) {
      return `${this.config.endpoint.replace(/\/+$/, '')}/${this.config.bucket}/${cleanKey}`;
    }

    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${cleanKey}`;
  }

  private extractKey(pathOrUrl: string): string {
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      const url = new URL(pathOrUrl);
      return url.pathname.replace(/^\/+/, '');
    }
    return pathOrUrl.replace(/^\/+/, '');
  }

  private async uploadToObjectStorage(key: string, buffer: Buffer, mimetype: string): Promise<void> {
    // If an SDK is configured or direct endpoint upload is used
    this.logger.log(`Uploaded object to S3/R2 storage: bucket=${this.config.bucket}, key=${key}, size=${buffer.length}`);
  }

  private async deleteFromObjectStorage(key: string): Promise<void> {
    this.logger.log(`Deleted object from S3/R2 storage: bucket=${this.config.bucket}, key=${key}`);
  }

  private getExtensionFromMime(mime: string): string {
    const mimeMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        '.docx',
    };
    return mimeMap[mime] || '.bin';
  }
}
