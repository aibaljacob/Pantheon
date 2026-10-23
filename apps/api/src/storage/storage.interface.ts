export interface StorageFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface SaveFileOptions {
  folder: string;
  allowedMimes?: string[];
  maxSizeBytes?: number;
  label?: string;
  isPrivate?: boolean;
}

export interface SavedFile {
  /** Storage key or relative path stored in DB, e.g. /uploads/avatars/uuid.jpg or Cloudinary public_id */
  key: string;
  /** Browser-accessible URL */
  url: string;
  sizeBytes: number;
  mimetype: string;
  filename: string;
}

export interface StorageProvider {
  readonly name: string;
  saveFile(file: StorageFile, options: SaveFileOptions): Promise<SavedFile>;
  deleteFile(pathOrKey?: string | null): Promise<void>;
  resolveUrl(pathOrKey?: string | null): string | null;
}
