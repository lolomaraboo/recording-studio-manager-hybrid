#!/usr/bin/env tsx
import postgres from 'postgres';

const sql = postgres({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'tenant_3',
});

async function checkSessions() {
  console.log('📊 Sessions in tenant_3:\n');

  const sessions = await sql`
    SELECT id, title, client_id, room_id, status, start_time, end_time
    FROM sessions
    ORDER BY id
  `;

  if (sessions.length === 0) {
    console.log('❌ No sessions found!\n');
  } else {
    sessions.forEach((s: any) => {
      console.log(`Session #${s.id}:`);
      console.log(`  Title: ${s.title}`);
      console.log(`  Status: ${s.status}`);
      console.log(`  Client ID: ${s.client_id}`);
      console.log(`  Room ID: ${s.room_id}`);
      console.log(`  Start: ${s.start_time}`);
      console.log(`  End: ${s.end_time}\n`);
    });
  }

  await sql.end();
}

checkSessions();
