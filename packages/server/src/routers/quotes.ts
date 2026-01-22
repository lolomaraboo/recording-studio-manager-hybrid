import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and, desc, sql } from 'drizzle-orm';
import { router, protectedProcedure } from '../_core/trpc';
import { quotes, quoteItems, clients, projects, vatRates } from '@rsm/database/tenant';
import { generateQuotePDF } from '../utils/quote-pdf-service';

/**
 * Quotes Router
 *
 * Manages price quotes/estimates with 7-state state machine:
 * draft → sent → (accepted | rejected | expired)
 *   ↓               ↓
 * cancelled   converted_to_project
 *
 * Endpoints:
 * - CRUD: list, get, create, update, delete
 * - State transitions: send, accept, reject, cancel
 * - Conversion: convertToProject
 */

/**
 * Helper: Check if quote is expired
 */
const isExpired = (quote: { expiresAt: Date | null; status: string }): boolean => {
  if (!quote.expiresAt || quote.status !== 'sent') return false;
  return new Date() > new Date(quote.expiresAt);
};

/**
 * Helper: Generate next quote number for the year
 * Format: Q-YYYY-NNNN (e.g., Q-2026-0001)
 */
const generateQuoteNumber = async (tenantDb: any): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `Q-${year}-`;

  // Get the latest quote number for this year
  const latestQuote = await tenantDb
    .select({ quoteNumber: quotes.quoteNumber })
    .from(quotes)
    .where(sql`${quotes.quoteNumber} LIKE ${prefix + '%'}`)
    .orderBy(desc(quotes.quoteNumber))
    .limit(1);

  if (latestQuote.length === 0) {
    // First quote of the year
    return `${prefix}0001`;
  }

  // Extract sequence number and increment
  const lastNumber = latestQuote[0].quoteNumber;
  const sequence = parseInt(lastNumber.split('-')[2], 10);
  const nextSequence = (sequence + 1).toString().padStart(4, '0');

  return `${prefix}${nextSequence}`;
};

