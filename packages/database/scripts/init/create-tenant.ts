#!/usr/bin/env tsx
/**
 * Universal Tenant Creation Script
 *
 * Creates a new tenant database with:
 * - Organization record in master DB
 * - New PostgreSQL database (tenant_N)
 * - Registration in tenant_databases table
 * - All current tenant migrations applied
 * - Validation of exact table count (31 tables expected)
 *
 * Usage:
 *   pnpm exec tsx scripts/init/create-tenant.ts          # Auto-increment
 *   pnpm exec tsx scripts/init/create-tenant.ts 5        # Explicit tenant number
 */

import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/rsm_master';
const EXPECTED_TABLE_COUNT = 31;

interface TenantInfo {
  tenantNumber: number;
  organizationId: number;
  organizationName: string;
  databaseName: string;
  connectionString: string;
}

/**
 * Find next available tenant number by checking existing tenant databases
 */
async function findNextTenantNumber(sql: postgres.Sql): Promise<number> {
  const result = await sql`
    SELECT database_name
    FROM tenant_databases
    ORDER BY database_name DESC
    LIMIT 1
  `;

  if (result.length === 0) {
    return 1; // First tenant
  }

  const lastDbName = result[0].database_name;
  const match = lastDbName.match(/^tenant_(\d+)$/);

  if (!match) {
    throw new Error(`Invalid database name format: ${lastDbName}`);
  }

  return parseInt(match[1]) + 1;
}

/**
 * Create test user (owner) for organization
 */
async function createTestUser(sql: postgres.Sql, tenantNumber: number): Promise<number> {
  console.log('\n👤 Creating test user (owner)...');

  const email = `tenant${tenantNumber}@test.local`;

  // Check if user exists
  const existing = await sql`
    SELECT id FROM users WHERE email = ${email}
  `;

  if (existing.length > 0) {
    console.log(`   ✅ Using existing user: ${email} (ID: ${existing[0].id})`);
    return existing[0].id;
  }

  const [user] = await sql`
    INSERT INTO users (email, name, role, created_at, updated_at)
    VALUES (${email}, ${'Tenant ' + tenantNumber + ' Owner'}, 'admin', NOW(), NOW())
    RETURNING id, email
  `;

  console.log(`   ✅ Created user: ${user.email} (ID: ${user.id})`);
  return user.id;
}

/**
 * Create organization in master database
 */
async function createOrganization(sql: postgres.Sql, tenantNumber: number, ownerId: number): Promise<number> {
  console.log('\n📝 Creating organization in master database...');

  const orgName = `Tenant ${tenantNumber} Organization`;
  const slug = `tenant-${tenantNumber}`;
  const subdomain = `tenant${tenantNumber}`;

  const [org] = await sql`
    INSERT INTO organizations (name, slug, subdomain, owner_id, created_at, updated_at)
    VALUES (${orgName}, ${slug}, ${subdomain}, ${ownerId}, NOW(), NOW())
    RETURNING id, name
  `;

  console.log(`✅ Organization created: "${org.name}" (ID: ${org.id})`);
  console.log(`   Slug:      ${slug}`);
  console.log(`   Subdomain: ${subdomain}`);
  return org.id;
}

/**
 * Create PostgreSQL database for tenant
 */
async function createTenantDatabase(sql: postgres.Sql, tenantNumber: number): Promise<string> {
  const dbName = `tenant_${tenantNumber}`;

  console.log(`\n📦 Creating PostgreSQL database: ${dbName}...`);

  // Check if database already exists
  const databases = await sql`
    SELECT datname FROM pg_database WHERE datname = ${dbName}
  `;

  if (databases.length > 0) {
    throw new Error(`Database ${dbName} already exists. Choose a different tenant number or drop the existing database.`);
  }

  await sql.unsafe(`CREATE DATABASE ${dbName}`);
  console.log(`✅ Database created: ${dbName}`);

  return dbName;
}

/**
 * Register tenant database in master DB
 */
async function registerTenantDatabase(
  sql: postgres.Sql,
  organizationId: number,
  databaseName: string
): Promise<void> {
  console.log('\n🔗 Registering tenant database mapping...');

  await sql`
    INSERT INTO tenant_databases (organization_id, database_name, created_at)
    VALUES (${organizationId}, ${databaseName}, NOW())
  `;

  console.log(`✅ Registered mapping: org ${organizationId} → ${databaseName}`);
}

/**
 * Apply all tenant migrations to new database
 */
