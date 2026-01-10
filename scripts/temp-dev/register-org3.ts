import postgres from 'postgres';

const sql = postgres({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'rsm_master',
});

async function registerOrg3() {
  console.log('📝 Registering Organization 3 in master database...\n');

  // Create org 3
  const org = await sql`
    INSERT INTO organizations (name, slug, subdomain, owner_id)
    VALUES ('Home Studio', 'home-studio', 'home-studio', 1)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name
  `;
  console.log(`✓ Organization: ${org[0].name} (ID: ${org[0].id})`);

  // Register tenant mapping
  const mapping = await sql`
    INSERT INTO tenant_databases (organization_id, database_name)
    VALUES (${org[0].id}, 'tenant_3')
    ON CONFLICT (organization_id) DO UPDATE SET database_name = EXCLUDED.database_name
    RETURNING organization_id, database_name
  `;
  console.log(`✓ Mapping: org ${mapping[0].organization_id} → ${mapping[0].database_name}\n`);

  console.log('✅ Registration complete!\n');

  await sql.end();
}

registerOrg3();
