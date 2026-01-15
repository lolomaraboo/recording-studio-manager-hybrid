import { getTenantDb } from '../connection';
import { clientPortalSessions } from '../tenant/schema';

async function main() {
  console.log('Testing getTenantDb(1)...');
  const tenantDb = await getTenantDb(1);

  console.log('Attempting INSERT...');
  await tenantDb.insert(clientPortalSessions).values({
    clientId: 1,
    token: 'test-token-' + Date.now(),
    expiresAt: new Date(Date.now() + 3600000),
    ipAddress: '127.0.0.1',
    userAgent: 'test',
  });

  console.log('✅ INSERT successful');

  const sessions = await tenantDb.select().from(clientPortalSessions);
  console.log('Sessions in DB:', sessions.length);

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
