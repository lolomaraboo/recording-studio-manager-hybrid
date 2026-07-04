import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { clientPackages } from "@rsm/database/tenant/schema";
import { desc, eq } from "drizzle-orm";

/**
 * Client Packages Router (Forfaits)
 * Prepaid hour packages per client (total_hours / used_hours).
 */
export const clientPackagesRouter = router({
  /**
   * List all client packages (most recent first)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenantDb = await ctx.getTenantDb();
    return tenantDb.select().from(clientPackages).orderBy(desc(clientPackages.createdAt));
  }),

  /**
   * Get client package by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const rows = await tenantDb
        .select()
        .from(clientPackages)
        .where(eq(clientPackages.id, input.id))
        .limit(1);
      if (rows.length === 0) throw new Error("Client package not found");
      return rows[0];
    }),

  /**
   * Create a new client package
   */
  create: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        name: z.string().min(1).max(255),
        totalHours: z.string().optional(),
        usedHours: z.string().default("0"),
        price: z.string().optional(),
        status: z.enum(["active", "expired", "consumed"]).default("active"),
        validUntil: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const inserted = await tenantDb
        .insert(clientPackages)
        .values({
          clientId: input.clientId,
          name: input.name,
          totalHours: input.totalHours ?? null,
          usedHours: input.usedHours,
          price: input.price ?? null,
          status: input.status,
          validUntil: input.validUntil ?? null,
          notes: input.notes ?? null,
        })
        .returning();
      return inserted[0];
    }),

  /**
   * Update a client package (used hours / status / details).
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        totalHours: z.string().optional(),
        usedHours: z.string().optional(),
        price: z.string().optional(),
        status: z.enum(["active", "expired", "consumed"]).optional(),
        validUntil: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { id, ...updateData } = input;
      const updated = await tenantDb
        .update(clientPackages)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(clientPackages.id, id))
        .returning();
      if (updated.length === 0) throw new Error("Client package not found");
      return updated[0];
    }),

  /**
   * Delete a client package.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      await tenantDb.delete(clientPackages).where(eq(clientPackages.id, input.id));
      return { success: true };
    }),
});
