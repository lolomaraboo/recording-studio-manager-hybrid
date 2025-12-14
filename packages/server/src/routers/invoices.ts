import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { router, protectedProcedure } from '../_core/trpc';
import { invoices } from '@rsm/database/tenant';

/**
 * Invoices Router
 *
 * CRUD for invoices (stored in Tenant DB)
 *
 * Endpoints:
 * - list: Get all invoices for organization
 * - get: Get invoice by ID
 * - create: Create new invoice
 * - update: Update invoice
 * - delete: Delete invoice
 */
export const invoicesRouter = router({
  /**
   * List invoices for current organization
   */
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { limit = 50, offset = 0 } = input || {};

      const invoicesList = await tenantDb
        .select()
        .from(invoices)
        .limit(limit)
        .offset(offset);

      return invoicesList;
    }),

  /**
   * Get invoice by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const invoice = await tenantDb.query.invoices.findFirst({
        where: eq(invoices.id, input.id),
      });

      if (!invoice) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        });
      }

      return invoice;
    }),

  /**
   * Create new invoice
   */
  create: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        invoiceNumber: z.string(),
        issueDate: z.string(), // ISO date string
        dueDate: z.string().optional(),
        subtotal: z.string(), // Decimal as string
        taxRate: z.string().optional(),
        status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Calculate tax and total
      const subtotal = parseFloat(input.subtotal);
      const taxRate = input.taxRate ? parseFloat(input.taxRate) : 20.0;
      const taxAmount = (subtotal * taxRate) / 100;
      const total = subtotal + taxAmount;

      const [invoice] = await tenantDb
        .insert(invoices)
        .values({
          clientId: input.clientId,
          invoiceNumber: input.invoiceNumber,
          issueDate: new Date(input.issueDate),
          dueDate: input.dueDate ? new Date(input.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          subtotal: input.subtotal,
          taxRate: input.taxRate || '20.00',
          taxAmount: taxAmount.toFixed(2),
          total: total.toFixed(2),
          status: input.status,
          notes: input.notes,
        })
        .returning();

      return invoice;
    }),

  /**
   * Update invoice
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          clientId: z.number().optional(),
          invoiceNumber: z.string().optional(),
          issueDate: z.string().optional(),
          dueDate: z.string().optional(),
          subtotal: z.string().optional(),
          status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
          notes: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Convert dates if provided
      const updateData: any = { ...input.data };
      if (input.data.issueDate) {
        updateData.issueDate = new Date(input.data.issueDate);
      }
      if (input.data.dueDate) {
        updateData.dueDate = new Date(input.data.dueDate);
      }

      const [updated] = await tenantDb
        .update(invoices)
        .set(updateData)
        .where(eq(invoices.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        });
      }

      return updated;
    }),

  /**
   * Delete invoice
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      await tenantDb.delete(invoices).where(eq(invoices.id, input.id));

      return { success: true };
    }),
});
