/**
 * VAT Rates Router
 *
 * Handles CRUD operations for organization VAT rates.
 * - List active rates
 * - Create new rate with validation
 * - Update existing rate
 * - Set default rate (atomic transaction)
 * - Archive rate (soft delete with usage validation)
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and, inArray, desc, asc } from 'drizzle-orm';
import { vatRates, invoiceItems, invoices, quoteItems, quotes } from '@rsm/database/tenant/schema';

export const vatRatesRouter = router({
  /**
   * List all active VAT rates for current organization
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenantDb = await ctx.getTenantDb();

    const rates = await tenantDb.query.vatRates.findMany({
      where: eq(vatRates.isActive, true),
      orderBy: [desc(vatRates.isDefault), asc(vatRates.rate)],
    });

    return rates;
  }),

  /**
   * List ALL rates (active + archived) for admin view
   */
  listAll: protectedProcedure.query(async ({ ctx }) => {
    const tenantDb = await ctx.getTenantDb();

    const rates = await tenantDb.query.vatRates.findMany({
      orderBy: [desc(vatRates.isDefault), desc(vatRates.isActive), asc(vatRates.rate)],
    });

    return rates;
  }),

  /**
   * Create new VAT rate
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
        rate: z
          .number()
          .min(0, 'Le taux doit être positif')
          .max(100, 'Le taux ne peut pas dépasser 100%'),
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // If setting as default, unset others first (atomic transaction)
      if (input.isDefault) {
        await tenantDb.transaction(async (tx) => {
          // Unset all existing defaults
          await tx
            .update(vatRates)
            .set({ isDefault: false })
            .where(eq(vatRates.isDefault, true));

          // Insert new rate as default
          const [newRate] = await tx
            .insert(vatRates)
            .values({
              name: input.name,
              rate: input.rate.toFixed(2),
              isDefault: true,
              isActive: true,
            })
            .returning();

          return newRate;
        });
      } else {
        // Insert non-default rate
        const [newRate] = await tenantDb
          .insert(vatRates)
          .values({
            name: input.name,
            rate: input.rate.toFixed(2),
            isDefault: false,
            isActive: true,
          })
          .returning();

        return newRate;
      }

      // Fetch newly created rate
      const created = await tenantDb.query.vatRates.findFirst({
        where: eq(vatRates.name, input.name),
        orderBy: desc(vatRates.createdAt),
      });

      return created;
    }),

  /**
   * Update existing VAT rate (name only - rate changes create new rate)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const [updated] = await tenantDb
        .update(vatRates)
        .set({
          name: input.name,
          updatedAt: new Date(),
        })
        .where(eq(vatRates.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Taux de TVA introuvable',
        });
      }

      return updated;
    }),

  /**
   * Set a rate as the default (atomic: unset all others, set this one)
   */
  setDefault: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      await tenantDb.transaction(async (tx) => {
        // Unset all defaults
        await tx.update(vatRates).set({ isDefault: false });

        // Set new default
        await tx
          .update(vatRates)
          .set({ isDefault: true, updatedAt: new Date() })
          .where(eq(vatRates.id, input.id));
      });

      return { success: true };
    }),

  /**
   * Archive a VAT rate (soft delete)
   * Prevents archiving if rate is used in active invoices or quotes
   */
  archive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Check if used in active invoices
      const usedInInvoices = await tenantDb
        .select({ id: invoiceItems.id })
        .from(invoiceItems)
        .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
        .where(
          and(
            eq(invoiceItems.vatRateId, input.id),
            inArray(invoices.status, ['draft', 'sent', 'paid', 'overdue'])
          )
        )
        .limit(1);

      if (usedInInvoices.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Impossible d\'archiver ce taux : il est utilisé dans des factures actives',
        });
      }

      // Check if used in active quotes
      const usedInQuotes = await tenantDb
        .select({ id: quoteItems.id })
        .from(quoteItems)
        .innerJoin(quotes, eq(quoteItems.quoteId, quotes.id))
        .where(
          and(
            eq(quoteItems.vatRateId, input.id),
            inArray(quotes.status, ['draft', 'sent', 'accepted'])
          )
        )
        .limit(1);

      if (usedInQuotes.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Impossible d\'archiver ce taux : il est utilisé dans des devis actifs',
        });
      }

      // Archive the rate (soft delete)
      const [archived] = await tenantDb
        .update(vatRates)
        .set({
          isActive: false,
          isDefault: false, // Can't be default if archived
          updatedAt: new Date(),
        })
        .where(eq(vatRates.id, input.id))
        .returning();

      if (!archived) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Taux de TVA introuvable',
        });
      }

      return archived;
    }),
});
