/**
 * Calendar Router
 *
 * Provides calendar integration endpoints.
 *
 * Endpoints:
 * - OAuth flow for Google/Outlook
 * - Connection management
 * - Sync operations
 * - iCal feed generation
 * - Availability checking
 */

import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import {
  getGoogleAuthUrl,
  getOutlookAuthUrl,
  exchangeGoogleCode,
  exchangeOutlookCode,
  createConnection,
  getConnections,
  getConnection,
  updateConnection,
  deleteConnection,
  syncCalendar,
  getICalFeedUrl,
  generateICalContent,
  checkAvailability,
  findAvailableSlots,
  sessionToEvent,
  type CalendarProvider,
  type CalendarSyncSettings,
  type CalendarEvent,
} from "../_core/calendar";

// ============================================================================
// Input Schemas
// ============================================================================

const providerSchema = z.enum(["google", "outlook", "apple", "ical"]);

const connectInput = z.object({
  provider: providerSchema,
  code: z.string().min(1),
  calendarId: z.string().default("primary"),
  calendarName: z.string().default("Studio Calendar"),
});

const updateConnectionInput = z.object({
  connectionId: z.string(),
  syncEnabled: z.boolean().optional(),
  syncDirection: z.enum(["import", "export", "both"]).optional(),
  settings: z
    .object({
      syncSessions: z.boolean().optional(),
      syncBookings: z.boolean().optional(),
      includeClientNames: z.boolean().optional(),
      includeRoomNames: z.boolean().optional(),
      eventPrefix: z.string().optional(),
      defaultReminders: z
        .array(
          z.object({
            method: z.enum(["email", "popup", "sms"]),
            minutes: z.number().min(0).max(10080), // Max 1 week
          })
        )
        .optional(),
    })
    .optional(),
});

