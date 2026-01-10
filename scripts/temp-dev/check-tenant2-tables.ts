import postgres from 'postgres';

const sql = postgres({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'tenant_2',
});

async function checkTables() {
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  console.log('Tables in tenant_2:');
  tables.forEach((t: any) => console.log(' -', t.table_name));

  await sql.end();
}

checkTables();
