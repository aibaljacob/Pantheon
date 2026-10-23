import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  SavedFile,
  SaveFileOptions,
  StorageFile,
  StorageProvider,
} from './storage.interface';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  readonly name = 'local';
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly baseUploadDir: string;

  constructor() {
    this.baseUploadDir = path.resolve(process.cwd(), 'uploads');
    this.ensureDirectoryExists(this.baseUploadDir);
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async saveFile(file: StorageFile, options: SaveFileOptions): Promise<SavedFile> {
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

    const folderDir = path.join(this.baseUploadDir, folder);
    this.ensureDirectoryExists(folderDir);

    const ext =
      path.extname(file.originalname) ||
      this.getExtensionFromMime(file.mimetype);
    const safeFilename = `${randomUUID()}${ext}`;
    const destinationPath = path.join(folderDir, safeFilename);

    // Prevent path traversal
    if (!destinationPath.startsWith(folderDir)) {
      throw new BadRequestException('Invalid filename path traversal');
    }

    await fs.promises.writeFile(destinationPath, file.buffer);

    const relativePath = `/uploads/${folder}/${safeFilename}`;
    return {
      key: relativePath,
      url: relativePath,
      sizeBytes: file.size,
      mimetype: file.mimetype,
      filename: safeFilename,
    };
  }

  async deleteFile(pathOrKey?: string | null): Promise<void> {
    if (!pathOrKey || pathOrKey.startsWith('data:') || pathOrKey.startsWith('http://') || pathOrKey.startsWith('https://')) {
      return;
    }

    try {
      const normalizedPath = pathOrKey.replace(/^\/?uploads\//, '');
      const absolutePath = path.join(this.baseUploadDir, normalizedPath);

      if (!absolutePath.startsWith(this.baseUploadDir)) {
        this.logger.warn(`Attempted path traversal deletion: ${pathOrKey}`);
        return;
      }

      if (fs.existsSync(absolutePath)) {
        await fs.promises.unlink(absolutePath);
      }
    } catch (error) {
      this.logger.error(`Failed to delete local file ${pathOrKey}:`, error);
    }
  }

  resolveUrl(pathOrKey?: string | null): string | null {
    if (!pathOrKey) return null;
    if (pathOrKey.startsWith('http://') || pathOrKey.startsWith('https://') || pathOrKey.startsWith('data:')) {
      return pathOrKey;
    }
    return pathOrKey.startsWith('/') ? pathOrKey : `/${pathOrKey}`;
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
