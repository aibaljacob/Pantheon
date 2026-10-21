import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { UploadedFileFile } from '../../profile/profile-file.interface';

@Injectable()
export class ArtDesignStorageService implements OnModuleInit {
  private readonly logger = new Logger(ArtDesignStorageService.name);
  private readonly baseUploadDir = path.resolve(process.cwd(), 'uploads');
  private readonly artDesignDir = path.join(this.baseUploadDir, 'art-design');

  onModuleInit() {
    this.ensureDirectoryExists(this.artDesignDir);
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async saveReferenceFile(file: UploadedFileFile): Promise<{
    fileUrl: string;
    fileName: string;
    fileSize: string;
    fileType: string;
  }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided for upload.');
    }

    const maxSizeBytes = 25 * 1024 * 1024; // 25 MB
    if (file.size > maxSizeBytes) {
      throw new BadRequestException('File exceeds 25 MB maximum allowed limit.');
    }

    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      'image/gif',
      'application/pdf',
      'text/plain',
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File format '${file.mimetype}' is not supported. Please upload an image (PNG, JPG, WEBP, SVG, GIF) or PDF.`,
      );
    }

    this.ensureDirectoryExists(this.artDesignDir);

    const ext = path.extname(file.originalname) || '.png';
    const uniqueFileName = `${randomUUID()}${ext}`;
    const destinationPath = path.join(this.artDesignDir, uniqueFileName);

    await fs.promises.writeFile(destinationPath, file.buffer);

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    const fileSizeStr = `${sizeInMb} MB`;
    const fileUrl = `/uploads/art-design/${uniqueFileName}`;

    return {
      fileUrl,
      fileName: file.originalname,
      fileSize: fileSizeStr,
      fileType: file.mimetype,
    };
  }
}
