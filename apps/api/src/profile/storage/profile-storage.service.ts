import { Injectable } from '@nestjs/common';
import * as path from 'node:path';
import type { UploadedFileFile } from '../profile-file.interface';
import { StorageService } from '../../storage/storage.service';

@Injectable()
export class ProfileStorageService {
  constructor(private readonly storageService: StorageService) {}

  async saveAvatar(file: UploadedFileFile): Promise<string> {
    const saved = await this.storageService.saveFile(file, {
      folder: 'avatars',
      allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
      maxSizeBytes: 5 * 1024 * 1024,
      label: 'Avatar',
    });
    return saved.url;
  }

  async saveBanner(file: UploadedFileFile): Promise<string> {
    const saved = await this.storageService.saveFile(file, {
      folder: 'banners',
      allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
      maxSizeBytes: 10 * 1024 * 1024,
      label: 'Banner',
    });
    return saved.url;
  }

  async savePortfolioCover(file: UploadedFileFile): Promise<string> {
    const saved = await this.storageService.saveFile(file, {
      folder: 'portfolio',
      allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
      maxSizeBytes: 10 * 1024 * 1024,
      label: 'Portfolio cover',
    });
    return saved.url;
  }

  async saveResume(file: UploadedFileFile): Promise<{
    downloadUrl: string;
    fileName: string;
    fileSize: string;
    fileType: string;
  }> {
    const saved = await this.storageService.saveFile(file, {
      folder: 'resumes',
      allowedMimes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      maxSizeBytes: 10 * 1024 * 1024,
      label: 'Resume',
    });

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const fileSizeStr = `${sizeInMb} MB`;
    const fileTypeStr =
      file.mimetype === 'application/pdf' ? 'PDF Document' : 'Word Document';

    return {
      downloadUrl: saved.url,
      fileName: path.basename(file.originalname),
      fileSize: fileSizeStr,
      fileType: fileTypeStr,
    };
  }

  deleteFileByUrl(relativeUrl?: string | null): void {
    void this.storageService.deleteFile(relativeUrl);
  }
}
