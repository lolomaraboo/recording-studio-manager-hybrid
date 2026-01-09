import { Router, Request } from 'express';
import multer from 'multer';
import { uploadAudioFile } from '../utils/cloudinary-service';

// Extend Express Request to include Multer file
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

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
router.post('/audio', upload.single('file'), async (req: MulterRequest, res) => {
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

/**
 * Upload logo/image endpoint
 * POST /api/upload/logo
 *
 * Body (multipart/form-data):
 * - file: Image file (PNG, JPG, SVG, WebP)
 * - organizationId: Organization ID
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     url: string,
 *     secureUrl: string,
 *     publicId: string
 *   }
 * }
 */
const uploadLogo = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/svg+xml',
      'image/webp',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only images are allowed.`));
    }
  },
});

router.post('/logo', uploadLogo.single('file'), async (req: MulterRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    const { organizationId } = req.body;

    console.log('[Upload] Logo upload:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      organizationId,
    });

    // Upload to Cloudinary (images folder)
    const { uploadImageFile } = await import('../utils/cloudinary-service');
    const folder = organizationId ? `logos/org_${organizationId}` : 'logos/temp';

    const result = await uploadImageFile(
      req.file.buffer,
      req.file.originalname,
      folder
    );

    console.log('[Upload] Logo upload success:', result.publicId);

    res.json({
      success: true,
      data: {
        url: result.url,
        secureUrl: result.secureUrl,
        publicId: result.publicId,
      },
    });
  } catch (error: any) {
    console.error('[Upload] Logo upload failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Upload failed',
    });
  }
});

/**
 * Upload avatar/logo endpoint (LOCAL STORAGE - vCard support)
 * POST /api/upload/avatar
 * POST /api/upload/client-logo
 *
 * Body (multipart/form-data):
 * - file: Image file (PNG, JPG, WebP)
 *
 * Returns: { success: true, data: { url, filePath, fileName, bytes } }
 */
const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only images allowed.`));
    }
  },
});

router.post('/avatar', uploadAvatar.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Get user's tenant database name
    const { getMasterDb } = await import('@rsm/database/connection');
    const { tenantDatabases } = await import('@rsm/database/master/schema');
    const { eq } = await import('drizzle-orm');

    const userId = req.session?.userId;
    const organizationId = req.session?.organizationId;

    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const masterDb = await getMasterDb();
    const [tenant] = await masterDb
      .select()
      .from(tenantDatabases)
      .where(eq(tenantDatabases.organizationId, organizationId))
      .limit(1);

    if (!tenant) {
      return res.status(403).json({ error: 'No tenant found' });
    }

    // Upload to local storage
    const { uploadLocalFile } = await import('../utils/local-upload-service');
    const result = await uploadLocalFile(
      req.file.buffer,
      req.file.originalname,
      tenant.databaseName,
      'avatars'
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Upload] Avatar upload failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Upload failed',
    });
  }
});

router.post('/client-logo', uploadAvatar.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { getMasterDb } = await import('@rsm/database/connection');
    const { tenantDatabases } = await import('@rsm/database/master/schema');
    const { eq } = await import('drizzle-orm');

    const userId = req.session?.userId;
    const organizationId = req.session?.organizationId;

    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const masterDb = await getMasterDb();
    const [tenant] = await masterDb
      .select()
      .from(tenantDatabases)
      .where(eq(tenantDatabases.organizationId, organizationId))
      .limit(1);

    if (!tenant) {
      return res.status(403).json({ error: 'No tenant found' });
    }

    const { uploadLocalFile } = await import('../utils/local-upload-service');
    const result = await uploadLocalFile(
      req.file.buffer,
      req.file.originalname,
      tenant.databaseName,
      'logos'
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Upload] Logo upload failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Upload failed',
    });
  }
});

/**
 * Secure file serving with tenant validation
 * GET /api/upload/serve/tenant_X/{avatars|logos}/filename.jpg
 */
router.get('/serve/tenant_*', async (req, res) => {
  try {
    const { validateTenantFileAccess } = await import('../middleware/tenantFileAccess');

    // Run validation middleware
    await new Promise<void>((resolve, reject) => {
      validateTenantFileAccess(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const fs = await import('fs/promises');
    const path = await import('path');
    const UPLOADS_BASE = process.env.UPLOADS_PATH || '/var/www/recording-studio-manager/uploads';

    // Remove /serve/ prefix from path
    const filePath = req.path.replace('/serve/', '');
    const absolutePath = path.join(UPLOADS_BASE, filePath);

    // Check file exists
    await fs.access(absolutePath);

    // Serve file
    res.sendFile(absolutePath);
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});

export default router;
