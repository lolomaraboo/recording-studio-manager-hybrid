import postgres from 'postgres';

const sql = postgres(`postgresql://postgres:password@localhost:5432/postgres`, {
  max: 1,
});

async function listDatabases() {
  try {
    const result = await sql`SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname`;
    console.log('📊 Databases:');
    result.forEach(row => console.log(`  - ${row.datname}`));
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

listDatabases();
