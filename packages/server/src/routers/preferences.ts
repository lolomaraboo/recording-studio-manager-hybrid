import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { router, protectedProcedure } from '../_core/trpc';
import { userPreferences } from '@rsm/database/tenant';

/**
 * Preferences Router
 *
 * CRUD for user preferences (stored in Tenant DB)
 * Enables cross-device synchronization of view preferences
 *
 * Endpoints:
 * - get: Get preferences by scope
 * - save: Upsert preferences for scope
 * - reset: Delete preferences for scope
 */
export const preferencesRouter = router({
  /**
   * Get preferences for a specific scope
   * Returns null if no preferences are saved
   */
  get: protectedProcedure
    .input(z.object({
      scope: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      const pref = await tenantDb.query.userPreferences.findFirst({
        where: and(
          eq(userPreferences.userId, ctx.userId),
          eq(userPreferences.scope, input.scope)
        ),
      });

      return pref?.preferences || null;
    }),

  /**
   * Save preferences for a scope
   * Updates if exists, inserts if not (upsert)
   */
  save: protectedProcedure
    .input(z.object({
      scope: z.string(),
      preferences: z.any(), // JSONB object with viewMode, visibleColumns, columnOrder, sortBy, sortOrder
    }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Check if preference already exists
      const existing = await tenantDb.query.userPreferences.findFirst({
        where: and(
          eq(userPreferences.userId, ctx.userId),
          eq(userPreferences.scope, input.scope)
        ),
      });

      if (existing) {
        // Update existing preference
        await tenantDb
          .update(userPreferences)
          .set({
            preferences: input.preferences,
            updatedAt: new Date(),
          })
          .where(eq(userPreferences.id, existing.id));
      } else {
        // Insert new preference
        await tenantDb.insert(userPreferences).values({
          userId: ctx.userId,
          scope: input.scope,
          preferences: input.preferences,
        });
      }

      return { success: true };
    }),

  /**
   * Reset preferences for a scope (delete)
   * Useful for "restore defaults" functionality
   */
  reset: protectedProcedure
    .input(z.object({
      scope: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      await tenantDb
        .delete(userPreferences)
        .where(and(
          eq(userPreferences.userId, ctx.userId),
          eq(userPreferences.scope, input.scope)
        ));

      return { success: true };
    }),
});
