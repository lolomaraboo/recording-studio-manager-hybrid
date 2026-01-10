#!/usr/bin/env tsx
/**
 * Register Organization 3 in Master Database
 * Maps organization 3 to tenant_3 database
 */

import postgres from 'postgres';

const host = process.env.DATABASE_HOST || 'localhost';
const port = parseInt(process.env.DATABASE_PORT || '5432');
const user = process.env.DATABASE_USER || 'postgres';
const password = process.env.DATABASE_PASSWORD || 'password';

async function registerOrg3() {
  let masterSql: any = null;

  try {
    console.log('📝 Registering Organization 3 in master database...\n');

    masterSql = postgres({ host, port, user, password, database: 'rsm_master' });

    // Create org 3 (or update if exists)
    const org = await masterSql`
      INSERT INTO organizations (name, slug, subdomain, owner_id)
      VALUES ('Home Studio', 'home-studio', 'home-studio', 1)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name
    `;
    console.log(`✓ Organization: ${org[0].name} (ID: ${org[0].id})`);

    // Register tenant mapping
    const mapping = await masterSql`
      INSERT INTO tenant_databases (organization_id, database_name)
      VALUES (${org[0].id}, 'tenant_3')
      ON CONFLICT (organization_id) DO UPDATE SET database_name = EXCLUDED.database_name
      RETURNING organization_id, database_name
    `;
    console.log(`✓ Mapping: org ${mapping[0].organization_id} → ${mapping[0].database_name}\n`);

    console.log('✅ Registration complete!\n');
    console.log('🎯 Next: Refresh browser at http://localhost:5174/sessions/1\n');

    await masterSql.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed:', error);
    if (masterSql) await masterSql.end().catch(() => {});
    process.exit(1);
  }
}

registerOrg3();
