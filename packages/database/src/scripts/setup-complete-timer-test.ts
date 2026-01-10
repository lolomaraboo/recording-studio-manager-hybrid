#!/usr/bin/env tsx
/**
 * Complete Timer Test Setup Script
 *
 * This script does EVERYTHING needed to test the timer:
 * 1. Creates tenant_2 database if it doesn't exist
 * 2. Applies all migrations
 * 3. Seeds all necessary data (clients, rooms, task types, session)
 *
 * Usage:
 * DATABASE_HOST=localhost DATABASE_USER=postgres DATABASE_PASSWORD=password pnpm tsx src/scripts/setup-complete-timer-test.ts
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'path';
import { fileURLToPath } from 'url';
import * as tenantSchema from '../tenant/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection config
const host = process.env.DATABASE_HOST || 'localhost';
const port = parseInt(process.env.DATABASE_PORT || '5432');
const user = process.env.DATABASE_USER || 'postgres';
const password = process.env.DATABASE_PASSWORD || 'password';
const databaseName = 'tenant_2';

async function setupCompleteTimerTest() {
  let adminSql: any = null;
  let tenantSql: any = null;

  try {
    console.log('🚀 Complete Timer Test Setup\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ========================================
    // STEP 1: CREATE DATABASE
    // ========================================
    console.log('📦 Step 1/3: Creating database...');

    adminSql = postgres({
      host,
      port,
      user,
      password,
      database: 'postgres',
    });

    // Check if database exists
    const checkResult = await adminSql`
      SELECT 1 FROM pg_database WHERE datname = ${databaseName}
    `;

    if (checkResult.length === 0) {
      await adminSql.unsafe(`CREATE DATABASE ${databaseName}`);
      console.log(`  ✅ Database ${databaseName} created\n`);
    } else {
      console.log(`  ℹ️  Database ${databaseName} already exists\n`);
    }

    await adminSql.end();
    adminSql = null;

    // ========================================
    // STEP 2: APPLY MIGRATIONS
    // ========================================
    console.log('🔄 Step 2/3: Applying migrations...');

    tenantSql = postgres({
      host,
      port,
      user,
      password,
      database: databaseName,
    });

    const db = drizzle(tenantSql, { schema: tenantSchema });

    const migrationsFolder = path.resolve(__dirname, '../../drizzle/migrations/tenant');
    console.log(`  📁 Migrations folder: ${migrationsFolder}`);

    await migrate(db, { migrationsFolder });
    console.log(`  ✅ Migrations applied\n`);

    // ========================================
    // STEP 3: SEED DATA
    // ========================================
    console.log('🌱 Step 3/3: Seeding test data...\n');

    // 3.1 - Clients
    console.log('  👥 Creating clients...');
    const clientsData = [
      {
        name: 'Sophie Martin',
        email: 'sophie.martin@test.com',
        phone: '+33 6 12 34 56 78',
        type: 'individual' as const,
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
        type: 'individual' as const,
        address: '42 avenue du Hip-Hop',
        city: 'Lyon',
        country: 'France',
        notes: 'Rappeur',
        isVip: false,
        portalAccess: true,
      },
    ];

    const clients = await db.insert(tenantSchema.clients).values(clientsData).returning();
    console.log(`     ✓ ${clients.length} clients created`);

    // 3.2 - Rooms
    console.log('  🏠 Creating rooms...');
    const roomsData = [
      {
        name: 'Studio A - Recording',
        description: 'Grande salle d\'enregistrement',
        type: 'recording' as const,
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
        type: 'mixing' as const,
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
    ];

    const rooms = await db.insert(tenantSchema.rooms).values(roomsData).returning();
    console.log(`     ✓ ${rooms.length} rooms created`);

    // 3.3 - Task Types
    console.log('  ⏱️  Creating task types...');
    const taskTypesData = [
      {
        name: 'Setup',
        description: 'Installation et préparation',
        hourlyRate: '50.00',
        category: 'billable' as const,
        color: '#3B82F6',
        sortOrder: 1,
        isActive: true,
      },
      {
        name: 'Recording',
        description: 'Enregistrement actif',
        hourlyRate: '75.00',
        category: 'billable' as const,
        color: '#EF4444',
        sortOrder: 2,
        isActive: true,
      },
      {
        name: 'Mixing',
        description: 'Mixage audio',
        hourlyRate: '60.00',
        category: 'billable' as const,
        color: '#10B981',
        sortOrder: 3,
        isActive: true,
      },
      {
        name: 'Mastering',
        description: 'Mastering',
        hourlyRate: '80.00',
        category: 'billable' as const,
        color: '#8B5CF6',
        sortOrder: 4,
        isActive: true,
      },
      {
        name: 'Break',
        description: 'Pause (non facturable)',
        hourlyRate: '0.00',
        category: 'non-billable' as const,
        color: '#6B7280',
        sortOrder: 5,
        isActive: true,
      },
    ];

    const taskTypes = await db.insert(tenantSchema.taskTypes).values(taskTypesData).returning();
    console.log(`     ✓ ${taskTypes.length} task types created`);

    // 3.4 - Test Session
    console.log('  📅 Creating test session...');
    const sessionData = {
      clientId: clients[0].id,
      roomId: rooms[0].id,
      title: 'Test Timer Session',
      description: 'Session de test pour le chronomètre',
      startTime: new Date(),
      endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      status: 'in-progress' as const,
      totalAmount: '300.00',
      depositAmount: '90.00',
      depositPaid: true,
      paymentStatus: 'partial' as const,
    };

    const sessions = await db.insert(tenantSchema.sessions).values(sessionData).returning();
    console.log(`     ✓ ${sessions.length} session created\n`);

    // ========================================
    // SUCCESS SUMMARY
    // ========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ ✅ ✅ SETUP COMPLETE! ✅ ✅ ✅\n');
    console.log('📊 Summary:');
    console.log(`   • Database: ${databaseName}`);
    console.log(`   • Clients: ${clients.length}`);
    console.log(`   • Rooms: ${rooms.length}`);
    console.log(`   • Task Types: ${taskTypes.length}`);
    console.log(`   • Sessions: ${sessions.length}\n`);

    console.log('🎯 Test Session Details:');
    console.log(`   • ID: ${sessions[0].id}`);
    console.log(`   • Title: ${sessions[0].title}`);
    console.log(`   • Client: ${clients[0].name}`);
    console.log(`   • Room: ${rooms[0].name}`);
    console.log(`   • Status: ${sessions[0].status}\n`);

    console.log('🔗 Access URL:');
    console.log(`   http://localhost:5174/sessions/${sessions[0].id}\n`);

    console.log('⚡ Next Steps:');
    console.log('   1. Open browser at http://localhost:5174');
    console.log('   2. Navigate to Sessions');
    console.log('   3. Open "Test Timer Session"');
    console.log('   4. Test the ActiveTimer component\n');

    await tenantSql.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Setup failed:', error);

    if (adminSql) {
      try {
        await adminSql.end();
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    if (tenantSql) {
      try {
        await tenantSql.end();
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    process.exit(1);
  }
}

// Run setup
setupCompleteTimerTest();
