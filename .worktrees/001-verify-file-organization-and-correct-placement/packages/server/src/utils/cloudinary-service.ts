import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
  format: string;
  duration?: number; // For audio/video
  bytes: number;
}

/**
 * Upload audio file to Cloudinary
 * @param buffer - File buffer from multer
 * @param filename - Original filename
 * @param folder - Cloudinary folder (e.g., 'tracks/demo', 'tracks/master')
 * @returns Upload result with URL and metadata
 */
export async function uploadAudioFile(
  buffer: Buffer,
  filename: string,
  folder: string = 'tracks'
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'video', // Cloudinary uses 'video' for audio files
        public_id: filename.replace(/\.[^/.]+$/, ''), // Remove extension
        overwrite: false,
        unique_filename: true,
        use_filename: true,
        format: 'auto', // Auto-detect format
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload failed:', error);
          reject(error);
        } else if (result) {
          const uploadResult: UploadResult = {
            url: result.url,
            publicId: result.public_id,
            secureUrl: result.secure_url,
            format: result.format,
            duration: result.duration,
            bytes: result.bytes,
          };
          console.log('[Cloudinary] Upload success:', uploadResult.publicId);
          resolve(uploadResult);
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete audio file from Cloudinary
 * @param publicId - Cloudinary public ID
 * @returns Deletion result
 */
export async function deleteAudioFile(publicId: string): Promise<void> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video',
    });
    console.log('[Cloudinary] Delete result:', result);
  } catch (error) {
    console.error('[Cloudinary] Delete failed:', error);
    throw error;
  }
}

/**
 * Get audio file info from Cloudinary
 * @param publicId - Cloudinary public ID
 * @returns File metadata
 */
export async function getAudioFileInfo(publicId: string): Promise<UploadApiResponse> {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'video',
    });
    return result;
  } catch (error) {
    console.error('[Cloudinary] Get info failed:', error);
    throw error;
  }
}

/**
 * Upload image file to Cloudinary
 * @param buffer - File buffer from multer
 * @param filename - Original filename
 * @param folder - Cloudinary folder (e.g., 'logos/org_1')
 * @returns Upload result with URL and metadata
 */
export async function uploadImageFile(
  buffer: Buffer,
  filename: string,
  folder: string = 'images'
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        public_id: filename.replace(/\.[^/.]+$/, ''), // Remove extension
        overwrite: true, // Overwrite if same filename
        unique_filename: false,
        use_filename: true,
        format: 'auto', // Auto-detect format
        transformation: [
          { width: 400, height: 400, crop: 'limit' }, // Max 400x400, preserve aspect ratio
          { quality: 'auto:good' },
        ],
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Image upload failed:', error);
          reject(error);
        } else if (result) {
          const uploadResult: UploadResult = {
            url: result.url,
            publicId: result.public_id,
            secureUrl: result.secure_url,
            format: result.format,
            bytes: result.bytes,
          };
          console.log('[Cloudinary] Image upload success:', uploadResult.publicId);
          resolve(uploadResult);
        }
      }
    );

    uploadStream.end(buffer);
  });
}

export default cloudinary;
