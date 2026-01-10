import postgres from 'postgres';

const sql = postgres({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'postgres',
});

async function listTenants() {
  console.log('📊 Listing all tenant databases...\n');

  const databases = await sql`
    SELECT datname
    FROM pg_database
    WHERE datname LIKE 'tenant_%'
    ORDER BY datname
  `;

  console.log(`Found ${databases.length} tenant databases:\n`);

  for (const db of databases) {
    const dbName = db.datname;
    console.log(`\n🔍 ${dbName}:`);

    // Connect to each tenant DB to check tables
    const tenantSql = postgres({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'password',
      database: dbName,
    });

    try {
      const tables = await tenantSql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;

      const tableNames = tables.map((t: any) => t.table_name);
      const hasTaskTypes = tableNames.includes('task_types');
      const hasTimeEntries = tableNames.includes('time_entries');
      const hasSessions = tableNames.includes('sessions');
      const hasClients = tableNames.includes('clients');
      const hasRooms = tableNames.includes('rooms');

      console.log(`   Tables: ${tables.length}`);
      console.log(`   ${hasClients ? '✅' : '❌'} clients`);
      console.log(`   ${hasRooms ? '✅' : '❌'} rooms`);
      console.log(`   ${hasSessions ? '✅' : '❌'} sessions`);
      console.log(`   ${hasTaskTypes ? '✅' : '❌'} task_types`);
      console.log(`   ${hasTimeEntries ? '✅' : '❌'} time_entries`);

      if (hasTaskTypes && hasTimeEntries) {
        console.log(`   ✨ HAS TIMER SUPPORT!`);
      }

      await tenantSql.end();
    } catch (error) {
      console.log(`   ❌ Error checking tables`);
      await tenantSql.end();
    }
  }

  console.log('\n');
  await sql.end();
}

listTenants();
