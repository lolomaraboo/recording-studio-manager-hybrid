import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { router, protectedProcedure } from '../_core/trpc';
import { rooms } from '@rsm/database/tenant';

/**
 * Rooms Router
 *
 * CRUD for studio rooms (stored in Tenant DB)
 *
 * Endpoints:
 * - list: Get all rooms for organization
 * - get: Get room by ID
 * - create: Create new room
 * - update: Update room
 * - delete: Delete room
 */
export const roomsRouter = router({
  /**
   * List rooms for current organization
   */
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
          activeOnly: z.boolean().default(false),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { limit = 50, offset = 0, activeOnly = false } = input || {};

      let query = tenantDb.select().from(rooms);

      if (activeOnly) {
        query = query.where(eq(rooms.isActive, true)) as typeof query;
      }

      const roomsList = await query.limit(limit).offset(offset);

      return roomsList;
    }),

  /**
   * Get room by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const room = await tenantDb.query.rooms.findFirst({
        where: eq(rooms.id, input.id),
      });

      if (!room) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Room not found',
        });
      }

      return room;
    }),

  /**
   * Create new room
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        hourlyRate: z.string(), // decimal as string
        capacity: z.number().optional(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const [room] = await tenantDb
        .insert(rooms)
        .values(input)
        .returning();

      return room;
    }),

  /**
   * Update room
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          hourlyRate: z.string().optional(),
          capacity: z.number().optional(),
          isActive: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const [updated] = await tenantDb
        .update(rooms)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(rooms.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Room not found',
        });
      }

      return updated;
    }),

  /**
   * Delete room
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      await tenantDb.delete(rooms).where(eq(rooms.id, input.id));

      return { success: true };
    }),
});
