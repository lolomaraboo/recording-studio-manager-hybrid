/**
 * Setup Organization 16 - Test Studio UI
 * Creates user and links to organization
 */

import postgres from 'postgres';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not set');
  }

  const sql = postgres(databaseUrl);

  try {
    console.log('🔧 Setting up Organization 16 (Test Studio UI)...\n');

    // Insert organization first
    console.log('📊 Creating organization...');
    await sql`
      INSERT INTO organizations (id, name, database_name, created_at, updated_at)
      VALUES (16, 'Test Studio UI', 'tenant_16', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name, database_name = EXCLUDED.database_name, updated_at = NOW()
    `;
    console.log('✅ Organization 16 created\n');

    // Insert user
    console.log('👤 Creating user...');
    await sql`
      INSERT INTO users (email, name, password_hash, role, is_active, created_at, updated_at)
      VALUES (
        'admin@test-studio-ui.com',
        'Admin Test Studio',
        '$2b$10$zAP43uVLimWwbpC5yfD91eUfkTOL/CxGHb8qAUlwG0A.3mDYrQDUK',
        'admin',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO UPDATE
      SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    `;
    console.log('✅ User created (email: admin@test-studio-ui.com, password: password)\n');

    // Link to organization
    console.log('🔗 Linking user to Organization 16...');
    await sql`
      INSERT INTO organization_members (user_id, organization_id, role, joined_at)
      SELECT
        (SELECT id FROM users WHERE email = 'admin@test-studio-ui.com'),
        16,
        'owner',
        NOW()
      ON CONFLICT (user_id, organization_id) DO UPDATE
      SET role = EXCLUDED.role
    `;
    console.log('✅ User linked as owner\n');

    // Verify
    console.log('✨ Verification:');
    const result = await sql`
      SELECT
        u.id as user_id,
        u.email,
        u.name,
        u.role as user_role,
        o.id as org_id,
        o.name as org_name,
        om.role as member_role
      FROM users u
      JOIN organization_members om ON u.id = om.user_id
      JOIN organizations o ON om.organization_id = o.id
      WHERE o.id = 16
    `;

    if (result.length > 0) {
      const row = result[0];
      console.log(`   User ID: ${row.user_id}`);
      console.log(`   Email: ${row.email}`);
      console.log(`   Name: ${row.name}`);
      console.log(`   Organization: ${row.org_name} (ID: ${row.org_id})`);
      console.log(`   Role: ${row.member_role}\n`);
    }

    console.log('🎉 Setup complete!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: admin@test-studio-ui.com');
    console.log('   Password: password');

    await sql.end();
  } catch (error) {
    console.error('❌ Setup failed:', error);
    await sql.end();
    process.exit(1);
  }
}

main();
