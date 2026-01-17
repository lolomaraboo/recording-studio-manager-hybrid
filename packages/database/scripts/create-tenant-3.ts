#!/usr/bin/env tsx
/**
 * Create tenant_3 database with fresh schema including company_members
 * Usage: pnpm --filter database tsx scripts/create-tenant-3.ts
 */

import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/rsm_master';

async function createTenant3() {
  console.log('🚀 Creating tenant_3 database...\n');

  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    // Step 1: Check if tenant_3 exists
    const databases = await sql`
      SELECT datname FROM pg_database WHERE datname = 'tenant_3'
    `;

    if (databases.length > 0) {
      console.log('⚠️  tenant_3 already exists. Dropping...');
      await sql`DROP DATABASE tenant_3`;
      console.log('✅ Dropped existing tenant_3\n');
    }

    // Step 2: Create tenant_3
    console.log('📦 Creating tenant_3 database...');
    await sql`CREATE DATABASE tenant_3`;
    console.log('✅ tenant_3 created\n');

    await sql.end();

    // Step 3: Apply all tenant migrations
    console.log('📝 Applying tenant migrations to tenant_3...');
    const tenantSql = postgres('postgresql://postgres@localhost:5432/tenant_3', { max: 1 });

    const migrationsDir = path.resolve(__dirname, '../drizzle/migrations/tenant');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files:\n`);

    for (const file of files) {
      console.log(`  📄 ${file}`);
      const filePath = path.join(migrationsDir, file);
      const migrationSql = fs.readFileSync(filePath, 'utf-8');

      // Execute each statement separately
      const statements = migrationSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        await tenantSql.unsafe(statement);
      }
    }

    console.log('\n✅ All migrations applied successfully');

    // Step 4: Verify tables
    const tables = await tenantSql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log(`\n📊 tenant_3 tables (${tables.length}):`);
    tables.forEach((t: any) => console.log(`  - ${t.table_name}`));

    // Verify company_members exists
    const hasCompanyMembers = tables.some((t: any) => t.table_name === 'company_members');
    console.log(hasCompanyMembers ? '\n✅ company_members table created successfully' : '\n❌ company_members table NOT FOUND');

    await tenantSql.end();

    console.log('\n✨ tenant_3 ready for testing!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTenant3();
