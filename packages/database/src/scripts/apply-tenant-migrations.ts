#!/usr/bin/env tsx
/**
 * Apply tenant schema migrations to all existing tenant databases
 *
 * This script finds all tenant databases and applies pending migrations to each.
 * Used when deploying schema changes to production tenants.
 *
 * Usage: DATABASE_URL="postgresql://postgres:password@localhost:5432/rsm_master" tsx src/scripts/apply-tenant-migrations.ts
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TenantDatabase {
  id: number;
  organization_id: number;
  database_name: string;
}

async function getTenantDatabases(masterClient: postgres.Sql): Promise<TenantDatabase[]> {
  const result = await masterClient<TenantDatabase[]>`
    SELECT id, organization_id, database_name
    FROM tenant_databases
    ORDER BY organization_id
  `;
  return result;
}

async function applyTenantMigrations(tenantDbName: string) {
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/rsm_master';

  // Replace database name in connection string
  const tenantUrl = databaseUrl.replace(/\/[^/]+$/, `/${tenantDbName}`);

  const tenantClient = postgres(tenantUrl, { max: 1 });
  const tenantDb = drizzle(tenantClient);

  try {
    await migrate(tenantDb, {
      migrationsFolder: join(__dirname, '../../drizzle/migrations/tenant'),
    });
    console.log(`   ✅ Migrations applied to ${tenantDbName}`);
  } catch (error) {
    console.error(`   ❌ Migration failed for ${tenantDbName}:`, error);
    throw error;
  } finally {
    await tenantClient.end();
  }
}

async function main() {
  const masterUrl = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/rsm_master';

  console.log('🔍 Finding tenant databases...\n');

  const masterClient = postgres(masterUrl, { max: 1 });

  try {
    const tenants = await getTenantDatabases(masterClient);

    if (tenants.length === 0) {
      console.log('⚠️  No tenant databases found in tenant_databases table');
      return;
    }

    console.log(`📋 Found ${tenants.length} tenant database(s):\n`);
    tenants.forEach(t => {
      console.log(`   - ${t.database_name} (Org ${t.organization_id})`);
    });

    console.log('\n🔄 Applying migrations to each tenant...\n');

    for (const tenant of tenants) {
      console.log(`📦 Migrating: ${tenant.database_name}`);
      await applyTenantMigrations(tenant.database_name);
    }

    console.log('\n✅ All tenant migrations complete!\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await masterClient.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