async function applyTenantMigrations(databaseName: string): Promise<void> {
  console.log('\n📝 Applying tenant migrations...');

  const migrationsDir = path.resolve(__dirname, '../../drizzle/migrations/tenant');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files\n`);

  const tenantSql = postgres(`postgresql://postgres@localhost:5432/${databaseName}`, { max: 1 });

  try {
    for (const file of files) {
      console.log(`  📄 Applying ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const migrationSql = fs.readFileSync(filePath, 'utf-8');

      // Execute migration SQL
      // Handle both Drizzle-generated (with "--> statement-breakpoint")
      // and custom SQL migrations (with standard SQL)

      if (migrationSql.includes('--> statement-breakpoint')) {
        // Drizzle-generated migration: split by statement-breakpoint
        const statements = migrationSql
          .split('--> statement-breakpoint')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'))
          .map(s => s.replace(/;$/, '')); // Remove trailing semicolons

        for (const statement of statements) {
          if (statement.trim()) {
            await tenantSql.unsafe(statement);
          }
        }
      } else {
        // Custom SQL migration: execute as-is
        // Remove comments but keep the whole file structure
        await tenantSql.unsafe(migrationSql);
      }
    }

    console.log('\n✅ All migrations applied successfully');
  } finally {
    await tenantSql.end();
  }
}

/**
 * Validate exact table count after migrations
 * CRITICAL: Ensures migrations created all expected tables
 */
async function validateTableCount(databaseName: string): Promise<void> {
  console.log('\n🔍 Validating table count...');

  const tenantSql = postgres(`postgresql://postgres@localhost:5432/${databaseName}`, { max: 1 });

  try {
    const result = await tenantSql`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;

    const actualCount = parseInt(result[0].count as string);

    console.log(`   Expected: ${EXPECTED_TABLE_COUNT} tables`);
    console.log(`   Actual:   ${actualCount} tables`);

    if (actualCount !== EXPECTED_TABLE_COUNT) {
      console.error(`\n❌ VALIDATION FAILED: Expected ${EXPECTED_TABLE_COUNT} tables, got ${actualCount}`);
      console.error('   This indicates migration failure or schema mismatch.');

      // Show actual tables for debugging
      const tables = await tenantSql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;

      console.error(`\n   Tables created (${actualCount}):`);
      tables.forEach((t: any, i: number) => {
        console.error(`     ${(i + 1).toString().padStart(2, ' ')}. ${t.table_name}`);
      });

      console.error('\n   Rolling back...');

      // Rollback will be handled by caller
      throw new Error(`Table count mismatch: expected ${EXPECTED_TABLE_COUNT}, got ${actualCount}`);
    }

    console.log(`\n✅ Validated: ${actualCount} tables created (matches expected count)`);
  } finally {
    await tenantSql.end();
  }
}

/**
 * Rollback: Drop database and remove organization records
 */
async function rollback(
  sql: postgres.Sql,
  databaseName: string | null,
  organizationId: number | null
): Promise<void> {
  console.log('\n⏪ Rolling back changes...');

  try {
    if (databaseName) {
      // Terminate all connections to the database first
      await sql.unsafe(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${databaseName}' AND pid <> pg_backend_pid()
      `);

      await sql.unsafe(`DROP DATABASE IF EXISTS ${databaseName}`);
      console.log(`   ✅ Dropped database: ${databaseName}`);
    }

    if (organizationId) {
      await sql`DELETE FROM tenant_databases WHERE organization_id = ${organizationId}`;
      await sql`DELETE FROM organizations WHERE id = ${organizationId}`;
      console.log(`   ✅ Deleted organization record: ID ${organizationId}`);
    }

    console.log('✅ Rollback complete');
  } catch (error) {
    console.error('⚠️  Error during rollback:', error);
    console.error('   Manual cleanup may be required.');
  }
}

/**
 * List all tables in tenant database (for verification)
 */
async function listTables(databaseName: string): Promise<void> {
  console.log('\n📊 Tenant database tables:');

  const tenantSql = postgres(`postgresql://postgres@localhost:5432/${databaseName}`, { max: 1 });

  try {
    const tables = await tenantSql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    tables.forEach((t: any, i: number) => {
      console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${t.table_name}`);
    });
  } finally {
    await tenantSql.end();
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  let tenantNumber: number | null = null;

  if (args.length > 0) {
    tenantNumber = parseInt(args[0]);
    if (isNaN(tenantNumber) || tenantNumber <= 0) {
      console.error('❌ Invalid tenant number. Must be a positive integer.');
      process.exit(1);
    }
  }

  console.log('🚀 Universal Tenant Creation Script');
  console.log('=====================================\n');

  const sql = postgres(DATABASE_URL, { max: 1 });
  let organizationId: number | null = null;
  let databaseName: string | null = null;

  try {
    // Step 1: Determine tenant number
    if (!tenantNumber) {
      tenantNumber = await findNextTenantNumber(sql);
      console.log(`🔢 Auto-detected next tenant number: ${tenantNumber}`);
    } else {
      console.log(`🔢 Using explicit tenant number: ${tenantNumber}`);
    }

    // Step 2: Create test user (owner)
    const ownerId = await createTestUser(sql, tenantNumber);

    // Step 3: Create organization
    organizationId = await createOrganization(sql, tenantNumber, ownerId);

    // Step 4: Create PostgreSQL database
    databaseName = await createTenantDatabase(sql, tenantNumber);

    // Step 5: Register in tenant_databases
    await registerTenantDatabase(sql, organizationId, databaseName);

    // Step 6: Apply migrations
    await applyTenantMigrations(databaseName);

    // Step 7: CRITICAL - Validate table count
    await validateTableCount(databaseName);

    // Step 8: List tables (verification)
    await listTables(databaseName);

    // Success summary
    const connectionString = `postgresql://postgres@localhost:5432/${databaseName}`;

    console.log('\n✨ Tenant created successfully!');
    console.log('================================');
    console.log(`   Tenant Number:     ${tenantNumber}`);
    console.log(`   Organization ID:   ${organizationId}`);
    console.log(`   Organization Name: Tenant ${tenantNumber} Organization`);
    console.log(`   Database Name:     ${databaseName}`);
    console.log(`   Connection:        ${connectionString}`);
    console.log('\n💡 Next steps:');
    console.log(`   1. Seed base data:       DATABASE_URL="${connectionString}" pnpm exec tsx scripts/init/seed-base-data.ts`);
    console.log(`   2. Seed realistic data:  DATABASE_URL="${connectionString}" pnpm exec tsx scripts/init/seed-realistic-data.ts`);
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error creating tenant:', error);

    // Attempt rollback
    await rollback(sql, databaseName, organizationId);

    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
