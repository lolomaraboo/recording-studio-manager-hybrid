/**
 * Create tenant database for Organization 16 (Test Studio UI)
 * This was missing when test data was created with SQL scripts
 */

import { createTenantDatabase } from '../connection.js';

async function main() {
  console.log('🔧 Creating tenant database for Organization 16...');

  try {
    await createTenantDatabase(16);
    console.log('✅ Tenant database created successfully for Organization 16');
    console.log('📊 Database: tenant_16');
    console.log('🔗 Registered in tenant_databases table');
    console.log('✨ Migrations applied');
  } catch (error) {
    console.error('❌ Failed to create tenant database:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
