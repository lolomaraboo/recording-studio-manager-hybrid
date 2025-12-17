import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { expenses } from "@rsm/database/tenant/schema";
import { eq } from "drizzle-orm";

/**
 * Expenses Router
 * Manages business expenses and costs
 */
export const expensesRouter = router({
  /**
   * List all expenses
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantDb) {
      throw new Error("Tenant database not available");
    }

    const expensesList = await ctx.tenantDb.select().from(expenses);
    return expensesList;
  }),

  /**
   * Get expense by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const expense = await ctx.tenantDb.select().from(expenses).where(eq(expenses.id, input.id)).limit(1);

      if (expense.length === 0) {
        throw new Error("Expense not found");
      }

      return expense[0];
    }),

  /**
   * Create new expense
   */
  create: protectedProcedure
    .input(
      z.object({
        category: z.enum([
          "rent",
          "utilities",
          "insurance",
          "maintenance",
          "salary",
          "marketing",
          "software",
          "supplies",
          "equipment",
          "other",
        ]),
        description: z.string().max(500),
        vendor: z.string().max(255).optional(),
        amount: z.string(),
        currency: z.string().length(3).default("EUR"),
        taxAmount: z.string().optional(),
        expenseDate: z.date(),
        paymentMethod: z.enum(["cash", "card", "bank_transfer", "check", "other"]).optional(),
        referenceNumber: z.string().max(100).optional(),
        projectId: z.number().optional(),
        equipmentId: z.number().optional(),
        receiptUrl: z.string().max(500).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const newExpense = await ctx.tenantDb.insert(expenses).values(input as any).returning();

      return newExpense[0];
    }),

  /**
   * Update expense
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        category: z
          .enum([
            "rent",
            "utilities",
            "insurance",
            "maintenance",
            "salary",
            "marketing",
            "software",
            "supplies",
            "equipment",
            "other",
          ])
          .optional(),
        description: z.string().max(500).optional(),
        vendor: z.string().max(255).optional(),
        amount: z.string().optional(),
        taxAmount: z.string().optional(),
        expenseDate: z.date().optional(),
        paidAt: z.date().optional(),
        paymentMethod: z.enum(["cash", "card", "bank_transfer", "check", "other"]).optional(),
        referenceNumber: z.string().max(100).optional(),
        status: z.enum(["pending", "paid", "cancelled"]).optional(),
        isRecurring: z.boolean().optional(),
        receiptUrl: z.string().max(500).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const { id, ...updateData } = input;

      const updated = await ctx.tenantDb.update(expenses).set(updateData).where(eq(expenses.id, id)).returning();

      if (updated.length === 0) {
        throw new Error("Expense not found");
      }

      return updated[0];
    }),

  /**
   * Delete expense
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      await ctx.tenantDb.delete(expenses).where(eq(expenses.id, input.id));

      return { success: true };
    }),
});
