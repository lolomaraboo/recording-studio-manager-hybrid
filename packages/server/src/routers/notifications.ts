/**
 * Notifications Router
 *
 * Endpoints for notification management:
 * - Get user notifications
 * - Mark as read
 * - Update preferences
 * - Push subscription management
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  registerPushSubscription,
  unregisterPushSubscription,
  notify,
  type NotificationType,
} from "../_core/notifications";

// ============================================================================
// Input Schemas
// ============================================================================

const getNotificationsInput = z.object({
  unreadOnly: z.boolean().default(false),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

const markAsReadInput = z.object({
  notificationId: z.string(),
});

const deleteNotificationInput = z.object({
  notificationId: z.string(),
});

const updatePreferencesInput = z.object({
  channels: z
    .object({
      in_app: z.boolean(),
      email: z.boolean(),
      push: z.boolean(),
      sms: z.boolean(),
    })
    .partial()
    .optional(),
  types: z.record(z.boolean()).optional(),
  digestMode: z.boolean().optional(),
  digestFrequency: z.enum(["instant", "hourly", "daily", "weekly"]).optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().optional(),
  language: z.string().length(2).optional(),
});

const registerPushInput = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  userAgent: z.string().optional(),
});

const unregisterPushInput = z.object({
  endpoint: z.string().url(),
});

const sendTestNotificationInput = z.object({
  type: z.enum([
    "session_reminder",
    "invoice_paid",
    "booking_confirmed",
    "message_received",
  ]),
});

// ============================================================================
// Router
// ============================================================================

export const notificationsRouter = router({
  /**
   * Get user notifications
   */
  list: protectedProcedure
    .input(getNotificationsInput)
    .query(({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error("Not authenticated");
      }

      const result = getUserNotifications(ctx.user.id, {
        unreadOnly: input.unreadOnly,
        limit: input.limit,
        offset: input.offset,
      });

      return {
        notifications: result.notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          data: n.data,
          read: n.read,
          readAt: n.readAt?.toISOString(),
          createdAt: n.createdAt.toISOString(),
        })),
        total: result.total,
        unread: result.unread,
      };
    }),

  /**
   * Get unread count
   */
  getUnreadCount: protectedProcedure.query(({ ctx }) => {
    if (!ctx.user) {
      throw new Error("Not authenticated");
    }

    const result = getUserNotifications(ctx.user.id, { unreadOnly: true, limit: 0 });

    return { unread: result.unread };
  }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(markAsReadInput)
    .mutation(({ input }) => {
      markAsRead(input.notificationId);
      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(({ ctx }) => {
    if (!ctx.user) {
      throw new Error("Not authenticated");
    }

    const count = markAllAsRead(ctx.user.id);
    return { success: true, count };
  }),

  /**
   * Delete notification
   */
  delete: protectedProcedure
    .input(deleteNotificationInput)
    .mutation(({ input }) => {
      deleteNotification(input.notificationId);
      return { success: true };
    }),

  /**
   * Get notification preferences
   */
  getPreferences: protectedProcedure.query(({ ctx }) => {
    if (!ctx.user) {
      throw new Error("Not authenticated");
    }

    const prefs = getPreferences(ctx.user.id);

    return {
      channels: prefs.channels,
      types: prefs.types,
      digestMode: prefs.digestMode,
      digestFrequency: prefs.digestFrequency,
      quietHoursEnabled: prefs.quietHoursEnabled,
      quietHoursStart: prefs.quietHoursStart,
      quietHoursEnd: prefs.quietHoursEnd,
      timezone: prefs.timezone,
      language: prefs.language,
    };
  }),

  /**
   * Update notification preferences
   */
  updatePreferences: protectedProcedure
    .input(updatePreferencesInput)
    .mutation(({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error("Not authenticated");
      }

      const current = getPreferences(ctx.user.id);

      const updated = updatePreferences(ctx.user.id, {
        channels: input.channels
          ? { ...current.channels, ...input.channels }
          : current.channels,
        types: input.types
          ? { ...current.types, ...(input.types as Record<NotificationType, boolean>) }
          : current.types,
        digestMode: input.digestMode ?? current.digestMode,
        digestFrequency: input.digestFrequency ?? current.digestFrequency,
        quietHoursEnabled: input.quietHoursEnabled ?? current.quietHoursEnabled,
        quietHoursStart: input.quietHoursStart ?? current.quietHoursStart,
        quietHoursEnd: input.quietHoursEnd ?? current.quietHoursEnd,
        timezone: input.timezone ?? current.timezone,
        language: input.language ?? current.language,
      });

      return {
        success: true,
        preferences: {
          channels: updated.channels,
          types: updated.types,
          digestMode: updated.digestMode,
          digestFrequency: updated.digestFrequency,
          quietHoursEnabled: updated.quietHoursEnabled,
          quietHoursStart: updated.quietHoursStart,
          quietHoursEnd: updated.quietHoursEnd,
          timezone: updated.timezone,
          language: updated.language,
        },
      };
    }),

  /**
   * Register push notification subscription
   */
  registerPush: protectedProcedure
    .input(registerPushInput)
    .mutation(({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error("Not authenticated");
      }

      registerPushSubscription(
        ctx.user.id,
        input.endpoint,
        input.keys,
        input.userAgent ?? "unknown"
      );

      return { success: true };
    }),

  /**
   * Unregister push notification subscription
   */
  unregisterPush: protectedProcedure
    .input(unregisterPushInput)
    .mutation(({ input }) => {
      unregisterPushSubscription(input.endpoint);
      return { success: true };
    }),

  /**
   * Send test notification (for debugging)
   */
  sendTest: protectedProcedure
    .input(sendTestNotificationInput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error("Not authenticated");
      }

      const testData: Record<string, Record<string, string>> = {
        session_reminder: {
          sessionTitle: "Test Recording Session",
          timeUntil: "30 minutes",
        },
        invoice_paid: {
          invoiceNumber: "INV-TEST-001",
          amount: "$500.00",
        },
        booking_confirmed: {
          roomName: "Studio A",
          date: "December 20, 2024",
          time: "2:00 PM",
        },
        message_received: {
          senderName: "Test User",
          messagePreview: "This is a test message...",
        },
      };

      const notifications = await notify(
        ctx.user.id,
        input.type as NotificationType,
        testData[input.type] ?? {},
        { channels: ["in_app"] }
      );

      return {
        success: true,
        notificationsSent: notifications.length,
      };
    }),
});

export type NotificationsRouter = typeof notificationsRouter;
