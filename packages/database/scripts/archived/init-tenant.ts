/**
 * Initialize tenant database schema
 */
import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as tenantSchema from '../src/tenant/schema';

async function main() {
  const tenantUrl = process.env.DATABASE_URL_TENANT || 'postgresql://postgres:password@localhost:5432/tenant_1';

  console.log(`🚀 Initializing tenant database: ${tenantUrl}`);

  const sql = postgres(tenantUrl);
  const db = drizzle(sql, { schema: tenantSchema });

  try {
    // Apply migrations
    console.log('📦 Applying tenant schema...');
    await migrate(db, { migrationsFolder: './drizzle/migrations/tenant' });
    console.log('✅ Tenant database initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize tenant database:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

main();
