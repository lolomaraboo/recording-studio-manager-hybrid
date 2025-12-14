/**
 * Quotes Router
 *
 * Handles quotes/estimates management:
 * - CRUD operations for quotes
 * - Quote items management
 * - PDF generation
 * - Quote to invoice conversion
 * - DocuSign e-signature integration
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { quotes, quoteItems, clients, projects, invoices, invoiceItems } from '@rsm/database/tenant';
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';
import { generateQuotePDF, type QuoteData } from '../_core/pdf';
import {
  isDocuSignConfigured,
  createEnvelope,
  getEnvelopeStatus,
} from '../_core/docusign';

// Input schemas
const quoteItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  amount: z.number().positive(),
});

const createQuoteSchema = z.object({
  clientId: z.number(),
  projectId: z.number().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  validUntil: z.string(), // ISO date string
  items: z.array(quoteItemSchema).min(1),
  taxRate: z.number().min(0).max(100).default(20),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

const updateQuoteSchema = z.object({
  id: z.number(),
  clientId: z.number().optional(),
  projectId: z.number().optional().nullable(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  validUntil: z.string().optional(),
  items: z.array(quoteItemSchema).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted']).optional(),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
});

export const quotesRouter = router({
  /**
   * List all quotes with pagination and filtering
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted']).optional(),
        clientId: z.number().optional(),
        projectId: z.number().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantDb) throw new Error('Tenant database not available');

      const { limit = 20, offset = 0, status, clientId, projectId } = input || {};

      // Build conditions
      const conditions = [];
      if (status) {
        conditions.push(eq(quotes.status, status));
      }
      if (clientId) {
        conditions.push(eq(quotes.clientId, clientId));
      }
      if (projectId) {
        conditions.push(eq(quotes.projectId, projectId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get quotes with client info
      const quotesList = await ctx.tenantDb
        .select({
          id: quotes.id,
          quoteNumber: quotes.quoteNumber,
          clientId: quotes.clientId,
          clientName: clients.name,
          clientArtistName: clients.artistName,
          projectId: quotes.projectId,
          projectName: projects.name,
          title: quotes.title,
          description: quotes.description,
          issueDate: quotes.issueDate,
          validUntil: quotes.validUntil,
          status: quotes.status,
          subtotal: quotes.subtotal,
          taxRate: quotes.taxRate,
          taxAmount: quotes.taxAmount,
          total: quotes.total,
          docusignStatus: quotes.docusignStatus,
          signedAt: quotes.signedAt,
          convertedInvoiceId: quotes.convertedInvoiceId,
          createdAt: quotes.createdAt,
        })
        .from(quotes)
        .leftJoin(clients, eq(quotes.clientId, clients.id))
        .leftJoin(projects, eq(quotes.projectId, projects.id))
        .where(whereClause)
        .orderBy(desc(quotes.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const [countResult] = await ctx.tenantDb
        .select({ count: sql<number>`count(*)` })
        .from(quotes)
        .where(whereClause);

      return {
        quotes: quotesList,
        total: Number(countResult?.count || 0),
        limit,
        offset,
      };
    }),

  /**
   * Get a single quote with items
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantDb) throw new Error('Tenant database not available');

      const [quote] = await ctx.tenantDb
        .select({
          id: quotes.id,
          quoteNumber: quotes.quoteNumber,
          clientId: quotes.clientId,
          clientName: clients.name,
          clientArtistName: clients.artistName,
          clientEmail: clients.email,
          clientAddress: clients.address,
          clientCity: clients.city,
          clientCountry: clients.country,
          projectId: quotes.projectId,
          projectName: projects.name,
          title: quotes.title,
          description: quotes.description,
          issueDate: quotes.issueDate,
          validUntil: quotes.validUntil,
          status: quotes.status,
          subtotal: quotes.subtotal,
          taxRate: quotes.taxRate,
          taxAmount: quotes.taxAmount,
          total: quotes.total,
          notes: quotes.notes,
          terms: quotes.terms,
          docusignEnvelopeId: quotes.docusignEnvelopeId,
          docusignStatus: quotes.docusignStatus,
          signedAt: quotes.signedAt,
          signedByName: quotes.signedByName,
          signedByEmail: quotes.signedByEmail,
          convertedInvoiceId: quotes.convertedInvoiceId,
          createdAt: quotes.createdAt,
          updatedAt: quotes.updatedAt,
        })
        .from(quotes)
        .leftJoin(clients, eq(quotes.clientId, clients.id))
        .leftJoin(projects, eq(quotes.projectId, projects.id))
        .where(eq(quotes.id, input.id));

      if (!quote) {
        throw new Error('Quote not found');
      }

      // Get quote items
      const items = await ctx.tenantDb
        .select()
        .from(quoteItems)
        .where(eq(quoteItems.quoteId, input.id))
        .orderBy(quoteItems.id);

      return { ...quote, items };
    }),

  /**
   * Create a new quote
   */
  create: protectedProcedure
    .input(createQuoteSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) throw new Error('Tenant database not available');

      // Generate quote number
      const [lastQuote] = await ctx.tenantDb
        .select({ quoteNumber: quotes.quoteNumber })
        .from(quotes)
        .orderBy(desc(quotes.id))
        .limit(1);

      const lastNumber = lastQuote?.quoteNumber
        ? parseInt(lastQuote.quoteNumber.replace('Q-', ''))
        : 0;
      const quoteNumber = `Q-${String(lastNumber + 1).padStart(5, '0')}`;

      // Calculate totals
      const subtotal = input.items.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = subtotal * (input.taxRate / 100);
      const total = subtotal + taxAmount;

      // Create quote
      const [newQuote] = await ctx.tenantDb
        .insert(quotes)
        .values({
          quoteNumber,
          clientId: input.clientId,
          projectId: input.projectId,
          title: input.title,
          description: input.description,
          validUntil: new Date(input.validUntil),
          subtotal: subtotal.toFixed(2),
          taxRate: input.taxRate.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          total: total.toFixed(2),
          notes: input.notes,
          terms: input.terms,
        })
        .returning();

      // Create quote items
      if (input.items.length > 0 && newQuote) {
        await ctx.tenantDb.insert(quoteItems).values(
          input.items.map((item) => ({
            quoteId: newQuote.id,
            description: item.description,
            quantity: item.quantity.toFixed(2),
            unitPrice: item.unitPrice.toFixed(2),
            amount: item.amount.toFixed(2),
          }))
        );
      }

      return newQuote;
    }),

  /**
   * Update a quote
   */
  update: protectedProcedure
    .input(updateQuoteSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) throw new Error('Tenant database not available');

      const { id, items, ...updateData } = input;

      // Check if quote exists and is editable
      const [existingQuote] = await ctx.tenantDb
        .select()
        .from(quotes)
        .where(eq(quotes.id, id));

      if (!existingQuote) {
        throw new Error('Quote not found');
      }

      if (existingQuote.status === 'converted') {
        throw new Error('Cannot edit a converted quote');
      }

      // Prepare update data
      const dataToUpdate: Record<string, unknown> = { updatedAt: new Date() };

      if (updateData.clientId !== undefined) dataToUpdate.clientId = updateData.clientId;
      if (updateData.projectId !== undefined) dataToUpdate.projectId = updateData.projectId;
      if (updateData.title !== undefined) dataToUpdate.title = updateData.title;
      if (updateData.description !== undefined) dataToUpdate.description = updateData.description;
      if (updateData.validUntil !== undefined) dataToUpdate.validUntil = new Date(updateData.validUntil);
      if (updateData.status !== undefined) dataToUpdate.status = updateData.status;
      if (updateData.notes !== undefined) dataToUpdate.notes = updateData.notes;
      if (updateData.terms !== undefined) dataToUpdate.terms = updateData.terms;

      // If items are provided, recalculate totals
      if (items) {
        const taxRate = updateData.taxRate ?? parseFloat(existingQuote.taxRate);
        const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;

        dataToUpdate.subtotal = subtotal.toFixed(2);
        dataToUpdate.taxRate = taxRate.toFixed(2);
        dataToUpdate.taxAmount = taxAmount.toFixed(2);
        dataToUpdate.total = total.toFixed(2);

        // Delete existing items and insert new ones
        await ctx.tenantDb.delete(quoteItems).where(eq(quoteItems.quoteId, id));

        await ctx.tenantDb.insert(quoteItems).values(
          items.map((item) => ({
            quoteId: id,
            description: item.description,
            quantity: item.quantity.toFixed(2),
            unitPrice: item.unitPrice.toFixed(2),
            amount: item.amount.toFixed(2),
          }))
        );
      } else if (updateData.taxRate !== undefined) {
        // Just update tax rate
        const subtotal = parseFloat(existingQuote.subtotal);
        const taxAmount = subtotal * (updateData.taxRate / 100);
        const total = subtotal + taxAmount;

        dataToUpdate.taxRate = updateData.taxRate.toFixed(2);
        dataToUpdate.taxAmount = taxAmount.toFixed(2);
        dataToUpdate.total = total.toFixed(2);
      }

      // Update quote
      const [updatedQuote] = await ctx.tenantDb
        .update(quotes)
        .set(dataToUpdate)
        .where(eq(quotes.id, id))
        .returning();

      return updatedQuote;
    }),

  /**
   * Delete a quote
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) throw new Error('Tenant database not available');

      // Check if quote can be deleted
      const [existingQuote] = await ctx.tenantDb
        .select()
        .from(quotes)
        .where(eq(quotes.id, input.id));

      if (!existingQuote) {
        throw new Error('Quote not found');
      }

      if (existingQuote.status === 'converted') {
        throw new Error('Cannot delete a converted quote');
      }

      // Delete items first
      await ctx.tenantDb.delete(quoteItems).where(eq(quoteItems.quoteId, input.id));

      // Delete quote
      await ctx.tenantDb.delete(quotes).where(eq(quotes.id, input.id));

      return { success: true };
    }),

  /**
   * Generate PDF for a quote
   */
  generatePDF: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) throw new Error('Tenant database not available');

      // Get quote with all data
      const [quote] = await ctx.tenantDb
        .select({
          id: quotes.id,
          quoteNumber: quotes.quoteNumber,
          title: quotes.title,
          description: quotes.description,
          issueDate: quotes.issueDate,
          validUntil: quotes.validUntil,
          subtotal: quotes.subtotal,
          taxRate: quotes.taxRate,
          taxAmount: quotes.taxAmount,
          total: quotes.total,
          notes: quotes.notes,
          terms: quotes.terms,
          clientName: clients.name,
          clientEmail: clients.email,
          clientAddress: clients.address,
          clientCity: clients.city,
          clientCountry: clients.country,
        })
        .from(quotes)
        .leftJoin(clients, eq(quotes.clientId, clients.id))
        .where(eq(quotes.id, input.id));

      if (!quote) {
        throw new Error('Quote not found');
      }

      // Get items
      const items = await ctx.tenantDb
        .select()
        .from(quoteItems)
        .where(eq(quoteItems.quoteId, input.id));

      // Generate PDF
      const quoteData: QuoteData = {
        quoteNumber: quote.quoteNumber,
        title: quote.title,
        description: quote.description || undefined,
        issueDate: quote.issueDate,
        validUntil: quote.validUntil,
        client: {
          name: quote.clientName || 'Unknown Client',
          email: quote.clientEmail || undefined,
          address: quote.clientAddress || undefined,
          city: quote.clientCity || undefined,
          country: quote.clientCountry || undefined,
        },
        items: items.map((item) => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          amount: parseFloat(item.amount),
        })),
        subtotal: parseFloat(quote.subtotal),
        taxRate: parseFloat(quote.taxRate),
        taxAmount: parseFloat(quote.taxAmount),
        total: parseFloat(quote.total),
        terms: quote.terms || undefined,
        notes: quote.notes || undefined,
      };

      const pdfBuffer = await generateQuotePDF(quoteData);

      // Return base64 encoded PDF
      return {
        pdf: pdfBuffer.toString('base64'),
        filename: `Quote_${quote.quoteNumber}.pdf`,
      };
    }),

  /**
   * Convert quote to invoice
   */
  convertToInvoice: protectedProcedure
    .input(z.object({
      id: z.number(),
      dueDate: z.string(), // ISO date string
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) throw new Error('Tenant database not available');

      // Get quote
      const [quote] = await ctx.tenantDb
        .select()
        .from(quotes)
        .where(eq(quotes.id, input.id));

      if (!quote) {
        throw new Error('Quote not found');
      }

      if (quote.status === 'converted') {
        throw new Error('Quote already converted to invoice');
      }

      if (quote.status !== 'accepted') {
        throw new Error('Only accepted quotes can be converted to invoices');
      }

      // Get quote items
      const items = await ctx.tenantDb
        .select()
        .from(quoteItems)
        .where(eq(quoteItems.quoteId, input.id));

      // Generate invoice number
      const [lastInvoice] = await ctx.tenantDb
        .select({ invoiceNumber: invoices.invoiceNumber })
        .from(invoices)
        .orderBy(desc(invoices.id))
        .limit(1);

      const lastNumber = lastInvoice?.invoiceNumber
        ? parseInt(lastInvoice.invoiceNumber.replace('INV-', ''))
        : 0;
      const invoiceNumber = `INV-${String(lastNumber + 1).padStart(5, '0')}`;

      // Create invoice
      const [newInvoice] = await ctx.tenantDb
        .insert(invoices)
        .values({
          invoiceNumber,
          clientId: quote.clientId,
          dueDate: new Date(input.dueDate),
          subtotal: quote.subtotal,
          taxRate: quote.taxRate,
          taxAmount: quote.taxAmount,
          total: quote.total,
          notes: quote.notes,
        })
        .returning();

      if (!newInvoice) {
        throw new Error('Failed to create invoice');
      }

      // Create invoice items
      if (items.length > 0) {
        await ctx.tenantDb.insert(invoiceItems).values(
          items.map((item) => ({
            invoiceId: newInvoice.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
          }))
        );
      }

      // Update quote status
      await ctx.tenantDb
        .update(quotes)
        .set({
          status: 'converted',
          convertedInvoiceId: newInvoice.id,
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, input.id));

      return newInvoice;
    }),

  /**
   * Send quote for e-signature via DocuSign
   */
  sendForSignature: protectedProcedure
    .input(z.object({
      id: z.number(),
      returnUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) throw new Error('Tenant database not available');

      if (!isDocuSignConfigured()) {
        throw new Error('DocuSign is not configured');
      }

      // Get quote with client info
      const [quote] = await ctx.tenantDb
        .select({
          id: quotes.id,
          quoteNumber: quotes.quoteNumber,
          title: quotes.title,
          status: quotes.status,
          clientName: clients.name,
          clientEmail: clients.email,
        })
        .from(quotes)
        .leftJoin(clients, eq(quotes.clientId, clients.id))
        .where(eq(quotes.id, input.id));

      if (!quote) {
        throw new Error('Quote not found');
      }

      if (!quote.clientEmail) {
        throw new Error('Client email is required for e-signature');
      }

      if (quote.status !== 'draft' && quote.status !== 'sent') {
        throw new Error('Only draft or sent quotes can be sent for signature');
      }

      // Create DocuSign envelope (placeholder - PDF generation would be called here)
      const envelope = await createEnvelope({
        documentBase64: '', // PDF base64 would be generated
        documentName: `Quote_${quote.quoteNumber}.pdf`,
        documentId: input.id.toString(),
        emailSubject: `Quote ${quote.quoteNumber}: ${quote.title}`,
        emailBody: `Please review and sign the attached quote.`,
        signers: [
          {
            name: quote.clientName || 'Client',
            email: quote.clientEmail,
            clientUserId: input.returnUrl ? `client_${input.id}` : undefined,
          },
        ],
        returnUrl: input.returnUrl,
      });

      if (!envelope) {
        throw new Error('Failed to create DocuSign envelope');
      }

      // Update quote with DocuSign info
      await ctx.tenantDb
        .update(quotes)
        .set({
          status: 'sent',
          docusignEnvelopeId: envelope.envelopeId,
          docusignStatus: 'sent',
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, input.id));

      return {
        envelopeId: envelope.envelopeId,
        signingUrl: envelope.signingUrl,
      };
    }),

  /**
   * Check DocuSign signature status
   */
  checkSignatureStatus: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantDb) throw new Error('Tenant database not available');

      const [quote] = await ctx.tenantDb
        .select({
          docusignEnvelopeId: quotes.docusignEnvelopeId,
          docusignStatus: quotes.docusignStatus,
        })
        .from(quotes)
        .where(eq(quotes.id, input.id));

      if (!quote?.docusignEnvelopeId) {
        return { status: 'not_sent' };
      }

      // Get current status from DocuSign
      const status = await getEnvelopeStatus(quote.docusignEnvelopeId);

      if (status && status.status !== quote.docusignStatus) {
        // Update local status
        const updateData: Record<string, unknown> = {
          docusignStatus: status.status,
          updatedAt: new Date(),
        };

        if (status.status === 'completed') {
          updateData.status = 'accepted';
          updateData.signedAt = status.signedAt;
          updateData.signedByName = status.signedByName;
          updateData.signedByEmail = status.signedByEmail;
        } else if (status.status === 'declined') {
          updateData.status = 'rejected';
        }

        await ctx.tenantDb
          .update(quotes)
          .set(updateData)
          .where(eq(quotes.id, input.id));
      }

      return status || { status: quote.docusignStatus };
    }),

  /**
   * Get quote statistics
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantDb) throw new Error('Tenant database not available');

    // Total quotes by status
    const statusCounts = await ctx.tenantDb
      .select({
        status: quotes.status,
        count: sql<number>`count(*)`,
      })
      .from(quotes)
      .groupBy(quotes.status);

    // Total amounts
    const [totals] = await ctx.tenantDb
      .select({
        totalQuotes: sql<number>`count(*)`,
        totalValue: sql<number>`coalesce(sum(${quotes.total}::numeric), 0)`,
        acceptedValue: sql<number>`coalesce(sum(case when ${quotes.status} = 'accepted' or ${quotes.status} = 'converted' then ${quotes.total}::numeric else 0 end), 0)`,
        pendingValue: sql<number>`coalesce(sum(case when ${quotes.status} = 'draft' or ${quotes.status} = 'sent' then ${quotes.total}::numeric else 0 end), 0)`,
      })
      .from(quotes);

    // Expiring soon (within 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const [expiringSoon] = await ctx.tenantDb
      .select({ count: sql<number>`count(*)` })
      .from(quotes)
      .where(
        and(
          eq(quotes.status, 'sent'),
          lte(quotes.validUntil, sevenDaysFromNow),
          gte(quotes.validUntil, new Date())
        )
      );

    return {
      byStatus: Object.fromEntries(
        statusCounts.map((s) => [s.status, Number(s.count)])
      ),
      totalQuotes: Number(totals?.totalQuotes || 0),
      totalValue: Number(totals?.totalValue || 0),
      acceptedValue: Number(totals?.acceptedValue || 0),
      pendingValue: Number(totals?.pendingValue || 0),
      expiringSoon: Number(expiringSoon?.count || 0),
    };
  }),

  /**
   * Check if DocuSign is configured
   */
  docusignConfig: protectedProcedure.query(() => {
    return {
      configured: isDocuSignConfigured(),
    };
  }),
});
