import { Request, Response, NextFunction } from 'express';
import { getSessionUser } from '../lib/session';
import { db } from '@rsm/database';
import { tenantDatabases } from '@rsm/database/master/schema';
import { eq } from 'drizzle-orm';

/**
 * Middleware to validate tenant file access
 * Ensures users can only access files from their own tenant
 */
export async function validateTenantFileAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract tenant ID from URL: /uploads/tenant_X/...
    const match = req.path.match(/^\/tenant_([^\/]+)\//);
    if (!match) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    const requestedTenantName = `tenant_${match[1]}`;

    // Get authenticated user's organization
    const user = await getSessionUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user's tenant database
    const [userTenant] = await db
      .select()
      .from(tenantDatabases)
      .where(eq(tenantDatabases.organizationId, user.organizationId))
      .limit(1);

    if (!userTenant) {
      return res.status(403).json({ error: 'No tenant found' });
    }

    // Verify user can only access their own tenant's files
    if (userTenant.databaseName !== requestedTenantName) {
      console.warn(
        `[Security] User ${user.id} attempted to access ${requestedTenantName} files (belongs to ${userTenant.databaseName})`
      );
      return res.status(403).json({ error: 'Access denied' });
    }

    // Access granted
    next();
  } catch (error) {
    console.error('[TenantFileAccess] Error:', error);
    res.status(500).json({ error: 'File access verification failed' });
  }
}
