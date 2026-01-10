#!/usr/bin/env tsx
/**
 * Direct Seed for Timer Testing
 *
 * Inserts data directly into existing tenant_2 database
 * Assumes database and schema already exist
 *
 * Usage:
 * cd packages/database
 * npx tsx src/scripts/seed-timer-direct.ts
 */

import postgres from 'postgres';

const host = process.env.DATABASE_HOST || 'localhost';
const port = parseInt(process.env.DATABASE_PORT || '5432');
const user = process.env.DATABASE_USER || 'postgres';
const password = process.env.DATABASE_PASSWORD || 'password';
const databaseName = 'tenant_2';

async function seedTimerDirect() {
  const sql = postgres({
    host,
    port,
    user,
    password,
    database: databaseName,
  });

  try {
    console.log('🌱 Direct Seed for Timer Testing\n');

    // Insert Clients
    console.log('  👥 Creating clients...');
    const clientsResult = await sql`
      INSERT INTO clients (name, email, phone, type, address, city, country, notes, is_vip, portal_access)
      VALUES
        ('Sophie Martin', 'sophie.martin@test.com', '+33 6 12 34 56 78', 'individual', '15 rue de la Musique', 'Paris', 'France', 'Chanteuse pro', true, true),
        ('Marc Dubois', 'marc.dubois@test.com', '+33 6 23 45 67 89', 'individual', '42 avenue du Hip-Hop', 'Lyon', 'France', 'Rappeur', false, true)
      RETURNING id, name
    `;
    console.log(`     ✓ ${clientsResult.length} clients created`);

    // Insert Rooms
    console.log('  🏠 Creating rooms...');
    const roomsResult = await sql`
      INSERT INTO rooms (name, description, type, hourly_rate, half_day_rate, full_day_rate, capacity, size, has_isolation_booth, has_live_room, has_control_room, color, is_active, is_available_for_booking)
      VALUES
        ('Studio A - Recording', 'Grande salle enregistrement', 'recording', 75.00, 280.00, 500.00, 8, 45, true, true, true, '#e74c3c', true, true),
        ('Studio B - Mixing', 'Salle de mixage', 'mixing', 60.00, 220.00, 400.00, 4, 30, false, false, true, '#3498db', true, true)
      RETURNING id, name
    `;
    console.log(`     ✓ ${roomsResult.length} rooms created`);

    // Insert Task Types
    console.log('  ⏱️  Creating task types...');
    const taskTypesResult = await sql`
      INSERT INTO task_types (name, description, hourly_rate, category, color, sort_order, is_active)
      VALUES
        ('Setup', 'Installation et préparation', 50.00, 'billable', '#3B82F6', 1, true),
        ('Recording', 'Enregistrement actif', 75.00, 'billable', '#EF4444', 2, true),
        ('Mixing', 'Mixage audio', 60.00, 'billable', '#10B981', 3, true),
        ('Mastering', 'Mastering', 80.00, 'billable', '#8B5CF6', 4, true),
        ('Break', 'Pause (non facturable)', 0.00, 'non-billable', '#6B7280', 5, true)
      RETURNING id, name, hourly_rate
    `;
    console.log(`     ✓ ${taskTypesResult.length} task types created`);

    // Insert Test Session
    console.log('  📅 Creating test session...');
    const sessionResult = await sql`
      INSERT INTO sessions (client_id, room_id, title, description, start_time, end_time, status, total_amount, deposit_amount, deposit_paid, payment_status)
      VALUES (
        ${clientsResult[0].id},
        ${roomsResult[0].id},
        'Test Timer Session',
        'Session de test pour le chronomètre',
        NOW(),
        NOW() + INTERVAL '4 hours',
        'in-progress',
        300.00,
        90.00,
        true,
        'partial'
      )
      RETURNING id, title
    `;
    console.log(`     ✓ ${sessionResult.length} session created\n`);

    console.log('✅ ✅ ✅ SEED COMPLETE! ✅ ✅ ✅\n');
    console.log('📊 Summary:');
    console.log(`   • Database: ${databaseName}`);
    console.log(`   • Clients: ${clientsResult.length}`);
    console.log(`   • Rooms: ${roomsResult.length}`);
    console.log(`   • Task Types: ${taskTypesResult.length}`);
    console.log(`   • Sessions: ${sessionResult.length}\n`);

    console.log('🎯 Session Details:');
    console.log(`   • ID: ${sessionResult[0].id}`);
    console.log(`   • Title: ${sessionResult[0].title}`);
    console.log(`   • Client: ${clientsResult[0].name}`);
    console.log(`   • Room: ${roomsResult[0].name}\n`);

    console.log('🔗 Test URL:');
    console.log(`   http://localhost:5174/sessions/${sessionResult[0].id}\n`);

    console.log('⚡ Task Types Available:');
    taskTypesResult.forEach(tt => {
      console.log(`   • ${tt.name}: ${tt.hourly_rate}€/h`);
    });
    console.log('');

    await sql.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    await sql.end();
    process.exit(1);
  }
}

seedTimerDirect();
