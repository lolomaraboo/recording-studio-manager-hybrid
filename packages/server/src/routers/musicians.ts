import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { musicians } from "@rsm/database/tenant/schema";
import { eq, sql, isNotNull } from "drizzle-orm";

/**
 * Musicians Router
 * Manages musicians/talents (artists, performers, etc.)
 */
export const musiciansRouter = router({
  /**
   * List all musicians for the organization
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantDb) {
      throw new Error("Tenant database not available");
    }

    const musiciansList = await ctx.tenantDb.select().from(musicians);
    return musiciansList;
  }),

  /**
   * Get a single musician by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const musician = await ctx.tenantDb
        .select()
        .from(musicians)
        .where(eq(musicians.id, input.id))
        .limit(1);

      if (musician.length === 0) {
        throw new Error("Musician not found");
      }

      return musician[0];
    }),

  /**
   * Get statistics about musicians
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantDb) {
      throw new Error("Tenant database not available");
    }

    const musiciansList = await ctx.tenantDb.select().from(musicians);

    const total = musiciansList.length;
    const withEmail = musiciansList.filter((m) => m.email).length;
    const withPhone = musiciansList.filter((m) => m.phone).length;
    const withWebsite = musiciansList.filter((m) => m.website).length;

    return {
      total,
      withEmail,
      withPhone,
      withWebsite,
    };
  }),

  /**
   * Create a new musician
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        stageName: z.string().max(255).optional(),
        email: z.string().email().max(255).optional(),
        phone: z.string().max(50).optional(),
        bio: z.string().optional(),
        website: z.string().url().max(500).optional(),
        spotifyUrl: z.string().url().max(500).optional(),
        instruments: z.string().optional(), // JSON string
        genres: z.string().optional(), // JSON string
        imageUrl: z.string().url().max(500).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const newMusician = await ctx.tenantDb
        .insert(musicians)
        .values(input)
        .returning();

      return newMusician[0];
    }),

  /**
   * Update a musician
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        stageName: z.string().max(255).optional(),
        email: z.string().email().max(255).optional(),
        phone: z.string().max(50).optional(),
        bio: z.string().optional(),
        website: z.string().url().max(500).optional(),
        spotifyUrl: z.string().url().max(500).optional(),
        instruments: z.string().optional(),
        genres: z.string().optional(),
        imageUrl: z.string().url().max(500).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const { id, ...data } = input;

      const updatedMusician = await ctx.tenantDb
        .update(musicians)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(musicians.id, id))
        .returning();

      if (updatedMusician.length === 0) {
        throw new Error("Musician not found");
      }

      return updatedMusician[0];
    }),

  /**
   * Delete a musician
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      await ctx.tenantDb.delete(musicians).where(eq(musicians.id, input.id));

      return { success: true };
    }),
});
