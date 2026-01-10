#!/usr/bin/env tsx
/**
 * Recreate Tenant 2 Complete Setup
 *
 * 1. DROP tenant_2 database
 * 2. CREATE tenant_2 database
 * 3. Apply all migrations
 * 4. Seed test data
 *
 * Usage:
 * npx tsx src/scripts/recreate-tenant2-complete.ts
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'path';
import { fileURLToPath } from 'url';
import * as tenantSchema from '../tenant/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const host = process.env.DATABASE_HOST || 'localhost';
const port = parseInt(process.env.DATABASE_PORT || '5432');
const user = process.env.DATABASE_USER || 'postgres';
const password = process.env.DATABASE_PASSWORD || 'password';
const databaseName = 'tenant_2';

async function recreateTenant2() {
  let adminSql: any = null;
  let tenantSql: any = null;

  try {
    console.log('🔥 Recreating Tenant 2 from Scratch\n');

    // Step 1: DROP database
    console.log('🗑️  Step 1/4: Dropping existing database...');
    adminSql = postgres({
      host,
      port,
      user,
      password,
      database: 'postgres',
    });

    // Terminate existing connections
    await adminSql`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = ${databaseName}
        AND pid <> pg_backend_pid()
    `;

    // Drop database
    await adminSql.unsafe(`DROP DATABASE IF EXISTS ${databaseName}`);
    console.log(`  ✅ Database ${databaseName} dropped\n`);

    // Step 2: CREATE database
    console.log('📦 Step 2/4: Creating fresh database...');
    await adminSql.unsafe(`CREATE DATABASE ${databaseName}`);
    console.log(`  ✅ Database ${databaseName} created\n`);

    await adminSql.end();
    adminSql = null;

    // Step 3: Apply migrations
    console.log('🔄 Step 3/4: Applying migrations...');
    tenantSql = postgres({
      host,
      port,
      user,
      password,
      database: databaseName,
    });

    const db = drizzle(tenantSql, { schema: tenantSchema });
    const migrationsFolder = path.resolve(__dirname, '../../drizzle/migrations/tenant');

    await migrate(db, { migrationsFolder });
    console.log(`  ✅ Migrations applied\n`);

    // Step 4: Seed data
    console.log('🌱 Step 4/4: Seeding test data...\n');

    // Clients
    console.log('  👥 Creating clients...');
    const clients = await db.insert(tenantSchema.clients).values([
      {
        name: 'Sophie Martin',
        email: 'sophie.martin@test.com',
        phone: '+33 6 12 34 56 78',
        type: 'individual',
        address: '15 rue de la Musique',
        city: 'Paris',
        country: 'France',
        notes: 'Chanteuse professionnelle',
        isVip: true,
        portalAccess: true,
      },
      {
        name: 'Marc Dubois',
        email: 'marc.dubois@test.com',
        phone: '+33 6 23 45 67 89',
        type: 'individual',
        address: '42 avenue du Hip-Hop',
        city: 'Lyon',
        country: 'France',
        notes: 'Rappeur',
        isVip: false,
        portalAccess: true,
      },
    ]).returning();
    console.log(`     ✓ ${clients.length} clients`);

    // Rooms
    console.log('  🏠 Creating rooms...');
    const rooms = await db.insert(tenantSchema.rooms).values([
      {
        name: 'Studio A - Recording',
        description: 'Grande salle enregistrement',
        type: 'recording',
        hourlyRate: '75.00',
        halfDayRate: '280.00',
        fullDayRate: '500.00',
        capacity: 8,
        size: 45,
        hasIsolationBooth: true,
        hasLiveRoom: true,
        hasControlRoom: true,
        color: '#e74c3c',
        isActive: true,
        isAvailableForBooking: true,
      },
      {
        name: 'Studio B - Mixing',
        description: 'Salle de mixage',
        type: 'mixing',
        hourlyRate: '60.00',
        halfDayRate: '220.00',
        fullDayRate: '400.00',
        capacity: 4,
        size: 30,
        hasIsolationBooth: false,
        hasLiveRoom: false,
        hasControlRoom: true,
        color: '#3498db',
        isActive: true,
        isAvailableForBooking: true,
      },
    ]).returning();
    console.log(`     ✓ ${rooms.length} rooms`);

    // Task Types
    console.log('  ⏱️  Creating task types...');
    const taskTypes = await db.insert(tenantSchema.taskTypes).values([
      { name: 'Setup', description: 'Préparation', hourlyRate: '50.00', category: 'billable', color: '#3B82F6', sortOrder: 1, isActive: true },
      { name: 'Recording', description: 'Enregistrement', hourlyRate: '75.00', category: 'billable', color: '#EF4444', sortOrder: 2, isActive: true },
      { name: 'Mixing', description: 'Mixage', hourlyRate: '60.00', category: 'billable', color: '#10B981', sortOrder: 3, isActive: true },
      { name: 'Mastering', description: 'Mastering', hourlyRate: '80.00', category: 'billable', color: '#8B5CF6', sortOrder: 4, isActive: true },
      { name: 'Break', description: 'Pause', hourlyRate: '0.00', category: 'non-billable', color: '#6B7280', sortOrder: 5, isActive: true },
    ]).returning();
    console.log(`     ✓ ${taskTypes.length} task types`);

    // Session
    console.log('  📅 Creating test session...');
    const sessions = await db.insert(tenantSchema.sessions).values({
      clientId: clients[0].id,
      roomId: rooms[0].id,
      title: 'Test Timer Session',
      description: 'Session de test pour le chronomètre',
      startTime: new Date(),
      endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      status: 'in-progress',
      totalAmount: '300.00',
      depositAmount: '90.00',
      depositPaid: true,
      paymentStatus: 'partial',
    }).returning();
    console.log(`     ✓ ${sessions.length} session\n`);

    console.log('✅ ✅ ✅ TENANT 2 READY! ✅ ✅ ✅\n');
    console.log('📊 Summary:');
    console.log(`   • Clients: ${clients.length}`);
    console.log(`   • Rooms: ${rooms.length}`);
    console.log(`   • Task Types: ${taskTypes.length}`);
    console.log(`   • Sessions: ${sessions.length}\n`);

    console.log('🎯 Test Session:');
    console.log(`   • ID: ${sessions[0].id}`);
    console.log(`   • Client: ${clients[0].name}`);
    console.log(`   • Room: ${rooms[0].name}\n`);

    console.log('🔗 Test URL:');
    console.log(`   http://localhost:5174/sessions/${sessions[0].id}\n`);

    await tenantSql.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Failed:', error);

    if (adminSql) await adminSql.end().catch(() => {});
    if (tenantSql) await tenantSql.end().catch(() => {});

    process.exit(1);
  }
}

recreateTenant2();
