import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { equipment } from "@rsm/database/tenant/schema";
import { eq } from "drizzle-orm";

/**
 * Equipment Router
 * Manages studio equipment, gear, and instruments
 */
export const equipmentRouter = router({
  /**
   * List all equipment for the organization
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantDb) {
      throw new Error("Tenant database not available");
    }

    const equipmentList = await ctx.tenantDb.select().from(equipment);
    return equipmentList;
  }),

  /**
   * Get equipment by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const item = await ctx.tenantDb
        .select()
        .from(equipment)
        .where(eq(equipment.id, input.id))
        .limit(1);

      if (item.length === 0) {
        throw new Error("Equipment not found");
      }

      return item[0];
    }),

  /**
   * Create new equipment
   */
  create: protectedProcedure
    .input(
      z.object({
        roomId: z.number().optional(),
        name: z.string().min(1).max(255),
        brand: z.string().max(100).optional(),
        model: z.string().max(100).optional(),
        serialNumber: z.string().max(100).optional(),
        category: z.enum([
          "microphone",
          "preamp",
          "interface",
          "outboard",
          "instrument",
          "monitoring",
          "computer",
          "cable",
          "accessory",
          "other",
        ]),
        description: z.string().optional(),
        specifications: z.string().optional(), // JSON
        purchaseDate: z.date().optional(),
        purchasePrice: z.string().optional(),
        warrantyUntil: z.date().optional(),
        status: z.enum(["operational", "maintenance", "out_of_service", "rented"]).default("operational"),
        condition: z.enum(["excellent", "good", "fair", "poor"]).default("good"),
        lastMaintenanceAt: z.date().optional(),
        nextMaintenanceAt: z.date().optional(),
        maintenanceNotes: z.string().optional(),
        location: z.string().max(255).optional(),
        isAvailable: z.boolean().default(true),
        imageUrl: z.string().max(500).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const newEquipment = await ctx.tenantDb.insert(equipment).values(input as any).returning();

      return newEquipment[0];
    }),

  /**
   * Update equipment
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        roomId: z.number().nullish(),
        name: z.string().min(1).max(255).optional(),
        brand: z.string().max(100).optional(),
        model: z.string().max(100).optional(),
        serialNumber: z.string().max(100).optional(),
        category: z
          .enum([
            "microphone",
            "preamp",
            "interface",
            "outboard",
            "instrument",
            "monitoring",
            "computer",
            "cable",
            "accessory",
            "other",
          ])
          .optional(),
        description: z.string().optional(),
        specifications: z.string().optional(),
        purchaseDate: z.coerce.date().nullish(),
        purchasePrice: z.string().nullish(),
        warrantyUntil: z.coerce.date().nullish(),
        status: z.enum(["operational", "maintenance", "out_of_service", "rented"]).optional(),
        condition: z.enum(["excellent", "good", "fair", "poor"]).optional(),
        lastMaintenanceAt: z.coerce.date().nullish(),
        nextMaintenanceAt: z.coerce.date().nullish(),
        maintenanceNotes: z.string().optional(),
        location: z.string().max(255).optional(),
        isAvailable: z.boolean().optional(),
        imageUrl: z.string().max(500).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      const { id, ...updateData } = input;

      const updated = await ctx.tenantDb
        .update(equipment)
        .set(updateData)
        .where(eq(equipment.id, id))
        .returning();

      if (updated.length === 0) {
        throw new Error("Equipment not found");
      }

      return updated[0];
    }),

  /**
   * Delete equipment
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantDb) {
        throw new Error("Tenant database not available");
      }

      await ctx.tenantDb.delete(equipment).where(eq(equipment.id, input.id));

      return { success: true };
    }),
});
