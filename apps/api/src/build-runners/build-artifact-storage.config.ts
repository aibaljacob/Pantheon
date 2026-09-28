import * as multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';

export function getArtifactMaxSizeBytes(): number {
  const mb = parseInt(process.env.BUILD_ARTIFACT_MAX_SIZE_MB || '500', 10);
  const safeMb = isNaN(mb) || mb <= 0 ? 500 : mb;
  return safeMb * 1024 * 1024;
}

export function getUploadsBaseDir(): string {
  return path.resolve(process.cwd(), 'uploads');
}

export function getTempUploadDir(): string {
  return path.join(getUploadsBaseDir(), 'temp');
}

export function getBuildArtifactStoragePath(
  projectId: string,
  jobId: string,
): { dir: string; fullPath: string; relativeKey: string } {
  // Sanitize identifiers to prevent path traversal
  const safeProjectId = projectId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeJobId = jobId.replace(/[^a-zA-Z0-9_-]/g, '_');

  const relativeKey = path
    .join('builds', safeProjectId, safeJobId, 'artifact.zip')
    .replace(/\\/g, '/');

  const dir = path.join(
    getUploadsBaseDir(),
    'builds',
    safeProjectId,
    safeJobId,
  );
  const fullPath = path.join(dir, 'artifact.zip');

  return { dir, fullPath, relativeKey };
}

export const buildArtifactUploadOptions: multer.Options = {
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const tempDir = getTempUploadDir();
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      cb(null, tempDir);
    },
    filename: (_req, _file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `artifact-${uniqueSuffix}.tmp`);
    },
  }),
  limits: {
    fileSize: getArtifactMaxSizeBytes(),
  },
};
