#!/usr/bin/env tsx
/**
 * Base Seed Data Script
 *
 * Seeds minimal test data for a tenant database using current schema.
 * Includes vCard fields, company_members, deposit fields, and all Phase 21 additions.
 *
 * Usage:
 *   DATABASE_URL="postgresql://postgres@localhost:5432/tenant_N" \
 *     pnpm exec tsx scripts/init/seed-base-data.ts
 */

import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('\n   Usage:');
  console.error('   DATABASE_URL="postgresql://postgres@localhost:5432/tenant_N" \\');
  console.error('     pnpm exec tsx scripts/init/seed-base-data.ts\n');
  process.exit(1);
}

async function seedBaseData() {
  console.log('🌱 Seeding base data...\n');
  console.log(`   Target: ${DATABASE_URL}\n`);

  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    // ========== INDIVIDUAL CLIENTS (3) ==========
    console.log('👤 Creating individual clients...');

    const [emma] = await sql`
      INSERT INTO clients (
        name, first_name, last_name, email, phone, type, city,
        phones, emails, avatar_url, created_at, updated_at
      )
      VALUES (
        'Emma Dubois',
        'Emma',
        'Dubois',
        'emma.dubois@example.com',
        '+33 6 12 34 56 78',
        'individual',
        'Paris',
        ${sql.json([{ type: 'mobile', number: '+33 6 12 34 56 78' }])},
        ${sql.json([{ type: 'work', email: 'emma.dubois@example.com' }])},
        'https://i.pravatar.cc/150?img=1',
        NOW(),
        NOW()
      )
      RETURNING id, name
    `;
    console.log(`   ✅ ${emma.name} (ID: ${emma.id})`);

    const [lucas] = await sql`
      INSERT INTO clients (
        name, first_name, last_name, email, phone, type, city, artist_name,
        phones, emails, avatar_url, created_at, updated_at
      )
      VALUES (
        'Lucas Martin',
        'Lucas',
        'Martin',
        'lucas.martin@example.com',
        '+33 6 23 45 67 89',
        'individual',
        'Lyon',
        'MC Lukie',
        ${sql.json([{ type: 'mobile', number: '+33 6 23 45 67 89' }])},
        ${sql.json([{ type: 'personal', email: 'lucas.martin@example.com' }])},
        'https://i.pravatar.cc/150?img=12',
        NOW(),
        NOW()
      )
      RETURNING id, name
    `;
    console.log(`   ✅ ${lucas.name} (ID: ${lucas.id})`);

    const [sarah] = await sql`
      INSERT INTO clients (
        name, first_name, last_name, email, phone, type, city,
        phones, emails, avatar_url, created_at, updated_at
      )
      VALUES (
        'Sarah Petit',
        'Sarah',
        'Petit',
        'sarah.petit@example.com',
        '+33 6 34 56 78 90',
        'individual',
        'Marseille',
        ${sql.json([{ type: 'mobile', number: '+33 6 34 56 78 90' }])},
        ${sql.json([{ type: 'work', email: 'sarah.petit@example.com' }])},
        'https://i.pravatar.cc/150?img=5',
        NOW(),
        NOW()
      )
      RETURNING id, name
    `;
    console.log(`   ✅ ${sarah.name} (ID: ${sarah.id})`);

    // ========== COMPANY CLIENTS (2) ==========
    console.log('\n🏢 Creating company clients...');

    const [soundProd] = await sql`
      INSERT INTO clients (
        name, type, email, phone, city, address, logo_url,
        phones, emails, websites, created_at, updated_at
      )
      VALUES (
        'Sound Production SARL',
        'company',
        'contact@soundproduction.fr',
        '+33 1 23 45 67 89',
        'Paris',
        '42 Rue de la Musique, 75011 Paris',
        'https://via.placeholder.com/200?text=SP',
        ${sql.json([{ type: 'office', number: '+33 1 23 45 67 89' }])},
        ${sql.json([{ type: 'general', email: 'contact@soundproduction.fr' }])},
        ${sql.json([{ type: 'website', url: 'https://soundproduction.fr' }])},
        NOW(),
        NOW()
      )
      RETURNING id, name
    `;
    console.log(`   ✅ ${soundProd.name} (ID: ${soundProd.id})`);

    const [melodyProd] = await sql`
      INSERT INTO clients (
        name, type, email, phone, city, address, logo_url,
        phones, emails, websites, created_at, updated_at
      )
      VALUES (
        'Mélodie Productions SAS',
        'company',
        'info@melodie-prod.com',
        '+33 4 12 34 56 78',
        'Lyon',
        '18 Avenue du Jazz, 69001 Lyon',
        'https://via.placeholder.com/200?text=MP',
        ${sql.json([{ type: 'office', number: '+33 4 12 34 56 78' }])},
        ${sql.json([{ type: 'general', email: 'info@melodie-prod.com' }])},
        ${sql.json([{ type: 'website', url: 'https://melodie-prod.com' }])},
        NOW(),
        NOW()
      )
      RETURNING id, name
    `;
    console.log(`   ✅ ${melodyProd.name} (ID: ${melodyProd.id})`);

    // ========== COMPANY MEMBERS (3) ==========
    console.log('\n🔗 Creating company-member relationships...');

    await sql`
      INSERT INTO company_members (company_client_id, member_client_id, role, is_primary, created_at, updated_at)
      VALUES
        (${soundProd.id}, ${emma.id}, 'Directrice Générale', true, NOW(), NOW()),
        (${soundProd.id}, ${lucas.id}, 'Artiste sous contrat', false, NOW(), NOW()),
        (${melodyProd.id}, ${sarah.id}, 'Productrice', true, NOW(), NOW())
    `;
    console.log(`   ✅ ${soundProd.name}: 2 members (Emma DG, Lucas Artiste)`);
    console.log(`   ✅ ${melodyProd.name}: 1 member (Sarah Productrice)`);

    // ========== ROOMS (2) ==========
    console.log('\n🏠 Creating studio rooms...');

    const [studioA] = await sql`
      INSERT INTO rooms (
        name, description, type, hourly_rate, capacity, created_at, updated_at
      )
      VALUES (
        'Studio A',
        'Grand studio d''enregistrement',
        'recording',
        80.00,
        10,
        NOW(),
        NOW()
      )
      RETURNING id, name
    `;
    console.log(`   ✅ ${studioA.name} (ID: ${studioA.id})`);

    const [studioMix] = await sql`
      INSERT INTO rooms (
        name, description, type, hourly_rate, capacity, created_at, updated_at
      )
      VALUES (
        'Studio Mix',
        'Studio de mixage professionnel',
        'mixing',
        60.00,
        4,
        NOW(),
        NOW()
      )
      RETURNING id, name
    `;
    console.log(`   ✅ ${studioMix.name} (ID: ${studioMix.id})`);

    // ========== EQUIPMENT (3) ==========
    console.log('\n🎤 Creating equipment...');

    await sql`
      INSERT INTO equipment (
        name, brand, model, category, status, condition, created_at, updated_at
      )
      VALUES
        ('Neumann U87 Ai', 'Neumann', 'U87 Ai', 'microphone', 'operational', 'excellent', NOW(), NOW()),
        ('Apollo x16', 'Universal Audio', 'x16', 'interface', 'operational', 'excellent', NOW(), NOW()),
        ('API 512c', 'API', '512c', 'preamp', 'operational', 'good', NOW(), NOW())
    `;
    console.log('   ✅ 3 equipment items created');

    // ========== PROJECT (1) ==========
    console.log('\n🎵 Creating project...');

    const [project] = await sql`
      INSERT INTO projects (
        client_id, name, artist_name, type, status, created_at, updated_at
      )
      VALUES (
        ${lucas.id},
        'Horizons Lointains',
        'MC Lukie',
        'album',
        'recording',
        NOW(),
        NOW()
      )
      RETURNING id, name
    `;
    console.log(`   ✅ ${project.name} (ID: ${project.id})`);

    // ========== SESSIONS (2) ==========
    console.log('\n🎬 Creating sessions...');

    const [session1] = await sql`
      INSERT INTO sessions (
        client_id,
        room_id,
        project_id,
        title,
        start_time,
        end_time,
        status,
        total_amount,
        deposit_amount,
        deposit_paid,
        payment_status,
        created_at,
        updated_at
      )
      VALUES (
        ${lucas.id},
        ${studioA.id},
        ${project.id},
        'Enregistrement Horizons Lointains - Track 1',
        NOW() + INTERVAL '1 day',
        NOW() + INTERVAL '1 day' + INTERVAL '4 hours',
        'scheduled',
        320.00,
        96.00,
        true,
        'partial',
        NOW(),
        NOW()
      )
      RETURNING id, title
    `;
    console.log(`   ✅ ${session1.title} (ID: ${session1.id})`);

    const [session2] = await sql`
      INSERT INTO sessions (
        client_id,
        room_id,
        title,
        start_time,
        end_time,
        status,
        total_amount,
        payment_status,
        created_at,
        updated_at
      )
      VALUES (
        ${sarah.id},
        ${studioMix.id},
        'Mixage projet indie',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days' + INTERVAL '3 hours',
        'completed',
        180.00,
        'paid',
        NOW(),
        NOW()
      )
      RETURNING id, title
    `;
    console.log(`   ✅ ${session2.title} (ID: ${session2.id})`);

    // ========== TRACKS (2) ==========
    console.log('\n🎶 Creating tracks...');

    await sql`
      INSERT INTO tracks (
        project_id,
        title,
        track_number,
        status,
        bpm,
        key,
        composer,
        lyricist,
        language,
        created_at,
        updated_at
      )
      VALUES
        (
          ${project.id},
          'Introduction',
          1,
          'recording',
          120,
          'Am',
          'Lucas Martin',
          'Lucas Martin',
          'fr',
          NOW(),
          NOW()
        ),
        (
          ${project.id},
          'Voyage',
          2,
          'mixing',
          95,
          'C',
          'Lucas Martin',
          'Emma Dubois',
          'fr',
          NOW(),
          NOW()
        )
    `;
    console.log('   ✅ 2 tracks created');

    // ========== TIME ENTRY (1) ==========
    console.log('\n⏱️  Creating task type and time entry...');

    const [taskType] = await sql`
      INSERT INTO task_types (
        name, description, hourly_rate, category, color, created_at, updated_at
      )
      VALUES (
        'Recording',
        'Studio recording session',
        80.00,
        'billable',
        '#FF5733',
        NOW(),
        NOW()
      )
      RETURNING id, name
    `;
    console.log(`   ✅ Task type: ${taskType.name} (ID: ${taskType.id})`);

    await sql`
      INSERT INTO time_entries (
        task_type_id,
        session_id,
        start_time,
        end_time,
        duration_minutes,
        hourly_rate_snapshot,
        created_at,
        updated_at
      )
      VALUES (
        ${taskType.id},
        ${session1.id},
        NOW() - INTERVAL '2 hours',
        NOW(),
        120,
        80.00,
        NOW(),
        NOW()
      )
    `;
    console.log('   ✅ 1 time entry created');

    // ========== INVOICE (1) ==========
    console.log('\n💳 Creating invoice...');

    const invoiceNumber = `INV-${Date.now()}`;
    const [invoice] = await sql`
      INSERT INTO invoices (
        invoice_number,
        client_id,
        issue_date,
        due_date,
        status,
        subtotal,
        tax_rate,
        tax_amount,
        total,
        deposit_amount,
        remaining_balance,
        created_at,
        updated_at
      )
      VALUES (
        ${invoiceNumber},
        ${sarah.id},
        NOW(),
        NOW() + INTERVAL '30 days',
        'sent',
        150.00,
        20.00,
        30.00,
        180.00,
        54.00,
        126.00,
        NOW(),
        NOW()
      )
      RETURNING id, invoice_number
    `;
    console.log(`   ✅ ${invoice.invoice_number} (ID: ${invoice.id})`);

    // ========== SUMMARY ==========
    console.log('\n📊 Seed summary:');

    const counts = await sql`
      SELECT
        (SELECT COUNT(*) FROM clients WHERE type = 'individual') as individuals,
        (SELECT COUNT(*) FROM clients WHERE type = 'company') as companies,
        (SELECT COUNT(*) FROM company_members) as members,
        (SELECT COUNT(*) FROM rooms) as rooms,
        (SELECT COUNT(*) FROM equipment) as equipment,
        (SELECT COUNT(*) FROM projects) as projects,
        (SELECT COUNT(*) FROM sessions) as sessions,
        (SELECT COUNT(*) FROM tracks) as tracks,
        (SELECT COUNT(*) FROM task_types) as task_types,
        (SELECT COUNT(*) FROM time_entries) as time_entries,
        (SELECT COUNT(*) FROM invoices) as invoices
    `;

    const summary = counts[0];
    console.log(`   Individual clients:   ${summary.individuals}`);
    console.log(`   Company clients:      ${summary.companies}`);
    console.log(`   Company members:      ${summary.members}`);
    console.log(`   Rooms:                ${summary.rooms}`);
    console.log(`   Equipment:            ${summary.equipment}`);
    console.log(`   Projects:             ${summary.projects}`);
    console.log(`   Sessions:             ${summary.sessions}`);
    console.log(`   Tracks:               ${summary.tracks}`);
    console.log(`   Task types:           ${summary.task_types}`);
    console.log(`   Time entries:         ${summary.time_entries}`);
    console.log(`   Invoices:             ${summary.invoices}`);

    const totalRecords =
      parseInt(summary.individuals as string) +
      parseInt(summary.companies as string) +
      parseInt(summary.members as string) +
      parseInt(summary.rooms as string) +
      parseInt(summary.equipment as string) +
      parseInt(summary.projects as string) +
      parseInt(summary.sessions as string) +
      parseInt(summary.tracks as string) +
      parseInt(summary.task_types as string) +
      parseInt(summary.time_entries as string) +
      parseInt(summary.invoices as string);

    console.log(`\n   Total records:        ${totalRecords}`);

    console.log('\n✨ Base data seeded successfully!\n');
  } catch (error) {
    console.error('\n❌ Error seeding base data:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seedBaseData();
