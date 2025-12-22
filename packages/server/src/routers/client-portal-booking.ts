import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import {
  clients,
  sessions,
  rooms,
  clientPortalSessions,
  clientPortalActivityLogs,
} from "@rsm/database/tenant/schema";
import { getTenantDb } from "@rsm/database/connection";
import { eq, and, gte, lte, between, sql, desc } from "drizzle-orm";
import { isTokenExpired } from "../utils/client-portal-auth";

/**
 * Extract organizationId from request context
 *
 * Multi-tenant strategy:
 * - Production: Extract from subdomain (e.g., studio1.myapp.com → org_id)
 * - Development: Use default org 1 (localhost has no subdomain)
 *
 * @param hostname - Request hostname (e.g., "studio1.myapp.com" or "localhost")
 */
function getOrganizationIdFromHostname(hostname: string | undefined): number {
  console.log('[Multi-Tenant] Extracting organizationId from hostname:', hostname);

  // Fallback if hostname not available
  if (!hostname) {
    console.warn('[Multi-Tenant] No hostname provided, defaulting to organizationId=1');
    return 1;
  }

  // Development mode: localhost has no subdomain
  if (hostname === 'localhost' || hostname.startsWith('localhost:')) {
    return 1; // Default to org 1 in development
  }

  // Production: Extract subdomain
  // Example: "studio1.myapp.com" → "studio1"
  const subdomain = hostname.split('.')[0];

  // TODO: Query master database to map subdomain → organizationId
  // For now, assume subdomain = slug and hardcode mapping
  // In real implementation: SELECT id FROM organizations WHERE slug = subdomain

  console.warn(`[Multi-Tenant] TODO: Map subdomain "${subdomain}" to organizationId`);
  return 1; // Fallback for now
}

/**
 * Middleware helper to validate client portal session
 * Extracts clientId from session token
 *
 * @param organizationId - Organization ID (from hostname/subdomain)
 * @param sessionToken - Client session token from localStorage
 */
async function validateClientSession(
  organizationId: number,
  sessionToken: string
): Promise<number> {
  const tenantDb = await getTenantDb(organizationId);

  // Find session
  const sessionList = await tenantDb
    .select()
    .from(clientPortalSessions)
    .where(eq(clientPortalSessions.token, sessionToken))
    .limit(1);

  if (sessionList.length === 0) {
    throw new Error("Invalid session");
  }

  const session = sessionList[0];

  // Check expiration
  if (isTokenExpired(session.expiresAt)) {
    // Delete expired session
    await tenantDb
      .delete(clientPortalSessions)
      .where(eq(clientPortalSessions.id, session.id));

    throw new Error("Session expired");
  }

  // Update last activity
  await tenantDb
    .update(clientPortalSessions)
    .set({ lastActivityAt: new Date() })
    .where(eq(clientPortalSessions.id, session.id));

  return session.clientId;
}

/**
 * Client Portal Booking Router
 *
 * Allows clients to:
 * - View room availability
 * - Check room details and pricing
 * - Create session booking requests
 * - View their booking requests
 * - Cancel bookings (within policy)
 *
 * Note: Uses the existing 'sessions' table with status:
 * - "scheduled" = confirmed booking (converted by staff)
 * - "in_progress" = session currently happening
 * - "completed" = finished session
 * - "cancelled" = cancelled booking
 */
