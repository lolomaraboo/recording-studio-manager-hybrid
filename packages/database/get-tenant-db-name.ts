import postgres from 'postgres';

const sql = postgres(`postgresql://postgres:password@localhost:5432/rsm_master`, {
  max: 1,
});

async function getTenantDbName() {
  try {
    const result = await sql`SELECT database_name FROM tenant_databases WHERE organization_id = 4`;
    if (result.length > 0) {
      console.log(`✅ Tenant DB for org 4: ${result[0].database_name}`);
    } else {
      console.log('❌ No tenant DB found for org 4');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

getTenantDbName();
