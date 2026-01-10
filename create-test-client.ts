import postgres from 'postgres';
import bcrypt from 'bcrypt';

const sql = postgres({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'tenant_3',
});

async function createTestClient() {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('Test123!', 10);

    // Create client with portal access
    const [client] = await sql`
      INSERT INTO clients (
        name,
        email,
        phone,
        type,
        portal_access,
        password_hash,
        city,
        country,
        notes
      )
      VALUES (
        'Test Client Phase 17',
        'test.client@phase17.local',
        '+33 6 12 34 56 78',
        'INDIVIDUAL',
        true,
        ${hashedPassword},
        'Paris',
        'France',
        'Client de test pour Phase 17 UAT - Invoice Payment Flow'
      )
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = ${hashedPassword},
        portal_access = true,
        updated_at = NOW()
      RETURNING id, name, email, portal_access
    `;

    console.log('✅ Test client created/updated:');
    console.log('   Email:', client.email);
    console.log('   Password: Test123!');
    console.log('   ID:', client.id);
    console.log('   Portal Access:', client.portal_access);

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test client:', error);
    await sql.end();
    process.exit(1);
  }
}

createTestClient();
