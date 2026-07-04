import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { trackCredits } from "@rsm/database/tenant/schema";
import { asc, eq } from "drizzle-orm";

/**
 * Track Credits Router
 * Credits & royalty splits per track
 * (role, creditName, isPrimary, splitPercent %).
 */
export const trackCreditsRouter = router({
  /**
   * List credits for a given track (ordered by creation).
   */
  listByTrack: protectedProcedure
    .input(z.object({ trackId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      return tenantDb
        .select()
        .from(trackCredits)
        .where(eq(trackCredits.trackId, input.trackId))
        .orderBy(asc(trackCredits.id));
    }),

  /**
   * Get credit by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const rows = await tenantDb
        .select()
        .from(trackCredits)
        .where(eq(trackCredits.id, input.id))
        .limit(1);
      if (rows.length === 0) throw new Error("Track credit not found");
      return rows[0];
    }),

  /**
   * Create a new track credit
   */
  create: protectedProcedure
    .input(
      z.object({
        trackId: z.number(),
        musicianId: z.number().optional(),
        role: z.string().min(1).max(100),
        creditName: z.string().min(1).max(255),
        isPrimary: z.boolean().default(false),
        splitPercent: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const inserted = await tenantDb
        .insert(trackCredits)
        .values({
          trackId: input.trackId,
          musicianId: input.musicianId ?? null,
          role: input.role,
          creditName: input.creditName,
          isPrimary: input.isPrimary,
          splitPercent: input.splitPercent ?? null,
        })
        .returning();
      return inserted[0];
    }),

  /**
   * Update a track credit (role / name / split %).
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        musicianId: z.number().optional(),
        role: z.string().min(1).max(100).optional(),
        creditName: z.string().min(1).max(255).optional(),
        isPrimary: z.boolean().optional(),
        splitPercent: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { id, ...updateData } = input;
      const updated = await tenantDb
        .update(trackCredits)
        .set(updateData)
        .where(eq(trackCredits.id, id))
        .returning();
      if (updated.length === 0) throw new Error("Track credit not found");
      return updated[0];
    }),

  /**
   * Delete a track credit.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      await tenantDb.delete(trackCredits).where(eq(trackCredits.id, input.id));
      return { success: true };
    }),
});
