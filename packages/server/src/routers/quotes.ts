import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { quotes, quoteItems } from "@rsm/database/tenant/schema";
import { eq } from "drizzle-orm";

/**
 * Quotes Router
 * Manages price quotes/estimates for clients
 */
export const quotesRouter = router({
  /**
   * List all quotes
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantDb) {
      throw new Error("Tenant database not available");
    }

    const quotesList = await ctx.tenantDb.select().from(quotes);
    return quotesList;
  }),

  /**
   * Get quote by ID with line items
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const quote = await ctx.tenantDb.select().from(quotes).where(eq(quotes.id, input.id)).limit(1);

      if (quote.length === 0) {
        throw new Error("Quote not found");
      }

      const items = await ctx.tenantDb.select().from(quoteItems).where(eq(quoteItems.quoteId, input.id));

      return {
        ...quote[0],
        items,
      };
    }),

  /**
   * Create new quote
   */
  create: protectedProcedure
    .input(
      z.object({
        quoteNumber: z.string().max(100),
        clientId: z.number(),
        projectId: z.number().optional(),
        validUntil: z.date(),
        title: z.string().max(255).optional(),
        description: z.string().optional(),
        subtotal: z.string(),
        taxRate: z.string().default("20.00"),
        taxAmount: z.string(),
        total: z.string(),
        terms: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const newQuote = await ctx.tenantDb.insert(quotes).values(input as any).returning();

      return newQuote[0];
    }),

  /**
   * Update quote
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["draft", "sent", "accepted", "rejected", "expired", "converted"]).optional(),
        validUntil: z.date().optional(),
        title: z.string().max(255).optional(),
        description: z.string().optional(),
        subtotal: z.string().optional(),
        taxRate: z.string().optional(),
        taxAmount: z.string().optional(),
        total: z.string().optional(),
        terms: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const { id, ...updateData } = input;

      const updated = await ctx.tenantDb.update(quotes).set(updateData).where(eq(quotes.id, id)).returning();

      if (updated.length === 0) {
        throw new Error("Quote not found");
      }

      return updated[0];
    }),

  /**
   * Delete quote
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      await ctx.tenantDb.delete(quotes).where(eq(quotes.id, input.id));

      return { success: true };
    }),

  /**
   * Quote Items sub-router
   */
  items: router({
    /**
     * Add item to quote
     */
    create: protectedProcedure
      .input(
        z.object({
          quoteId: z.number(),
          description: z.string().max(500),
          quantity: z.string().default("1.00"),
          unitPrice: z.string(),
          amount: z.string(),
          sessionId: z.number().optional(),
          equipmentId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.tenantDb) {
          throw new Error("Tenant database not available");
        }

        const newItem = await ctx.tenantDb.insert(quoteItems).values(input as any).returning();

        return newItem[0];
      }),

    /**
     * Delete quote item
     */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.tenantDb) {
          throw new Error("Tenant database not available");
        }

        await ctx.tenantDb.delete(quoteItems).where(eq(quoteItems.id, input.id));

        return { success: true };
      }),
  }),
});
