import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { router, protectedProcedure, adminProcedure } from '../_core/trpc';
import { organizations } from '@rsm/database/master';
import { getMasterDb } from '@rsm/database/connection';
import { createTenantDatabase, deleteTenantDatabase } from '../services/tenant-provisioning';

/**
 * Organizations Router
 *
 * CRUD for organizations (stored in Master DB)
 *
 * Endpoints:
 * - list: Get all organizations (admin only)
 * - get: Get organization by ID
 * - create: Create new organization
 * - update: Update organization
 * - delete: Delete organization (admin only)
 */
export const organizationsRouter = router({
  /**
   * List all organizations (admin only)
   */
  list: adminProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getMasterDb();
      const { limit = 50, offset = 0 } = input || {};

      const orgs = await db
        .select()
        .from(organizations)
        .limit(limit)
        .offset(offset);

      return orgs;
    }),

  /**
   * Get current user's organization
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No organization found for user',
      });
    }

    const db = await getMasterDb();
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, ctx.organizationId),
    });

    if (!org) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Organization not found',
      });
    }

    return org;
  }),

  /**
   * Create new organization
   * Also creates tenant database
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(200),
        phone: z.string().optional(),
        timezone: z.string().default('America/New_York'),
        currency: z.string().default('USD'),
      })
    )
    .mutation(async ({ input, ctx: _ctx }) => {
      const db = await getMasterDb();

      // Generate slug and subdomain from name
      const slug = input.name.toLowerCase().replace(/\s+/g, '-');
      const subdomain = slug + '-' + Date.now();

      // TODO: Use real user ID from ctx.user.id when auth is implemented
      const ownerId = 1; // Mock owner ID

      const [org] = await db
        .insert(organizations)
        .values({
          name: input.name,
          slug,
          subdomain,
          ownerId,
          phone: input.phone,
          timezone: input.timezone,
          currency: input.currency,
        })
        .returning();

      // Create tenant database and apply migrations
      const tenantResult = await createTenantDatabase(org.id);

      if (!tenantResult.success) {
        console.error('[Organizations] Failed to create tenant database:', tenantResult.error);
        // Rollback organization creation
        await db.delete(organizations).where(eq(organizations.id, org.id));
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create tenant database: ${tenantResult.error}`,
        });
      }

      console.log(`[Organizations] Organization ${org.id} created with tenant DB: ${tenantResult.databaseName}`);

      return org;
    }),

  /**
   * Update organization
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().min(2).max(200).optional(),
          logoUrl: z.string().max(500).nullable().optional(),
          phone: z.string().optional(),
          timezone: z.string().optional(),
          currency: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getMasterDb();

      // Verify user belongs to this organization
      if (ctx.user?.role !== 'admin' && ctx.organizationId !== input.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot update organization you do not belong to',
        });
      }

      const [updated] = await db
        .update(organizations)
        .set(input.data)
        .where(eq(organizations.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Organization not found',
        });
      }

      return updated;
    }),

  /**
   * Delete organization (admin only)
   */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getMasterDb();

      // Delete tenant database first
      try {
        await deleteTenantDatabase(input.id);
      } catch (error) {
        console.error('[Organizations] Failed to delete tenant database:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete tenant database',
        });
      }

      await db.delete(organizations).where(eq(organizations.id, input.id));

      return { success: true };
    }),
});
