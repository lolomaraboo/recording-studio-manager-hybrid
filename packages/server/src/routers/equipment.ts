/**
 * Equipment Router
 *
 * Manage studio equipment inventory:
 * - CRUD equipment items
 * - Track availability
 * - Maintenance scheduling
 * - Category management
 */

import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../_core/trpc';
import { equipment } from '@rsm/database/tenant';
import { eq, desc, and, count, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

const equipmentCategoryEnum = z.enum([
  'microphone',
  'preamp',
  'compressor',
  'equalizer',
  'reverb',
  'delay',
  'console',
  'interface',
  'monitor',
  'headphones',
  'instrument',
  'amplifier',
  'cable',
  'stand',
  'acoustic',
  'software',
  'computer',
  'storage',
  'other',
]);

const equipmentConditionEnum = z.enum([
  'excellent',
  'good',
  'fair',
  'poor',
  'needs_repair',
  'out_of_service',
]);

export const equipmentRouter = router({
  // ============ LIST & GET ============

  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      search: z.string().optional(),
      category: equipmentCategoryEnum.optional(),
      condition: equipmentConditionEnum.optional(),
      isAvailable: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { limit = 50, offset = 0, search, category, condition, isAvailable } = input || {};
      const db = await ctx.getTenantDb();

      const conditions = [];
      if (search) {
        conditions.push(
          sql`(${equipment.name} ILIKE ${`%${search}%`} OR ${equipment.brand} ILIKE ${`%${search}%`} OR ${equipment.model} ILIKE ${`%${search}%`})`
        );
      }
      if (category) {
        conditions.push(eq(equipment.category, category));
      }
      if (condition) {
        conditions.push(eq(equipment.condition, condition));
      }
      if (isAvailable !== undefined) {
        conditions.push(eq(equipment.isAvailable, isAvailable));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [items, totalResult] = await Promise.all([
        db.select().from(equipment).where(whereClause).limit(limit).offset(offset).orderBy(desc(equipment.createdAt)),
        db.select({ count: count() }).from(equipment).where(whereClause),
      ]);

      return {
        equipment: items,
        total: totalResult[0]?.count || 0,
        limit,
        offset,
      };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();
      const [item] = await db.select().from(equipment).where(eq(equipment.id, input.id));
      if (!item) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipment not found' });
      }
      return item;
    }),

  // ============ CRUD ============

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      category: equipmentCategoryEnum,
      brand: z.string().optional(),
      model: z.string().optional(),
      serialNumber: z.string().optional(),
      purchaseDate: z.string().optional(),
      purchasePrice: z.number().optional(),
      condition: equipmentConditionEnum.default('good'),
      location: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      const [item] = await db.insert(equipment).values({
        name: input.name,
        category: input.category,
        brand: input.brand,
        model: input.model,
        serialNumber: input.serialNumber,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
        purchasePrice: input.purchasePrice?.toString(),
        condition: input.condition,
        location: input.location,
        notes: input.notes,
        isAvailable: true,
      }).returning();

      return item;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      category: equipmentCategoryEnum.optional(),
      brand: z.string().optional(),
      model: z.string().optional(),
      serialNumber: z.string().optional(),
      purchaseDate: z.string().optional(),
      purchasePrice: z.number().optional(),
      condition: equipmentConditionEnum.optional(),
      location: z.string().optional(),
      notes: z.string().optional(),
      isAvailable: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();
      const { id, purchaseDate, purchasePrice, ...updates } = input;

      const [item] = await db.update(equipment)
        .set({
          ...updates,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
          purchasePrice: purchasePrice?.toString(),
          updatedAt: new Date(),
        })
        .where(eq(equipment.id, id))
        .returning();

      if (!item) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipment not found' });
      }

      return item;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();
      await db.delete(equipment).where(eq(equipment.id, input.id));
      return { success: true };
    }),

  // ============ AVAILABILITY ============

  setAvailability: protectedProcedure
    .input(z.object({
      id: z.number(),
      isAvailable: z.boolean(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await ctx.getTenantDb();

      const updateData: Record<string, unknown> = {
        isAvailable: input.isAvailable,
        updatedAt: new Date(),
      };

      if (input.notes !== undefined) {
        const [current] = await db.select().from(equipment).where(eq(equipment.id, input.id));
        if (current) {
          const currentNotes = current.notes || '';
          const timestamp = new Date().toISOString();
          const newNote = `[${timestamp}] Availability: ${input.isAvailable ? 'Available' : 'Not Available'}${input.notes ? ` - ${input.notes}` : ''}`;
          updateData.notes = currentNotes ? `${currentNotes}\n${newNote}` : newNote;
        }
      }

      const [item] = await db.update(equipment)
        .set(updateData)
        .where(eq(equipment.id, input.id))
        .returning();

      if (!item) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipment not found' });
      }

      return item;
    }),

  // ============ STATISTICS ============

  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = await ctx.getTenantDb();

    const [
      totalResult,
      availableResult,
      byCategoryResult,
      byConditionResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(equipment),
      db.select({ count: count() }).from(equipment).where(eq(equipment.isAvailable, true)),
      db.select({
        category: equipment.category,
        count: count(),
      }).from(equipment).groupBy(equipment.category),
      db.select({
        condition: equipment.condition,
        count: count(),
      }).from(equipment).groupBy(equipment.condition),
    ]);

    // Calculate total value
    const allEquipment = await db.select().from(equipment);
    const totalValue = allEquipment.reduce((sum, item) => {
      return sum + (parseFloat(item.purchasePrice || '0') || 0);
    }, 0);

    return {
      total: totalResult[0]?.count || 0,
      available: availableResult[0]?.count || 0,
      unavailable: (totalResult[0]?.count || 0) - (availableResult[0]?.count || 0),
      totalValue,
      byCategory: byCategoryResult.reduce((acc, r) => {
        acc[r.category] = r.count;
        return acc;
      }, {} as Record<string, number>),
      byCondition: byConditionResult.reduce((acc, r) => {
        acc[r.condition] = r.count;
        return acc;
      }, {} as Record<string, number>),
    };
  }),

  // ============ CATEGORIES ============

  getCategories: protectedProcedure.query(() => {
    return {
      categories: [
        { id: 'microphone', name: 'Microphones', icon: 'mic' },
        { id: 'preamp', name: 'Preamps', icon: 'sliders' },
        { id: 'compressor', name: 'Compressors', icon: 'gauge' },
        { id: 'equalizer', name: 'Equalizers', icon: 'sliders-horizontal' },
        { id: 'reverb', name: 'Reverbs', icon: 'waves' },
        { id: 'delay', name: 'Delays', icon: 'timer' },
        { id: 'console', name: 'Mixing Consoles', icon: 'layout-grid' },
        { id: 'interface', name: 'Audio Interfaces', icon: 'usb' },
        { id: 'monitor', name: 'Studio Monitors', icon: 'speaker' },
        { id: 'headphones', name: 'Headphones', icon: 'headphones' },
        { id: 'instrument', name: 'Instruments', icon: 'music' },
        { id: 'amplifier', name: 'Amplifiers', icon: 'volume-2' },
        { id: 'cable', name: 'Cables & Connectors', icon: 'cable' },
        { id: 'stand', name: 'Stands & Mounts', icon: 'columns' },
        { id: 'acoustic', name: 'Acoustic Treatment', icon: 'square' },
        { id: 'software', name: 'Software & Plugins', icon: 'code' },
        { id: 'computer', name: 'Computers & Hardware', icon: 'laptop' },
        { id: 'storage', name: 'Storage Devices', icon: 'hard-drive' },
        { id: 'other', name: 'Other', icon: 'package' },
      ],
    };
  }),
});
