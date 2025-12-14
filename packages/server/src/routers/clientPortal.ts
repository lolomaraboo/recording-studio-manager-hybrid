import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, desc } from 'drizzle-orm';
import { router, publicProcedure } from '../_core/trpc';
import { clients, sessions, invoices, rooms, projects } from '@rsm/database/tenant';

/**
 * Client-only procedure
 * Ensures the user is authenticated as a client (not staff)
 */
const clientProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== 'client') {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Client authentication required',
    });
  }
  return next({
    ctx: {
      ...ctx,
      clientId: ctx.user.id, // Client ID from token
    },
  });
});

/**
 * Client Portal Router
 *
 * Self-service endpoints for authenticated clients.
 * All data is scoped to the authenticated client.
 *
 * Endpoints:
 * - dashboard: Get dashboard summary (upcoming sessions, recent invoices, etc.)
 * - sessions: Get client's sessions
 * - invoices: Get client's invoices
 * - projects: Get client's projects
 * - profile: Get/update client profile
 */
export const clientPortalRouter = router({
  /**
   * Dashboard summary
   * Returns overview data for the client dashboard
   */
  dashboard: clientProcedure.query(async ({ ctx }) => {
    const tenantDb = await ctx.getTenantDb();

    // Get upcoming sessions
    // TODO: Add date filtering for upcoming sessions

    const upcomingSessions = await tenantDb
      .select({
        id: sessions.id,
        title: sessions.title,
        startTime: sessions.startTime,
        endTime: sessions.endTime,
        status: sessions.status,
        roomId: sessions.roomId,
        roomName: rooms.name,
      })
      .from(sessions)
      .leftJoin(rooms, eq(sessions.roomId, rooms.id))
      .where(eq(sessions.clientId, ctx.clientId))
      .orderBy(sessions.startTime)
      .limit(5);

    // Get recent invoices
    const recentInvoices = await tenantDb
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        total: invoices.total,
        status: invoices.status,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
      })
      .from(invoices)
      .where(eq(invoices.clientId, ctx.clientId))
      .orderBy(desc(invoices.issueDate))
      .limit(5);

    // Get unpaid invoice count and total
    const allInvoices = await tenantDb
      .select({
        status: invoices.status,
        total: invoices.total,
      })
      .from(invoices)
      .where(eq(invoices.clientId, ctx.clientId));

    const unpaidInvoices = allInvoices.filter(
      (inv) => inv.status === 'sent' || inv.status === 'overdue'
    );
    const unpaidTotal = unpaidInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.total || '0'),
      0
    );

    // Get active projects count
    const activeProjects = await tenantDb
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.clientId, ctx.clientId));

    return {
      upcomingSessions,
      recentInvoices,
      stats: {
        upcomingSessionsCount: upcomingSessions.length,
        unpaidInvoicesCount: unpaidInvoices.length,
        unpaidTotal: unpaidTotal.toFixed(2),
        activeProjectsCount: activeProjects.filter(
          (p) => p.id !== undefined
        ).length,
      },
    };
  }),

  /**
   * Get client's sessions
   */
  sessions: clientProcedure
    .input(
      z
        .object({
          status: z
            .enum(['scheduled', 'in_progress', 'completed', 'cancelled'])
            .optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { limit = 20, offset = 0 } = input || {};
      // TODO: Add status filter when Drizzle supports conditional where clauses better
      // const { status } = input || {};

      const query = tenantDb
        .select({
          id: sessions.id,
          title: sessions.title,
          description: sessions.description,
          startTime: sessions.startTime,
          endTime: sessions.endTime,
          status: sessions.status,
          totalAmount: sessions.totalAmount,
          notes: sessions.notes,
          roomId: sessions.roomId,
          roomName: rooms.name,
        })
        .from(sessions)
        .leftJoin(rooms, eq(sessions.roomId, rooms.id))
        .where(eq(sessions.clientId, ctx.clientId))
        .orderBy(desc(sessions.startTime))
        .limit(limit)
        .offset(offset);

      // TODO: Add status filter when Drizzle supports it better

      const sessionsList = await query;
      return sessionsList;
    }),

  /**
   * Get client's invoices
   */
  invoices: clientProcedure
    .input(
      z
        .object({
          status: z
            .enum(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
            .optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { limit = 20, offset = 0 } = input || {};

      const invoicesList = await tenantDb
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          issueDate: invoices.issueDate,
          dueDate: invoices.dueDate,
          status: invoices.status,
          subtotal: invoices.subtotal,
          taxRate: invoices.taxRate,
          taxAmount: invoices.taxAmount,
          total: invoices.total,
          paidAt: invoices.paidAt,
          notes: invoices.notes,
        })
        .from(invoices)
        .where(eq(invoices.clientId, ctx.clientId))
        .orderBy(desc(invoices.issueDate))
        .limit(limit)
        .offset(offset);

      return invoicesList;
    }),

  /**
   * Get a specific invoice details
   */
  invoice: clientProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const [invoice] = await tenantDb
        .select()
        .from(invoices)
        .where(eq(invoices.id, input.id))
        .limit(1);

      if (!invoice) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        });
      }

      // Ensure client can only see their own invoices
      if (invoice.clientId !== ctx.clientId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      return invoice;
    }),

  /**
   * Get client's projects
   */
  projects: clientProcedure
    .input(
      z
        .object({
          status: z
            .enum(['active', 'on_hold', 'completed', 'cancelled'])
            .optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { limit = 20, offset = 0 } = input || {};

      const projectsList = await tenantDb
        .select({
          id: projects.id,
          name: projects.name,
          description: projects.description,
          status: projects.status,
          startDate: projects.startDate,
          targetEndDate: projects.targetEndDate,
          actualEndDate: projects.actualEndDate,
          budget: projects.budget,
        })
        .from(projects)
        .where(eq(projects.clientId, ctx.clientId))
        .orderBy(desc(projects.startDate))
        .limit(limit)
        .offset(offset);

      return projectsList;
    }),

  /**
   * Get client profile
   */
  profile: clientProcedure.query(async ({ ctx }) => {
    const tenantDb = await ctx.getTenantDb();

    const [client] = await tenantDb
      .select({
        id: clients.id,
        name: clients.name,
        artistName: clients.artistName,
        email: clients.email,
        phone: clients.phone,
        type: clients.type,
        address: clients.address,
        city: clients.city,
        country: clients.country,
        isVip: clients.isVip,
        createdAt: clients.createdAt,
      })
      .from(clients)
      .where(eq(clients.id, ctx.clientId))
      .limit(1);

    if (!client) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Profile not found',
      });
    }

    return client;
  }),

  /**
   * Update client profile (limited fields)
   */
  updateProfile: clientProcedure
    .input(
      z.object({
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const [updated] = await tenantDb
        .update(clients)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(clients.id, ctx.clientId))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Profile not found',
        });
      }

      return {
        id: updated.id,
        name: updated.name,
        artistName: updated.artistName,
        email: updated.email,
        phone: updated.phone,
        address: updated.address,
        city: updated.city,
        country: updated.country,
      };
    }),
});
