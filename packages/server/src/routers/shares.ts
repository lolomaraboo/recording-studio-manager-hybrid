/**
 * Shares Router
 *
 * Manage file sharing with external parties:
 * - Create share links
 * - Password protection
 * - Expiration management
 * - Access tracking
 * - Download limits
 */

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { fileShares, shareAccessLogs, projectFiles, projects } from '@rsm/database/tenant';
import { eq, desc, and, count, sql, isNull, gt, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';

export const sharesRouter = router({
  // ============ LIST & GET ============

  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      projectId: z.number().optional(),
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { limit = 50, offset = 0, projectId, isActive } = input || {};
      const db = await ctx.getTenantDb();

      const conditions = [];
      if (projectId) {
        conditions.push(eq(fileShares.projectId, projectId));
      }
      if (isActive !== undefined) {
        conditions.push(eq(fileShares.isActive, isActive));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [shares, totalResult] = await Promise.all([
        db.select({
          share: fileShares,
          project: projects,
          file: projectFiles,
        })
          .from(fileShares)
          .leftJoin(projects, eq(fileShares.projectId, projects.id))
          .leftJoin(projectFiles, eq(fileShares.fileId, projectFiles.id))
          .where(whereClause)
          .limit(limit)
          .offset(offset)
          .orderBy(desc(fileShares.createdAt)),
        db.select({ count: count() }).from(fileShares).where(whereClause),
      ]);

      return {
        shares: shares.map(s => ({
          ...s.share,
          project: s.project,
          file: s.file,
          shareUrl: `${process.env.APP_URL || 'http://localhost:5174'}/share/${s.share.shareToken}`,
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
        share: fileShares,
        project: projects,
        file: projectFiles,
      })
        .from(fileShares)
        .leftJoin(projects, eq(fileShares.projectId, projects.id))
        .leftJoin(projectFiles, eq(fileShares.fileId, projectFiles.id))
        .where(eq(fileShares.id, input.id));

      if (!result) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Share not found' });
      }

      // Get access logs
      const logs = await db.select()
        .from(shareAccessLogs)
        .where(eq(shareAccessLogs.shareId, input.id))
        .orderBy(desc(shareAccessLogs.accessedAt))
        .limit(50);

      return {
        ...result.share,
        project: result.project,
        file: result.file,
        accessLogs: logs,
        shareUrl: `${process.env.APP_URL || 'http://localhost:5174'}/share/${result.share.shareToken}`,
      };
    }),

  // ============ CREATE & UPDATE ============

  create: protectedProcedure
    .input(z.object({
      projectId: z.number().optional(),
      fileId: z.number().optional(),
      name: z.string().min(1),
      accessType: z.enum(['view', 'download', 'comment', 'edit']).default('view'),
      password: z.string().optional(),
      expiresAt: z.string().optional(),
      maxDownloads: z.number().optional(),
      allowedEmails: z.array(z.string().email()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      // Validate that at least projectId or fileId is provided
      if (!input.projectId && !input.fileId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Either projectId or fileId must be provided',
        });
      }

      const shareToken = nanoid(24);
      const hashedPassword = input.password ? await bcrypt.hash(input.password, 10) : null;

      const [share] = await db.insert(fileShares).values({
        projectId: input.projectId,
        fileId: input.fileId,
        shareToken,
        name: input.name,
        accessType: input.accessType,
        password: hashedPassword,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        maxDownloads: input.maxDownloads,
        allowedEmails: input.allowedEmails ? JSON.stringify(input.allowedEmails) : null,
        createdBy: ctx.user.name || ctx.user.email,
      }).returning();

      return {
        ...share,
        shareUrl: `${process.env.APP_URL || 'http://localhost:5174'}/share/${shareToken}`,
      };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      accessType: z.enum(['view', 'download', 'comment', 'edit']).optional(),
      password: z.string().nullable().optional(),
      expiresAt: z.string().nullable().optional(),
      maxDownloads: z.number().nullable().optional(),
      allowedEmails: z.array(z.string().email()).nullable().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();
      const { id, password, expiresAt, allowedEmails, ...updates } = input;

      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: new Date(),
      };

      if (password !== undefined) {
        updateData.password = password ? await bcrypt.hash(password, 10) : null;
      }
      if (expiresAt !== undefined) {
        updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
      }
      if (allowedEmails !== undefined) {
        updateData.allowedEmails = allowedEmails ? JSON.stringify(allowedEmails) : null;
      }

      const [share] = await db.update(fileShares)
        .set(updateData)
        .where(eq(fileShares.id, id))
        .returning();

      if (!share) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Share not found' });
      }

      return {
        ...share,
        shareUrl: `${process.env.APP_URL || 'http://localhost:5174'}/share/${share.shareToken}`,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      // Delete access logs first
      await db.delete(shareAccessLogs).where(eq(shareAccessLogs.shareId, input.id));

      // Delete share
      await db.delete(fileShares).where(eq(fileShares.id, input.id));

      return { success: true };
    }),

  // ============ PUBLIC ACCESS ============

  // Get share info by token (public)
  getByToken: publicProcedure
    .input(z.object({
      token: z.string(),
      password: z.string().optional(),
    }))
    .query(async () => {
      // This needs to query from correct tenant - would need organization lookup
      // For now, throw error as this needs proper multi-tenant handling
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Public share access requires organization context',
      });
    }),

  // Log access (public)
  logAccess: publicProcedure
    .input(z.object({
      token: z.string(),
      accessType: z.enum(['view', 'download']),
      email: z.string().email().optional(),
    }))
    .mutation(async () => {
      // Same issue - needs organization context
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Public share access requires organization context',
      });
    }),

  // ============ STATISTICS ============

  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = await ctx.getTenantDb();

    const now = new Date();

    const [
      totalResult,
      activeResult,
      expiredResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(fileShares),
      db.select({ count: count() }).from(fileShares).where(
        and(
          eq(fileShares.isActive, true),
          or(
            isNull(fileShares.expiresAt),
            gt(fileShares.expiresAt, now)
          )
        )
      ),
      db.select({ count: count() }).from(fileShares).where(
        and(
          eq(fileShares.isActive, true),
          sql`${fileShares.expiresAt} < ${now}`
        )
      ),
    ]);

    // Total downloads
    const allShares = await db.select().from(fileShares);
    const totalDownloads = allShares.reduce((sum, s) => sum + (s.downloadCount || 0), 0);

    // Recent access count
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentAccess = await db.select({ count: count() })
      .from(shareAccessLogs)
      .where(gt(shareAccessLogs.accessedAt, oneWeekAgo));

    return {
      total: totalResult[0]?.count || 0,
      active: activeResult[0]?.count || 0,
      expired: expiredResult[0]?.count || 0,
      totalDownloads,
      recentAccess: recentAccess[0]?.count || 0,
    };
  }),

  // ============ ACCESS LOGS ============

  getAccessLogs: protectedProcedure
    .input(z.object({
      shareId: z.number(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      const [logs, totalResult] = await Promise.all([
        db.select()
          .from(shareAccessLogs)
          .where(eq(shareAccessLogs.shareId, input.shareId))
          .limit(input.limit)
          .offset(input.offset)
          .orderBy(desc(shareAccessLogs.accessedAt)),
        db.select({ count: count() })
          .from(shareAccessLogs)
          .where(eq(shareAccessLogs.shareId, input.shareId)),
      ]);

      return {
        logs,
        total: totalResult[0]?.count || 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),
});
