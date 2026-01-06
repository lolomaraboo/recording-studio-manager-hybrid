import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc.js';
import { serviceCatalog } from '@rsm/database/tenant';
import { eq, and, or, ilike, sql } from 'drizzle-orm';

/**
 * Service Catalog Router
 *
 * Manages pre-defined service items for quick quote insertion.
 * Categories: Studio, Post-production, Location matériel, Autre
 *
 * Endpoints:
 * - CRUD: list, getById, create, update, delete
 * - Filtering: search (name/description), category, activeOnly
 */

export const serviceCatalogRouter = router({
  /**
   * List services with optional search/filter
   */
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        activeOnly: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const conditions = [];

      // Filter by active status
      if (input.activeOnly) {
        conditions.push(eq(serviceCatalog.isActive, true));
      }

      // Filter by category
      if (input.category) {
        conditions.push(eq(serviceCatalog.category, input.category));
      }

      // Search by name or description (fuzzy match)
      if (input.search && input.search.trim().length > 0) {
        const searchPattern = `%${input.search.trim()}%`;
        conditions.push(
          or(
            ilike(serviceCatalog.name, searchPattern),
            ilike(serviceCatalog.description, searchPattern)
          )
        );
      }

      return tenantDb.query.serviceCatalog.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: (serviceCatalog, { asc }) => [
          asc(serviceCatalog.displayOrder),
          asc(serviceCatalog.name),
        ],
      });
    }),

  /**
   * Get service by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      return tenantDb.query.serviceCatalog.findFirst({
        where: eq(serviceCatalog.id, input.id),
      });
    }),

  /**
   * Create new service
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Le nom est requis').max(255),
        description: z.string().optional(),
        category: z.enum(['Studio', 'Post-production', 'Location matériel', 'Autre']),
        unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Prix invalide'),
        taxRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'TVA invalide').default('20.00'),
        defaultQuantity: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Quantité invalide').default('1.00'),
        isActive: z.boolean().default(true),
        displayOrder: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const [service] = await tenantDb.insert(serviceCatalog).values(input).returning();
      return service;
    }),

  /**
   * Update existing service
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1, 'Le nom est requis').max(255).optional(),
        description: z.string().optional(),
        category: z.enum(['Studio', 'Post-production', 'Location matériel', 'Autre']).optional(),
        unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Prix invalide').optional(),
        taxRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'TVA invalide').optional(),
        defaultQuantity: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Quantité invalide').optional(),
        isActive: z.boolean().optional(),
        displayOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      const { id, ...updateData } = input;
      const [updated] = await tenantDb
        .update(serviceCatalog)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(serviceCatalog.id, id))
        .returning();
      return updated;
    }),

  /**
   * Delete service (hard delete)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();
      await tenantDb.delete(serviceCatalog).where(eq(serviceCatalog.id, input.id));
      return { success: true };
    }),
});
