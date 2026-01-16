/**
 * Complete setup for Organization 16 (Test Studio UI)
 * Creates organization, user, and tenant database
 */

import { sql } from 'drizzle-orm';
import { getMasterDb } from '../connection.js';

async function main() {
  console.log('🔧 Setting up Organization 16 (Test Studio UI)...');

  const masterDb = await getMasterDb();

  try {
    // 1. Insert organization if not exists
    console.log('\n📊 Step 1: Creating organization...');
    await masterDb.execute(sql`
      INSERT INTO organizations (id, name, database_name, created_at, updated_at)
      VALUES (16, 'Test Studio UI', 'tenant_16', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name, database_name = EXCLUDED.database_name, updated_at = NOW()
    `);
    console.log('✅ Organization 16 created/updated');

    // 2. Insert user with hashed password
    console.log('\n👤 Step 2: Creating user...');
    await masterDb.execute(sql`
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
      RETURNING id
    `);
    console.log('✅ User created/updated (password: "password")');

    // 3. Link user to organization
    console.log('\n🔗 Step 3: Linking user to organization...');
    await masterDb.execute(sql`
      INSERT INTO organization_members (user_id, organization_id, role, joined_at)
      SELECT
        (SELECT id FROM users WHERE email = 'admin@test-studio-ui.com'),
        16,
        'owner',
        NOW()
      ON CONFLICT (user_id, organization_id) DO UPDATE
      SET role = EXCLUDED.role
    `);
    console.log('✅ User linked to organization as owner');

    // 4. Verify setup
    console.log('\n✨ Verification:');
    const result: any = await masterDb.execute(sql`
      SELECT
        u.id as user_id,
        u.email,
        u.name,
        o.id as org_id,
        o.name as org_name,
        om.role
      FROM users u
      JOIN organization_members om ON u.id = om.user_id
      JOIN organizations o ON om.organization_id = o.id
      WHERE o.id = 16
    `);

    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];
      console.log(`   User ID: ${row.user_id}`);
      console.log(`   Email: ${row.email}`);
      console.log(`   Name: ${row.name}`);
      console.log(`   Organization: ${row.org_name} (ID: ${row.org_id})`);
      console.log(`   Role: ${row.role}`);
    }

    console.log('\n🎉 Setup complete!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: admin@test-studio-ui.com');
    console.log('   Password: password');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
