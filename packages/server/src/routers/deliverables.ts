import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { deliverables } from "@rsm/database/tenant/schema";
import { desc, eq } from "drizzle-orm";

/**
 * Deliverables Router
 * Export bundles / deliverables handed to the client
 * (status: draft | delivered | approved).
 */
export const deliverablesRouter = router({
  /**
   * List all deliverables (most recent first)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenantDb = await ctx.getTenantDb();
    return tenantDb.select().from(deliverables).orderBy(desc(deliverables.createdAt));
  }),

  /**
   * Get deliverable by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const rows = await tenantDb
        .select()
        .from(deliverables)
        .where(eq(deliverables.id, input.id))
        .limit(1);
      if (rows.length === 0) throw new Error("Deliverable not found");
      return rows[0];
    }),

  /**
   * Create a new deliverable
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        projectId: z.number().optional(),
        url: z.string().max(1000).optional(),
        status: z.enum(["draft", "delivered", "approved"]).default("draft"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const inserted = await tenantDb
        .insert(deliverables)
        .values({
          name: input.name,
          projectId: input.projectId ?? null,
          url: input.url ?? null,
          status: input.status,
          notes: input.notes ?? null,
        })
        .returning();
      return inserted[0];
    }),

  /**
   * Update a deliverable (status / details).
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        projectId: z.number().optional(),
        url: z.string().max(1000).optional(),
        status: z.enum(["draft", "delivered", "approved"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { id, ...updateData } = input;
      const updated = await tenantDb
        .update(deliverables)
        .set(updateData)
        .where(eq(deliverables.id, id))
        .returning();
      if (updated.length === 0) throw new Error("Deliverable not found");
      return updated[0];
    }),

  /**
   * Delete a deliverable.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      await tenantDb.delete(deliverables).where(eq(deliverables.id, input.id));
      return { success: true };
    }),
});
