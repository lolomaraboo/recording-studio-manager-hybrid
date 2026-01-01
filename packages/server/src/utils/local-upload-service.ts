import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const UPLOADS_BASE = process.env.UPLOADS_PATH || '/var/www/recording-studio-manager/uploads';

export interface UploadResult {
  url: string;
  filePath: string;
  fileName: string;
  bytes: number;
}

/**
 * Upload file to local VPS storage with tenant isolation
 */
export async function uploadLocalFile(
  buffer: Buffer,
  originalFilename: string,
  tenantDatabaseName: string,
  folder: 'avatars' | 'logos'
): Promise<UploadResult> {
  // Generate unique filename
  const ext = path.extname(originalFilename);
  const hash = crypto.randomBytes(16).toString('hex');
  const fileName = `${Date.now()}-${hash}${ext}`;

  // Construct paths
  const relativePath = `${tenantDatabaseName}/${folder}/${fileName}`;
  const absolutePath = path.join(UPLOADS_BASE, relativePath);

  // Ensure directory exists
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });

  // Write file
  await fs.writeFile(absolutePath, buffer);

  // Generate public URL
  const url = `/uploads/${relativePath}`;

  return {
    url,
    filePath: relativePath,
    fileName,
    bytes: buffer.length,
  };
}

/**
 * Delete file from local storage
 */
export async function deleteLocalFile(filePath: string): Promise<void> {
  const absolutePath = path.join(UPLOADS_BASE, filePath);

  try {
    await fs.unlink(absolutePath);
    console.log('[LocalUpload] File deleted:', filePath);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    // File doesn't exist, ignore
  }
}
