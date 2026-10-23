import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import type {
  SavedFile,
  SaveFileOptions,
  StorageFile,
  StorageProvider,
} from './storage.interface';

export interface CloudinaryConfig {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
  cloudinaryUrl?: string;
}

@Injectable()
export class CloudinaryStorageProvider implements StorageProvider {
  readonly name = 'cloudinary';
  private readonly logger = new Logger(CloudinaryStorageProvider.name);
  private config: CloudinaryConfig;
  private isConfigured = false;

  constructor() {
    this.config = {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      cloudinaryUrl: process.env.CLOUDINARY_URL,
    };
    this.initCloudinary();
  }

  static create(config?: Partial<CloudinaryConfig>): CloudinaryStorageProvider {
    const provider = new CloudinaryStorageProvider();
    if (config) {
      provider.config = { ...provider.config, ...config };
      provider.initCloudinary();
    }
    return provider;
  }

  private initCloudinary(): void {
    if (this.config.cloudinaryUrl) {
      cloudinary.config({
        cloudinary_url: this.config.cloudinaryUrl,
      });
      this.isConfigured = true;
    } else if (this.config.cloudName && this.config.apiKey && this.config.apiSecret) {
      cloudinary.config({
        cloud_name: this.config.cloudName,
        api_key: this.config.apiKey,
        api_secret: this.config.apiSecret,
        secure: true,
      });
      this.isConfigured = true;
    } else {
      this.isConfigured = false;
    }
  }

  validateConfig(): void {
    if (!this.isConfigured) {
      const missing: string[] = [];
      if (!this.config.cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
      if (!this.config.apiKey) missing.push('CLOUDINARY_API_KEY');
      if (!this.config.apiSecret) missing.push('CLOUDINARY_API_SECRET');

      throw new Error(
        `Cloudinary storage is enabled, but missing configuration: ${missing.join(', ')} (or CLOUDINARY_URL). ` +
        `Please set these environment variables on the backend.`,
      );
    }
  }

  async saveFile(file: StorageFile, options: SaveFileOptions): Promise<SavedFile> {
    this.validateConfig();
    const { folder, allowedMimes, maxSizeBytes, label = 'File', isPrivate = false } = options;

    if (!file || !file.buffer) {
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

    const isImage = file.mimetype.startsWith('image/');
    const rawExt = path.extname(file.originalname).replace(/^\./, '');
    const safeId = `${randomUUID()}`;
    const targetFolder = `pantheon/${folder}`;

    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadOptions: Record<string, any> = {
        folder: targetFolder,
        public_id: safeId,
        resource_type: isImage ? 'image' : 'raw',
        type: isPrivate ? 'authenticated' : 'upload',
        overwrite: true,
      };

      if (!isImage && rawExt) {
        uploadOptions.format = rawExt;
      }

      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error || !result) {
            this.logger.error('Cloudinary upload_stream error:', error);
            reject(
              new BadRequestException(
                `Media upload to Cloudinary failed: ${error?.message || 'Unknown error'}`,
              ),
            );
          } else {
            resolve(result);
          }
        },
      );

      Readable.from(file.buffer).pipe(stream);
    });

    let effectiveUrl = uploadResult.secure_url;
    // For authenticated/private files (such as resumes), generate a signed delivery URL
    if (isPrivate) {
      effectiveUrl = cloudinary.url(uploadResult.public_id, {
        resource_type: uploadResult.resource_type || (isImage ? 'image' : 'raw'),
        type: 'authenticated',
        sign_url: true,
        secure: true,
      });
    }

    return {
      key: uploadResult.public_id,
      url: effectiveUrl,
      sizeBytes: uploadResult.bytes || file.size,
      mimetype: file.mimetype,
      filename: `${safeId}.${uploadResult.format || rawExt || 'bin'}`,
    };
  }

  async deleteFile(pathOrKey?: string | null): Promise<void> {
    if (!pathOrKey) return;
    this.validateConfig();

    try {
      const publicId = this.extractPublicId(pathOrKey);
      if (!publicId) return;

      const isRaw = pathOrKey.includes('/resumes/') || pathOrKey.endsWith('.pdf') || pathOrKey.endsWith('.doc') || pathOrKey.endsWith('.docx');
      const resourceType = isRaw ? 'raw' : 'image';

      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });
    } catch (error) {
      this.logger.error(`Failed to delete Cloudinary media ${pathOrKey}:`, error);
    }
  }

  resolveUrl(pathOrKey?: string | null): string | null {
    if (!pathOrKey) return null;

    if (pathOrKey.startsWith('http://') || pathOrKey.startsWith('https://') || pathOrKey.startsWith('data:')) {
      return pathOrKey;
    }

    if (this.isConfigured && !pathOrKey.startsWith('/uploads/')) {
      return cloudinary.url(pathOrKey, { secure: true });
    }

    return pathOrKey.startsWith('/') ? pathOrKey : `/${pathOrKey}`;
  }

  private extractPublicId(pathOrUrl: string): string | null {
    if (!pathOrUrl.startsWith('http://') && !pathOrUrl.startsWith('https://')) {
      // It may already be a public_id like 'pantheon/avatars/abc' or a local path
      if (pathOrUrl.startsWith('/uploads/')) {
        return null;
      }
      return pathOrUrl.replace(/^\/+/, '');
    }

    try {
      const parsed = new URL(pathOrUrl);
      if (!parsed.hostname.includes('cloudinary.com')) {
        return null;
      }

      // Format: /<cloud_name>/image/upload/v<version>/<public_id>.<ext>
      const match = parsed.pathname.match(
        /\/(?:image|raw|video)\/(?:upload|authenticated)\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/,
      );
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
}
