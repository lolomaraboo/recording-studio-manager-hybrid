import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { availability } from "@rsm/database/tenant/schema";
import { desc, eq } from "drizzle-orm";

/**
 * Availability Router
 * Unavailability / vacation windows for staff or talents
 * (polymorphic subject: subjectType + subjectId; kind: unavailable | vacation).
 */
export const availabilityRouter = router({
  /**
   * List all availability windows (most recent first)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenantDb = await ctx.getTenantDb();
    return tenantDb.select().from(availability).orderBy(desc(availability.startTime));
  }),

  /**
   * Get availability window by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const rows = await tenantDb
        .select()
        .from(availability)
        .where(eq(availability.id, input.id))
        .limit(1);
      if (rows.length === 0) throw new Error("Availability not found");
      return rows[0];
    }),

  /**
   * Create a new availability window
   */
  create: protectedProcedure
    .input(
      z.object({
        subjectType: z.enum(["staff", "talent"]),
        subjectId: z.number(),
        startTime: z.date(),
        endTime: z.date(),
        kind: z.enum(["unavailable", "vacation"]).default("unavailable"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const inserted = await tenantDb
        .insert(availability)
        .values({
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          startTime: input.startTime,
          endTime: input.endTime,
          kind: input.kind,
          notes: input.notes ?? null,
        })
        .returning();
      return inserted[0];
    }),

  /**
   * Update an availability window (kind / dates / details).
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        subjectType: z.enum(["staff", "talent"]).optional(),
        subjectId: z.number().optional(),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
        kind: z.enum(["unavailable", "vacation"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { id, ...updateData } = input;
      const updated = await tenantDb
        .update(availability)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(availability.id, id))
        .returning();
      if (updated.length === 0) throw new Error("Availability not found");
      return updated[0];
    }),

  /**
   * Delete an availability window.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      await tenantDb.delete(availability).where(eq(availability.id, input.id));
      return { success: true };
    }),
});
