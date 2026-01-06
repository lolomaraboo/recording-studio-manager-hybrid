import { z } from 'zod';
import { router, adminProcedure } from '../_core/trpc';
import { getMasterDb } from '@rsm/database/connection';
import { organizations, tenantDatabases } from '@rsm/database/master';
import { createTenantDatabase } from '../services/tenant-provisioning';
import { eq, notInArray } from 'drizzle-orm';

/**
 * Admin Router
 *
 * Administrative endpoints for system maintenance
 */
export const adminRouter = router({
  /**
   * Fix missing tenant databases
   * Creates tenant databases for organizations that don't have one
   */
  fixMissingTenants: adminProcedure.query(async () => {
    const db = await getMasterDb();

    // Get all organizations
    const allOrgs = await db.select().from(organizations);

    // Get organizations that already have tenant databases
    const existingTenants = await db
      .select({ organizationId: tenantDatabases.organizationId })
      .from(tenantDatabases);

    const existingOrgIds = existingTenants.map((t) => t.organizationId);

    // Find organizations without tenant databases
    const missingOrgs = allOrgs.filter((org) => !existingOrgIds.includes(org.id));

    console.log(`[Admin] Found ${missingOrgs.length} organizations without tenant databases`);

    const results = [];

    for (const org of missingOrgs) {
      console.log(`[Admin] Creating tenant database for organization ${org.id}: ${org.name}`);
      const result = await createTenantDatabase(org.id);
      results.push({
        organizationId: org.id,
        organizationName: org.name,
        databaseName: result.databaseName,
        success: result.success,
        error: result.error,
      });
    }

    return {
      totalOrganizations: allOrgs.length,
      missingTenants: missingOrgs.length,
      results,
    };
  }),

  /**
   * List all tenant databases
   */
  listTenants: adminProcedure.query(async () => {
    const db = await getMasterDb();

    const tenants = await db
      .select({
        id: tenantDatabases.id,
        organizationId: tenantDatabases.organizationId,
        databaseName: tenantDatabases.databaseName,
        createdAt: tenantDatabases.createdAt,
        organizationName: organizations.name,
      })
      .from(tenantDatabases)
      .leftJoin(organizations, eq(tenantDatabases.organizationId, organizations.id));

    return tenants;
  }),
});
