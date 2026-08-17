import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { UploadedFileFile } from '../profile-file.interface';

@Injectable()
export class ProfileStorageService implements OnModuleInit {
  private readonly logger = new Logger(ProfileStorageService.name);
  private readonly baseUploadDir = path.resolve(process.cwd(), 'uploads');

  onModuleInit() {
    this.ensureDirectoryExists(path.join(this.baseUploadDir, 'avatars'));
    this.ensureDirectoryExists(path.join(this.baseUploadDir, 'banners'));
    this.ensureDirectoryExists(path.join(this.baseUploadDir, 'resumes'));
    this.ensureDirectoryExists(path.join(this.baseUploadDir, 'portfolio'));
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async saveAvatar(file: UploadedFileFile): Promise<string> {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

    this.validateFile(file, allowedMimeTypes, maxSizeBytes, 'Avatar');
    return this.writeUniqueFile(file, 'avatars');
  }

  async saveBanner(file: UploadedFileFile): Promise<string> {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB

    this.validateFile(file, allowedMimeTypes, maxSizeBytes, 'Banner');
    return this.writeUniqueFile(file, 'banners');
  }

  async savePortfolioCover(file: UploadedFileFile): Promise<string> {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB

    this.validateFile(file, allowedMimeTypes, maxSizeBytes, 'Portfolio cover');
    return this.writeUniqueFile(file, 'portfolio');
  }

  async saveResume(file: UploadedFileFile): Promise<{ downloadUrl: string; fileName: string; fileSize: string; fileType: string }> {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB

    this.validateFile(file, allowedMimeTypes, maxSizeBytes, 'Resume');
    const downloadUrl = await this.writeUniqueFile(file, 'resumes');

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const fileSizeStr = `${sizeInMb} MB`;
    const fileTypeStr = file.mimetype === 'application/pdf' ? 'PDF Document' : 'Word Document';

    return {
      downloadUrl,
      fileName: path.basename(file.originalname),
      fileSize: fileSizeStr,
      fileType: fileTypeStr,
    };
  }

  deleteFileByUrl(relativeUrl?: string | null): void {
    if (!relativeUrl || relativeUrl.startsWith('data:')) {
      return;
    }

    try {
      const normalizedPath = relativeUrl.replace(/^\/uploads\//, '');
      const absolutePath = path.join(this.baseUploadDir, normalizedPath);

      // Prevent path traversal
      if (!absolutePath.startsWith(this.baseUploadDir)) {
        this.logger.warn(`Attempted path traversal deletion: ${relativeUrl}`);
        return;
      }

      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch (error) {
      this.logger.error(`Failed to delete stored file ${relativeUrl}:`, error);
    }
  }

  private validateFile(
    file: UploadedFileFile,
    allowedMimes: string[],
    maxSize: number,
    label: string,
  ): void {
    if (!file) {
      throw new BadRequestException(`${label} file is required.`);
    }

    if (file.size > maxSize) {
      const mb = maxSize / (1024 * 1024);
      throw new BadRequestException(`${label} file size must not exceed ${mb} MB.`);
    }

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type (${file.mimetype}). Allowed types: ${allowedMimes.join(', ')}.`,
      );
    }
  }

  private async writeUniqueFile(
    file: UploadedFileFile,
    folder: 'avatars' | 'banners' | 'resumes' | 'portfolio',
  ): Promise<string> {
    const ext = path.extname(file.originalname) || this.getExtensionFromMime(file.mimetype);
    const safeFilename = `${randomUUID()}${ext}`;
    const destinationDir = path.join(this.baseUploadDir, folder);
    const destinationPath = path.join(destinationDir, safeFilename);

    // Prevent path traversal
    if (!destinationPath.startsWith(destinationDir)) {
      throw new BadRequestException('Invalid filename');
    }

    fs.writeFileSync(destinationPath, file.buffer);
    return `/uploads/${folder}/${safeFilename}`;
  }

  private getExtensionFromMime(mime: string): string {
    switch (mime) {
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'application/pdf':
        return '.pdf';
      case 'application/msword':
        return '.doc';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return '.docx';
      default:
        return '.bin';
    }
  }
}
