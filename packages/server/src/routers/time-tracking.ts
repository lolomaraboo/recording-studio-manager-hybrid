import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { router, protectedProcedure } from '../_core/trpc';
import { taskTypes } from '@rsm/database';
import {
  startTimer,
  stopTimer,
  getActiveTimer,
  adjustTimeEntry,
  getTimeHistory,
} from '../services/timer-service';

/**
 * Time Tracking Router
 *
 * Provides tRPC API endpoints for time tracking operations:
 * - Task type management (list, create, update)
 * - Timer operations (start, stop, getActive)
 * - Time entry management (list, adjust)
 *
 * All procedures use protectedProcedure and ctx.getTenantDb() for multi-tenancy.
 */
export const timeTrackingRouter = router({
  /**
   * ========== TASK TYPES ==========
   */

  /**
   * List all task types
   */
  taskTypes: router({
    list: protectedProcedure
      .input(
        z
          .object({
            includeInactive: z.boolean().optional().default(false),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        const tenantDb = await ctx.getTenantDb();
        const { includeInactive = false } = input || {};

        const whereCondition = includeInactive ? undefined : eq(taskTypes.isActive, true);

        const taskTypesList = await tenantDb.query.taskTypes.findMany({
          where: whereCondition,
          orderBy: (taskTypes, { asc }) => [asc(taskTypes.sortOrder), asc(taskTypes.name)],
        });

        return taskTypesList;
      }),

    /**
     * Create new task type
     */
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(100),
          description: z.string().optional(),
          hourlyRate: z.string(), // Decimal as string
          category: z.enum(['billable', 'non-billable']).default('billable'),
          color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
          sortOrder: z.number().int().default(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const tenantDb = await ctx.getTenantDb();

        const [created] = await tenantDb
          .insert(taskTypes)
          .values({
            name: input.name,
            description: input.description,
            hourlyRate: input.hourlyRate,
            category: input.category,
            color: input.color,
            sortOrder: input.sortOrder,
            isActive: true,
          })
          .returning();

        return created;
      }),

    /**
     * Update task type
     */
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            name: z.string().min(1).max(100).optional(),
            description: z.string().optional(),
            hourlyRate: z.string().optional(), // Decimal as string
            category: z.enum(['billable', 'non-billable']).optional(),
            color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
            sortOrder: z.number().int().optional(),
            isActive: z.boolean().optional(),
          }),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const tenantDb = await ctx.getTenantDb();

        const [updated] = await tenantDb
          .update(taskTypes)
          .set({
            ...input.data,
            updatedAt: new Date(),
          })
          .where(eq(taskTypes.id, input.id))
          .returning();

        if (!updated) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task type not found',
          });
        }

        return updated;
      }),
  }),

  /**
   * ========== TIMER OPERATIONS ==========
   */

  timer: router({
    /**
     * Start timer
     */
    start: protectedProcedure
      .input(
        z.object({
          taskTypeId: z.number(),
          sessionId: z.number().optional(),
          projectId: z.number().optional(),
          trackId: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const tenantDb = await ctx.getTenantDb();

        // XOR validation: exactly one of sessionId, projectId, or trackId required
        const count = [input.sessionId, input.projectId, input.trackId].filter(Boolean).length;
        if (count !== 1) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Exactly one of sessionId, projectId, or trackId must be provided',
          });
        }

        const result = await startTimer(tenantDb, {
          taskTypeId: input.taskTypeId,
          sessionId: input.sessionId,
          projectId: input.projectId,
          trackId: input.trackId,
          notes: input.notes,
        });

        // Broadcast timer:started event to organization
        const io = ctx.req.app.get('io');
        if (io && ctx.organizationId) {
          io.to(`org:${ctx.organizationId}`).emit('timer:started', {
            timeEntryId: result.id,
            taskType: result.taskType,
            sessionId: result.sessionId,
            projectId: result.projectId,
            trackId: result.trackId,
            startTime: result.startTime,
            userId: ctx.user?.id,
          });
        }

        return result;
      }),

    /**
     * Stop timer
     */
    stop: protectedProcedure
      .input(z.object({ timeEntryId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const tenantDb = await ctx.getTenantDb();
        const result = await stopTimer(tenantDb, input.timeEntryId);

        // Calculate cost for broadcast
        const cost = result.durationMinutes && result.hourlyRateSnapshot
          ? (result.durationMinutes * parseFloat(result.hourlyRateSnapshot)) / 60
          : 0;

        // Broadcast timer:stopped event to organization
        const io = ctx.req.app.get('io');
        if (io && ctx.organizationId) {
          io.to(`org:${ctx.organizationId}`).emit('timer:stopped', {
            timeEntryId: result.id,
            endTime: result.endTime,
            durationMinutes: result.durationMinutes,
            cost: cost.toFixed(2),
            userId: ctx.user?.id,
          });
        }

        return result;
      }),

    /**
     * Get active timer for session or project
     */
    getActive: protectedProcedure
      .input(
        z.object({
          sessionId: z.number().optional(),
          projectId: z.number().optional(),
          trackId: z.number().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const tenantDb = await ctx.getTenantDb();

        // XOR validation: exactly one of sessionId, projectId, or trackId required
        const count = [input.sessionId, input.projectId, input.trackId].filter(Boolean).length;
        if (count !== 1) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Exactly one of sessionId, projectId, or trackId must be provided',
          });
        }

        const result = await getActiveTimer(tenantDb, input.sessionId, input.projectId, input.trackId);
        return result;
      }),
  }),

  /**
   * ========== TIME ENTRIES ==========
   */

  timeEntries: router({
    /**
     * Get time history with filters
     */
    list: protectedProcedure
      .input(
        z.object({
          sessionId: z.number().optional(),
          projectId: z.number().optional(),
          trackId: z.number().optional(),
          dateRange: z
            .object({
              start: z.string(), // ISO date string
              end: z.string(), // ISO date string
            })
            .optional(),
          taskTypeIds: z.array(z.number()).optional(),
          includeManuallyAdjusted: z.boolean().optional().default(true),
        })
      )
      .query(async ({ ctx, input }) => {
        const tenantDb = await ctx.getTenantDb();

        // XOR validation: exactly one of sessionId, projectId, or trackId required
        const count = [input.sessionId, input.projectId, input.trackId].filter(Boolean).length;
        if (count !== 1) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Exactly one of sessionId, projectId, or trackId must be provided',
          });
        }

        // Parse date range if provided
        const filters = {
          dateRange: input.dateRange
            ? {
                start: new Date(input.dateRange.start),
                end: new Date(input.dateRange.end),
              }
            : undefined,
          taskTypeIds: input.taskTypeIds,
          includeManuallyAdjusted: input.includeManuallyAdjusted,
        };

        const result = await getTimeHistory(
          tenantDb,
          input.sessionId,
          input.projectId,
          input.trackId,
          filters
        );

        return result;
      }),

    /**
     * Manual time adjustment
     */
    adjust: protectedProcedure
      .input(
        z.object({
          timeEntryId: z.number(),
          startTime: z.string().optional(), // ISO date string
          endTime: z.string().optional(), // ISO date string
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const tenantDb = await ctx.getTenantDb();

        const result = await adjustTimeEntry(tenantDb, input.timeEntryId, {
          startTime: input.startTime ? new Date(input.startTime) : undefined,
          endTime: input.endTime ? new Date(input.endTime) : undefined,
          notes: input.notes,
        });

        // Broadcast timer:adjusted event to organization
        const io = ctx.req.app.get('io');
        if (io && ctx.organizationId) {
          io.to(`org:${ctx.organizationId}`).emit('timer:adjusted', {
            timeEntryId: result.id,
            startTime: result.startTime,
            endTime: result.endTime,
            durationMinutes: result.durationMinutes,
            userId: ctx.user?.id,
          });
        }

        return result;
      }),
  }),
});
