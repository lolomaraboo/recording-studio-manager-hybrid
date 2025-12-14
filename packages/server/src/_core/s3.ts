/**
 * AWS S3 Integration Module
 *
 * Handles file storage for audio files, documents, and project assets:
 * - Upload files with presigned URLs
 * - Download files with presigned URLs
 * - Delete files
 * - List files in a path
 * - File versioning support
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 Configuration from environment
const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  bucket: process.env.AWS_S3_BUCKET || '',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
};

// Initialize S3 client
const s3Client =
  s3Config.accessKeyId && s3Config.secretAccessKey
    ? new S3Client({
        region: s3Config.region,
        credentials: {
          accessKeyId: s3Config.accessKeyId,
          secretAccessKey: s3Config.secretAccessKey,
        },
      })
    : null;

if (!s3Client) {
  console.warn('AWS S3 not configured - file upload features will be disabled');
}

/**
 * Check if S3 is configured
 */
export function isS3Configured(): boolean {
  return s3Client !== null && s3Config.bucket !== '';
}

/**
 * Get S3 bucket name
 */
export function getBucketName(): string {
  return s3Config.bucket;
}

/**
 * Generate a storage path for project files
 * Format: tenants/{tenantId}/projects/{projectId}/{fileType}/{fileName}
 */
export function generateStoragePath(params: {
  tenantId: string;
  projectId: number;
  trackId?: number;
  fileType: 'audio' | 'document' | 'image' | 'video' | 'other';
  fileName: string;
  version?: number;
}): string {
  const { tenantId, projectId, trackId, fileType, fileName, version = 1 } = params;

  // Clean filename
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Add version suffix if not v1
  const versionedFileName =
    version > 1
      ? `${cleanFileName.replace(/(\.[^.]+)$/, `_v${version}$1`)}`
      : cleanFileName;

  // Build path
  const basePath = `tenants/${tenantId}/projects/${projectId}`;
  const trackPath = trackId ? `/tracks/${trackId}` : '';

  return `${basePath}${trackPath}/${fileType}/${versionedFileName}`;
}

/**
 * Generate a presigned URL for uploading a file
 * Returns a URL that can be used directly by the client to upload
 */
