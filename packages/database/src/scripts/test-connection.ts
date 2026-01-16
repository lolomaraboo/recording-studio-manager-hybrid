import { getMasterDb, getTenantDb } from '../connection';

async function test() {
  console.log('Testing database connections...');

  try {
    // Test master DB
    const masterDb = await getMasterDb();
    const users = await masterDb.query.users.findMany({ limit: 1 });
    console.log('✅ Master DB connection OK');
    console.log(`   Users table accessible: ${users !== undefined}`);

    // Test tenant DB
    const tenantDb = await getTenantDb(1);
    const clients = await tenantDb.query.clients.findMany({ limit: 1 });
    console.log('✅ Tenant DB (tenant_1) connection OK');
    console.log(`   Clients table accessible: ${clients !== undefined}`);

    console.log('\n✅ All database connections working!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

test();
