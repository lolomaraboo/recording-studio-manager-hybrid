import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and, inArray, desc } from 'drizzle-orm';
import Stripe from 'stripe';
import { router, protectedProcedure } from '../_core/trpc';
import { invoices, timeEntries, clients } from '@rsm/database/tenant';
import { generateInvoiceFromTimeEntries } from '../utils/invoice-generator';
import { getStripeClient, formatStripeAmount } from '../utils/stripe-client';
import { getInvoicePDFUrl } from '../services/storage/s3-service';
import { sendInvoiceEmail } from '../services/email/resend-service';
import { generateInvoicePDF } from '../services/pdf/invoice-pdf-generator';
import { uploadInvoicePDF } from '../services/storage/s3-service';

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
        with: {
          items: true,
          client: true,
        },
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
          subtotal: z
            .string()
            .optional()
            .transform((val) => (val === "" || val === undefined ? undefined : val)),
          taxRate: z
            .string()
            .optional()
            .transform((val) => (val === "" || val === undefined ? undefined : val)),
          taxAmount: z
            .string()
            .optional()
            .transform((val) => (val === "" || val === undefined ? undefined : val)),
          total: z
            .string()
            .optional()
            .transform((val) => (val === "" || val === undefined ? undefined : val)),
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

  /**
   * Generate invoice from time entries
   */
  generateFromTimeEntries: protectedProcedure
    .input(
      z.object({
        timeEntryIds: z.array(z.number()).min(1),
        clientId: z.number(),
        mode: z.enum(['session', 'project']),
        taxRate: z.number().min(0).max(100).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Validate timeEntries exist and belong to organization
      const entries = await tenantDb.query.timeEntries.findMany({
        where: inArray(timeEntries.id, input.timeEntryIds),
        with: { taskType: true },
      });

      if (entries.length !== input.timeEntryIds.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Some time entries not found' });
      }

      // Validate mode consistency
      if (input.mode === 'session') {
        const sessionIds = new Set(entries.map((e) => e.sessionId).filter(Boolean));
        if (sessionIds.size !== 1) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'All time entries must belong to the same session for mode=session',
          });
        }
      }

      if (input.mode === 'project') {
        const projectIds = new Set(entries.map((e) => e.projectId).filter(Boolean));
        if (projectIds.size !== 1) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'All time entries must belong to the same project for mode=project',
          });
        }
      }

      // Generate invoice
      const result = await generateInvoiceFromTimeEntries(tenantDb, {
        timeEntryIds: input.timeEntryIds,
        clientId: input.clientId,
        mode: input.mode,
        taxRate: input.taxRate,
        notes: input.notes,
      });

      // Link time entries to invoice (update invoiceId FK)
      await tenantDb
        .update(timeEntries)
        .set({ invoiceId: result.invoice.id })
        .where(inArray(timeEntries.id, input.timeEntryIds));

      return result;
    }),

  /**
   * Get uninvoiced time entries
   */
  getUninvoicedTimeEntries: protectedProcedure
    .input(
      z.object({
        sessionId: z.number().optional(),
        projectId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Build where clauses
      const whereConditions = [eq(timeEntries.invoiceId, null)];

      if (input.sessionId !== undefined) {
        whereConditions.push(eq(timeEntries.sessionId, input.sessionId));
      }

      if (input.projectId !== undefined) {
        whereConditions.push(eq(timeEntries.projectId, input.projectId));
      }

      // Query time entries where invoiceId IS NULL
      const entries = await tenantDb.query.timeEntries.findMany({
        where: and(...whereConditions),
        with: {
          taskType: true,
          session: { with: { client: true } },
          project: { with: { client: true } },
        },
        orderBy: [desc(timeEntries.startTime)],
      });

      return entries;
    }),

  /**
   * Create Stripe Payment Intent for invoice deposit
   */
  createDepositPaymentIntent: protectedProcedure
    .input(
      z.object({
        invoiceId: z.number(),
        depositAmount: z.number().positive(), // Amount in euros
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Get invoice with client details
      const invoice = await tenantDb.query.invoices.findFirst({
        where: eq(invoices.id, input.invoiceId),
        with: { client: true },
      });

      if (!invoice) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found' });
      }

      // Validate deposit amount
      if (input.depositAmount > parseFloat(invoice.total)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Deposit amount cannot exceed invoice total',
        });
      }

      // Create Stripe Payment Intent
      const stripe = getStripeClient();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: formatStripeAmount(input.depositAmount), // Convert euros to cents
        currency: 'eur',
        metadata: {
          type: 'invoice_deposit',
          invoiceId: invoice.id.toString(),
          organizationId: ctx.organizationId.toString(),
          clientId: invoice.clientId.toString(),
        },
        description: `Acompte facture ${invoice.invoiceNumber} - ${invoice.client.name}`,
      });

      // Update invoice with deposit information
      const remainingBalance = parseFloat(invoice.total) - input.depositAmount;

      await tenantDb
        .update(invoices)
        .set({
          depositAmount: input.depositAmount.toFixed(2),
          stripeDepositPaymentIntentId: paymentIntent.id,
          remainingBalance: remainingBalance.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, input.invoiceId));

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    }),

  /**
   * Create Stripe Checkout Session for invoice payment
   */
  createPaymentSession: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Get invoice
      const invoice = await tenantDb.query.invoices.findFirst({
        where: eq(invoices.id, input.invoiceId),
      });

      if (!invoice) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found' });
      }

      // Validate invoice status - cannot pay already paid invoices
      if (invoice.status === 'paid') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invoice is already paid',
        });
      }

      const stripe = getStripeClient();
      const appUrl = process.env.APP_URL || 'http://localhost:5174';

      // Determine payment amount: deposit or full
      const isDeposit = invoice.depositAmount && parseFloat(invoice.depositAmount) > 0;
      const paymentAmount = isDeposit
        ? parseFloat(invoice.depositAmount)
        : parseFloat(invoice.total);

      // Create single line item for invoice (line items detail will be in Stripe invoice PDF)
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Facture ${invoice.invoiceNumber}`,
              description: invoice.notes || undefined,
            },
            unit_amount: formatStripeAmount(paymentAmount),
          },
          quantity: 1,
        },
      ];

      // Create Checkout Session
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems,
        metadata: {
          invoiceId: invoice.id.toString(),
          organizationId: ctx.organizationId.toString(),
          isDeposit: isDeposit ? 'true' : 'false',
        },
        invoice_creation: { enabled: true },
        success_url: `${appUrl}/invoices/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/invoices?canceled=true`,
      });

      return {
        sessionId: session.id,
        checkoutUrl: session.url,
      };
    }),

  /**
   * Download invoice PDF
   * Generates a temporary signed URL for accessing the invoice PDF from S3
   */
  downloadPDF: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Get invoice and verify it has a PDF
      const invoice = await tenantDb.query.invoices.findFirst({
        where: eq(invoices.id, input.invoiceId),
      });

      if (!invoice) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        });
      }

      if (!invoice.pdfS3Key) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invoice PDF not yet generated',
        });
      }

      // Generate signed URL (valid for 1 hour)
      const downloadUrl = await getInvoicePDFUrl(invoice.pdfS3Key);

      return { downloadUrl };
    }),

  /**
   * Send invoice email manually
   * Generates PDF, uploads to S3, and sends email with attachment
   */
  sendInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Load invoice with client and line items
      const invoice = await tenantDb.query.invoices.findFirst({
        where: eq(invoices.id, input.invoiceId),
        with: {
          client: true,
          items: true,
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        });
      }

      if (!invoice.client.email) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Client does not have an email address',
        });
      }

      // Generate PDF
      const pdfBuffer = await generateInvoicePDF(invoice);

      // Upload to S3
      const pdfS3Key = await uploadInvoicePDF({
        invoiceId: invoice.id,
        organizationId: ctx.organizationId,
        pdfBuffer,
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
      });

      // Update invoice status and S3 key
      await tenantDb
        .update(invoices)
        .set({
          status: 'sent' as any,
          pdfS3Key,
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, input.invoiceId));

      // Send email with PDF
      await sendInvoiceEmail({
        to: invoice.client.email,
        subject: `Invoice #${invoice.invoiceNumber} from ${process.env.STUDIO_NAME || 'Your Studio'}`,
        invoiceData: invoice,
        pdfBuffer,
      });

      return { success: true };
    }),
});
