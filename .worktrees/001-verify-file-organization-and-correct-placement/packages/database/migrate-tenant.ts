import postgres from 'postgres';

const tenantName = process.argv[2] || 'tenant_4';

const sql = postgres(`postgresql://postgres:password@localhost:5432/${tenantName}`, {
  max: 1,
});

async function migrate() {
  try {
    console.log(`🔧 Migrating ${tenantName}...`);

    // Add talent_type column
    await sql`ALTER TABLE musicians ADD COLUMN IF NOT EXISTS talent_type varchar(50) DEFAULT 'musician' NOT NULL`;
    console.log('✅ Added talent_type column');

    // Add other columns from migration
    await sql`ALTER TABLE musicians ADD COLUMN IF NOT EXISTS primary_instrument varchar(100)`;
    console.log('✅ Added primary_instrument column');

    await sql`ALTER TABLE musicians ADD COLUMN IF NOT EXISTS hourly_rate numeric(10, 2)`;
    console.log('✅ Added hourly_rate column');

    await sql`ALTER TABLE musicians ADD COLUMN IF NOT EXISTS photo_url varchar(500)`;
    console.log('✅ Added photo_url column');

    await sql`ALTER TABLE musicians ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL`;
    console.log('✅ Added is_active column');

    console.log(`✅ Migration complete for ${tenantName}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
