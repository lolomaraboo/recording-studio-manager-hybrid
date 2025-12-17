import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { projects, tracks } from "@rsm/database/tenant/schema";
import { eq, and } from "drizzle-orm";

/**
 * Projects Router
 * Manages musical projects, albums, EPs, singles, and their tracks
 */
export const projectsRouter = router({
  /**
   * List all projects for the organization
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantDb) {
      throw new Error("Tenant database not available");
    }

    const projectsList = await ctx.tenantDb.select().from(projects);
    return projectsList;
  }),

  /**
   * Get project by ID with related tracks
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const project = await ctx.tenantDb
        .select()
        .from(projects)
        .where(eq(projects.id, input.id))
        .limit(1);

      if (project.length === 0) {
        throw new Error("Project not found");
      }

      // Get tracks for this project
      const projectTracks = await ctx.tenantDb
        .select()
        .from(tracks)
        .where(eq(tracks.projectId, input.id));

      return {
        ...project[0],
        tracks: projectTracks,
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
        artistName: z.string().max(255).optional(),
        description: z.string().optional(),
        genre: z.string().max(100).optional(),
        type: z.enum(["album", "ep", "single", "demo", "soundtrack", "podcast"]).default("album"),
        status: z
          .enum(["pre_production", "recording", "editing", "mixing", "mastering", "completed", "delivered", "archived"])
          .default("pre_production"),
        startDate: z.date().optional(),
        targetDeliveryDate: z.date().optional(),
        budget: z.string().optional(),
        label: z.string().max(200).optional(),
        coverArtUrl: z.string().max(500).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const newProject = await ctx.tenantDb.insert(projects).values(input as any).returning();

      return newProject[0];
    }),

  /**
   * Update project
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        artistName: z.string().max(255).optional(),
        description: z.string().optional(),
        genre: z.string().max(100).optional(),
        type: z.enum(["album", "ep", "single", "demo", "soundtrack", "podcast"]).optional(),
        status: z
          .enum(["pre_production", "recording", "editing", "mixing", "mastering", "completed", "delivered", "archived"])
          .optional(),
        targetDeliveryDate: z.date().optional(),
        actualDeliveryDate: z.date().optional(),
        budget: z.string().optional(),
        totalCost: z.string().optional(),
        label: z.string().max(200).optional(),
        coverArtUrl: z.string().max(500).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const { id, ...updateData } = input;

      const updated = await ctx.tenantDb
        .update(projects)
        .set(updateData)
        .where(eq(projects.id, id))
        .returning();

      if (updated.length === 0) {
        throw new Error("Project not found");
      }

      return updated[0];
    }),

  /**
   * Delete project
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      // Note: This will cascade delete tracks due to foreign key
      await ctx.tenantDb.delete(projects).where(eq(projects.id, input.id));

      return { success: true };
    }),

  /**
   * Tracks sub-router
   */
  tracks: router({
    /**
     * List tracks for a project
     */
    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.tenantDb) {
          throw new Error("Tenant database not available");
        }

        const tracksList = await ctx.tenantDb
          .select()
          .from(tracks)
          .where(eq(tracks.projectId, input.projectId));

        return tracksList;
      }),

    /**
     * List all tracks (cross-project) with optional filters
     */
    listAll: protectedProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(100),
          offset: z.number().min(0).default(0),
          projectId: z.number().optional(),
          status: z.enum(["recording", "editing", "mixing", "mastering", "completed"]).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        if (!ctx.tenantDb) {
          throw new Error("Tenant database not available");
        }

        // Build where conditions
        const conditions = [];
        if (input.projectId) {
          conditions.push(eq(tracks.projectId, input.projectId));
        }
        if (input.status) {
          conditions.push(eq(tracks.status, input.status));
        }

        // Build and execute query
        const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

        const tracksList = await ctx.tenantDb
          .select()
          .from(tracks)
          .where(whereCondition)
          .orderBy(tracks.projectId, tracks.trackNumber)
          .limit(input.limit)
          .offset(input.offset);

        return tracksList;
      }),

    /**
     * Get global stats for all tracks
     */
    getStats: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const allTracks = await ctx.tenantDb.select().from(tracks);

      const stats = {
        total: allTracks.length,
        byStatus: {
          recording: allTracks.filter((t) => t.status === "recording").length,
          editing: allTracks.filter((t) => t.status === "editing").length,
          mixing: allTracks.filter((t) => t.status === "mixing").length,
          mastering: allTracks.filter((t) => t.status === "mastering").length,
          completed: allTracks.filter((t) => t.status === "completed").length,
        },
        totalDuration: allTracks.reduce((sum, t) => sum + (t.duration || 0), 0),
      };

      return stats;
    }),

    /**
     * Get track by ID
     */
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.tenantDb) {
          throw new Error("Tenant database not available");
        }

        const track = await ctx.tenantDb
          .select()
          .from(tracks)
          .where(eq(tracks.id, input.id))
          .limit(1);

        if (track.length === 0) {
          throw new Error("Track not found");
        }

        return track[0];
      }),

    /**
     * Create new track
     */
    create: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          title: z.string().min(1).max(255),
          trackNumber: z.number().optional(),
          duration: z.number().optional(),
          isrc: z.string().max(50).optional(),
          status: z.enum(["recording", "editing", "mixing", "mastering", "completed"]).default("recording"),
          bpm: z.number().optional(),
          key: z.string().max(20).optional(),
          lyrics: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.tenantDb) {
          throw new Error("Tenant database not available");
        }

        const newTrack = await ctx.tenantDb.insert(tracks).values(input as any).returning();

        return newTrack[0];
      }),

    /**
     * Update track
     */
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).max(255).optional(),
          trackNumber: z.number().optional(),
          duration: z.number().optional(),
          status: z.enum(["recording", "editing", "mixing", "mastering", "completed"]).optional(),
          bpm: z.number().optional(),
          key: z.string().max(20).optional(),
          lyrics: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.tenantDb) {
          throw new Error("Tenant database not available");
        }

        const { id, ...updateData } = input;

        const updated = await ctx.tenantDb.update(tracks).set(updateData).where(eq(tracks.id, id)).returning();

        if (updated.length === 0) {
          throw new Error("Track not found");
        }

        return updated[0];
      }),

    /**
     * Delete track
     */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.tenantDb) {
          throw new Error("Tenant database not available");
        }

        await ctx.tenantDb.delete(tracks).where(eq(tracks.id, input.id));

        return { success: true };
      }),
  }),
});
