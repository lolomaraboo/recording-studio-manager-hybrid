import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { documents } from "@rsm/database/tenant/schema";
import { desc, eq } from "drizzle-orm";

/**
 * Documents Router
 * Documents / assets library (briefs, references, riders, stems, contracts…).
 */
export const documentsRouter = router({
  /**
   * List all documents (most recent first)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenantDb = await ctx.getTenantDb();
    return tenantDb.select().from(documents).orderBy(desc(documents.createdAt));
  }),

  /**
   * Get document by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const rows = await tenantDb
        .select()
        .from(documents)
        .where(eq(documents.id, input.id))
        .limit(1);
      if (rows.length === 0) throw new Error("Document not found");
      return rows[0];
    }),

  /**
   * Create a new document
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        url: z.string().min(1).max(1000),
        docType: z.string().max(100).optional(),
        clientId: z.number().optional(),
        projectId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const inserted = await tenantDb
        .insert(documents)
        .values({
          name: input.name,
          url: input.url,
          docType: input.docType ?? null,
          clientId: input.clientId ?? null,
          projectId: input.projectId ?? null,
          notes: input.notes ?? null,
        })
        .returning();
      return inserted[0];
    }),

  /**
   * Update a document (details).
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        url: z.string().min(1).max(1000).optional(),
        docType: z.string().max(100).optional(),
        clientId: z.number().optional(),
        projectId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { id, ...updateData } = input;
      const updated = await tenantDb
        .update(documents)
        .set(updateData)
        .where(eq(documents.id, id))
        .returning();
      if (updated.length === 0) throw new Error("Document not found");
      return updated[0];
    }),

  /**
   * Delete a document.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      await tenantDb.delete(documents).where(eq(documents.id, input.id));
      return { success: true };
    }),
});