export const quotesRouter = router({
  /**
   * List quotes with filters and pagination
   */
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired', 'cancelled', 'converted_to_project']).optional(),
          clientId: z.number().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { status, clientId, limit = 50, offset = 0 } = input || {};

      // Build where conditions
      const conditions = [];
      if (status) {
        conditions.push(eq(quotes.status, status));
      }
      if (clientId) {
        conditions.push(eq(quotes.clientId, clientId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const quotesList = await tenantDb
        .select()
        .from(quotes)
        .where(whereClause)
        .orderBy(desc(quotes.createdAt))
        .limit(limit)
        .offset(offset);

      // Add virtual fields: isExpired and displayStatus
      return quotesList.map((quote) => ({
        ...quote,
        isExpired: isExpired(quote),
        displayStatus: isExpired(quote) ? 'expired' : quote.status,
      }));
    }),

  /**
   * Get quote by ID with items and client
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const quote = await tenantDb.query.quotes.findFirst({
        where: eq(quotes.id, input.id),
        with: {
          items: true,
          client: true,
        },
      });

      if (!quote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Quote not found',
        });
      }

      return {
        ...quote,
        isExpired: isExpired(quote),
        displayStatus: isExpired(quote) ? 'expired' : quote.status,
      };
    }),

  /**
   * Create new quote with items
   */
  create: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        items: z
          .array(
            z.object({
              description: z.string().max(500),
              quantity: z.string().default('1.00'),
              unitPrice: z.string(),
              amount: z.string(),
              vatRateId: z.number(), // Required per line item
              serviceTemplateId: z.number().optional(),
              displayOrder: z.number().default(0),
            })
          )
          .min(1, 'At least one item is required'),
        validityDays: z.number().min(1).default(30),
        terms: z.string().optional(),
        notes: z.string().optional(),
        internalNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Use transaction for atomicity
      return await tenantDb.transaction(async (tx) => {
        // Calculate totals from line items (including their individual VAT rates)
        let subtotal = 0;
        let totalTax = 0;

        for (const item of input.items) {
          const itemAmount = parseFloat(item.amount);
          subtotal += itemAmount;

          // Fetch VAT rate for this item
          const vatRate = await tx.query.vatRates.findFirst({
            where: eq(vatRates.id, item.vatRateId),
          });

          if (!vatRate) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Taux de TVA invalide (ID: ${item.vatRateId})`,
            });
          }

          const itemTax = itemAmount * (parseFloat(vatRate.rate) / 100);
          totalTax += itemTax;
        }

        const total = subtotal + totalTax;

        // Weighted average tax rate for header (legacy compatibility)
        const averageTaxRate = subtotal > 0 ? (totalTax / subtotal) * 100 : 0;

        // Generate quote number
        const quoteNumber = await generateQuoteNumber(tx);

        // Create quote
        const [quote] = await tx
          .insert(quotes)
          .values({
            quoteNumber,
            clientId: input.clientId,
            status: 'draft',
            validityDays: input.validityDays,
            subtotal: subtotal.toFixed(2),
            taxRate: averageTaxRate.toFixed(2), // Weighted average for backward compatibility
            taxAmount: totalTax.toFixed(2),
            total: total.toFixed(2),
            terms: input.terms,
            notes: input.notes,
            internalNotes: input.internalNotes,
          })
          .returning();

        // Create quote items with vatRateId
        const items = await tx
          .insert(quoteItems)
          .values(
            input.items.map((item, index) => ({
              quoteId: quote.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
              vatRateId: item.vatRateId,
              serviceTemplateId: item.serviceTemplateId,
              displayOrder: item.displayOrder !== undefined ? item.displayOrder : index,
            }))
          )
          .returning();

        return { ...quote, items };
      });
    }),

  /**
   * Update quote (only if status='draft')
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          clientId: z.number().optional(),
          validityDays: z.number().min(1).optional(),
          terms: z.string().optional(),
          notes: z.string().optional(),
          internalNotes: z.string().optional(),
          items: z
            .array(
              z.object({
                id: z.number().optional(), // For existing items
                description: z.string().max(500),
                quantity: z.string(),
                unitPrice: z.string(),
                amount: z.string(),
                vatRateId: z.number(), // Required per line item
                serviceTemplateId: z.number().optional(),
                displayOrder: z.number().default(0),
              })
            )
            .optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Validate quote exists and is draft
      const existingQuote = await tenantDb.query.quotes.findFirst({
        where: eq(quotes.id, input.id),
      });

      if (!existingQuote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Quote not found',
        });
      }

      if (existingQuote.status !== 'draft') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only draft quotes can be edited',
        });
      }

      return await tenantDb.transaction(async (tx) => {
        // If items are being updated, recalculate totals
        let updateData: any = { ...input.data };

        if (input.data.items && input.data.items.length > 0) {
          // Delete existing items and create new ones
          await tx.delete(quoteItems).where(eq(quoteItems.quoteId, input.id));

          // Calculate totals from line items (including their individual VAT rates)
          let subtotal = 0;
          let totalTax = 0;

          for (const item of input.data.items) {
            const itemAmount = parseFloat(item.amount);
            subtotal += itemAmount;

            // Fetch VAT rate for this item
            const vatRate = await tx.query.vatRates.findFirst({
              where: eq(vatRates.id, item.vatRateId),
            });

            if (!vatRate) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Taux de TVA invalide (ID: ${item.vatRateId})`,
              });
            }

            const itemTax = itemAmount * (parseFloat(vatRate.rate) / 100);
            totalTax += itemTax;
          }

          const total = subtotal + totalTax;

          // Weighted average tax rate for header (legacy compatibility)
          const averageTaxRate = subtotal > 0 ? (totalTax / subtotal) * 100 : 0;

          updateData.subtotal = subtotal.toFixed(2);
          updateData.taxRate = averageTaxRate.toFixed(2);
          updateData.taxAmount = totalTax.toFixed(2);
          updateData.total = total.toFixed(2);

          // Create new items with vatRateId
          await tx.insert(quoteItems).values(
            input.data.items.map((item, index) => ({
              quoteId: input.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
              vatRateId: item.vatRateId,
              serviceTemplateId: item.serviceTemplateId,
              displayOrder: item.displayOrder !== undefined ? item.displayOrder : index,
            }))
          );
        }

        // Remove items from updateData as they're handled separately
        delete updateData.items;

        // Update quote
        const [updatedQuote] = await tx
          .update(quotes)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(quotes.id, input.id))
          .returning();

        return updatedQuote;
      });
    }),

  /**
   * Delete quote (only if status='draft')
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Validate quote exists and is draft
      const existingQuote = await tenantDb.query.quotes.findFirst({
        where: eq(quotes.id, input.id),
      });

      if (!existingQuote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Quote not found',
        });
      }

      if (existingQuote.status !== 'draft') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only draft quotes can be deleted',
        });
      }

      // Delete quote (items will cascade)
      await tenantDb.delete(quotes).where(eq(quotes.id, input.id));

      return { success: true };
    }),

  /**
   * State transition: draft → sent
   */
  send: protectedProcedure
    .input(z.object({ quoteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Validate current state
      const quote = await tenantDb.query.quotes.findFirst({
        where: eq(quotes.id, input.quoteId),
      });

      if (!quote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Quote not found',
        });
      }

      if (quote.status !== 'draft') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only draft quotes can be sent',
        });
      }

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + quote.validityDays);

      // Update status
      const [updated] = await tenantDb
        .update(quotes)
        .set({
          status: 'sent',
          sentAt: new Date(),
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, input.quoteId))
        .returning();

      return updated;
    }),

  /**
   * State transition: sent → accepted
   */
  accept: protectedProcedure
    .input(z.object({ quoteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Validate current state
      const quote = await tenantDb.query.quotes.findFirst({
        where: eq(quotes.id, input.quoteId),
      });

      if (!quote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Quote not found',
        });
      }

      if (quote.status !== 'sent') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only sent quotes can be accepted',
        });
      }

      // Check if expired
      if (isExpired(quote)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot accept expired quote',
        });
      }

      // Update status
      const [updated] = await tenantDb
        .update(quotes)
        .set({
          status: 'accepted',
          respondedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, input.quoteId))
        .returning();

      return updated;
    }),

  /**
   * State transition: sent → rejected
   */
  reject: protectedProcedure
    .input(z.object({ quoteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Validate current state
      const quote = await tenantDb.query.quotes.findFirst({
        where: eq(quotes.id, input.quoteId),
      });

      if (!quote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Quote not found',
        });
      }

      if (quote.status !== 'sent') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only sent quotes can be rejected',
        });
      }

      // Update status
      const [updated] = await tenantDb
        .update(quotes)
        .set({
          status: 'rejected',
          respondedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, input.quoteId))
        .returning();

      return updated;
    }),

  /**
   * State transition: draft → cancelled
   */
  cancel: protectedProcedure
    .input(z.object({ quoteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Validate current state
      const quote = await tenantDb.query.quotes.findFirst({
        where: eq(quotes.id, input.quoteId),
      });

      if (!quote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Quote not found',
        });
      }

      if (quote.status !== 'draft') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only draft quotes can be cancelled',
        });
      }

      // Update status
      const [updated] = await tenantDb
        .update(quotes)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, input.quoteId))
        .returning();

      return updated;
    }),

  /**
   * Convert accepted quote to project (atomic transaction)
   */
  convertToProject: protectedProcedure
    .input(z.object({ quoteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Use database transaction for atomicity
      return await tenantDb.transaction(async (tx) => {
        // 1. Fetch quote with validation
        const quote = await tx.query.quotes.findFirst({
          where: eq(quotes.id, input.quoteId),
          with: { client: true, items: true },
        });

        if (!quote) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Quote not found',
          });
        }

        // 2. Validate quote state
        if (quote.status !== 'accepted') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Only accepted quotes can be converted to projects',
          });
        }

        if (quote.convertedToProjectId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Quote already converted to project',
          });
        }

        // 3. Create project from quote
        const [project] = await tx
          .insert(projects)
          .values({
            clientId: quote.clientId,
            name: `Project from Quote ${quote.quoteNumber}`,
            description: quote.notes || `Converted from quote ${quote.quoteNumber}`,
            status: 'pre_production',
            budget: quote.total, // Quote total becomes project budget
            startDate: new Date(),
          })
          .returning();

        // 4. Update quote status and link project
        const [updatedQuote] = await tx
          .update(quotes)
          .set({
            status: 'converted_to_project',
            convertedToProjectId: project.id,
            convertedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(quotes.id, input.quoteId))
          .returning();

        return { project, quote: updatedQuote };
      });
    }),

  /**
   * Generate PDF for a quote
   */
  generatePDF: protectedProcedure
    .input(z.object({ quoteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Verify quote exists and user has access
      const quote = await tenantDb.query.quotes.findFirst({
        where: eq(quotes.id, input.quoteId),
      });

      if (!quote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Quote not found',
        });
      }

      // Generate PDF
      const pdfBuffer = await generateQuotePDF(input.quoteId, ctx.organizationId);

      // Return as base64 for transport over tRPC
      return {
        filename: `quote-${quote.quoteNumber}.pdf`,
        data: pdfBuffer.toString('base64'),
        mimeType: 'application/pdf',
      };
    }),
});
