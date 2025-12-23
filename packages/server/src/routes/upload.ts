import { Router } from 'express';
import multer from 'multer';
import { uploadAudioFile } from '../utils/cloudinary-service';

const router = Router();

// Configure multer for memory storage (we'll upload to Cloudinary from buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Accept audio files only
    const allowedMimes = [
      'audio/mpeg', // mp3
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/flac',
      'audio/x-flac',
      'audio/aac',
      'audio/ogg',
      'audio/webm',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only audio files are allowed.`));
    }
  },
});

/**
 * Upload audio file endpoint
 * POST /api/upload/audio
 *
 * Body (multipart/form-data):
 * - file: Audio file
 * - versionType: 'demo' | 'roughMix' | 'finalMix' | 'master'
 * - trackId: Track ID (optional, for folder organization)
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     url: string,
 *     secureUrl: string,
 *     publicId: string,
 *     format: string,
 *     duration: number,
 *     bytes: number
 *   }
 * }
 */
router.post('/audio', upload.single('file'), async (req, res) => {
  try {
    console.log('[Upload] Received upload request');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    const { versionType = 'demo', trackId } = req.body;
    const validVersions = ['demo', 'roughMix', 'finalMix', 'master'];

    if (!validVersions.includes(versionType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid version type. Must be one of: ${validVersions.join(', ')}`,
      });
    }

    console.log('[Upload] File:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      versionType,
      trackId,
    });

    // Create folder path: tracks/{trackId}/{versionType}
    const folder = trackId
      ? `tracks/${trackId}/${versionType}`
      : `tracks/temp/${versionType}`;

    // Upload to Cloudinary
    const result = await uploadAudioFile(
      req.file.buffer,
      req.file.originalname,
      folder
    );

    console.log('[Upload] Upload success:', result.publicId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Upload] Upload failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Upload failed',
    });
  }
});

/**
 * Delete audio file endpoint
 * DELETE /api/upload/audio/:publicId
 */
router.delete('/audio/:publicId(*)', async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        error: 'Public ID is required',
      });
    }

    console.log('[Upload] Delete request:', publicId);

    const { deleteAudioFile } = await import('../utils/cloudinary-service');
    await deleteAudioFile(publicId);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error: any) {
    console.error('[Upload] Delete failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Delete failed',
    });
  }
});

export default router;
