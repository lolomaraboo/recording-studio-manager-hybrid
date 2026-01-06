import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import { router, protectedProcedure } from '../_core/trpc';
import { notifications } from '@rsm/database/tenant';
import { notificationBroadcaster } from '../lib/notificationBroadcaster.js';

/**
 * Notifications Router
 *
 * CRUD for user notifications (stored in Tenant DB)
 *
 * Endpoints:
 * - list: Get all notifications for current user
 * - unread: Get count of unread notifications
 * - markAsRead: Mark a notification as read
 * - markAllAsRead: Mark all notifications as read
 * - delete: Delete a notification
 */
export const notificationsRouter = router({
  /**
   * List all notifications for current user/organization
   */
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
          isRead: z.boolean().optional(), // Filter by read status
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const db = await ctx.getTenantDb();
      const { limit = 50, offset = 0, isRead } = input || {};

      // Build where conditions
      const conditions = [];
      if (isRead !== undefined) {
        conditions.push(eq(notifications.isRead, isRead));
      }

      const result = await db
        .select()
        .from(notifications)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      return result;
    }),

  /**
   * Get unread notifications count
   */
  unread: protectedProcedure.query(async ({ ctx }) => {
    const db = await ctx.getTenantDb();

    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.isRead, false))
      .orderBy(desc(notifications.createdAt));

    return result;
  }),

  /**
   * Mark a notification as read
   */
  markAsRead: protectedProcedure
    .input(
      z.object({
        notificationId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await ctx.getTenantDb();

      const [updated] = await db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(notifications.id, input.notificationId))
        .returning();

      return updated;
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await ctx.getTenantDb();

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notifications.isRead, false));

    return { success: true };
  }),

  /**
   * Delete a notification
   */
  delete: protectedProcedure
    .input(
      z.object({
        notificationId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await ctx.getTenantDb();

      await db
        .delete(notifications)
        .where(eq(notifications.id, input.notificationId));

      return { success: true };
    }),

  /**
   * Create a new notification and broadcast it via SSE
   */
  create: protectedProcedure
    .input(
      z.object({
        type: z.string(),
        title: z.string(),
        message: z.string(),
        actionUrl: z.string().optional(),
        userId: z.number().optional(), // If omitted, notification is for current user
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await ctx.getTenantDb();
      const targetUserId = input.userId || ctx.session.userId;

      const [notification] = await db
        .insert(notifications)
        .values({
          type: input.type,
          title: input.title,
          message: input.message,
          actionUrl: input.actionUrl || null,
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Broadcast notification to connected SSE clients
      notificationBroadcaster.sendToUser(
        targetUserId,
        ctx.session.organizationId,
        notification
      );

      return notification;
    }),
});
