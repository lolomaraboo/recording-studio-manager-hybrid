import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as masterSchema from '@rsm/database/master';
import type * as tenantSchema from '@rsm/database/tenant';
import { getTenantDb } from '@rsm/database/connection';

/**
 * Type for Master DB
 */
export type MasterDb = PostgresJsDatabase<typeof masterSchema>;

/**
 * Type for Tenant DB
 */
export type TenantDb = PostgresJsDatabase<typeof tenantSchema>;

/**
 * User type (simplified for now - will be replaced by auth SDK later)
 */
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'client';
}

/**
 * tRPC Context - Available in all procedures
 */
export type TrpcContext = {
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
  user: User | null;
  organizationId: number | null;
  tenantDb: TenantDb | null;
  getTenantDb: () => Promise<TenantDb>;
};

/**
 * Create tRPC context for each request
 *
 * Pattern from Manus but adapted for Hybride:
 * - Authenticate user (TODO: integrate auth SDK)
 * - Resolve organizationId from user
 * - Load tenant DB lazily via getTenantDb()
 *
 * DIFFERENCE vs Manus: tenantDb is ACTIVE (not commented)
 */
export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let organizationId: number | null = null;
  let tenantDb: TenantDb | null = null;

  try {
    // TODO: Replace with real auth SDK
    // For now, check for test header
    const testUserId = opts.req.headers['x-test-user-id'];
    const testOrgId = opts.req.headers['x-test-org-id'];

    if (testUserId && testOrgId) {
      // Mock user for testing
      user = {
        id: parseInt(testUserId as string),
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      };
      organizationId = parseInt(testOrgId as string);

      // ACTIVE: Load tenant DB immediately (vs Manus commented)
      tenantDb = await getTenantDb(organizationId);
    }
  } catch (error) {
    // Auth is optional for publicProcedure
    console.error('Auth error:', error);
    user = null;
    organizationId = null;
    tenantDb = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    organizationId,
    tenantDb,
    getTenantDb: () => {
      if (!organizationId) {
        throw new Error('No organization context');
      }
      if (tenantDb) return Promise.resolve(tenantDb);
      return getTenantDb(organizationId);
    },
  };
}
