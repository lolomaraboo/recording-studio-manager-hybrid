import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and, desc, sql } from 'drizzle-orm';
import { router, protectedProcedure } from '../_core/trpc';
import {
  projects,
  projectTracks,
  musicians,
  projectCredits,
  projectFiles,
  clients,
} from '@rsm/database/tenant';

/**
 * Projects Router
 *
 * CRUD for music production projects, tracks, musicians, and credits.
 *
 * Endpoints:
 * - list: Get all projects
 * - get: Get project by ID with tracks and credits
 * - create: Create new project
 * - update: Update project
 * - delete: Delete project
 * - addTrack: Add track to project
 * - updateTrack: Update track
 * - deleteTrack: Delete track
 * - listMusicians: Get all musicians
 * - createMusician: Create musician
 * - updateMusician: Update musician
 * - addCredit: Add credit to project/track
 * - removeCredit: Remove credit
 * - stats: Get project statistics
 */

// Project status workflow
const PROJECT_STATUSES = [
  'pre_production',
  'recording',
  'mixing',
  'mastering',
  'completed',
  'on_hold',
  'cancelled',
] as const;

const TRACK_STATUSES = [
  'writing',
  'pre_production',
  'recording',
  'editing',
  'mixing',
  'mastering',
  'completed',
] as const;

const PROJECT_TYPES = [
  'album',
  'ep',
  'single',
  'compilation',
  'soundtrack',
  'other',
] as const;

