import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { creditNotes } from "@rsm/database/tenant/schema";
import { desc, eq, like } from "drizzle-orm";

/**
 * Credit Notes Router (Avoirs)
 * Formal negative-invoice documents with server-side numbering AV-YYYY-NNNN.
 */
export const creditNotesRouter = router({
  /**
   * List all credit notes (most recent first)
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenantDb = await ctx.getTenantDb();
    return tenantDb.select().from(creditNotes).orderBy(desc(creditNotes.createdAt));
  }),

  /**
   * Get credit note by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const rows = await tenantDb
        .select()
        .from(creditNotes)
        .where(eq(creditNotes.id, input.id))
        .limit(1);
      if (rows.length === 0) throw new Error("Credit note not found");
      return rows[0];
    }),

  /**
   * Create a new credit note.
   * The credit note number AV-YYYY-NNNN is generated server-side
   * (mirrors POST /api/sync/create-credit-note).
   */
  create: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        invoiceId: z.number().optional(),
        amount: z.string(),
        reason: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const year = new Date().getFullYear();
      const prefix = `AV-${year}-`;

      // Find the last sequence number for the current year.
      const last = await tenantDb
        .select({ creditNoteNumber: creditNotes.creditNoteNumber })
        .from(creditNotes)
        .where(like(creditNotes.creditNoteNumber, `${prefix}%`))
        .orderBy(desc(creditNotes.creditNoteNumber))
        .limit(1);

      const lastSeq = last[0]
        ? parseInt(last[0].creditNoteNumber.slice(prefix.length), 10) || 0
        : 0;
      const creditNoteNumber = `${prefix}${String(lastSeq + 1).padStart(4, "0")}`;

      const inserted = await tenantDb
        .insert(creditNotes)
        .values({
          creditNoteNumber,
          clientId: input.clientId,
          invoiceId: input.invoiceId ?? null,
          amount: input.amount,
          reason: input.reason ?? null,
          status: "issued",
        })
        .returning();

      return inserted[0];
    }),

  /**
   * Update a credit note (status / reason).
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        amount: z.string().optional(),
        reason: z.string().max(500).optional(),
        status: z.enum(["issued", "applied", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { id, ...updateData } = input;
      const updated = await tenantDb
        .update(creditNotes)
        .set(updateData)
        .where(eq(creditNotes.id, id))
        .returning();
      if (updated.length === 0) throw new Error("Credit note not found");
      return updated[0];
    }),

  /**
   * Delete a credit note.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      await tenantDb.delete(creditNotes).where(eq(creditNotes.id, input.id));
      return { success: true };
    }),
});
