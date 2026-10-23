import { Injectable } from '@nestjs/common';
import type { UploadedFileFile } from '../../profile/profile-file.interface';
import { StorageService } from '../../storage/storage.service';

@Injectable()
export class ArtDesignStorageService {
  constructor(private readonly storageService: StorageService) {}

  async saveReferenceFile(file: UploadedFileFile): Promise<{
    fileUrl: string;
    fileName: string;
    fileSize: string;
    fileType: string;
  }> {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      'image/gif',
      'application/pdf',
      'text/plain',
    ];

    const saved = await this.storageService.saveFile(file, {
      folder: 'art-design',
      allowedMimes,
      maxSizeBytes: 25 * 1024 * 1024,
      label: 'Art/design reference',
    });

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    const fileSizeStr = `${sizeInMb} MB`;

    return {
      fileUrl: saved.url,
      fileName: file.originalname,
      fileSize: fileSizeStr,
      fileType: file.mimetype,
    };
  }
}
