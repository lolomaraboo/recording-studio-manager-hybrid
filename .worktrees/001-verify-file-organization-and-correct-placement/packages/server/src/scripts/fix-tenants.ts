#!/usr/bin/env tsx
/**
 * Fix Missing Tenants Script
 *
 * This script creates tenant databases for organizations that don't have one.
 * Run this after implementing the auto-provisioning system to fix existing orgs.
 *
 * Usage: tsx scripts/fix-tenants.ts
 */

import { getMasterDb } from '@rsm/database/connection';
import { organizations, tenantDatabases } from '@rsm/database/master';
import { createTenantDatabase } from '../services/tenant-provisioning';

async function fixMissingTenants() {
  console.log('🔧 Checking for organizations without tenant databases...\n');

  const db = await getMasterDb();

  // Get all organizations
  const allOrgs = await db.select().from(organizations);
  console.log(`📊 Found ${allOrgs.length} total organizations`);

  // Get organizations that already have tenant databases
  const existingTenants = await db
    .select({ organizationId: tenantDatabases.organizationId })
    .from(tenantDatabases);

  const existingOrgIds = existingTenants.map((t) => t.organizationId);
  console.log(`✅ ${existingOrgIds.length} organizations already have tenant databases`);

  // Find organizations without tenant databases
  const missingOrgs = allOrgs.filter((org) => !existingOrgIds.includes(org.id));

  if (missingOrgs.length === 0) {
    console.log('\n✨ All organizations have tenant databases! Nothing to fix.');
    process.exit(0);
  }

  console.log(`\n⚠️  Found ${missingOrgs.length} organizations without tenant databases:\n`);

  for (const org of missingOrgs) {
    console.log(`   - Org ${org.id}: ${org.name}`);
  }

  console.log('\n🔨 Creating missing tenant databases...\n');

  for (const org of missingOrgs) {
    console.log(`[${org.id}] ${org.name}`);
    const result = await createTenantDatabase(org.id);

    if (result.success) {
      console.log(`   ✅ Created ${result.databaseName}`);
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
    }
  }

  console.log('\n✨ Done!\n');
  process.exit(0);
}

// Run the script
fixMissingTenants().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
