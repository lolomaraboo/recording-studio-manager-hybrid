/**
 * Audio Files Router
 *
 * Manage audio files and recordings:
 * - CRUD audio files
 * - Upload/download management
 * - Version control
 * - Project/track associations
 * - Waveform data
 * - Format conversion
 */

import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../_core/trpc';
import { audioFiles, projects, projectTracks, sessions } from '@rsm/database/tenant';
import { eq, desc, and, count, sql, inArray } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

const audioFormatEnum = z.enum([
  'wav',
  'aiff',
  'flac',
  'mp3',
  'aac',
  'm4a',
  'ogg',
  'wma',
  'raw',
  'other',
]);

const audioStatusEnum = z.enum([
  'uploading',
  'processing',
  'ready',
  'error',
  'archived',
]);

const audioCategoryEnum = z.enum([
  'recording',
  'mix',
  'master',
  'stem',
  'bounce',
  'reference',
  'sample',
  'sfx',
  'other',
]);

export const audioFilesRouter = router({
  // ============ LIST & GET ============

  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      search: z.string().optional(),
      projectId: z.number().optional(),
      trackId: z.number().optional(),
      sessionId: z.number().optional(),
      format: audioFormatEnum.optional(),
      status: audioStatusEnum.optional(),
      category: audioCategoryEnum.optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const {
        limit = 50,
        offset = 0,
        search,
        projectId,
        trackId,
        sessionId,
        format,
        status,
        category,
      } = input || {};
      const db = await ctx.getTenantDb();

      const conditions = [];
      if (search) {
        conditions.push(
          sql`(${audioFiles.filename} ILIKE ${`%${search}%`} OR ${audioFiles.originalFilename} ILIKE ${`%${search}%`})`
        );
      }
      if (projectId) {
        conditions.push(eq(audioFiles.projectId, projectId));
      }
      if (trackId) {
        conditions.push(eq(audioFiles.trackId, trackId));
      }
      if (sessionId) {
        conditions.push(eq(audioFiles.sessionId, sessionId));
      }
      if (format) {
        conditions.push(eq(audioFiles.format, format));
      }
      if (status) {
        conditions.push(eq(audioFiles.status, status));
      }
      if (category) {
        conditions.push(eq(audioFiles.category, category));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [files, totalResult] = await Promise.all([
        db.select({
          file: audioFiles,
          project: projects,
          track: projectTracks,
          session: sessions,
        })
          .from(audioFiles)
          .leftJoin(projects, eq(audioFiles.projectId, projects.id))
          .leftJoin(projectTracks, eq(audioFiles.trackId, projectTracks.id))
          .leftJoin(sessions, eq(audioFiles.sessionId, sessions.id))
          .where(whereClause)
          .limit(limit)
          .offset(offset)
          .orderBy(desc(audioFiles.createdAt)),
        db.select({ count: count() }).from(audioFiles).where(whereClause),
      ]);

      return {
        files: files.map(f => ({
          ...f.file,
          project: f.project,
          track: f.track,
          session: f.session,
        })),
        total: totalResult[0]?.count || 0,
        limit,
        offset,
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      const [result] = await db.select({
        file: audioFiles,
        project: projects,
        track: projectTracks,
        session: sessions,
      })
        .from(audioFiles)
        .leftJoin(projects, eq(audioFiles.projectId, projects.id))
        .leftJoin(projectTracks, eq(audioFiles.trackId, projectTracks.id))
        .leftJoin(sessions, eq(audioFiles.sessionId, sessions.id))
        .where(eq(audioFiles.id, input.id));

      if (!result) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Audio file not found' });
      }

      // Get version history
      const versions = await db.select()
        .from(audioFiles)
        .where(
          and(
            eq(audioFiles.projectId, result.file.projectId!),
            eq(audioFiles.trackId, result.file.trackId!),
            eq(audioFiles.filename, result.file.filename)
          )
        )
        .orderBy(desc(audioFiles.version));

      return {
        ...result.file,
        project: result.project,
        track: result.track,
        session: result.session,
        versions,
      };
    }),

  // ============ CRUD ============

  create: protectedProcedure
    .input(z.object({
      filename: z.string().min(1),
      originalFilename: z.string().min(1),
      path: z.string().min(1),
      format: audioFormatEnum,
      category: audioCategoryEnum.default('recording'),
      sizeBytes: z.number(),
      durationMs: z.number().optional(),
      sampleRate: z.number().optional(),
      bitDepth: z.number().optional(),
      channels: z.number().optional(),
      projectId: z.number().optional(),
      trackId: z.number().optional(),
      sessionId: z.number().optional(),
      notes: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      // Determine version number
      let version = 1;
      if (input.projectId && input.trackId) {
        const [existing] = await db.select({ maxVersion: sql<number>`MAX(${audioFiles.version})` })
          .from(audioFiles)
          .where(
            and(
              eq(audioFiles.projectId, input.projectId),
              eq(audioFiles.trackId, input.trackId),
              eq(audioFiles.filename, input.filename)
            )
          );
        if (existing?.maxVersion) {
          version = existing.maxVersion + 1;
        }
      }

      const [file] = await db.insert(audioFiles).values({
        filename: input.filename,
        originalFilename: input.originalFilename,
        path: input.path,
        format: input.format,
        category: input.category,
        sizeBytes: input.sizeBytes.toString(),
        durationMs: input.durationMs,
        sampleRate: input.sampleRate,
        bitDepth: input.bitDepth,
        channels: input.channels,
        projectId: input.projectId,
        trackId: input.trackId,
        sessionId: input.sessionId,
        notes: input.notes,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        version,
        status: 'ready',
        uploadedBy: ctx.user.id,
      }).returning();

      return file;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      filename: z.string().min(1).optional(),
      category: audioCategoryEnum.optional(),
      projectId: z.number().optional(),
      trackId: z.number().optional(),
      sessionId: z.number().optional(),
      notes: z.string().optional(),
      status: audioStatusEnum.optional(),
      metadata: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();
      const { id, metadata, ...updates } = input;

      const [file] = await db.update(audioFiles)
        .set({
          ...updates,
          metadata: metadata ? JSON.stringify(metadata) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(audioFiles.id, id))
        .returning();

      if (!file) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Audio file not found' });
      }

      return file;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      // Soft delete by setting status to archived
      const [file] = await db.update(audioFiles)
        .set({ status: 'archived', updatedAt: new Date() })
        .where(eq(audioFiles.id, input.id))
        .returning();

      if (!file) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Audio file not found' });
      }

      return { success: true };
    }),

  permanentDelete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();
      await db.delete(audioFiles).where(eq(audioFiles.id, input.id));
      return { success: true };
    }),

  // ============ BULK OPERATIONS ============

  bulkDelete: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      await db.update(audioFiles)
        .set({ status: 'archived', updatedAt: new Date() })
        .where(inArray(audioFiles.id, input.ids));

      return { success: true, count: input.ids.length };
    }),

  bulkMove: protectedProcedure
    .input(z.object({
      ids: z.array(z.number()),
      projectId: z.number().optional(),
      trackId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (input.projectId !== undefined) updates.projectId = input.projectId;
      if (input.trackId !== undefined) updates.trackId = input.trackId;

      await db.update(audioFiles)
        .set(updates)
        .where(inArray(audioFiles.id, input.ids));

      return { success: true, count: input.ids.length };
    }),

  // ============ VERSION CONTROL ============

  getVersions: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      trackId: z.number(),
      filename: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      const versions = await db.select()
        .from(audioFiles)
        .where(
          and(
            eq(audioFiles.projectId, input.projectId),
            eq(audioFiles.trackId, input.trackId),
            eq(audioFiles.filename, input.filename)
          )
        )
        .orderBy(desc(audioFiles.version));

      return versions;
    }),

  revertToVersion: protectedProcedure
    .input(z.object({
      fileId: z.number(),
      targetVersion: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      // Get the target version
      const [target] = await db.select()
        .from(audioFiles)
        .where(eq(audioFiles.id, input.fileId));

      if (!target) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Audio file not found' });
      }

      // Get the version to revert to
      const [versionToRevert] = await db.select()
        .from(audioFiles)
        .where(
          and(
            eq(audioFiles.projectId, target.projectId!),
            eq(audioFiles.trackId, target.trackId!),
            eq(audioFiles.filename, target.filename),
            eq(audioFiles.version, input.targetVersion)
          )
        );

      if (!versionToRevert) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Target version not found' });
      }

      // Create a new version that's a copy of the target
      const [newVersion] = await db.select({ maxVersion: sql<number>`MAX(${audioFiles.version})` })
        .from(audioFiles)
        .where(
          and(
            eq(audioFiles.projectId, target.projectId!),
            eq(audioFiles.trackId, target.trackId!),
            eq(audioFiles.filename, target.filename)
          )
        );

      const [reverted] = await db.insert(audioFiles).values({
        ...versionToRevert,
        id: undefined,
        version: (newVersion?.maxVersion || 0) + 1,
        notes: `Reverted to version ${input.targetVersion}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      return reverted;
    }),

  // ============ WAVEFORM ============

  getWaveform: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      const [file] = await db.select()
        .from(audioFiles)
        .where(eq(audioFiles.id, input.id));

      if (!file) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Audio file not found' });
      }

      // Return waveform data if available
      return {
        fileId: file.id,
        waveformData: file.waveformData,
        peaks: file.waveformPeaks ? JSON.parse(file.waveformPeaks) : null,
      };
    }),

  setWaveform: protectedProcedure
    .input(z.object({
      id: z.number(),
      waveformData: z.string().optional(),
      peaks: z.array(z.number()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      const [file] = await db.update(audioFiles)
        .set({
          waveformData: input.waveformData,
          waveformPeaks: input.peaks ? JSON.stringify(input.peaks) : null,
          updatedAt: new Date(),
        })
        .where(eq(audioFiles.id, input.id))
        .returning();

      if (!file) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Audio file not found' });
      }

      return file;
    }),

  // ============ UPLOAD STATUS ============

  startUpload: protectedProcedure
    .input(z.object({
      filename: z.string(),
      originalFilename: z.string(),
      format: audioFormatEnum,
      sizeBytes: z.number(),
      projectId: z.number().optional(),
      trackId: z.number().optional(),
      sessionId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      const [file] = await db.insert(audioFiles).values({
        filename: input.filename,
        originalFilename: input.originalFilename,
        path: '', // Will be set after upload
        format: input.format,
        sizeBytes: input.sizeBytes.toString(),
        projectId: input.projectId,
        trackId: input.trackId,
        sessionId: input.sessionId,
        status: 'uploading',
        uploadedBy: ctx.user.id,
        version: 1,
      }).returning();

      if (!file) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create upload record' });
      }

      return {
        fileId: file.id,
        uploadUrl: `/api/upload/${file.id}`, // Would be presigned URL in production
      };
    }),

  completeUpload: protectedProcedure
    .input(z.object({
      id: z.number(),
      path: z.string(),
      durationMs: z.number().optional(),
      sampleRate: z.number().optional(),
      bitDepth: z.number().optional(),
      channels: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      const [file] = await db.update(audioFiles)
        .set({
          path: input.path,
          durationMs: input.durationMs,
          sampleRate: input.sampleRate,
          bitDepth: input.bitDepth,
          channels: input.channels,
          status: 'processing',
          updatedAt: new Date(),
        })
        .where(eq(audioFiles.id, input.id))
        .returning();

      if (!file) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Audio file not found' });
      }

      return file;
    }),

  setReady: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      const [file] = await db.update(audioFiles)
        .set({ status: 'ready', updatedAt: new Date() })
        .where(eq(audioFiles.id, input.id))
        .returning();

      if (!file) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Audio file not found' });
      }

      return file;
    }),

  setError: protectedProcedure
    .input(z.object({
      id: z.number(),
      error: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      const [file] = await db.update(audioFiles)
        .set({
          status: 'error',
          notes: input.error,
          updatedAt: new Date(),
        })
        .where(eq(audioFiles.id, input.id))
        .returning();

      if (!file) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Audio file not found' });
      }

      return file;
    }),

  // ============ STATISTICS ============

  stats: protectedProcedure
    .input(z.object({
      projectId: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();
      const { projectId } = input || {};

      const baseCondition = projectId ? eq(audioFiles.projectId, projectId) : undefined;

      const [
        totalResult,
        readyResult,
        byFormatResult,
        byCategoryResult,
      ] = await Promise.all([
        db.select({ count: count() }).from(audioFiles).where(baseCondition),
        db.select({ count: count() }).from(audioFiles).where(
          baseCondition
            ? and(baseCondition, eq(audioFiles.status, 'ready'))
            : eq(audioFiles.status, 'ready')
        ),
        db.select({
          format: audioFiles.format,
          count: count(),
        }).from(audioFiles).where(baseCondition).groupBy(audioFiles.format),
        db.select({
          category: audioFiles.category,
          count: count(),
        }).from(audioFiles).where(baseCondition).groupBy(audioFiles.category),
      ]);

      // Calculate total size and duration
      const allFiles = await db.select().from(audioFiles).where(baseCondition);
      const totalSizeBytes = allFiles.reduce((sum, f) => sum + (parseInt(f.sizeBytes || '0') || 0), 0);
      const totalDurationMs = allFiles.reduce((sum, f) => sum + (f.durationMs || 0), 0);

      return {
        total: totalResult[0]?.count || 0,
        ready: readyResult[0]?.count || 0,
        totalSizeBytes,
        totalSizeFormatted: formatBytes(totalSizeBytes),
        totalDurationMs,
        totalDurationFormatted: formatDuration(totalDurationMs),
        byFormat: byFormatResult.reduce((acc, r) => {
          acc[r.format] = r.count;
          return acc;
        }, {} as Record<string, number>),
        byCategory: byCategoryResult.reduce((acc, r) => {
          if (r.category) acc[r.category] = r.count;
          return acc;
        }, {} as Record<string, number>),
      };
    }),

  // ============ FORMATS & CATEGORIES ============

  getFormats: protectedProcedure.query(() => {
    return {
      formats: [
        { id: 'wav', name: 'WAV', description: 'Uncompressed audio', lossless: true },
        { id: 'aiff', name: 'AIFF', description: 'Apple uncompressed audio', lossless: true },
        { id: 'flac', name: 'FLAC', description: 'Free lossless audio codec', lossless: true },
        { id: 'mp3', name: 'MP3', description: 'MPEG Audio Layer III', lossless: false },
        { id: 'aac', name: 'AAC', description: 'Advanced Audio Coding', lossless: false },
        { id: 'm4a', name: 'M4A', description: 'MPEG-4 Audio', lossless: false },
        { id: 'ogg', name: 'OGG', description: 'Ogg Vorbis', lossless: false },
        { id: 'wma', name: 'WMA', description: 'Windows Media Audio', lossless: false },
        { id: 'raw', name: 'RAW', description: 'Raw audio data', lossless: true },
        { id: 'other', name: 'Other', description: 'Other format', lossless: false },
      ],
    };
  }),

  getCategories: protectedProcedure.query(() => {
    return {
      categories: [
        { id: 'recording', name: 'Recording', description: 'Original recordings' },
        { id: 'mix', name: 'Mix', description: 'Mixed audio' },
        { id: 'master', name: 'Master', description: 'Mastered audio' },
        { id: 'stem', name: 'Stem', description: 'Individual stems' },
        { id: 'bounce', name: 'Bounce', description: 'Bounced tracks' },
        { id: 'reference', name: 'Reference', description: 'Reference tracks' },
        { id: 'sample', name: 'Sample', description: 'Audio samples' },
        { id: 'sfx', name: 'SFX', description: 'Sound effects' },
        { id: 'other', name: 'Other', description: 'Other category' },
      ],
    };
  }),

  // ============ SEARCH ============

  search: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      const results = await db.select({
        file: audioFiles,
        project: projects,
      })
        .from(audioFiles)
        .leftJoin(projects, eq(audioFiles.projectId, projects.id))
        .where(
          sql`(
            ${audioFiles.filename} ILIKE ${`%${input.query}%`} OR
            ${audioFiles.originalFilename} ILIKE ${`%${input.query}%`} OR
            ${audioFiles.notes} ILIKE ${`%${input.query}%`}
          )`
        )
        .limit(input.limit)
        .orderBy(desc(audioFiles.createdAt));

      return results.map(r => ({
        ...r.file,
        project: r.project,
      }));
    }),
});

// Helper functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}
