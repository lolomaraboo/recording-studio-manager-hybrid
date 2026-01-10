#!/usr/bin/env tsx
/**
 * Create Tenant 3 with Direct SQL (migrations bypass)
 * Créer tenant_3 en créant directement les tables SQL nécessaires
 */

import postgres from 'postgres';

const host = process.env.DATABASE_HOST || 'localhost';
const port = parseInt(process.env.DATABASE_PORT || '5432');
const user = process.env.DATABASE_USER || 'postgres';
const password = process.env.DATABASE_PASSWORD || 'password';

async function createTenant3WithSQL() {
  let adminSql: any = null;
  let tenantSql: any = null;

  try {
    console.log('🚀 Creating Tenant 3 with Direct SQL\n');

    // Drop and create database
    console.log('📦 Creating database...');
    adminSql = postgres({ host, port, user, password, database: 'postgres' });
    await adminSql`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = 'tenant_3' AND pid <> pg_backend_pid()
    `;
    await adminSql.unsafe(`DROP DATABASE IF EXISTS tenant_3`);
    await adminSql.unsafe(`CREATE DATABASE tenant_3`);
    console.log('  ✅ tenant_3 created\n');
    await adminSql.end();

    // Connect and create tables
    console.log('📝 Creating tables directly...');
    tenantSql = postgres({ host, port, user, password, database: 'tenant_3' });

    // Create task_types table
    await tenantSql.unsafe(`
      CREATE TABLE task_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        hourly_rate NUMERIC(10, 2) NOT NULL,
        category VARCHAR(50) DEFAULT 'billable' NOT NULL,
        color VARCHAR(7),
        sort_order INTEGER DEFAULT 0 NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create other necessary tables (simplified)
    await tenantSql.unsafe(`
      CREATE TABLE clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        type VARCHAR(50) DEFAULT 'individual' NOT NULL,
        city VARCHAR(100),
        country VARCHAR(100),
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await tenantSql.unsafe(`
      CREATE TABLE rooms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50),
        hourly_rate NUMERIC(10, 2),
        capacity INTEGER,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await tenantSql.unsafe(`
      CREATE TABLE sessions (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id),
        room_id INTEGER REFERENCES rooms(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        status VARCHAR(50) DEFAULT 'scheduled' NOT NULL,
        total_amount NUMERIC(10, 2),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    await tenantSql.unsafe(`
      CREATE TABLE time_entries (
        id SERIAL PRIMARY KEY,
        task_type_id INTEGER NOT NULL REFERENCES task_types(id),
        session_id INTEGER REFERENCES sessions(id),
        project_id INTEGER,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration_minutes INTEGER,
        hourly_rate_snapshot NUMERIC(10, 2) NOT NULL,
        manually_adjusted BOOLEAN DEFAULT false NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CONSTRAINT check_session_or_project CHECK (session_id IS NOT NULL OR project_id IS NOT NULL)
      )
    `);

    console.log('  ✅ Tables created\n');

    // Insert test data
    console.log('🌱 Inserting test data...\n');

    // Clients
    const clientsResult = await tenantSql`
      INSERT INTO clients (name, email, phone, type, city, country)
      VALUES
        ('Sophie Martin', 'sophie@test.com', '+33 6 12 34 56 78', 'individual', 'Paris', 'France'),
        ('Marc Dubois', 'marc@test.com', '+33 6 23 45 67 89', 'individual', 'Lyon', 'France')
      RETURNING id, name
    `;
    console.log(`  👥 ${clientsResult.length} clients created`);

    // Rooms
    const roomsResult = await tenantSql`
      INSERT INTO rooms (name, type, hourly_rate, capacity, is_active)
      VALUES
        ('Studio A', 'recording', 75.00, 8, true),
        ('Studio B', 'mixing', 60.00, 4, true)
      RETURNING id, name
    `;
    console.log(`  🏠 ${roomsResult.length} rooms created`);

    // Task Types
    const taskTypesResult = await tenantSql`
      INSERT INTO task_types (name, description, hourly_rate, category, color, sort_order, is_active)
      VALUES
        ('Setup', 'Préparation studio', 50.00, 'billable', '#3B82F6', 1, true),
        ('Recording', 'Enregistrement actif', 75.00, 'billable', '#EF4444', 2, true),
        ('Mixing', 'Mixage', 60.00, 'billable', '#10B981', 3, true),
        ('Break', 'Pause', 0.00, 'non-billable', '#6B7280', 4, true)
      RETURNING id, name
    `;
    console.log(`  ⏱️  ${taskTypesResult.length} task types created`);

    // Session
    const sessionsResult = await tenantSql`
      INSERT INTO sessions (client_id, room_id, title, description, start_time, end_time, status, total_amount)
      VALUES (
        ${clientsResult[0].id},
        ${roomsResult[0].id},
        'Session Test Minuteur',
        'Session pour tester le chronomètre en temps réel',
        NOW(),
        NOW() + INTERVAL '4 hours',
        'in-progress',
        300.00
      )
      RETURNING id, title
    `;
    console.log(`  📅 ${sessionsResult.length} session created\n`);

    await tenantSql.end();

    // Summary
    console.log('✅ ✅ ✅ TENANT 3 READY! ✅ ✅ ✅\n');
    console.log('📊 Created:');
    console.log(`   • Database: tenant_3`);
    console.log(`   • Clients: ${clientsResult.length}`);
    console.log(`   • Rooms: ${roomsResult.length}`);
    console.log(`   • Task Types: ${taskTypesResult.length} ⭐`);
    console.log(`   • Sessions: ${sessionsResult.length}\n`);

    console.log('🎯 Session:');
    console.log(`   • ID: ${sessionsResult[0].id}`);
    console.log(`   • URL: http://localhost:5174/sessions/${sessionsResult[0].id}\n`);

    console.log('⚙️  Next: Update main.tsx to use org 3:');
    console.log('   "x-test-org-id": "3"\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed:', error);
    if (adminSql) await adminSql.end().catch(() => {});
    if (tenantSql) await tenantSql.end().catch(() => {});
    process.exit(1);
  }
}

createTenant3WithSQL();
