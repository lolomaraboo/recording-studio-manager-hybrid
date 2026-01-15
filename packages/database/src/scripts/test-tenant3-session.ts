import { getTenantDb } from '../connection';
import { clientPortalSessions } from '../tenant/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const TOKEN = '1b132da0d4454ceabd3de4c01c411922a90f2608ba48a194fe3cc72c146aa6e3';

  console.log('Testing getTenantDb(3) session lookup...');
  const tenantDb = await getTenantDb(3);

  // Check which database we're actually connected to
  const dbCheck: any = await tenantDb.execute(`SELECT current_database()`);
  console.log('Connected to database:', dbCheck[0]?.current_database);

  console.log('Querying for token:', TOKEN.substring(0, 16) + '...');

  // Try raw SQL first
  try {
    const rawResult: any = await tenantDb.execute(`SELECT * FROM client_portal_sessions WHERE token = '${TOKEN}' LIMIT 1`);
    console.log('Raw SQL result:', rawResult.length, 'rows');
    if (rawResult.length > 0) {
      console.log('✅ Found via raw SQL:', { id: rawResult[0].id, client_id: rawResult[0].client_id });
    }
  } catch (e: any) {
    console.error('❌ Raw SQL failed:', e.message);
  }

  const sessions = await tenantDb
    .select()
    .from(clientPortalSessions)
    .where(eq(clientPortalSessions.token, TOKEN))
    .limit(1);

  console.log('Sessions found:', sessions.length);
  if (sessions.length > 0) {
    console.log('✅ Session found:', {
      id: sessions[0].id,
      clientId: sessions[0].clientId,
      expiresAt: sessions[0].expiresAt
    });
  } else {
    console.log('❌ No session found');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
