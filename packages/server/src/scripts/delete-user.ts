#!/usr/bin/env tsx
/**
 * Delete User Script
 *
 * Safely deletes a user and their organization + tenant database
 */

import { getMasterDb } from '@rsm/database/connection';
import { organizations, users, organizationMembers } from '@rsm/database/master';
import { deleteTenantDatabase } from '../services/tenant-provisioning';
import { eq } from 'drizzle-orm';

const email = process.argv[2];

if (!email) {
  console.error('Usage: npx tsx delete-user.ts <email>');
  process.exit(1);
}

async function deleteUser() {
  console.log(`🗑️  Deleting user: ${email}\n`);

  const db = await getMasterDb();

  // Find user
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    console.log('   ℹ️  User not found');
    process.exit(0);
  }

  console.log(`📝 Found user: ID ${user.id}, Name: ${user.name}`);

  // Find owned organizations
  const ownedOrgs = await db
    .select()
    .from(organizations)
    .where(eq(organizations.ownerId, user.id));

  if (ownedOrgs.length > 0) {
    console.log(`\n🏢 Found ${ownedOrgs.length} owned organization(s):`);

    for (const org of ownedOrgs) {
      console.log(`\n   [Org ${org.id}] ${org.name}`);

      // Delete tenant database
      console.log('   🗑️  Deleting tenant database...');
      try {
        await deleteTenantDatabase(org.id);
        console.log('      ✅ Tenant deleted');
      } catch (error: any) {
        console.log(`      ⚠️  ${error.message}`);
      }

      // Delete organization members
      await db
        .delete(organizationMembers)
        .where(eq(organizationMembers.organizationId, org.id));

      // Delete organization
      await db.delete(organizations).where(eq(organizations.id, org.id));
      console.log('      ✅ Organization deleted');
    }
  }

  // Remove from organization memberships
  await db.delete(organizationMembers).where(eq(organizationMembers.userId, user.id));

  // Delete user
  console.log('\n👤 Deleting user...');
  await db.delete(users).where(eq(users.id, user.id));
  console.log('   ✅ User deleted');

  console.log('\n✨ Done!\n');
  process.exit(0);
}

deleteUser().catch((error) => {
  console.error('💥 Failed:', error);
  process.exit(1);
});
