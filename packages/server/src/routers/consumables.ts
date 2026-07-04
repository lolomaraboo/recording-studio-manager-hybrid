import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { consumables } from "@rsm/database/tenant/schema";
import { asc, eq } from "drizzle-orm";

/**
 * Consumables Router
 * Inventory of consumable supplies (cables, media, supplies) with
 * quantity and a low-stock threshold.
 */
export const consumablesRouter = router({
  /**
   * List all consumables (alphabetical)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenantDb = await ctx.getTenantDb();
    return tenantDb.select().from(consumables).orderBy(asc(consumables.name));
  }),

  /**
   * Get consumable by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const rows = await tenantDb
        .select()
        .from(consumables)
        .where(eq(consumables.id, input.id))
        .limit(1);
      if (rows.length === 0) throw new Error("Consumable not found");
      return rows[0];
    }),

  /**
   * Create a new consumable
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        quantity: z.string().default("0"),
        unit: z.string().max(50).optional(),
        threshold: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const inserted = await tenantDb
        .insert(consumables)
        .values({
          name: input.name,
          quantity: input.quantity,
          unit: input.unit ?? null,
          threshold: input.threshold ?? null,
          notes: input.notes ?? null,
        })
        .returning();
      return inserted[0];
    }),

  /**
   * Update a consumable (quantity / threshold / details).
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        quantity: z.string().optional(),
        unit: z.string().max(50).optional(),
        threshold: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { id, ...updateData } = input;
      const updated = await tenantDb
        .update(consumables)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(consumables.id, id))
        .returning();
      if (updated.length === 0) throw new Error("Consumable not found");
      return updated[0];
    }),

  /**
   * Delete a consumable.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      await tenantDb.delete(consumables).where(eq(consumables.id, input.id));
      return { success: true };
    }),
});
