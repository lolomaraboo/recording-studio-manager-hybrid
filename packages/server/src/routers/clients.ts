import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, desc, sql } from 'drizzle-orm';
import { router, protectedProcedure } from '../_core/trpc';
import { clients } from '@rsm/database/tenant';

/**
 * Clients Router
 *
 * CRUD for clients (stored in Tenant DB)
 *
 * Endpoints:
 * - list: Get all clients for organization
 * - get: Get client by ID
 * - create: Create new client
 * - update: Update client
 * - delete: Delete client
 */
export const clientsRouter = router({
  /**
   * List clients for current organization
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

      // Get clients with notes metadata
      const clientsList = await tenantDb
        .select({
          id: clients.id,
          userId: clients.userId,
          name: clients.name,
          artistName: clients.artistName,
          email: clients.email,
          phone: clients.phone,
          type: clients.type,
          address: clients.address,
          city: clients.city,
          country: clients.country,
          notes: clients.notes,
          isVip: clients.isVip,
          isActive: clients.isActive,
          portalAccess: clients.portalAccess,
          createdAt: clients.createdAt,
          updatedAt: clients.updatedAt,
          notesCount: sql<number>`CAST(COUNT(${clientNotes.id}) AS INTEGER)`,
          lastNoteDate: sql<Date | null>`MAX(${clientNotes.createdAt})`,
        })
        .from(clients)
        .leftJoin(clientNotes, eq(clients.id, clientNotes.clientId))
        .groupBy(clients.id)
        .limit(limit)
        .offset(offset);

      return clientsList;
    }),

  /**
   * Get client by ID with recent notes
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const client = await tenantDb.query.clients.findFirst({
        where: eq(clients.id, input.id),
      });

      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        });
      }

      // Get the 10 most recent notes for this client
      const recentNotes = await tenantDb
        .select()
        .from(clientNotes)
        .where(eq(clientNotes.clientId, input.id))
        .orderBy(desc(clientNotes.createdAt))
        .limit(10);

      return {
        ...client,
        clientNotes: recentNotes,
      };
    }),

  /**
   * Create new client
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(200),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const [client] = await tenantDb
        .insert(clients)
        .values(input as any)
        .returning();

      return client;
    }),

  /**
   * Update client
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().min(2).max(200).optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          company: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const [updated] = await tenantDb
        .update(clients)
        .set(input.data)
        .where(eq(clients.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        });
      }

      return updated;
    }),

  /**
   * Delete client
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      await tenantDb.delete(clients).where(eq(clients.id, input.id));

      return { success: true };
    }),
});
