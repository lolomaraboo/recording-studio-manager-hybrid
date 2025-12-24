import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'path';
import { getMasterDb } from '@rsm/database/connection';
import { tenantDatabases } from '@rsm/database/master';

/**
 * Tenant Provisioning Service
 *
 * Automatically creates tenant databases and applies migrations
 * when a new organization is created.
 */

interface TenantCreationResult {
  databaseName: string;
  success: boolean;
  error?: string;
}

/**
 * Create a new tenant database and apply all migrations
 */
export async function createTenantDatabase(organizationId: number): Promise<TenantCreationResult> {
  const databaseName = `tenant_${organizationId}`;

  console.log(`[TenantProvisioning] Creating tenant database: ${databaseName}`);

  try {
    // Step 1: Create the database
    const host = process.env.DATABASE_HOST || 'postgres';
    const port = parseInt(process.env.DATABASE_PORT || '5432');
    const user = process.env.DATABASE_USER || 'postgres';
    const password = process.env.DATABASE_PASSWORD || 'password';

    const adminSql = postgres({
      host,
      port,
      user,
      password,
      database: 'postgres', // Connect to default postgres DB
    });

    // Check if database already exists
    const checkResult = await adminSql`
      SELECT 1 FROM pg_database WHERE datname = ${databaseName}
    `;

    if (checkResult.length > 0) {
      console.log(`[TenantProvisioning] Database ${databaseName} already exists`);
      await adminSql.end();
      return { databaseName, success: true };
    }

    // Create database (needs raw query)
    await adminSql.unsafe(`CREATE DATABASE ${databaseName}`);
    console.log(`[TenantProvisioning] Database ${databaseName} created`);
    await adminSql.end();

    // Step 2: Apply migrations to the new tenant database
    const tenantSql = postgres({
      host,
      port,
      user,
      password,
      database: databaseName,
    });

    const tenantDb = drizzle(tenantSql);

    // Apply migrations
    const migrationsFolder = path.resolve(__dirname, '../../../database/drizzle/migrations');
    console.log(`[TenantProvisioning] Applying migrations from: ${migrationsFolder}`);

    await migrate(tenantDb, { migrationsFolder });
    console.log(`[TenantProvisioning] Migrations applied to ${databaseName}`);

    await tenantSql.end();

    // Step 3: Register in tenant_databases table
    const masterDb = await getMasterDb();
    await masterDb
      .insert(tenantDatabases)
      .values({
        organizationId,
        databaseName,
      })
      .onConflictDoNothing();

    console.log(`[TenantProvisioning] Tenant database ${databaseName} registered in master DB`);

    return { databaseName, success: true };
  } catch (error: any) {
    console.error(`[TenantProvisioning] Failed to create tenant database:`, error);
    return {
      databaseName,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete a tenant database (use with caution!)
 */
export async function deleteTenantDatabase(organizationId: number): Promise<void> {
  const databaseName = `tenant_${organizationId}`;

  console.log(`[TenantProvisioning] Deleting tenant database: ${databaseName}`);

  try {
    // Step 1: Remove from tenant_databases table
    const masterDb = await getMasterDb();
    await masterDb
      .delete(tenantDatabases)
      .where({ organizationId });

    // Step 2: Drop the database
    const host = process.env.DATABASE_HOST || 'postgres';
    const port = parseInt(process.env.DATABASE_PORT || '5432');
    const user = process.env.DATABASE_USER || 'postgres';
    const password = process.env.DATABASE_PASSWORD || 'password';

    const adminSql = postgres({
      host,
      port,
      user,
      password,
      database: 'postgres',
    });

    // Terminate all connections to the database first
    await adminSql`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = ${databaseName}
        AND pid <> pg_backend_pid()
    `;

    // Drop database
    await adminSql.unsafe(`DROP DATABASE IF EXISTS ${databaseName}`);
    console.log(`[TenantProvisioning] Database ${databaseName} deleted`);

    await adminSql.end();
  } catch (error: any) {
    console.error(`[TenantProvisioning] Failed to delete tenant database:`, error);
    throw error;
  }
}
