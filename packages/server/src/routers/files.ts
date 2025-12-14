import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and, desc } from 'drizzle-orm';
import { router, protectedProcedure } from '../_core/trpc';
import { projectFiles, projects, projectTracks } from '@rsm/database/tenant';
import {
  isS3Configured,
  generateStoragePath,
  getUploadPresignedUrl,
  getDownloadPresignedUrl,
  deleteFile,
  validateFileUpload,
  getFileTypeFromMime,
} from '../_core/s3';

/**
 * Files Router
 *
 * Handles file uploads and downloads for projects:
 * - Request upload URL (presigned)
 * - Confirm upload (save metadata to DB)
 * - Get download URL (presigned)
 * - Delete file
 * - List files for project/track
 * - File versioning
 */

const FILE_TYPES = ['audio', 'document', 'image', 'video', 'other'] as const;

export const filesRouter = router({
  /**
   * Check if S3 is configured
   */
  config: protectedProcedure.query(() => {
    return {
      configured: isS3Configured(),
      maxSizes: {
        audio: 500, // MB
        document: 50,
        image: 10,
        video: 1024,
        other: 100,
      },
    };
  }),

  /**
   * Request an upload URL
   * Returns a presigned URL for direct upload to S3
   */
  requestUpload: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        trackId: z.number().optional(),
        fileName: z.string().min(1).max(255),
        mimeType: z.string(),
        fileSize: z.number().min(1),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isS3Configured()) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'File storage is not configured',
        });
      }

      const tenantDb = await ctx.getTenantDb();

      // Verify project exists
      const [project] = await tenantDb
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .limit(1);

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      // Verify track exists if provided
      if (input.trackId) {
        const [track] = await tenantDb
          .select({ id: projectTracks.id })
          .from(projectTracks)
          .where(
            and(
              eq(projectTracks.id, input.trackId),
              eq(projectTracks.projectId, input.projectId)
            )
          )
          .limit(1);

        if (!track) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Track not found',
          });
        }
      }

      // Validate file
      const fileType = getFileTypeFromMime(input.mimeType);
      const validation = validateFileUpload({
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
      });

      if (!validation.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: validation.error || 'Invalid file',
        });
      }

      // Check for existing file to determine version
      const whereConditions = [
        eq(projectFiles.projectId, input.projectId),
        eq(projectFiles.fileName, input.fileName),
      ];
      if (input.trackId) {
        whereConditions.push(eq(projectFiles.trackId, input.trackId));
      }

      const existingFiles = await tenantDb
        .select({ version: projectFiles.version })
        .from(projectFiles)
        .where(and(...whereConditions))
        .orderBy(desc(projectFiles.version));

      const latestVersion = existingFiles[0]?.version ?? 0;
      const nextVersion = latestVersion + 1;

      // Generate storage path using organizationId as tenant identifier
      const tenantId = ctx.organizationId?.toString() || 'unknown';
      const storagePath = generateStoragePath({
        tenantId,
        projectId: input.projectId,
        trackId: input.trackId,
        fileType,
        fileName: input.fileName,
        version: nextVersion,
      });

      // Get presigned upload URL
      const presigned = await getUploadPresignedUrl({
        storagePath,
        contentType: input.mimeType,
        expiresIn: 3600, // 1 hour
      });

      if (!presigned) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate upload URL',
        });
      }

      return {
        uploadUrl: presigned.url,
        expiresAt: presigned.expiresAt.toISOString(),
        storagePath,
        version: nextVersion,
        fileType,
      };
    }),

  /**
   * Confirm upload completion
   * Save file metadata to database after successful S3 upload
   */
  confirmUpload: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        trackId: z.number().optional(),
        fileName: z.string().min(1).max(500),
        mimeType: z.string(),
        fileSize: z.number().min(1),
        storagePath: z.string(),
        version: z.number().default(1),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const fileType = getFileTypeFromMime(input.mimeType);

      // Mark previous versions as not latest
      if (input.version > 1) {
        await tenantDb
          .update(projectFiles)
          .set({ isLatest: false })
          .where(
            and(
              eq(projectFiles.projectId, input.projectId),
              eq(projectFiles.fileName, input.fileName),
              input.trackId
                ? eq(projectFiles.trackId, input.trackId)
                : undefined
            )
          );
      }

      // Insert file record
      const [file] = await tenantDb
        .insert(projectFiles)
        .values({
          projectId: input.projectId,
          trackId: input.trackId || null,
          fileName: input.fileName,
          fileType,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          storagePath: input.storagePath,
          version: input.version,
          isLatest: true,
          uploadedBy: ctx.user?.name || 'Unknown',
          notes: input.notes || null,
        })
        .returning();

      return file;
    }),

  /**
   * Get download URL for a file
   */
  getDownloadUrl: protectedProcedure
    .input(
      z.object({
        fileId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!isS3Configured()) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'File storage is not configured',
        });
      }

      const tenantDb = await ctx.getTenantDb();

      const [file] = await tenantDb
        .select()
        .from(projectFiles)
        .where(eq(projectFiles.id, input.fileId))
        .limit(1);

      if (!file) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'File not found',
        });
      }

      const presigned = await getDownloadPresignedUrl({
        storagePath: file.storagePath,
        expiresIn: 3600, // 1 hour
        downloadFileName: file.fileName,
      });

      if (!presigned) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate download URL',
        });
      }

      return {
        downloadUrl: presigned.url,
        expiresAt: presigned.expiresAt.toISOString(),
        fileName: file.fileName,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
      };
    }),

  /**
   * List files for a project
   */
  list: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        trackId: z.number().optional(),
        fileType: z.enum(FILE_TYPES).optional(),
        latestOnly: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const conditions = [eq(projectFiles.projectId, input.projectId)];

      if (input.trackId !== undefined) {
        conditions.push(eq(projectFiles.trackId, input.trackId));
      }

      if (input.fileType) {
        conditions.push(eq(projectFiles.fileType, input.fileType));
      }

      if (input.latestOnly) {
        conditions.push(eq(projectFiles.isLatest, true));
      }

      const files = await tenantDb
        .select({
          id: projectFiles.id,
          projectId: projectFiles.projectId,
          trackId: projectFiles.trackId,
          fileName: projectFiles.fileName,
          fileType: projectFiles.fileType,
          mimeType: projectFiles.mimeType,
          fileSize: projectFiles.fileSize,
          version: projectFiles.version,
          isLatest: projectFiles.isLatest,
          uploadedBy: projectFiles.uploadedBy,
          notes: projectFiles.notes,
          createdAt: projectFiles.createdAt,
        })
        .from(projectFiles)
        .where(and(...conditions))
        .orderBy(desc(projectFiles.createdAt));

      return files;
    }),

  /**
   * Get file versions
   */
  versions: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        fileName: z.string(),
        trackId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const conditions = [
        eq(projectFiles.projectId, input.projectId),
        eq(projectFiles.fileName, input.fileName),
      ];

      if (input.trackId !== undefined) {
        conditions.push(eq(projectFiles.trackId, input.trackId));
      }

      const versions = await tenantDb
        .select({
          id: projectFiles.id,
          version: projectFiles.version,
          fileSize: projectFiles.fileSize,
          isLatest: projectFiles.isLatest,
          uploadedBy: projectFiles.uploadedBy,
          notes: projectFiles.notes,
          createdAt: projectFiles.createdAt,
        })
        .from(projectFiles)
        .where(and(...conditions))
        .orderBy(desc(projectFiles.version));

      return versions;
    }),

  /**
   * Delete a file
   */
  delete: protectedProcedure
    .input(
      z.object({
        fileId: z.number(),
        deleteFromStorage: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Get file info
      const [file] = await tenantDb
        .select()
        .from(projectFiles)
        .where(eq(projectFiles.id, input.fileId))
        .limit(1);

      if (!file) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'File not found',
        });
      }

      // Delete from S3 if requested
      if (input.deleteFromStorage && isS3Configured()) {
        const deleted = await deleteFile(file.storagePath);
        if (!deleted) {
          console.warn(`Failed to delete file from S3: ${file.storagePath}`);
        }
      }

      // Delete from database
      await tenantDb
        .delete(projectFiles)
        .where(eq(projectFiles.id, input.fileId));

      // If this was the latest version, mark previous version as latest
      if (file.isLatest) {
        const conditions = [
          eq(projectFiles.projectId, file.projectId),
          eq(projectFiles.fileName, file.fileName),
        ];

        if (file.trackId) {
          conditions.push(eq(projectFiles.trackId, file.trackId));
        }

        const [previousVersion] = await tenantDb
          .select({ id: projectFiles.id })
          .from(projectFiles)
          .where(and(...conditions))
          .orderBy(desc(projectFiles.version))
          .limit(1);

        if (previousVersion) {
          await tenantDb
            .update(projectFiles)
            .set({ isLatest: true })
            .where(eq(projectFiles.id, previousVersion.id));
        }
      }

      return { success: true };
    }),

  /**
   * Get file stats for a project
   */
  stats: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const files = await tenantDb
        .select({
          fileType: projectFiles.fileType,
          fileSize: projectFiles.fileSize,
          isLatest: projectFiles.isLatest,
        })
        .from(projectFiles)
        .where(eq(projectFiles.projectId, input.projectId));

      const latestFiles = files.filter((f) => f.isLatest);

      const stats = {
        totalFiles: latestFiles.length,
        totalVersions: files.length,
        totalSize: files.reduce((sum, f) => sum + (f.fileSize || 0), 0),
        latestSize: latestFiles.reduce((sum, f) => sum + (f.fileSize || 0), 0),
        byType: {
          audio: latestFiles.filter((f) => f.fileType === 'audio').length,
          document: latestFiles.filter((f) => f.fileType === 'document').length,
          image: latestFiles.filter((f) => f.fileType === 'image').length,
          video: latestFiles.filter((f) => f.fileType === 'video').length,
          other: latestFiles.filter((f) => f.fileType === 'other').length,
        },
      };

      return stats;
    }),
});
