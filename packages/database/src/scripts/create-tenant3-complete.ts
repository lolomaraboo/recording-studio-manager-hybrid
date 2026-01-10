#!/usr/bin/env tsx
/**
 * Create Fresh Tenant 3 for Timer Testing
 *
 * Creates tenant_3 database with:
 * - All migrations (including task_types)
 * - Complete test data
 * - Ready for timer testing
 *
 * Usage:
 * cd packages/database
 * npx tsx src/scripts/create-tenant3-complete.ts
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'path';
import { fileURLToPath } from 'url';
import * as tenantSchema from '../tenant/schema.js';
import * as masterSchema from '../master/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const host = process.env.DATABASE_HOST || 'localhost';
const port = parseInt(process.env.DATABASE_PORT || '5432');
const user = process.env.DATABASE_USER || 'postgres';
const password = process.env.DATABASE_PASSWORD || 'password';

async function createTenant3() {
  let adminSql: any = null;
  let tenantSql: any = null;
  let masterSql: any = null;

  try {
    console.log('🚀 Creating Fresh Tenant 3 for Timer Testing\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // STEP 1: Create tenant_3 database
    console.log('📦 Step 1/5: Creating tenant_3 database...');
    adminSql = postgres({ host, port, user, password, database: 'postgres' });

    // Drop if exists
    await adminSql`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'tenant_3'
        AND pid <> pg_backend_pid()
    `;
    await adminSql.unsafe(`DROP DATABASE IF EXISTS tenant_3`);
    await adminSql.unsafe(`CREATE DATABASE tenant_3`);
    console.log('  ✅ Database tenant_3 created\n');
    await adminSql.end();
    adminSql = null;

    // STEP 2: Apply ALL migrations
    console.log('🔄 Step 2/5: Applying ALL migrations...');
    tenantSql = postgres({ host, port, user, password, database: 'tenant_3' });
    const tenantDb = drizzle(tenantSql, { schema: tenantSchema });
    const migrationsFolder = path.resolve(__dirname, '../../drizzle/migrations/tenant');
    await migrate(tenantDb, { migrationsFolder });
    console.log('  ✅ All migrations applied\n');

    // STEP 3: Seed test data
    console.log('🌱 Step 3/5: Seeding test data...\n');

    // Clients
    console.log('  👥 Creating clients...');
    const clients = await tenantDb.insert(tenantSchema.clients).values([
      {
        name: 'Sophie Martin',
        email: 'sophie@test.com',
        phone: '+33 6 12 34 56 78',
        type: 'individual',
        city: 'Paris',
        country: 'France',
      },
      {
        name: 'Marc Dubois',
        email: 'marc@test.com',
        phone: '+33 6 23 45 67 89',
        type: 'individual',
        city: 'Lyon',
        country: 'France',
      },
    ]).returning();
    console.log(`     ✓ ${clients.length} clients`);

    // Rooms
    console.log('  🏠 Creating rooms...');
    const rooms = await tenantDb.insert(tenantSchema.rooms).values([
      {
        name: 'Studio A',
        type: 'recording',
        hourlyRate: '75.00',
        capacity: 8,
        isActive: true,
      },
      {
        name: 'Studio B',
        type: 'mixing',
        hourlyRate: '60.00',
        capacity: 4,
        isActive: true,
      },
    ]).returning();
    console.log(`     ✓ ${rooms.length} rooms`);

    // Task Types (THIS IS THE KEY!)
    console.log('  ⏱️  Creating task types...');
    const taskTypes = await tenantDb.insert(tenantSchema.taskTypes).values([
      { name: 'Setup', description: 'Préparation studio', hourlyRate: '50.00', category: 'billable', color: '#3B82F6', sortOrder: 1, isActive: true },
      { name: 'Recording', description: 'Enregistrement actif', hourlyRate: '75.00', category: 'billable', color: '#EF4444', sortOrder: 2, isActive: true },
      { name: 'Mixing', description: 'Mixage', hourlyRate: '60.00', category: 'billable', color: '#10B981', sortOrder: 3, isActive: true },
      { name: 'Break', description: 'Pause', hourlyRate: '0.00', category: 'non-billable', color: '#6B7280', sortOrder: 4, isActive: true },
    ]).returning();
    console.log(`     ✓ ${taskTypes.length} task types`);

    // Test Session
    console.log('  📅 Creating test session...');
    const sessions = await tenantDb.insert(tenantSchema.sessions).values({
      clientId: clients[0].id,
      roomId: rooms[0].id,
      title: 'Session Test Minuteur',
      description: 'Session pour tester le chronomètre',
      startTime: new Date(),
      endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      status: 'in-progress',
      totalAmount: '300.00',
    }).returning();
    console.log(`     ✓ ${sessions.length} session\n`);

    await tenantSql.end();
    tenantSql = null;

    // STEP 4: Register in master database
    console.log('📝 Step 4/5: Registering in master database...');
    masterSql = postgres({ host, port, user, password, database: 'rsm_master' });
    const masterDb = drizzle(masterSql, { schema: masterSchema });

    // Create organization 3
    const [org] = await masterDb.insert(masterSchema.organizations).values({
      name: 'Timer Test Studio',
      slug: 'timer-test',
      subdomain: 'timer-test',
      ownerId: 1, // Assuming user 1 exists
    }).onConflictDoNothing().returning();

    if (org) {
      // Register tenant database
      await masterDb.insert(masterSchema.tenantDatabases).values({
        organizationId: org.id,
        databaseName: 'tenant_3',
      }).onConflictDoNothing();
      console.log(`  ✅ Organization ${org.id} registered\n`);
    } else {
      console.log(`  ℹ️  Organization already exists\n`);
    }

    await masterSql.end();
    masterSql = null;

    // STEP 5: Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ ✅ ✅ TENANT 3 READY FOR TIMER TESTING! ✅ ✅ ✅\n');
    console.log('📊 Data Created:');
    console.log(`   • Database: tenant_3`);
    console.log(`   • Clients: ${clients.length}`);
    console.log(`   • Rooms: ${rooms.length}`);
    console.log(`   • Task Types: ${taskTypes.length} ⭐`);
    console.log(`   • Sessions: ${sessions.length}\n`);

    console.log('🎯 Session Details:');
    console.log(`   • ID: ${sessions[0].id}`);
    console.log(`   • Title: ${sessions[0].title}`);
    console.log(`   • Client: ${clients[0].name}`);
    console.log(`   • Room: ${rooms[0].name}\n`);

    console.log('⚙️  Next Steps:');
    console.log('   1. Update packages/client/src/main.tsx:');
    console.log('      Change x-test-org-id to "3"');
    console.log('   2. Refresh browser');
    console.log('   3. Go to http://localhost:5174/sessions/' + sessions[0].id);
    console.log('   4. Test the timer!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed:', error);
    if (adminSql) await adminSql.end().catch(() => {});
    if (tenantSql) await tenantSql.end().catch(() => {});
    if (masterSql) await masterSql.end().catch(() => {});
    process.exit(1);
  }
}

createTenant3();
