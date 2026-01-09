import { z } from 'zod';
import { router, publicProcedure } from '../_core/trpc.js';
import { requireSuperadmin } from '../middleware/superadmin.js';
import { listContainers, getContainerLogs, getSystemMetrics } from '../lib/docker.js';
import { getMasterDb, getTenantDb } from '@rsm/database/connection';
import * as masterSchema from '@rsm/database/master';
import { sql } from 'drizzle-orm';

/**
 * Superadmin Router
 *
 * Protected routes for system administration:
 * - Docker container monitoring
 * - Database management and queries
 * - System health aggregation
 * - Log viewing
 *
 * All routes protected by superadmin middleware (SUPERADMIN_EMAIL check)
 */
export const superadminRouter = router({
  // Health check endpoint (confirms superadmin access working)
  ping: publicProcedure
    .use(async ({ ctx, next }) => {
      requireSuperadmin(ctx);
      return next();
    })
    .query(async () => {
      return {
        status: 'ok',
        message: 'Superadmin access granted',
        timestamp: new Date().toISOString(),
      };
    }),

  // Docker Monitoring Endpoints

  /**
   * List all Docker containers
   *
   * Returns container name, status, uptime, image for all containers
   * Empty array if Docker socket not accessible
   */
  listContainers: publicProcedure
    .use(async ({ ctx, next }) => {
      requireSuperadmin(ctx);
      return next();
    })
    .query(async () => {
      const containers = await listContainers();
      return {
        containers,
        timestamp: new Date().toISOString(),
      };
    }),

  /**
   * Get logs for a specific container
   *
   * Returns last N lines of logs (default 100)
   */
  getContainerLogs: publicProcedure
    .use(async ({ ctx, next }) => {
      requireSuperadmin(ctx);
      return next();
    })
    .input(
      z.object({
        containerId: z.string(),
        tail: z.number().optional().default(100),
      })
    )
    .query(async ({ input }) => {
      const logs = await getContainerLogs(input.containerId, input.tail);
      return {
        containerId: input.containerId,
        logs,
        timestamp: new Date().toISOString(),
      };
    }),

  /**
   * Get system metrics
   *
   * Returns container counts (total, running, stopped)
   * Future: CPU usage, memory usage, disk usage
   */
  getSystemMetrics: publicProcedure
    .use(async ({ ctx, next }) => {
      requireSuperadmin(ctx);
      return next();
    })
    .query(async () => {
      const metrics = await getSystemMetrics();
      return {
        ...metrics,
        timestamp: new Date().toISOString(),
      };
    }),

  // Database Management Endpoints

  /**
   * List all organizations with stats
   *
   * Returns: name, owner, user count, tenant DB name, subscription tier, created date
   * Pagination: limit 50 per page (default)
   */
  listOrganizations: publicProcedure
    .use(async ({ ctx, next }) => {
      requireSuperadmin(ctx);
      return next();
    })
    .input(
      z.object({
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input }) => {
      const masterDb = await getMasterDb();

      // Query organizations with tenant DB info
      const orgs = await masterDb
        .select({
          id: masterSchema.organizations.id,
          name: masterSchema.organizations.name,
          subdomain: masterSchema.organizations.subdomain,
          subscriptionTier: masterSchema.organizations.subscriptionTier,
          subscriptionStatus: masterSchema.organizations.subscriptionStatus,
          createdAt: masterSchema.organizations.createdAt,
          tenantDbName: masterSchema.tenantDatabases.databaseName,
        })
        .from(masterSchema.organizations)
        .leftJoin(
          masterSchema.tenantDatabases,
          sql`${masterSchema.organizations.id} = ${masterSchema.tenantDatabases.organizationId}`
        )
        .limit(input.limit)
        .offset(input.offset);

      // Count total orgs for pagination
      const totalResult = await masterDb
        .select({ count: sql<number>`count(*)::int` })
        .from(masterSchema.organizations);
      const total = totalResult[0]?.count || 0;

      return {
        organizations: orgs,
        total,
        limit: input.limit,
        offset: input.offset,
        timestamp: new Date().toISOString(),
      };
    }),

  /**
   * List all users
   *
   * Returns: email, name, role, organization, last login, created date
   * Pagination: limit 50 per page (default)
   * Security: Password hashes excluded
   */
  listUsers: publicProcedure
    .use(async ({ ctx, next }) => {
      requireSuperadmin(ctx);
      return next();
    })
    .input(
      z.object({
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input }) => {
      const masterDb = await getMasterDb();

      // Query users (exclude password hashes)
      const users = await masterDb
        .select({
          id: masterSchema.users.id,
          email: masterSchema.users.email,
          name: masterSchema.users.name,
          role: masterSchema.users.role,
          isActive: masterSchema.users.isActive,
          createdAt: masterSchema.users.createdAt,
          updatedAt: masterSchema.users.updatedAt,
        })
        .from(masterSchema.users)
        .limit(input.limit)
        .offset(input.offset);

      // Count total users for pagination
      const totalResult = await masterDb
        .select({ count: sql<number>`count(*)::int` })
        .from(masterSchema.users);
      const total = totalResult[0]?.count || 0;

      return {
        users,
        total,
        limit: input.limit,
        offset: input.offset,
        timestamp: new Date().toISOString(),
      };
    }),

  /**
   * Get tenant database stats
   *
   * For each tenant DB: count tables, estimate size using pg_database_size()
   */
  getTenantStats: publicProcedure
    .use(async ({ ctx, next }) => {
      requireSuperadmin(ctx);
      return next();
    })
    .query(async () => {
      const masterDb = await getMasterDb();

      // Get all tenant databases
      const tenantDbs = await masterDb
        .select()
        .from(masterSchema.tenantDatabases);

      const stats = await Promise.all(
        tenantDbs.map(async (tenant) => {
          try {
            // Get database size
            const sizeResult = await masterDb.execute(
              sql`SELECT pg_database_size(${tenant.databaseName}) as size`
            );
            const size = sizeResult[0]?.size || 0;

            // Format size (bytes to MB)
            const sizeMB = Math.round(Number(size) / 1024 / 1024);

            return {
              organizationId: tenant.organizationId,
              databaseName: tenant.databaseName,
              sizeMB,
              createdAt: tenant.createdAt,
            };
          } catch (error) {
            console.error(`Error getting stats for ${tenant.databaseName}:`, error);
            return {
              organizationId: tenant.organizationId,
              databaseName: tenant.databaseName,
              sizeMB: 0,
              createdAt: tenant.createdAt,
              error: 'Failed to retrieve stats',
            };
          }
        })
      );

      return {
        tenantStats: stats,
        timestamp: new Date().toISOString(),
      };
    }),

  /**
   * Aggregate health check
   *
   * Combines:
   * - System health endpoint (/api/health)
   * - Docker container health status
   * - Database connection status
   */
  aggregateHealth: publicProcedure
    .use(async ({ ctx, next }) => {
      requireSuperadmin(ctx);
      return next();
    })
    .query(async () => {
      // 1. Get Docker metrics
      const dockerMetrics = await getSystemMetrics();

      // 2. Check database connectivity
      let databaseHealth = { status: 'unknown', error: null as string | null };
      try {
        const masterDb = await getMasterDb();
        await masterDb.select().from(masterSchema.users).limit(1);
        databaseHealth = { status: 'ok', error: null };
      } catch (error: any) {
        databaseHealth = { status: 'error', error: error.message };
      }

      return {
        database: databaseHealth,
        docker: {
          status: dockerMetrics.containers.running > 0 ? 'ok' : 'warning',
          containers: dockerMetrics.containers,
        },
        timestamp: new Date().toISOString(),
      };
    }),
});
