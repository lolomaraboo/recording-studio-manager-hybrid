#!/usr/bin/env tsx
/**
 * Apply migrations to both master and tenant databases
 * Usage: tsx src/scripts/migrate-all.ts
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const masterUrl = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/rsm_master';

  console.log('🔄 Migrating master database...');
  const masterClient = postgres(masterUrl, { max: 1 });
  const masterDb = drizzle(masterClient);

  try {
    await migrate(masterDb, {
      migrationsFolder: join(__dirname, '../../drizzle/migrations/master'),
    });
    console.log('✅ Master migrations complete');
  } catch (error) {
    console.error('❌ Master migration failed:', error);
    throw error;
  } finally {
    await masterClient.end();
  }

  console.log('✅ All migrations complete!');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