export const projectsRouter = router({
  /**
   * List all projects with optional filters
   */
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(PROJECT_STATUSES).optional(),
          clientId: z.number().optional(),
          includeArchived: z.boolean().default(false),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const {
        status,
        clientId,
        includeArchived = false,
        limit = 50,
        offset = 0,
      } = input || {};

      // Build where conditions
      const conditions = [];
      if (status) {
        conditions.push(eq(projects.status, status));
      }
      if (clientId) {
        conditions.push(eq(projects.clientId, clientId));
      }
      if (!includeArchived) {
        conditions.push(eq(projects.isArchived, false));
      }

      const projectsList = await tenantDb
        .select({
          id: projects.id,
          clientId: projects.clientId,
          clientName: clients.name,
          clientArtistName: clients.artistName,
          name: projects.name,
          description: projects.description,
          projectType: projects.projectType,
          genre: projects.genre,
          status: projects.status,
          startDate: projects.startDate,
          targetEndDate: projects.targetEndDate,
          actualEndDate: projects.actualEndDate,
          budget: projects.budget,
          spentAmount: projects.spentAmount,
          notes: projects.notes,
          isArchived: projects.isArchived,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .leftJoin(clients, eq(projects.clientId, clients.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(projects.updatedAt))
        .limit(limit)
        .offset(offset);

      return projectsList;
    }),

  /**
   * Get project by ID with all related data
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Get project
      const project = await tenantDb
        .select({
          id: projects.id,
          clientId: projects.clientId,
          clientName: clients.name,
          clientArtistName: clients.artistName,
          name: projects.name,
          description: projects.description,
          projectType: projects.projectType,
          genre: projects.genre,
          status: projects.status,
          startDate: projects.startDate,
          targetEndDate: projects.targetEndDate,
          actualEndDate: projects.actualEndDate,
          budget: projects.budget,
          spentAmount: projects.spentAmount,
          notes: projects.notes,
          isArchived: projects.isArchived,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .leftJoin(clients, eq(projects.clientId, clients.id))
        .where(eq(projects.id, input.id))
        .limit(1);

      if (project.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      // Get tracks
      const tracks = await tenantDb
        .select()
        .from(projectTracks)
        .where(eq(projectTracks.projectId, input.id))
        .orderBy(projectTracks.trackNumber);

      // Get credits with musician info
      const credits = await tenantDb
        .select({
          id: projectCredits.id,
          projectId: projectCredits.projectId,
          trackId: projectCredits.trackId,
          musicianId: projectCredits.musicianId,
          musicianName: musicians.name,
          musicianStageName: musicians.stageName,
          role: projectCredits.role,
          notes: projectCredits.notes,
          createdAt: projectCredits.createdAt,
        })
        .from(projectCredits)
        .leftJoin(musicians, eq(projectCredits.musicianId, musicians.id))
        .where(eq(projectCredits.projectId, input.id));

      // Get files
      const files = await tenantDb
        .select()
        .from(projectFiles)
        .where(
          and(
            eq(projectFiles.projectId, input.id),
            eq(projectFiles.isLatest, true)
          )
        )
        .orderBy(desc(projectFiles.createdAt));

      return {
        ...project[0],
        tracks,
        credits,
        files,
      };
    }),

  /**
   * Create new project
   */
  create: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        projectType: z.enum(PROJECT_TYPES).default('album'),
        genre: z.string().max(100).optional(),
        status: z.enum(PROJECT_STATUSES).default('pre_production'),
        startDate: z.string().optional(),
        targetEndDate: z.string().optional(),
        budget: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const [project] = await tenantDb
        .insert(projects)
        .values({
          clientId: input.clientId,
          name: input.name,
          description: input.description,
          projectType: input.projectType,
          genre: input.genre,
          status: input.status,
          startDate: input.startDate ? new Date(input.startDate) : null,
          targetEndDate: input.targetEndDate
            ? new Date(input.targetEndDate)
            : null,
          budget: input.budget,
          notes: input.notes,
        })
        .returning();

      return project;
    }),

  /**
   * Update project
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          clientId: z.number().optional(),
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          projectType: z.enum(PROJECT_TYPES).optional(),
          genre: z.string().max(100).optional(),
          status: z.enum(PROJECT_STATUSES).optional(),
          startDate: z.string().nullable().optional(),
          targetEndDate: z.string().nullable().optional(),
          actualEndDate: z.string().nullable().optional(),
          budget: z.string().optional(),
          spentAmount: z.string().optional(),
          notes: z.string().optional(),
          isArchived: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Convert dates
      const updateData: Record<string, unknown> = { ...input.data };
      if (input.data.startDate !== undefined) {
        updateData.startDate = input.data.startDate
          ? new Date(input.data.startDate)
          : null;
      }
      if (input.data.targetEndDate !== undefined) {
        updateData.targetEndDate = input.data.targetEndDate
          ? new Date(input.data.targetEndDate)
          : null;
      }
      if (input.data.actualEndDate !== undefined) {
        updateData.actualEndDate = input.data.actualEndDate
          ? new Date(input.data.actualEndDate)
          : null;
      }
      updateData.updatedAt = new Date();

      const [updated] = await tenantDb
        .update(projects)
        .set(updateData)
        .where(eq(projects.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      return updated;
    }),

  /**
   * Delete project (soft delete by archiving)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number(), permanent: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      if (input.permanent) {
        // Hard delete - remove all related data
        await tenantDb
          .delete(projectFiles)
          .where(eq(projectFiles.projectId, input.id));
        await tenantDb
          .delete(projectCredits)
          .where(eq(projectCredits.projectId, input.id));
        await tenantDb
          .delete(projectTracks)
          .where(eq(projectTracks.projectId, input.id));
        await tenantDb.delete(projects).where(eq(projects.id, input.id));
      } else {
        // Soft delete - archive
        await tenantDb
          .update(projects)
          .set({ isArchived: true, updatedAt: new Date() })
          .where(eq(projects.id, input.id));
      }

      return { success: true };
    }),

  // ===================
  // TRACKS
  // ===================

  /**
   * Add track to project
   */
  addTrack: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        title: z.string().min(1).max(255),
        trackNumber: z.number().optional(),
        duration: z.number().optional(),
        status: z.enum(TRACK_STATUSES).default('writing'),
        bpm: z.number().optional(),
        key: z.string().max(20).optional(),
        isrc: z.string().max(20).optional(),
        lyrics: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // If no track number provided, get next available
      let trackNumber = input.trackNumber;
      if (!trackNumber) {
        const lastTrack = await tenantDb
          .select({ trackNumber: projectTracks.trackNumber })
          .from(projectTracks)
          .where(eq(projectTracks.projectId, input.projectId))
          .orderBy(desc(projectTracks.trackNumber))
          .limit(1);

        trackNumber = (lastTrack[0]?.trackNumber || 0) + 1;
      }

      const [track] = await tenantDb
        .insert(projectTracks)
        .values({
          projectId: input.projectId,
          title: input.title,
          trackNumber,
          duration: input.duration,
          status: input.status,
          bpm: input.bpm,
          key: input.key,
          isrc: input.isrc,
          lyrics: input.lyrics,
          notes: input.notes,
        })
        .returning();

      return track;
    }),

  /**
   * Update track
   */
  updateTrack: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          title: z.string().min(1).max(255).optional(),
          trackNumber: z.number().optional(),
          duration: z.number().optional(),
          status: z.enum(TRACK_STATUSES).optional(),
          bpm: z.number().optional(),
          key: z.string().max(20).optional(),
          isrc: z.string().max(20).optional(),
          lyrics: z.string().optional(),
          notes: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const [updated] = await tenantDb
        .update(projectTracks)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(projectTracks.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Track not found',
        });
      }

      return updated;
    }),

  /**
   * Delete track
   */
  deleteTrack: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Delete related credits and files first
      await tenantDb
        .delete(projectCredits)
        .where(eq(projectCredits.trackId, input.id));
      await tenantDb
        .delete(projectFiles)
        .where(eq(projectFiles.trackId, input.id));
      await tenantDb.delete(projectTracks).where(eq(projectTracks.id, input.id));

      return { success: true };
    }),

  // ===================
  // MUSICIANS
  // ===================

  /**
   * List all musicians
   */
  listMusicians: protectedProcedure
    .input(
      z
        .object({
          includeInactive: z.boolean().default(false),
          limit: z.number().min(1).max(100).default(100),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { includeInactive = false, limit = 100 } = input || {};

      const condition = includeInactive ? undefined : eq(musicians.isActive, true);

      const musiciansList = await tenantDb
        .select()
        .from(musicians)
        .where(condition)
        .orderBy(musicians.name)
        .limit(limit);

      return musiciansList;
    }),

  /**
   * Create musician
   */
  createMusician: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        stageName: z.string().max(255).optional(),
        email: z.string().email().optional(),
        phone: z.string().max(50).optional(),
        instruments: z.string().optional(),
        bio: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const [musician] = await tenantDb
        .insert(musicians)
        .values(input)
        .returning();

      return musician;
    }),

  /**
   * Update musician
   */
  updateMusician: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().min(1).max(255).optional(),
          stageName: z.string().max(255).optional(),
          email: z.string().email().optional(),
          phone: z.string().max(50).optional(),
          instruments: z.string().optional(),
          bio: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const [updated] = await tenantDb
        .update(musicians)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(musicians.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Musician not found',
        });
      }

      return updated;
    }),

  // ===================
  // CREDITS
  // ===================

  /**
   * Add credit to project or track
   */
  addCredit: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        trackId: z.number().optional(),
        musicianId: z.number(),
        role: z.string().min(1).max(100),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const [credit] = await tenantDb
        .insert(projectCredits)
        .values(input)
        .returning();

      return credit;
    }),

  /**
   * Remove credit
   */
  removeCredit: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      await tenantDb
        .delete(projectCredits)
        .where(eq(projectCredits.id, input.id));

      return { success: true };
    }),

  // ===================
  // STATS
  // ===================

  /**
   * Get project statistics for dashboard
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    const tenantDb = await ctx.getTenantDb();

    // Count by status
    const statusCounts = await tenantDb
      .select({
        status: projects.status,
        count: sql<number>`count(*)::int`,
      })
      .from(projects)
      .where(eq(projects.isArchived, false))
      .groupBy(projects.status);

    // Total budget and spent
    const totals = await tenantDb
      .select({
        totalBudget: sql<string>`coalesce(sum(budget), 0)`,
        totalSpent: sql<string>`coalesce(sum(spent_amount), 0)`,
      })
      .from(projects)
      .where(eq(projects.isArchived, false));

    // Track counts
    const trackCounts = await tenantDb
      .select({
        status: projectTracks.status,
        count: sql<number>`count(*)::int`,
      })
      .from(projectTracks)
      .innerJoin(projects, eq(projectTracks.projectId, projects.id))
      .where(eq(projects.isArchived, false))
      .groupBy(projectTracks.status);

    // Active projects count
    const activeCount = statusCounts
      .filter((s) => !['completed', 'cancelled', 'on_hold'].includes(s.status))
      .reduce((sum, s) => sum + s.count, 0);

    return {
      totalProjects: statusCounts.reduce((sum, s) => sum + s.count, 0),
      activeProjects: activeCount,
      statusBreakdown: statusCounts,
      trackStatusBreakdown: trackCounts,
      totalBudget: totals[0]?.totalBudget || '0',
      totalSpent: totals[0]?.totalSpent || '0',
    };
  }),
});
