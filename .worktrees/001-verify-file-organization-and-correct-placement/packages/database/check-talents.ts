import postgres from 'postgres';

const sql = postgres(`postgresql://postgres:password@localhost:5432/tenant_4`, {
  max: 1,
});

async function checkTalents() {
  try {
    const result = await sql`SELECT id, name, talent_type FROM musicians ORDER BY id`;
    console.log('📊 Talents in tenant_4:');
    console.log('ID | Name | talent_type');
    console.log('---|------|------------');
    result.forEach(row => console.log(`${row.id} | ${row.name} | ${row.talent_type}`));
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

checkTalents();
