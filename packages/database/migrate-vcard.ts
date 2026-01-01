import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tenantName = process.argv[2] || 'tenant_1';

// Use VPS database
const sql = postgres(`postgresql://postgres:postgres@167.99.254.57:5432/${tenantName}`, {
  max: 1,
});

async function migrate() {
  try {
    console.log(`🔧 Migrating ${tenantName} with vCard fields...`);

    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'drizzle/migrations/tenant/0004_certain_trish_tilby.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split by statement breakpoint and execute each statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        await sql.unsafe(statement);
        console.log('✅ Executed:', statement.substring(0, 100).replace(/\n/g, ' ') + '...');
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message?.includes('already exists')) {
          console.log('⏭️  Skipped (already exists):', statement.substring(0, 60).replace(/\n/g, ' '));
        } else {
          throw error;
        }
      }
    }

    console.log(`✅ Migration complete for ${tenantName}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
