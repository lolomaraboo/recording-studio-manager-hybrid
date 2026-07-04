import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { coupons } from "@rsm/database/tenant/schema";
import { desc, eq } from "drizzle-orm";

/**
 * Coupons Router
 * Discount coupons / gift cards (code, kind, value).
 */
export const couponsRouter = router({
  /**
   * List all coupons (most recent first)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenantDb = await ctx.getTenantDb();
    return tenantDb.select().from(coupons).orderBy(desc(coupons.createdAt));
  }),

  /**
   * Get coupon by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const rows = await tenantDb
        .select()
        .from(coupons)
        .where(eq(coupons.id, input.id))
        .limit(1);
      if (rows.length === 0) throw new Error("Coupon not found");
      return rows[0];
    }),

  /**
   * Create a new coupon
   */
  create: protectedProcedure
    .input(
      z.object({
        code: z.string().min(1).max(100),
        kind: z.enum(["percent", "amount", "giftcard"]).default("percent"),
        value: z.string(),
        isActive: z.boolean().default(true),
        validUntil: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const inserted = await tenantDb
        .insert(coupons)
        .values({
          code: input.code,
          kind: input.kind,
          value: input.value,
          isActive: input.isActive,
          validUntil: input.validUntil ?? null,
          notes: input.notes ?? null,
        })
        .returning();
      return inserted[0];
    }),

  /**
   * Update a coupon (value / active state / validity).
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        code: z.string().min(1).max(100).optional(),
        kind: z.enum(["percent", "amount", "giftcard"]).optional(),
        value: z.string().optional(),
        isActive: z.boolean().optional(),
        validUntil: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { id, ...updateData } = input;
      const updated = await tenantDb
        .update(coupons)
        .set(updateData)
        .where(eq(coupons.id, id))
        .returning();
      if (updated.length === 0) throw new Error("Coupon not found");
      return updated[0];
    }),

  /**
   * Delete a coupon.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      await tenantDb.delete(coupons).where(eq(coupons.id, input.id));
      return { success: true };
    }),
});