export const clientPortalBookingRouter = router({
  /**
   * List available rooms
   * Shows all rooms available for public booking
   */
  listRooms: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        type: z.enum(["recording", "mixing", "mastering", "rehearsal", "live"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Extract organizationId from hostname (multi-tenant)
      const organizationId = getOrganizationIdFromHostname(ctx.req.hostname);

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);

      // Build query
      let query = tenantDb
        .select()
        .from(rooms)
        .where(
          and(eq(rooms.isActive, true), eq(rooms.isAvailableForBooking, true))
        );

      // Apply type filter if provided
      if (input.type) {
        query = tenantDb
          .select()
          .from(rooms)
          .where(
            and(
              eq(rooms.isActive, true),
              eq(rooms.isAvailableForBooking, true),
              eq(rooms.type, input.type)
            )
          );
      }

      const roomsList = await query;

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId,
        action: "view_rooms",
        description: `Viewed available rooms${input.type ? ` (type: ${input.type})` : ""}`,
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return {
        rooms: roomsList,
      };
    }),

  /**
   * Get room details
   */
  getRoom: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        roomId: z.number().int().positive(),
      })
    )
    .query(async ({ ctx, input }) => {
      const organizationId = getOrganizationIdFromHostname(ctx.req.hostname);

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);

      // Get room
      const roomList = await tenantDb
        .select()
        .from(rooms)
        .where(eq(rooms.id, input.roomId))
        .limit(1);

      if (roomList.length === 0) {
        throw new Error("Room not found");
      }

      const room = roomList[0];

      // Check if available for booking
      if (!room.isActive || !room.isAvailableForBooking) {
        throw new Error("Room not available for booking");
      }

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId,
        action: "view_room",
        description: `Viewed room "${room.name}"`,
        resourceType: "room",
        resourceId: input.roomId,
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return room;
    }),

  /**
   * Check room availability for a time slot
   * Returns conflicts if room is already booked
   */
  checkAvailability: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        roomId: z.number().int().positive(),
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
      })
    )
    .query(async ({ ctx, input }) => {
      const organizationId = getOrganizationIdFromHostname(ctx.req.hostname);

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);

      const startTime = new Date(input.startTime);
      const endTime = new Date(input.endTime);

      // Validate time range
      if (endTime <= startTime) {
        throw new Error("End time must be after start time");
      }

      // Check if time is in the past
      if (startTime < new Date()) {
        throw new Error("Cannot book in the past");
      }

      // Verify room exists and is available for booking
      const roomList = await tenantDb
        .select()
        .from(rooms)
        .where(eq(rooms.id, input.roomId))
        .limit(1);

      if (roomList.length === 0) {
        throw new Error("Room not found");
      }

      const room = roomList[0];

      if (!room.isActive || !room.isAvailableForBooking) {
        throw new Error("Room not available for booking");
      }

      // Check for overlapping sessions
      // A session conflicts if it starts before our end time AND ends after our start time
      const conflicts = await tenantDb
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.roomId, input.roomId),
            sql`${sessions.startTime} < ${endTime}`,
            sql`${sessions.endTime} > ${startTime}`,
            sql`${sessions.status} != 'cancelled'`
          )
        );

      // Calculate duration in hours
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      // Estimate cost based on duration
      let estimatedCost = 0;
      const hourlyRate = parseFloat(room.hourlyRate || "0");

      if (durationHours >= 8 && room.fullDayRate) {
        estimatedCost = parseFloat(room.fullDayRate);
      } else if (durationHours >= 4 && room.halfDayRate) {
        estimatedCost = parseFloat(room.halfDayRate);
      } else {
        estimatedCost = hourlyRate * durationHours;
      }

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId,
        action: "check_availability",
        description: `Checked availability for room "${room.name}" from ${startTime.toISOString()} to ${endTime.toISOString()}`,
        resourceType: "room",
        resourceId: input.roomId,
        metadata: JSON.stringify({
          startTime: input.startTime,
          endTime: input.endTime,
          isAvailable: conflicts.length === 0,
        }),
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return {
        isAvailable: conflicts.length === 0,
        conflicts: conflicts.map((s) => ({
          id: s.id,
          title: s.title,
          startTime: s.startTime,
          endTime: s.endTime,
          status: s.status,
        })),
        room: {
          id: room.id,
          name: room.name,
          type: room.type,
          hourlyRate: room.hourlyRate,
          halfDayRate: room.halfDayRate,
          fullDayRate: room.fullDayRate,
        },
        duration: {
          hours: durationHours,
          minutes: Math.round((durationHours % 1) * 60),
        },
        estimatedCost,
      };
    }),

  /**
   * Create a booking request
   * Creates a session in "scheduled" status
   */
  createBooking: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        roomId: z.number().int().positive(),
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log('[createBooking] Request received:', {
        roomId: input.roomId,
        title: input.title,
        startTime: input.startTime,
        endTime: input.endTime,
        hostname: ctx.req.hostname,
      });

      const organizationId = getOrganizationIdFromHostname(ctx.req.hostname);
      console.log('[createBooking] Organization ID:', organizationId);

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      console.log('[createBooking] Client ID:', clientId);

      const tenantDb = await getTenantDb(organizationId);
      console.log('[createBooking] Tenant DB connected');

      const startTime = new Date(input.startTime);
      const endTime = new Date(input.endTime);

      console.log('[createBooking] Dates parsed:', {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        now: new Date().toISOString(),
        isPast: startTime < new Date(),
      });

      // Validate time range
      if (endTime <= startTime) {
        console.error('[createBooking] ERROR: End time before start time');
        throw new Error("End time must be after start time");
      }

      // Check if time is in the past
      if (startTime < new Date()) {
        console.error('[createBooking] ERROR: Booking in the past');
        throw new Error("Cannot book in the past");
      }

      console.log('[createBooking] Time validation passed, checking room...');

      // Verify room exists and is available
      const roomList = await tenantDb
        .select()
        .from(rooms)
        .where(eq(rooms.id, input.roomId))
        .limit(1);

      console.log('[createBooking] Room query result:', roomList.length);

      if (roomList.length === 0) {
        console.error('[createBooking] ERROR: Room not found');
        throw new Error("Room not found");
      }

      const room = roomList[0];

      console.log('[createBooking] Room details:', {
        id: room.id,
        name: room.name,
        isActive: room.isActive,
        isAvailableForBooking: room.isAvailableForBooking,
      });

      if (!room.isActive || !room.isAvailableForBooking) {
        console.error('[createBooking] ERROR: Room not available');
        throw new Error("Room not available for booking");
      }

      console.log('[createBooking] Checking for conflicts...');

      // Double-check availability (prevent race conditions)
      let conflicts;
      try {
        conflicts = await tenantDb
          .select()
          .from(sessions)
          .where(
            and(
              eq(sessions.roomId, input.roomId),
              sql`${sessions.startTime} < ${sql.raw(`'${endTime.toISOString()}'`)}`,
              sql`${sessions.endTime} > ${sql.raw(`'${startTime.toISOString()}'`)}`,
              sql`${sessions.status} != 'cancelled'`
            )
          );

        console.log('[createBooking] Conflicts found:', conflicts.length);
      } catch (error) {
        console.error('[createBooking] ERROR checking conflicts:', error);
        throw error;
      }

      if (conflicts.length > 0) {
        console.error('[createBooking] ERROR: Room has conflicts');
        throw new Error(
          "Room is no longer available for this time slot. Please choose another time."
        );
      }

      console.log('[createBooking] No conflicts, calculating price...');

      // Calculate total amount
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      const hourlyRate = parseFloat(room.hourlyRate || "0");

      let totalAmount = 0;
      if (durationHours >= 8 && room.fullDayRate) {
        totalAmount = parseFloat(room.fullDayRate);
      } else if (durationHours >= 4 && room.halfDayRate) {
        totalAmount = parseFloat(room.halfDayRate);
      } else {
        totalAmount = hourlyRate * durationHours;
      }

      // Calculate deposit (30% of total)
      const depositPercentage = 0.3;
      const depositAmount = totalAmount * depositPercentage;

      // Create session (booking request)
      const newSession = await tenantDb
        .insert(sessions)
        .values({
          clientId,
          roomId: input.roomId,
          title: input.title,
          description: input.description || null,
          startTime,
          endTime,
          status: "scheduled", // Initially scheduled, staff can confirm later
          totalAmount: totalAmount.toFixed(2),
          depositAmount: depositAmount.toFixed(2),
          depositPaid: false,
          paymentStatus: "unpaid",
          notes: input.notes || null,
        })
        .returning();

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId,
        action: "create_booking",
        description: `Created booking "${input.title}" for room "${room.name}"`,
        resourceType: "session",
        resourceId: newSession[0].id,
        metadata: JSON.stringify({
          roomId: input.roomId,
          startTime: input.startTime,
          endTime: input.endTime,
          totalAmount,
        }),
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return {
        booking: newSession[0],
        room,
        message: "Booking created successfully. Awaiting confirmation from studio.",
      };
    }),

  /**
   * List client's bookings
   */
  listMyBookings: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        limit: z.number().int().positive().default(20),
        offset: z.number().int().nonnegative().default(0),
        status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
        upcoming: z.boolean().optional(), // Only future bookings
      })
    )
    .query(async ({ ctx, input }) => {
      const organizationId = getOrganizationIdFromHostname(ctx.req.hostname);

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);

      // Build base conditions
      const conditions = [eq(sessions.clientId, clientId)];

      // Add status filter
      if (input.status) {
        conditions.push(eq(sessions.status, input.status));
      }

      // Add upcoming filter (startTime >= now)
      if (input.upcoming) {
        conditions.push(gte(sessions.startTime, new Date()));
      }

      // Get bookings with room details
      const bookingsList = await tenantDb
        .select({
          session: sessions,
          room: rooms,
        })
        .from(sessions)
        .innerJoin(rooms, eq(sessions.roomId, rooms.id))
        .where(and(...conditions))
        .orderBy(desc(sessions.startTime))
        .limit(input.limit)
        .offset(input.offset);

      // Get total count
      const totalCount = await tenantDb
        .select({ count: sql<number>`count(*)` })
        .from(sessions)
        .where(and(...conditions));

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId,
        action: "view_bookings",
        description: `Viewed bookings list${input.status ? ` (status: ${input.status})` : ""}${input.upcoming ? " (upcoming only)" : ""}`,
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return {
        bookings: bookingsList.map((b) => ({
          ...b.session,
          room: b.room,
        })),
        total: Number(totalCount[0]?.count || 0),
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Get booking details
   */
  getBooking: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        bookingId: z.number().int().positive(),
      })
    )
    .query(async ({ ctx, input }) => {
      const organizationId = getOrganizationIdFromHostname(ctx.req.hostname);

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);

      // Get booking with room details (verify ownership)
      const bookingList = await tenantDb
        .select({
          session: sessions,
          room: rooms,
        })
        .from(sessions)
        .innerJoin(rooms, eq(sessions.roomId, rooms.id))
        .where(
          and(eq(sessions.id, input.bookingId), eq(sessions.clientId, clientId))
        )
        .limit(1);

      if (bookingList.length === 0) {
        throw new Error("Booking not found or access denied");
      }

      const booking = bookingList[0];

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId,
        action: "view_booking",
        description: `Viewed booking "${booking.session.title}"`,
        resourceType: "session",
        resourceId: input.bookingId,
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return {
        ...booking.session,
        room: booking.room,
      };
    }),

  /**
   * Cancel a booking
   * Only allows cancellation if booking is in the future and not already completed
   */
  cancelBooking: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        bookingId: z.number().int().positive(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = getOrganizationIdFromHostname(ctx.req.hostname);

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);

      // Get booking (verify ownership)
      const bookingList = await tenantDb
        .select()
        .from(sessions)
        .where(
          and(eq(sessions.id, input.bookingId), eq(sessions.clientId, clientId))
        )
        .limit(1);

      if (bookingList.length === 0) {
        throw new Error("Booking not found or access denied");
      }

      const booking = bookingList[0];

      // Check if booking can be cancelled
      if (booking.status === "cancelled") {
        throw new Error("Booking is already cancelled");
      }

      if (booking.status === "completed") {
        throw new Error("Cannot cancel a completed booking");
      }

      // Check if booking is in the past
      if (new Date(booking.startTime) < new Date()) {
        throw new Error("Cannot cancel a booking that has already started or passed");
      }

      // Update booking status
      await tenantDb
        .update(sessions)
        .set({
          status: "cancelled",
          notes: input.reason
            ? `${booking.notes || ""}\n\nCancellation reason: ${input.reason}`
            : booking.notes,
          updatedAt: new Date(),
        })
        .where(eq(sessions.id, input.bookingId));

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId,
        action: "cancel_booking",
        description: `Cancelled booking "${booking.title}"${input.reason ? `: ${input.reason}` : ""}`,
        resourceType: "session",
        resourceId: input.bookingId,
        metadata: JSON.stringify({
          reason: input.reason,
          originalStartTime: booking.startTime,
        }),
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return {
        message: "Booking cancelled successfully",
        booking: {
          id: booking.id,
          title: booking.title,
          status: "cancelled",
        },
      };
    }),

  /**
   * Get upcoming availability for a room
   * Returns available time slots for the next N days
   */
  getRoomAvailability: publicProcedure
    .input(
      z.object({
        sessionToken: z.string().length(64),
        roomId: z.number().int().positive(),
        fromDate: z.string().datetime(),
        toDate: z.string().datetime(),
      })
    )
    .query(async ({ ctx, input }) => {
      const organizationId = getOrganizationIdFromHostname(ctx.req.hostname);

      const clientId = await validateClientSession(
        organizationId,
        input.sessionToken
      );
      const tenantDb = await getTenantDb(organizationId);

      const fromDate = new Date(input.fromDate);
      const toDate = new Date(input.toDate);

      // Verify room exists
      const roomList = await tenantDb
        .select()
        .from(rooms)
        .where(eq(rooms.id, input.roomId))
        .limit(1);

      if (roomList.length === 0) {
        throw new Error("Room not found");
      }

      const room = roomList[0];

      // Get all bookings in this date range
      const bookings = await tenantDb
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.roomId, input.roomId),
            gte(sessions.startTime, fromDate),
            lte(sessions.endTime, toDate),
            sql`${sessions.status} != 'cancelled'`
          )
        )
        .orderBy(sessions.startTime);

      // Log activity
      await tenantDb.insert(clientPortalActivityLogs).values({
        clientId,
        action: "view_availability",
        description: `Viewed availability for room "${room.name}" from ${fromDate.toISOString()} to ${toDate.toISOString()}`,
        resourceType: "room",
        resourceId: input.roomId,
        status: "success",
        ipAddress: ctx.req.ip,
        userAgent: ctx.req.headers["user-agent"],
      });

      return {
        room: {
          id: room.id,
          name: room.name,
          type: room.type,
          hourlyRate: room.hourlyRate,
          halfDayRate: room.halfDayRate,
          fullDayRate: room.fullDayRate,
        },
        bookedSlots: bookings.map((b) => ({
          id: b.id,
          title: b.title,
          startTime: b.startTime,
          endTime: b.endTime,
          status: b.status,
        })),
        dateRange: {
          from: fromDate,
          to: toDate,
        },
      };
    }),
});