export async function getUploadPresignedUrl(params: {
  storagePath: string;
  contentType: string;
  expiresIn?: number; // seconds, default 1 hour
}): Promise<{ url: string; expiresAt: Date } | null> {
  if (!s3Client || !s3Config.bucket) {
    console.error('S3 not configured');
    return null;
  }

  const { storagePath, contentType, expiresIn = 3600 } = params;

  const command = new PutObjectCommand({
    Bucket: s3Config.bucket,
    Key: storagePath,
    ContentType: contentType,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return { url, expiresAt };
  } catch (error) {
    console.error('Error generating upload presigned URL:', error);
    return null;
  }
}

/**
 * Generate a presigned URL for downloading a file
 */
export async function getDownloadPresignedUrl(params: {
  storagePath: string;
  expiresIn?: number; // seconds, default 1 hour
  downloadFileName?: string; // Custom filename for download
}): Promise<{ url: string; expiresAt: Date } | null> {
  if (!s3Client || !s3Config.bucket) {
    console.error('S3 not configured');
    return null;
  }

  const { storagePath, expiresIn = 3600, downloadFileName } = params;

  const command = new GetObjectCommand({
    Bucket: s3Config.bucket,
    Key: storagePath,
    ...(downloadFileName && {
      ResponseContentDisposition: `attachment; filename="${downloadFileName}"`,
    }),
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return { url, expiresAt };
  } catch (error) {
    console.error('Error generating download presigned URL:', error);
    return null;
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFile(storagePath: string): Promise<boolean> {
  if (!s3Client || !s3Config.bucket) {
    console.error('S3 not configured');
    return false;
  }

  const command = new DeleteObjectCommand({
    Bucket: s3Config.bucket,
    Key: storagePath,
  });

  try {
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Check if a file exists in S3
 */
export async function fileExists(storagePath: string): Promise<boolean> {
  if (!s3Client || !s3Config.bucket) {
    return false;
  }

  const command = new HeadObjectCommand({
    Bucket: s3Config.bucket,
    Key: storagePath,
  });

  try {
    await s3Client.send(command);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file metadata from S3
 */
export async function getFileMetadata(storagePath: string): Promise<{
  size: number;
  contentType: string;
  lastModified: Date;
} | null> {
  if (!s3Client || !s3Config.bucket) {
    return null;
  }

  const command = new HeadObjectCommand({
    Bucket: s3Config.bucket,
    Key: storagePath,
  });

  try {
    const response = await s3Client.send(command);
    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType || 'application/octet-stream',
      lastModified: response.LastModified || new Date(),
    };
  } catch {
    return null;
  }
}

/**
 * List files in a path prefix
 */
export async function listFiles(params: {
  prefix: string;
  maxKeys?: number;
  continuationToken?: string;
}): Promise<{
  files: Array<{
    key: string;
    size: number;
    lastModified: Date;
  }>;
  nextToken?: string;
} | null> {
  if (!s3Client || !s3Config.bucket) {
    return null;
  }

  const { prefix, maxKeys = 100, continuationToken } = params;

  const command = new ListObjectsV2Command({
    Bucket: s3Config.bucket,
    Prefix: prefix,
    MaxKeys: maxKeys,
    ContinuationToken: continuationToken,
  });

  try {
    const response = await s3Client.send(command);

    const files = (response.Contents || []).map((obj) => ({
      key: obj.Key || '',
      size: obj.Size || 0,
      lastModified: obj.LastModified || new Date(),
    }));

    return {
      files,
      nextToken: response.NextContinuationToken,
    };
  } catch (error) {
    console.error('Error listing files:', error);
    return null;
  }
}

/**
 * Copy a file to create a new version
 */
export async function copyFile(params: {
  sourceKey: string;
  destinationKey: string;
}): Promise<boolean> {
  if (!s3Client || !s3Config.bucket) {
    return false;
  }

  const { sourceKey, destinationKey } = params;

  const command = new CopyObjectCommand({
    Bucket: s3Config.bucket,
    CopySource: `${s3Config.bucket}/${sourceKey}`,
    Key: destinationKey,
  });

  try {
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error copying file:', error);
    return false;
  }
}

/**
 * Allowed audio MIME types
 */
export const AUDIO_MIME_TYPES = [
  'audio/mpeg', // .mp3
  'audio/wav', // .wav
  'audio/x-wav',
  'audio/aiff', // .aiff
  'audio/x-aiff',
  'audio/flac', // .flac
  'audio/x-flac',
  'audio/aac', // .aac
  'audio/mp4', // .m4a
  'audio/x-m4a',
  'audio/ogg', // .ogg
] as const;

/**
 * Allowed document MIME types
 */
export const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
] as const;

/**
 * Allowed image MIME types
 */
export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const;

/**
 * Get file type category from MIME type
 */
export function getFileTypeFromMime(
  mimeType: string
): 'audio' | 'document' | 'image' | 'video' | 'other' {
  if (AUDIO_MIME_TYPES.includes(mimeType as (typeof AUDIO_MIME_TYPES)[number])) {
    return 'audio';
  }
  if (DOCUMENT_MIME_TYPES.includes(mimeType as (typeof DOCUMENT_MIME_TYPES)[number])) {
    return 'document';
  }
  if (IMAGE_MIME_TYPES.includes(mimeType as (typeof IMAGE_MIME_TYPES)[number])) {
    return 'image';
  }
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  return 'other';
}

/**
 * Max file sizes by type (in bytes)
 */
export const MAX_FILE_SIZES = {
  audio: 500 * 1024 * 1024, // 500MB for audio files
  document: 50 * 1024 * 1024, // 50MB for documents
  image: 10 * 1024 * 1024, // 10MB for images
  video: 1024 * 1024 * 1024, // 1GB for video
  other: 100 * 1024 * 1024, // 100MB for other files
} as const;

/**
 * Validate file upload
 */
export function validateFileUpload(params: {
  fileName: string;
  mimeType: string;
  fileSize: number;
  allowedTypes?: Array<'audio' | 'document' | 'image' | 'video' | 'other'>;
}): { valid: boolean; error?: string } {
  const { fileName, mimeType, fileSize, allowedTypes } = params;

  // Check file name
  if (!fileName || fileName.length > 255) {
    return { valid: false, error: 'Invalid file name' };
  }

  // Get file type
  const fileType = getFileTypeFromMime(mimeType);

  // Check allowed types
  if (allowedTypes && !allowedTypes.includes(fileType)) {
    return {
      valid: false,
      error: `File type ${fileType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  const maxSize = MAX_FILE_SIZES[fileType];
  if (fileSize > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${maxSizeMB}MB for ${fileType} files)`,
    };
  }

  return { valid: true };
}
