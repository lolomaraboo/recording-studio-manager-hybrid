#!/usr/bin/env tsx
/**
 * Cleanup Test Script
 *
 * Cleans up the test organization and tenant database
 */

import { getMasterDb } from '@rsm/database/connection';
import { organizations, users } from '@rsm/database/master';
import { deleteTenantDatabase } from '../services/tenant-provisioning';
import { eq } from 'drizzle-orm';

async function cleanup() {
  console.log('🧹 Cleaning up test data...\n');

  const db = await getMasterDb();

  // Find test org
  const testOrg = await db.query.organizations.findFirst({
    where: eq(organizations.name, 'Test Workflow Studio'),
  });

  if (!testOrg) {
    console.log('   ℹ️  No test organization found, nothing to clean up');
    process.exit(0);
  }

  console.log(`📝 Found test organization: ID ${testOrg.id}`);

  // Delete tenant database
  console.log('🗑️  Deleting tenant database...');
  try {
    await deleteTenantDatabase(testOrg.id);
    console.log('   ✅ Tenant database deleted');
  } catch (error: any) {
    console.log(`   ⚠️  ${error.message}`);
  }

  // Delete organization
  console.log('🗑️  Deleting organization...');
  await db.delete(organizations).where(eq(organizations.id, testOrg.id));
  console.log('   ✅ Organization deleted');

  // Delete test user
  console.log('🗑️  Deleting test user...');
  await db.delete(users).where(eq(users.email, 'testworkflow@example.com'));
  console.log('   ✅ Test user deleted');

  console.log('\n✨ Cleanup complete!\n');
  process.exit(0);
}

cleanup().catch((error) => {
  console.error('💥 Cleanup failed:', error);
  process.exit(1);
});
