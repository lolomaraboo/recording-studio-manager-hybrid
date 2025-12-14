import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as masterSchema from '@rsm/database/master';
import type * as tenantSchema from '@rsm/database/tenant';
import { getTenantDb } from '@rsm/database/connection';
import { extractBearerToken, verifyAccessToken } from './auth';

/**
 * Type for Master DB
 */
export type MasterDb = PostgresJsDatabase<typeof masterSchema>;

/**
 * Type for Tenant DB
 */
export type TenantDb = PostgresJsDatabase<typeof tenantSchema>;

/**
 * User type for context (from JWT token)
 */
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'client';
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
 * Authentication flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Verify JWT and decode payload
 * 3. Set user and organizationId in context
 * 4. Load tenant DB if organizationId is present
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
    // 1. Try JWT authentication
    const token = extractBearerToken(opts.req);
    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        user = {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.email.split('@')[0] || 'User', // Will be replaced with DB lookup
          role: decoded.role === 'admin' ? 'admin' : decoded.role === 'client' ? 'client' : 'member',
        };
        organizationId = decoded.organizationId;
      }
    }

    // 2. Fallback: Test headers for development/testing
    if (!user) {
      const testUserId = opts.req.headers['x-test-user-id'];
      const testOrgId = opts.req.headers['x-test-org-id'];

      if (testUserId && testOrgId) {
        user = {
          id: parseInt(testUserId as string),
          email: 'test@example.com',
          name: 'Test User',
          role: 'member',
        };
        organizationId = parseInt(testOrgId as string);
      }
    }

    // 3. Load tenant DB if we have an organization
    if (organizationId) {
      tenantDb = await getTenantDb(organizationId);
    }
  } catch (error) {
    // Auth is optional for publicProcedure
    console.error('Context creation error:', error);
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
