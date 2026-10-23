import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';
import { CloudinaryStorageProvider } from './cloudinary-storage.provider';

@Global()
@Module({
  providers: [
    StorageService,
    LocalStorageProvider,
    S3StorageProvider,
    CloudinaryStorageProvider,
  ],
  exports: [StorageService],
})
export class StorageModule {}