const availabilityInput = z.object({
  roomId: z.number(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  excludeEventId: z.string().optional(),
});

const findSlotsInput = z.object({
  roomId: z.number(),
  date: z.coerce.date(),
  durationMinutes: z.number().min(15).max(480).default(60),
  workingHoursStart: z.number().min(0).max(23).default(9),
  workingHoursEnd: z.number().min(1).max(24).default(21),
});

const icalFeedInput = z.object({
  organizationId: z.number(),
  token: z.string().min(1),
});

// ============================================================================
// Helper
// ============================================================================

function getOrgId(ctx: { organizationId: number | null }): number {
  if (!ctx.organizationId) {
    throw new Error("Organization context required");
  }
  return ctx.organizationId;
}

// ============================================================================
// Router
// ============================================================================

export const calendarRouter = router({
  /**
   * Get OAuth URL for calendar provider
   */
  getAuthUrl: protectedProcedure
    .input(z.object({ provider: providerSchema }))
    .query(({ ctx, input }) => {
      const state = Buffer.from(
        JSON.stringify({
          userId: ctx.user?.id,
          organizationId: ctx.organizationId,
          timestamp: Date.now(),
        })
      ).toString("base64");

      switch (input.provider) {
        case "google":
          return { url: getGoogleAuthUrl(state), provider: input.provider };
        case "outlook":
          return { url: getOutlookAuthUrl(state), provider: input.provider };
        default:
          throw new Error(`OAuth not supported for provider: ${input.provider}`);
      }
    }),

  /**
   * Complete OAuth flow and create connection
   */
  connect: protectedProcedure.input(connectInput).mutation(async ({ ctx, input }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const organizationId = getOrgId(ctx);

    // Exchange code for tokens
    let tokens: { accessToken: string; refreshToken?: string; expiresIn?: number };

    switch (input.provider) {
      case "google":
        tokens = await exchangeGoogleCode(input.code);
        break;
      case "outlook":
        tokens = await exchangeOutlookCode(input.code);
        break;
      default:
        throw new Error(`OAuth not supported for provider: ${input.provider}`);
    }

    // Create connection
    const connection = await createConnection(
      userId,
      organizationId,
      input.provider as CalendarProvider,
      tokens,
      input.calendarId,
      input.calendarName
    );

    return {
      connectionId: connection.id,
      provider: connection.provider,
      calendarName: connection.calendarName,
      syncEnabled: connection.syncEnabled,
    };
  }),

  /**
   * Get user's calendar connections
   */
  listConnections: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const userConnections = await getConnections(userId);

    return userConnections.map((c) => ({
      id: c.id,
      provider: c.provider,
      calendarName: c.calendarName,
      syncEnabled: c.syncEnabled,
      syncDirection: c.syncDirection,
      lastSyncAt: c.lastSyncAt,
      syncStatus: c.syncStatus,
      errorMessage: c.errorMessage,
      settings: c.settings,
    }));
  }),

  /**
   * Get connection details
   */
  getConnection: protectedProcedure
    .input(z.object({ connectionId: z.string() }))
    .query(async ({ input }) => {
      const connection = await getConnection(input.connectionId);
      if (!connection) {
        throw new Error("Connection not found");
      }

      return {
        id: connection.id,
        provider: connection.provider,
        calendarId: connection.calendarId,
        calendarName: connection.calendarName,
        syncEnabled: connection.syncEnabled,
        syncDirection: connection.syncDirection,
        lastSyncAt: connection.lastSyncAt,
        syncStatus: connection.syncStatus,
        errorMessage: connection.errorMessage,
        settings: connection.settings,
        createdAt: connection.createdAt,
      };
    }),

  /**
   * Update connection settings
   */
  updateConnection: protectedProcedure
    .input(updateConnectionInput)
    .mutation(async ({ input }) => {
      const updates: Parameters<typeof updateConnection>[1] = {};

      if (input.syncEnabled !== undefined) {
        updates.syncEnabled = input.syncEnabled;
      }
      if (input.syncDirection) {
        updates.syncDirection = input.syncDirection;
      }
      if (input.settings) {
        const connection = await getConnection(input.connectionId);
        if (connection) {
          updates.settings = {
            ...connection.settings,
            ...input.settings,
          } as CalendarSyncSettings;
        }
      }

      const updated = await updateConnection(input.connectionId, updates);
      if (!updated) {
        throw new Error("Connection not found");
      }

      return {
        id: updated.id,
        syncEnabled: updated.syncEnabled,
        syncDirection: updated.syncDirection,
        settings: updated.settings,
      };
    }),

  /**
   * Delete a calendar connection
   */
  disconnect: protectedProcedure
    .input(z.object({ connectionId: z.string() }))
    .mutation(async ({ input }) => {
      const deleted = await deleteConnection(input.connectionId);
      if (!deleted) {
        throw new Error("Connection not found");
      }
      return { success: true };
    }),

  /**
   * Trigger manual sync
   */
  sync: protectedProcedure
    .input(z.object({ connectionId: z.string() }))
    .mutation(async ({ input }) => {
      const result = await syncCalendar(input.connectionId);
      return result;
    }),

  /**
   * Sync all connections for current user
   */
  syncAll: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const userConnections = await getConnections(userId);
    const results = await Promise.all(
      userConnections
        .filter((c) => c.syncEnabled && c.syncStatus !== "paused")
        .map((c) => syncCalendar(c.id))
    );

    return {
      synced: results.length,
      totalCreated: results.reduce((sum, r) => sum + r.eventsCreated, 0),
      totalUpdated: results.reduce((sum, r) => sum + r.eventsUpdated, 0),
      errors: results.flatMap((r) => r.errors),
    };
  }),

  /**
   * Get iCal feed URL
   */
  getICalFeed: protectedProcedure.query(({ ctx }) => {
    const organizationId = getOrgId(ctx);

    // Generate a secure token (in production, store and validate this)
    const token = Buffer.from(`${organizationId}:${Date.now()}`).toString("base64url");

    return {
      feedUrl: getICalFeedUrl(organizationId, token),
      token,
      instructions: "Add this URL to your calendar app to subscribe to updates",
    };
  }),

  /**
   * Public iCal feed endpoint (accessed by calendar apps)
   */
  icalFeed: publicProcedure.input(icalFeedInput).query(({ input }) => {
    // In production, validate token and fetch real events
    const mockEvents: CalendarEvent[] = [
      {
        id: "session_1",
        title: "Recording Session - Acme Records",
        description: "Room: Studio A\nEngineer: John",
        location: "Studio A",
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        allDay: false,
        timezone: "America/New_York",
        status: "confirmed",
        visibility: "private",
        organizationId: input.organizationId,
      },
      {
        id: "session_2",
        title: "Mixing Session - Indie Band",
        description: "Room: Mix Room",
        location: "Mix Room",
        startTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 48 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        allDay: false,
        timezone: "America/New_York",
        status: "confirmed",
        visibility: "private",
        organizationId: input.organizationId,
      },
    ];

    const icalContent = generateICalContent(mockEvents, "Studio Sessions");

    return {
      content: icalContent,
      contentType: "text/calendar",
      filename: "studio-calendar.ics",
    };
  }),

  /**
   * Check availability for a time slot
   */
  checkAvailability: protectedProcedure.input(availabilityInput).query(({ ctx, input }) => {
    const organizationId = getOrgId(ctx);

    const result = checkAvailability(
      organizationId,
      input.roomId,
      input.startTime,
      input.endTime,
      input.excludeEventId
    );

    return {
      available: result.available,
      conflictCount: result.conflicts.length,
      conflicts: result.conflicts.map((c) => ({
        id: c.id,
        title: c.title,
        startTime: c.startTime,
        endTime: c.endTime,
      })),
    };
  }),

  /**
   * Find available time slots
   */
  findSlots: protectedProcedure.input(findSlotsInput).query(({ ctx, input }) => {
    const organizationId = getOrgId(ctx);

    const slots = findAvailableSlots(
      organizationId,
      input.roomId,
      input.date,
      input.durationMinutes,
      { start: input.workingHoursStart, end: input.workingHoursEnd }
    );

    return {
      date: input.date,
      roomId: input.roomId,
      durationMinutes: input.durationMinutes,
      availableSlots: slots,
      slotsCount: slots.length,
    };
  }),

  /**
   * Preview session as calendar event
   */
  previewSessionEvent: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        title: z.string(),
        date: z.coerce.date(),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        roomId: z.number(),
        roomName: z.string(),
        clientId: z.number(),
        clientName: z.string(),
        notes: z.string().optional(),
      })
    )
    .query(({ ctx, input }) => {
      const organizationId = getOrgId(ctx);

      const event = sessionToEvent(
        {
          id: input.sessionId,
          title: input.title,
          date: input.date,
          startTime: input.startTime,
          endTime: input.endTime,
          roomId: input.roomId,
          roomName: input.roomName,
          clientId: input.clientId,
          clientName: input.clientName,
          notes: input.notes,
          organizationId,
        },
        {
          syncSessions: true,
          syncBookings: true,
          includeClientNames: true,
          includeRoomNames: true,
          defaultReminders: [{ method: "popup", minutes: 30 }],
          eventPrefix: "[Studio] ",
        }
      );

      return event;
    }),
});

export type CalendarRouter = typeof calendarRouter;
