#!/usr/bin/env tsx
/**
 * Test Workflow Script
 *
 * Tests the complete workflow of creating an organization
 * and verifying tenant auto-provisioning
 */

import { getMasterDb } from '@rsm/database/connection';
import { organizations } from '@rsm/database/master';
import { createTenantDatabase } from '../services/tenant-provisioning';
import postgres from 'postgres';

async function testWorkflow() {
  console.log('🧪 Testing Complete Workflow\n');

  const db = await getMasterDb();

  // Step 1: Create organization (simulating what happens in auth.register)
  console.log('📝 Step 1: Creating new organization...');
  const [org] = await db
    .insert(organizations)
    .values({
      name: 'Test Workflow Studio',
      slug: 'test-workflow-studio',
      subdomain: 'test-workflow-' + Date.now(),
      ownerId: 10, // User we just created
      timezone: 'Pacific/Tahiti',
      currency: 'USD',
    })
    .returning();

  console.log(`   ✅ Organization created: ID ${org.id}, Name: ${org.name}\n`);

  // Step 2: Auto-provision tenant (this is what should happen automatically)
  console.log('🔧 Step 2: Auto-provisioning tenant database...');
  const result = await createTenantDatabase(org.id);

  if (!result.success) {
    console.error(`   ❌ Failed: ${result.error}`);
    process.exit(1);
  }

  console.log(`   ✅ Tenant ${result.databaseName} created and migrated\n`);

  // Step 3: Verify database exists
  console.log('🔍 Step 3: Verifying database exists...');
  const checkSql = postgres({
    host: process.env.DATABASE_HOST || 'postgres',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: 'postgres',
  });

  const dbCheck = await checkSql`
    SELECT 1 FROM pg_database WHERE datname = ${result.databaseName}
  `;
  await checkSql.end();

  if (dbCheck.length === 0) {
    console.error(`   ❌ Database ${result.databaseName} does not exist!`);
    process.exit(1);
  }

  console.log(`   ✅ Database ${result.databaseName} exists\n`);

  // Step 4: Verify migrations applied (check for ai_conversations table)
  console.log('🔍 Step 4: Verifying migrations applied...');
  const tenantSql = postgres({
    host: process.env.DATABASE_HOST || 'postgres',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: result.databaseName,
  });

  try {
    const tableCheck = await tenantSql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'ai_conversations'
      ) as exists
    `;

    if (!tableCheck[0].exists) {
      console.error('   ❌ ai_conversations table does not exist!');
      await tenantSql.end();
      process.exit(1);
    }

    console.log('   ✅ ai_conversations table exists');

    // Count all tables
    const tables = await tenantSql`
      SELECT COUNT(*) as count FROM information_schema.tables
      WHERE table_schema = 'public'
    `;

    console.log(`   ✅ Found ${tables[0].count} tables in tenant database\n`);

    await tenantSql.end();
  } catch (error) {
    console.error('   ❌ Error checking tables:', error);
    await tenantSql.end();
    process.exit(1);
  }

  // Step 5: Summary
  console.log('✨ WORKFLOW TEST COMPLETE!\n');
  console.log('Summary:');
  console.log(`   - Organization ID: ${org.id}`);
  console.log(`   - Organization Name: ${org.name}`);
  console.log(`   - Tenant Database: ${result.databaseName}`);
  console.log(`   - Owner User ID: ${org.ownerId}`);
  console.log('\n✅ All systems operational! Auto-provisioning works correctly.\n');

  process.exit(0);
}

testWorkflow().catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
