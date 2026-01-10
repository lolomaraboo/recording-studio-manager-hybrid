/**
 * Create tenant database for organization 2
 * This ensures tenant_2 exists with proper schema before seeding data
 */

import { createTenantDatabase } from './packages/server/src/services/tenant-provisioning.js';
import { closeAllConnections } from './packages/database/src/connection.js';

async function main() {
  console.log('🔧 Creating tenant database for organization 2...\n');

  try {
    const result = await createTenantDatabase(2);

    if (result.success) {
      console.log('\n✅ Tenant database created successfully!');
      console.log(`   Database: ${result.databaseName}`);
      console.log('\n📝 Next step: Run the seed script:');
      console.log('   cd packages/database');
      console.log('   DATABASE_URL="postgresql://localhost:5432/rsm_master" pnpm tsx src/scripts/seed-timer-test-data.ts\n');
    } else {
      console.error(`\n❌ Failed to create tenant database: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await closeAllConnections();
  }
}

main();
