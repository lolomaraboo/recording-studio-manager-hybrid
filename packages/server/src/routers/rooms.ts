import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { rooms } from "@rsm/database/tenant/schema";
import { eq } from "drizzle-orm";

/**
 * Rooms Router
 * Manages studio rooms/spaces
 */
export const roomsRouter = router({
  /**
   * List all rooms for the organization
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantDb) {
      throw new Error("Tenant database not available");
    }

    const roomsList = await ctx.tenantDb.select().from(rooms);
    return roomsList;
  }),

  /**
   * Get a single room by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const room = await ctx.tenantDb
        .select()
        .from(rooms)
        .where(eq(rooms.id, input.id))
        .limit(1);

      if (room.length === 0) {
        throw new Error("Room not found");
      }

      return room[0];
    }),

  /**
   * Create a new room
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        type: z.enum(["recording", "mixing", "mastering", "rehearsal", "live"]).default("recording"),
        hourlyRate: z.string(), // Decimal as string
        halfDayRate: z.string().optional(),
        fullDayRate: z.string().optional(),
        capacity: z.number().default(1),
        size: z.number().optional(),
        hasIsolationBooth: z.boolean().default(false),
        hasLiveRoom: z.boolean().default(false),
        hasControlRoom: z.boolean().default(false),
        equipmentList: z.string().optional(), // JSON string
        isActive: z.boolean().default(true),
        isAvailableForBooking: z.boolean().default(true),
        color: z.string().max(7).optional(),
        imageUrl: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const newRoom = await ctx.tenantDb.insert(rooms).values(input as any).returning();

      return newRoom[0];
    }),

  /**
   * Update a room
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        type: z.enum(["recording", "mixing", "mastering", "rehearsal", "live"]).optional(),
        hourlyRate: z.string().optional(),
        halfDayRate: z.string().optional(),
        fullDayRate: z.string().optional(),
        capacity: z.number().optional(),
        size: z.number().optional(),
        hasIsolationBooth: z.boolean().optional(),
        hasLiveRoom: z.boolean().optional(),
        hasControlRoom: z.boolean().optional(),
        equipmentList: z.string().optional(),
        isActive: z.boolean().optional(),
        isAvailableForBooking: z.boolean().optional(),
        color: z.string().max(7).optional(),
        imageUrl: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const { id, ...updateData } = input;

      const updatedRoom = await ctx.tenantDb
        .update(rooms)
        .set(updateData)
        .where(eq(rooms.id, id))
        .returning();

      if (updatedRoom.length === 0) {
        throw new Error("Room not found");
      }

      return updatedRoom[0];
    }),

  /**
   * Delete a room
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      await ctx.tenantDb.delete(rooms).where(eq(rooms.id, input.id));

      return { success: true };
    }),
});
