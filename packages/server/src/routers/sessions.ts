import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { router, protectedProcedure } from '../_core/trpc';
import { sessions } from '@rsm/database/tenant';

/**
 * Sessions Router
 *
 * CRUD for recording sessions (stored in Tenant DB)
 *
 * Endpoints:
 * - list: Get all sessions for organization
 * - get: Get session by ID
 * - create: Create new session
 * - update: Update session
 * - delete: Delete session
 */
export const sessionsRouter = router({
  /**
   * List sessions for current organization
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

      const sessionsList = await tenantDb
        .select()
        .from(sessions)
        .limit(limit)
        .offset(offset);

      return sessionsList;
    }),

  /**
   * Get session by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const session = await tenantDb.query.sessions.findFirst({
        where: eq(sessions.id, input.id),
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      return session;
    }),

  /**
   * Create new session
   */
  create: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        roomId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        startTime: z.string(), // ISO date string
        endTime: z.string(), // ISO date string
        status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
        totalAmount: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const [session] = await tenantDb
        .insert(sessions)
        .values({
          clientId: input.clientId,
          roomId: input.roomId,
          title: input.title,
          description: input.description,
          startTime: new Date(input.startTime),
          endTime: new Date(input.endTime),
          status: input.status,
          totalAmount: input.totalAmount,
          notes: input.notes,
        })
        .returning();

      return session;
    }),

  /**
   * Update session
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          clientId: z.number().optional(),
          roomId: z.number().optional(),
          title: z.string().optional(),
          description: z.string().optional(),
          startTime: z.string().optional(),
          endTime: z.string().optional(),
          status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
          totalAmount: z.string().optional(),
          notes: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Convert dates if provided
      const updateData: any = { ...input.data };
      if (input.data.startTime) {
        updateData.startTime = new Date(input.data.startTime);
      }
      if (input.data.endTime) {
        updateData.endTime = new Date(input.data.endTime);
      }

      const [updated] = await tenantDb
        .update(sessions)
        .set(updateData)
        .where(eq(sessions.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      return updated;
    }),

  /**
   * Delete session
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      await tenantDb.delete(sessions).where(eq(sessions.id, input.id));

      return { success: true };
    }),
});
