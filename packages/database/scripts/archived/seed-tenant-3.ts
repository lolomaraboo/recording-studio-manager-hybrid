#!/usr/bin/env tsx
/**
 * Seed tenant_3 with test data for company_members architecture
 * Usage: npx tsx packages/database/scripts/seed-tenant-3.ts
 */

import postgres from 'postgres';

const tenantSql = postgres('postgresql://postgres@localhost:5432/tenant_3', { max: 1 });

async function seedTenant3() {
  console.log('🌱 Seeding tenant_3 with test data...\n');

  try {
    // Step 1: Create individual clients (members)
    console.log('👤 Creating individual clients...');

    const [emma] = await tenantSql`
      INSERT INTO clients (name, first_name, last_name, email, phone, type, city)
      VALUES ('Emma Dubois', 'Emma', 'Dubois', 'emma.dubois@example.com', '+33 6 12 34 56 78', 'individual', 'Paris')
      RETURNING id, name
    `;
    console.log(`  ✅ ${emma.name} (ID: ${emma.id})`);

    const [lucas] = await tenantSql`
      INSERT INTO clients (name, first_name, last_name, email, phone, type, city, artist_name)
      VALUES ('Lucas Martin', 'Lucas', 'Martin', 'lucas.martin@example.com', '+33 6 23 45 67 89', 'individual', 'Lyon', 'MC Lukie')
      RETURNING id, name
    `;
    console.log(`  ✅ ${lucas.name} (ID: ${lucas.id})`);

    const [sarah] = await tenantSql`
      INSERT INTO clients (name, first_name, last_name, email, phone, type, city)
      VALUES ('Sarah Petit', 'Sarah', 'Petit', 'sarah.petit@example.com', '+33 6 34 56 78 90', 'individual', 'Marseille')
      RETURNING id, name
    `;
    console.log(`  ✅ ${sarah.name} (ID: ${sarah.id})`);

    const [alex] = await tenantSql`
      INSERT INTO clients (name, first_name, last_name, email, phone, type, city)
      VALUES ('Alexandre Grand', 'Alexandre', 'Grand', 'alex.grand@example.com', '+33 6 45 67 89 01', 'individual', 'Bordeaux')
      RETURNING id, name
    `;
    console.log(`  ✅ ${alex.name} (ID: ${alex.id})`);

    const [marie] = await tenantSql`
      INSERT INTO clients (name, first_name, last_name, email, phone, type, city)
      VALUES ('Marie Leroy', 'Marie', 'Leroy', 'marie.leroy@example.com', '+33 6 56 78 90 12', 'individual', 'Nice')
      RETURNING id, name
    `;
    console.log(`  ✅ ${marie.name} (ID: ${marie.id})`);

    // Step 2: Create company clients
    console.log('\n🏢 Creating company clients...');

    const [soundProd] = await tenantSql`
      INSERT INTO clients (name, type, email, phone, city, address)
      VALUES (
        'Sound Production SARL',
        'company',
        'contact@soundproduction.fr',
        '+33 1 23 45 67 89',
        'Paris',
        '42 Rue de la Musique, 75011 Paris'
      )
      RETURNING id, name
    `;
    console.log(`  ✅ ${soundProd.name} (ID: ${soundProd.id})`);

    const [melodyProd] = await tenantSql`
      INSERT INTO clients (name, type, email, phone, city, address)
      VALUES (
        'Mélodie Productions SAS',
        'company',
        'info@melodie-prod.com',
        '+33 4 12 34 56 78',
        'Lyon',
        '18 Avenue du Jazz, 69001 Lyon'
      )
      RETURNING id, name
    `;
    console.log(`  ✅ ${melodyProd.name} (ID: ${melodyProd.id})`);

    const [midnightGroove] = await tenantSql`
      INSERT INTO clients (name, type, email, phone, city, address)
      VALUES (
        'Midnight Groove Collective',
        'company',
        'booking@midnightgroove.fr',
        '+33 5 23 45 67 89',
        'Bordeaux',
        '33 Cours Victor Hugo, 33000 Bordeaux'
      )
      RETURNING id, name
    `;
    console.log(`  ✅ ${midnightGroove.name} (ID: ${midnightGroove.id})`);

    // Step 3: Link members to companies via company_members
    console.log('\n🔗 Creating company-member relationships...');

    // Sound Production SARL
    await tenantSql`
      INSERT INTO company_members (company_client_id, member_client_id, role, is_primary)
      VALUES
        (${soundProd.id}, ${emma.id}, 'Directrice Générale', true),
        (${soundProd.id}, ${lucas.id}, 'Artiste sous contrat', false)
    `;
    console.log(`  ✅ ${soundProd.name}: Emma (DG primary), Lucas (Artiste)`);

    // Mélodie Productions SAS
    await tenantSql`
      INSERT INTO company_members (company_client_id, member_client_id, role, is_primary)
      VALUES
        (${melodyProd.id}, ${sarah.id}, 'Productrice', true),
        (${melodyProd.id}, ${alex.id}, 'Ingénieur du son', false),
        (${melodyProd.id}, ${marie.id}, 'Assistante production', false)
    `;
    console.log(`  ✅ ${melodyProd.name}: Sarah (Productrice primary), Alex (Ing son), Marie (Assistante)`);

    // Midnight Groove Collective
    await tenantSql`
      INSERT INTO company_members (company_client_id, member_client_id, role, is_primary)
      VALUES
        (${midnightGroove.id}, ${lucas.id}, 'Lead Vocalist', true),
        (${midnightGroove.id}, ${alex.id}, 'Guitariste', false)
    `;
    console.log(`  ✅ ${midnightGroove.id}: Lucas (Lead vocalist primary), Alex (Guitariste)`);

    // Step 4: Create rooms
    console.log('\n🏠 Creating studio rooms...');
    await tenantSql`
      INSERT INTO rooms (name, description, type, hourly_rate, capacity)
      VALUES
        ('Studio A', 'Grand studio d''enregistrement', 'recording', 80.00, 10),
        ('Studio Mix', 'Studio de mixage professionnel', 'mixing', 60.00, 4),
        ('Salle Répétition', 'Salle de répétition', 'rehearsal', 30.00, 8)
    `;
    console.log('  ✅ 3 rooms created');

    // Step 5: Verify data
    console.log('\n📊 Verification...');

    const individualCount = await tenantSql`
      SELECT COUNT(*) as count FROM clients WHERE type = 'individual'
    `;
    console.log(`  Individual clients: ${individualCount[0].count}`);

    const companyCount = await tenantSql`
      SELECT COUNT(*) as count FROM clients WHERE type = 'company'
    `;
    console.log(`  Company clients: ${companyCount[0].count}`);

    const membershipCount = await tenantSql`
      SELECT COUNT(*) as count FROM company_members
    `;
    console.log(`  Company memberships: ${membershipCount[0].count}`);

    // Show memberships by company
    const memberships = await tenantSql`
      SELECT
        c.name as company,
        COUNT(cm.id) as members
      FROM clients c
      LEFT JOIN company_members cm ON c.id = cm.company_client_id
      WHERE c.type = 'company'
      GROUP BY c.id, c.name
      ORDER BY c.name
    `;

    console.log('\n  Memberships by company:');
    memberships.forEach((m: any) => {
      console.log(`    ${m.company}: ${m.members} member(s)`);
    });

    await tenantSql.end();

    console.log('\n✨ tenant_3 seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding tenant_3:', error);
    await tenantSql.end();
    process.exit(1);
  }
}

seedTenant3();
