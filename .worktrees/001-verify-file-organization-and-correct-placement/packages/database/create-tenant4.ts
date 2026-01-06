import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './src/tenant/schema.js';
import {readFileSync} from 'fs';
import {join} from 'path';

async function createTenant4() {
  // Connect to postgres (not rsm_master) to create DB
  const adminSql = postgres(`postgresql://postgres:password@localhost:5432/postgres`, { max: 1 });

  try {
    console.log('🔧 Creating tenant_4 database...');
    await adminSql.unsafe('CREATE DATABASE tenant_4');
    console.log('✅ Database tenant_4 created');
  } catch (error: any) {
    if (error.code === '42P04') {
      console.log('⚠️  Database tenant_4 already exists');
    } else {
      throw error;
    }
  } finally {
    await adminSql.end();
  }

  // Connect to tenant_4 and apply schema
  const tenantSql = postgres(`postgresql://postgres:password@localhost:5432/tenant_4`, { max: 1 });

  try {
    console.log('🔧 Applying schema to tenant_4...');

    // Read and execute migration files
    const migration0 = readFileSync('/Users/marabook_m1/Documents/APP_HOME/CascadeProjects/windsurf-project/recording-studio-manager-hybrid/packages/database/drizzle/migrations/tenant/0000_early_charles_xavier.sql', 'utf-8');
    const migration1 = readFileSync('/Users/marabook_m1/Documents/APP_HOME/CascadeProjects/windsurf-project/recording-studio-manager-hybrid/packages/database/drizzle/migrations/tenant/0001_woozy_kinsey_walden.sql', 'utf-8');

    // Execute migrations
    await tenantSql.unsafe(migration0);
    console.log('✅ Applied migration 0000');

    await tenantSql.unsafe(migration1);
    console.log('✅ Applied migration 0001');

    console.log('✅ Schema applied successfully');
  } catch (error) {
    console.error('❌ Error applying schema:', error);
    throw error;
  } finally {
    await tenantSql.end();
  }
}

createTenant4();
