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
    // Get user from session
    const session = opts.req.session as any;

    if (session.userId && session.organizationId) {
      // User is authenticated via session
      user = {
        id: session.userId,
        email: session.email || 'user@example.com',
        name: session.name || 'User',
        role: session.role || 'user',
      };
      organizationId = session.organizationId;

      // Load tenant DB
      tenantDb = await getTenantDb(organizationId);
    }
  } catch (error) {
    // Auth is optional for publicProcedure
    console.error('[Auth Error]:', error);
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
