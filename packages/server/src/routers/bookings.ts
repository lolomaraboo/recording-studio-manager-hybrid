import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and, gte, lte, or, not } from 'drizzle-orm';
import { router, publicProcedure } from '../_core/trpc';
import { sessions, rooms } from '@rsm/database/tenant';

/**
 * Bookings Router
 *
 * Self-service booking for clients (Client Portal).
 * Allows clients to view availability and book recording sessions.
 *
 * Endpoints:
 * - availability: Get available time slots for a room
 * - rooms: Get all bookable rooms
 * - create: Book a new session
 * - myBookings: Get client's upcoming and past bookings
 * - cancel: Cancel a booking (if allowed by policy)
 * - reschedule: Reschedule a booking
 */

/**
 * Client procedure middleware
 * Ensures user is authenticated as a client (not staff)
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
      clientId: ctx.user.id,
    },
  });
});

/**
 * Check if two time ranges overlap
 */
function timeRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Generate available time slots for a given day
 * Studio hours: 9:00 - 22:00 by default
 */
function generateTimeSlots(
  date: Date,
  existingBookings: { startTime: Date; endTime: Date }[],
  slotDurationMinutes: number = 60,
  studioOpenHour: number = 9,
  studioCloseHour: number = 22
): { start: Date; end: Date; available: boolean }[] {
  const slots: { start: Date; end: Date; available: boolean }[] = [];

  const dayStart = new Date(date);
  dayStart.setHours(studioOpenHour, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(studioCloseHour, 0, 0, 0);

  let currentSlotStart = new Date(dayStart);

  while (currentSlotStart < dayEnd) {
    const currentSlotEnd = new Date(
      currentSlotStart.getTime() + slotDurationMinutes * 60 * 1000
    );

    if (currentSlotEnd > dayEnd) break;

    // Check if slot overlaps with any existing booking
    const isBooked = existingBookings.some((booking) =>
      timeRangesOverlap(
        currentSlotStart,
        currentSlotEnd,
        booking.startTime,
        booking.endTime
      )
    );

    // Don't show slots in the past
    const isPast = currentSlotStart < new Date();

    slots.push({
      start: new Date(currentSlotStart),
      end: new Date(currentSlotEnd),
      available: !isBooked && !isPast,
    });

    currentSlotStart = new Date(currentSlotEnd);
  }

  return slots;
}

export const bookingsRouter = router({
  /**
   * Get all bookable rooms
   */
  rooms: clientProcedure.query(async ({ ctx }) => {
    const tenantDb = await ctx.getTenantDb();

    const roomsList = await tenantDb
      .select({
        id: rooms.id,
        name: rooms.name,
        description: rooms.description,
        hourlyRate: rooms.hourlyRate,
        capacity: rooms.capacity,
      })
      .from(rooms)
      .where(eq(rooms.isActive, true));

    return roomsList;
  }),

  /**
   * Get availability for a room on specific dates
   */
  availability: clientProcedure
    .input(
      z.object({
        roomId: z.number(),
        startDate: z.string(), // ISO date string (start of range)
        endDate: z.string(), // ISO date string (end of range)
        slotDurationMinutes: z.number().min(30).max(480).default(60),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      // Validate date range (max 30 days)
      const daysDiff =
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 30) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Date range cannot exceed 30 days',
        });
      }

      // Get existing bookings for this room in the date range
      const existingBookings = await tenantDb
        .select({
          startTime: sessions.startTime,
          endTime: sessions.endTime,
        })
        .from(sessions)
        .where(
          and(
            eq(sessions.roomId, input.roomId),
            not(eq(sessions.status, 'cancelled')),
            gte(sessions.startTime, startDate),
            lte(sessions.endTime, endDate)
          )
        );

      // Generate slots for each day
      const availability: {
        date: string;
        slots: { start: string; end: string; available: boolean }[];
      }[] = [];

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const daySlots = generateTimeSlots(
          currentDate,
          existingBookings,
          input.slotDurationMinutes
        );

        availability.push({
          date: currentDate.toISOString().split('T')[0] as string,
          slots: daySlots.map((slot) => ({
            start: slot.start.toISOString(),
            end: slot.end.toISOString(),
            available: slot.available,
          })),
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return availability;
    }),

  /**
   * Create a booking (client self-service)
   */
  create: clientProcedure
    .input(
      z.object({
        roomId: z.number(),
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        startTime: z.string(), // ISO date string
        endTime: z.string(), // ISO date string
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const clientId = ctx.clientId;

      const startTime = new Date(input.startTime);
      const endTime = new Date(input.endTime);

      // Validate times
      if (startTime >= endTime) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'End time must be after start time',
        });
      }

      if (startTime < new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot book in the past',
        });
      }

      // Check room exists and is active
      const room = await tenantDb.query.rooms.findFirst({
        where: and(eq(rooms.id, input.roomId), eq(rooms.isActive, true)),
      });

      if (!room) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Room not found or not available',
        });
      }

      // Check for conflicts
      const conflictingBookings = await tenantDb
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.roomId, input.roomId),
            not(eq(sessions.status, 'cancelled')),
            or(
              // New booking starts during existing booking
              and(gte(sessions.startTime, startTime), lte(sessions.startTime, endTime)),
              // New booking ends during existing booking
              and(gte(sessions.endTime, startTime), lte(sessions.endTime, endTime)),
              // New booking completely contains existing booking
              and(lte(sessions.startTime, startTime), gte(sessions.endTime, endTime))
            )
          )
        );

      if (conflictingBookings.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This time slot is already booked',
        });
      }

      // Calculate total amount based on hourly rate
      const durationHours =
        (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const hourlyRate = parseFloat(room.hourlyRate);
      const totalAmount = (durationHours * hourlyRate).toFixed(2);

      // Create the session/booking
      const [booking] = await tenantDb
        .insert(sessions)
        .values({
          clientId,
          roomId: input.roomId,
          title: input.title,
          description: input.description,
          startTime,
          endTime,
          status: 'scheduled',
          totalAmount,
          notes: input.notes,
        })
        .returning();

      return {
        ...booking,
        room: {
          name: room.name,
          hourlyRate: room.hourlyRate,
        },
      };
    }),

  /**
   * Get client's bookings (upcoming and past)
   */
  myBookings: clientProcedure
    .input(
      z
        .object({
          status: z
            .enum(['all', 'upcoming', 'past', 'cancelled'])
            .default('all'),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const clientId = ctx.clientId;
      const { status = 'all', limit = 50, offset = 0 } = input || {};

      const now = new Date();

      let whereClause = eq(sessions.clientId, clientId);

      if (status === 'upcoming') {
        whereClause = and(
          eq(sessions.clientId, clientId),
          gte(sessions.startTime, now),
          not(eq(sessions.status, 'cancelled'))
        )!;
      } else if (status === 'past') {
        whereClause = and(
          eq(sessions.clientId, clientId),
          lte(sessions.endTime, now),
          not(eq(sessions.status, 'cancelled'))
        )!;
      } else if (status === 'cancelled') {
        whereClause = and(
          eq(sessions.clientId, clientId),
          eq(sessions.status, 'cancelled')
        )!;
      }

      const bookingsList = await tenantDb
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
          roomHourlyRate: rooms.hourlyRate,
          createdAt: sessions.createdAt,
        })
        .from(sessions)
        .leftJoin(rooms, eq(sessions.roomId, rooms.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(sessions.startTime);

      return bookingsList;
    }),

  /**
   * Cancel a booking
   * Policy: Can only cancel bookings that start more than 24 hours from now
   */
  cancel: clientProcedure
    .input(
      z.object({
        bookingId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const clientId = ctx.clientId;

      // Get the booking
      const booking = await tenantDb.query.sessions.findFirst({
        where: and(
          eq(sessions.id, input.bookingId),
          eq(sessions.clientId, clientId)
        ),
      });

      if (!booking) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Booking not found',
        });
      }

      if (booking.status === 'cancelled') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Booking is already cancelled',
        });
      }

      if (booking.status === 'completed') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot cancel a completed booking',
        });
      }

      // Check cancellation policy (24 hours advance notice)
      const hoursUntilStart =
        (booking.startTime.getTime() - Date.now()) / (1000 * 60 * 60);

      if (hoursUntilStart < 24) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Bookings must be cancelled at least 24 hours in advance. Please contact the studio directly.',
        });
      }

      // Cancel the booking
      const [cancelled] = await tenantDb
        .update(sessions)
        .set({
          status: 'cancelled',
          notes: input.reason
            ? `${booking.notes || ''}\n[Cancelled by client: ${input.reason}]`
            : booking.notes,
          updatedAt: new Date(),
        })
        .where(eq(sessions.id, input.bookingId))
        .returning();

      return cancelled;
    }),

  /**
   * Reschedule a booking
   * Policy: Can only reschedule bookings that start more than 24 hours from now
   */
  reschedule: clientProcedure
    .input(
      z.object({
        bookingId: z.number(),
        newStartTime: z.string(),
        newEndTime: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const clientId = ctx.clientId;

      const newStartTime = new Date(input.newStartTime);
      const newEndTime = new Date(input.newEndTime);

      // Get the booking
      const booking = await tenantDb.query.sessions.findFirst({
        where: and(
          eq(sessions.id, input.bookingId),
          eq(sessions.clientId, clientId)
        ),
      });

      if (!booking) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Booking not found',
        });
      }

      if (booking.status === 'cancelled' || booking.status === 'completed') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot reschedule a cancelled or completed booking',
        });
      }

      // Check reschedule policy (24 hours advance notice)
      const hoursUntilStart =
        (booking.startTime.getTime() - Date.now()) / (1000 * 60 * 60);

      if (hoursUntilStart < 24) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Bookings must be rescheduled at least 24 hours in advance. Please contact the studio directly.',
        });
      }

      // Validate new times
      if (newStartTime >= newEndTime) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'End time must be after start time',
        });
      }

      if (newStartTime < new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot reschedule to a past time',
        });
      }

      // Check for conflicts (excluding this booking)
      const conflictingBookings = await tenantDb
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.roomId, booking.roomId),
            not(eq(sessions.id, input.bookingId)),
            not(eq(sessions.status, 'cancelled')),
            or(
              and(
                gte(sessions.startTime, newStartTime),
                lte(sessions.startTime, newEndTime)
              ),
              and(
                gte(sessions.endTime, newStartTime),
                lte(sessions.endTime, newEndTime)
              ),
              and(
                lte(sessions.startTime, newStartTime),
                gte(sessions.endTime, newEndTime)
              )
            )
          )
        );

      if (conflictingBookings.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'The new time slot is already booked',
        });
      }

      // Get room for recalculating total
      const room = await tenantDb.query.rooms.findFirst({
        where: eq(rooms.id, booking.roomId),
      });

      // Recalculate total amount
      const durationHours =
        (newEndTime.getTime() - newStartTime.getTime()) / (1000 * 60 * 60);
      const hourlyRate = parseFloat(room?.hourlyRate || '0');
      const totalAmount = (durationHours * hourlyRate).toFixed(2);

      // Update the booking
      const [rescheduled] = await tenantDb
        .update(sessions)
        .set({
          startTime: newStartTime,
          endTime: newEndTime,
          totalAmount,
          notes: `${booking.notes || ''}\n[Rescheduled by client on ${new Date().toISOString()}]`,
          updatedAt: new Date(),
        })
        .where(eq(sessions.id, input.bookingId))
        .returning();

      return rescheduled;
    }),
});
