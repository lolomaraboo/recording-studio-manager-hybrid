#!/usr/bin/env tsx
/**
 * Realistic Seed Data Script
 *
 * Seeds realistic test data for a tenant database using @faker-js/faker.
 * Reduced scope: ~60 records (not 118+) to fit single task context budget.
 *
 * Usage:
 *   DATABASE_URL="postgresql://postgres@localhost:5432/tenant_N" \
 *     pnpm exec tsx scripts/init/seed-realistic-data.ts
 */

import postgres from 'postgres';
import { faker } from '@faker-js/faker';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('\n   Usage:');
  console.error('   DATABASE_URL="postgresql://postgres@localhost:5432/tenant_N" \\');
  console.error('     pnpm exec tsx scripts/init/seed-realistic-data.ts\n');
  process.exit(1);
}

// Realistic data for recording studios
const ARTIST_TYPES = ['session musician', 'singer-songwriter', 'producer', 'rapper', 'DJ'];
const COMPANY_TYPES = ['record label', 'management company', 'production house', 'publisher'];
const GENRES = ['Rock', 'Hip-Hop', 'Electronic', 'Jazz', 'Folk', 'R&B', 'Indie', 'Pop'];
const PROJECT_TYPES = ['album', 'ep', 'single', 'demo'] as const;
const ROOM_TYPES = ['recording', 'mixing', 'mastering', 'rehearsal'] as const;
const EQUIPMENT_CATEGORIES = ['microphone', 'preamp', 'interface', 'outboard', 'instrument'] as const;
const TASK_TYPES_CONFIG = [
  { name: 'Setup', rate: 50, color: '#3498db' },
  { name: 'Recording', rate: 80, color: '#e74c3c' },
  { name: 'Editing', rate: 60, color: '#f39c12' },
  { name: 'Mixing', rate: 90, color: '#9b59b6' },
  { name: 'Mastering', rate: 120, color: '#1abc9c' },
];


// Music profile data (Phase 18.4)
const INSTRUMENTS = [
  'Vocals', 'Guitar', 'Bass', 'Drums', 'Keyboard', 'Piano',
  'Synthesizer', 'Saxophone', 'Trumpet', 'Violin', 'Cello',
  'Flute', 'Clarinet', 'Harmonica', 'Accordion', 'Banjo',
  'Ukulele', 'Mandolin', 'Production', 'DJ Equipment', 'Beatmaking'
];

const RECORD_LABELS = [
  'Universal Music', 'Sony Music', 'Warner Music', 'Indie Records',
  'Blue Note', 'Def Jam', 'Atlantic Records', 'Capitol Records',
  'Columbia Records', 'Island Records', 'Self-Released', null // 50% have labels
];

const DISTRIBUTORS = [
  'DistroKid', 'CD Baby', 'TuneCore', 'AWAL', 'The Orchard',
  'Believe Digital', 'Ditto Music', 'Self-Distributed', null
];

const PERFORMANCE_RIGHTS = ['SACEM', 'SOCAN', 'BMI', 'ASCAP', 'PRS', null];

async function seedRealisticData() {
  console.log('🌱 Seeding realistic data...\n');
  console.log(`   Target: ${DATABASE_URL}\n`);

  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    faker.seed(12345); // Consistent data

    // ========== INDIVIDUAL CLIENTS (15) ==========
    console.log('👤 Creating individual clients...');

    const individualClients = [];
    for (let i = 0; i < 15; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const artistName = faker.helpers.arrayElement([
        null,
        `${faker.music.genre()} ${faker.word.adjective()}`,
      ]);
      const email = faker.internet.email({ firstName, lastName });
      const phone = faker.phone.number('+33 6 ## ## ## ##');
      // Generate music profile fields (Phase 18.4)
      const genreCount = faker.number.int({ min: 1, max: 3 });
      const genres = faker.helpers.arrayElements(GENRES, genreCount);

      const instrumentCount = faker.number.int({ min: 1, max: 4 });
      const instruments = faker.helpers.arrayElements(INSTRUMENTS, instrumentCount);

      // Streaming platforms (50% have profiles)
      const hasStreamingProfile = faker.datatype.boolean();
      const spotifyUrl = hasStreamingProfile
        ? `https://open.spotify.com/artist/${faker.string.alphanumeric(22)}`
        : null;
      const appleMusicUrl = hasStreamingProfile && faker.datatype.boolean({ probability: 0.7 })
        ? `https://music.apple.com/artist/${faker.string.alphanumeric(10)}`
        : null;
      const youtubeUrl = faker.datatype.boolean({ probability: 0.6 })
        ? `https://youtube.com/@${faker.internet.userName()}`
        : null;
      const soundcloudUrl = faker.datatype.boolean({ probability: 0.4 })
        ? `https://soundcloud.com/${faker.internet.userName()}`
        : null;
      const bandcampUrl = faker.datatype.boolean({ probability: 0.3 })
        ? `https://${faker.internet.userName()}.bandcamp.com`
        : null;

      // Industry info (30-40% have representation)
      const hasRepresentation = faker.datatype.boolean({ probability: 0.35 });
      const recordLabel = hasRepresentation ? faker.helpers.arrayElement(RECORD_LABELS) : null;
      const distributor = faker.helpers.arrayElement(DISTRIBUTORS);
      const managerContact = hasRepresentation
        ? `${faker.person.fullName()} <${faker.internet.email()}>`
        : null;
      const publisher = hasRepresentation && faker.datatype.boolean({ probability: 0.5 })
        ? faker.company.name()
        : null;
      const performanceRightsSociety = faker.helpers.arrayElement(PERFORMANCE_RIGHTS);

      // Career info
      const startYear = faker.number.int({ min: 2010, max: 2020 });
      const yearsActive = `${startYear}-present`;
      const notableWorks = faker.datatype.boolean({ probability: 0.4 })
        ? faker.helpers.arrayElements([
            `${faker.music.songName()} (${faker.number.int({ min: 2015, max: 2024 })})`,
            `${faker.music.songName()} (${faker.number.int({ min: 2015, max: 2024 })})`,
          ], faker.number.int({ min: 1, max: 2 })).join(', ')
        : null;
      const awardsRecognition = faker.datatype.boolean({ probability: 0.2 })
        ? faker.helpers.arrayElement([
            'Victoires de la Musique 2022',
            'SACEM Award 2021',
            'Prix Constantin Nominee',
            'Regional Music Award Winner'
          ])
        : null;
      const biography = faker.datatype.boolean({ probability: 0.4 })
        ? faker.lorem.paragraph({ min: 2, max: 4 })
        : null;


      const [client] = await sql`
        INSERT INTO clients (
          name, first_name, last_name, email, phone, type, city,
          artist_name, phones, emails, avatar_url,
          genres, instruments,
          spotify_url, apple_music_url, youtube_url, soundcloud_url, bandcamp_url,
          record_label, distributor, manager_contact, publisher, performance_rights_society,
          years_active, notable_works, awards_recognition, biography,
          created_at, updated_at
        )
        VALUES (
          ${`${firstName} ${lastName}`},
          ${firstName},
          ${lastName},
          ${email},
          ${phone},
          'individual',
          ${faker.location.city()},
          ${artistName},
          ${sql.json([{ type: 'mobile', number: phone }])},
          ${sql.json([{ type: 'work', email }])},
          ${`https://i.pravatar.cc/150?img=${i + 1}`},
          ${sql.json(genres)},
          ${sql.json(instruments)},
          ${spotifyUrl},
          ${appleMusicUrl},
          ${youtubeUrl},
          ${soundcloudUrl},
          ${bandcampUrl},
          ${recordLabel},
          ${distributor},
          ${managerContact},
          ${publisher},
          ${performanceRightsSociety},
          ${yearsActive},
          ${notableWorks},
          ${awardsRecognition},
          ${biography},
          NOW(),
          NOW()
        )
        RETURNING id, name
      `;
      individualClients.push(client);
      console.log(`   ✅ ${client.name} (ID: ${client.id})`);
    }

    // ========== COMPANY CLIENTS (5) ==========
    console.log('\n🏢 Creating company clients...');

    const companyClients = [];
    for (let i = 0; i < 5; i++) {
      const companyName = `${faker.company.name()} ${faker.helpers.arrayElement(COMPANY_TYPES)}`;
      const email = faker.internet.email({ firstName: faker.word.noun() });
      const phone = faker.phone.number('+33 1 ## ## ## ##');
      const website = `https://${faker.internet.domainName()}`;

      const [company] = await sql`
        INSERT INTO clients (
          name, type, email, phone, city, address, logo_url,
          phones, emails, websites, created_at, updated_at
        )
        VALUES (
          ${companyName},
          'company',
          ${email},
          ${phone},
          ${faker.location.city()},
          ${faker.location.streetAddress()},
          ${`https://via.placeholder.com/200?text=${companyName.slice(0, 2).toUpperCase()}`},
          ${sql.json([{ type: 'office', number: phone }])},
          ${sql.json([{ type: 'general', email }])},
          ${sql.json([{ type: 'website', url: website }])},
          NOW(),
          NOW()
        )
        RETURNING id, name
      `;
      companyClients.push(company);
      console.log(`   ✅ ${company.name} (ID: ${company.id})`);
    }

    // ========== COMPANY MEMBERS (15) ==========
    console.log('\n🔗 Creating company-member relationships...');

    let memberCount = 0;
    for (const company of companyClients) {
      // Each company has 3 members
      for (let i = 0; i < 3; i++) {
        const member = faker.helpers.arrayElement(individualClients);
        const role = faker.person.jobTitle();
        const isPrimary = i === 0;

        await sql`
          INSERT INTO company_members (company_client_id, member_client_id, role, is_primary, created_at, updated_at)
          VALUES (${company.id}, ${member.id}, ${role}, ${isPrimary}, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `;
        memberCount++;
      }
      console.log(`   ✅ ${company.name}: 3 members assigned`);
    }

    // ========== CLIENT NOTES (10) ==========
    console.log('\n📝 Creating client notes...');

    for (let i = 0; i < 10; i++) {
      const client = faker.helpers.arrayElement([...individualClients, ...companyClients]);
      await sql`
        INSERT INTO client_notes (client_id, note, created_at)
        VALUES (${client.id}, ${faker.lorem.sentence()}, NOW())
      `;
    }
    console.log('   ✅ 10 client notes created');

    // ========== ROOMS (3) ==========
    console.log('\n🏠 Creating studio rooms...');

    const rooms = [];
    for (const roomType of ['recording', 'mixing', 'rehearsal'] as const) {
      const [room] = await sql`
        INSERT INTO rooms (
          name, description, type, hourly_rate, capacity, color, created_at, updated_at
        )
        VALUES (
          ${`Studio ${roomType.charAt(0).toUpperCase() + roomType.slice(1)}`},
          ${faker.lorem.sentence()},
          ${roomType},
          ${faker.number.int({ min: 40, max: 120 })},
          ${faker.number.int({ min: 4, max: 12 })},
          ${faker.color.rgb()},
          NOW(),
          NOW()
        )
        RETURNING id, name
      `;
      rooms.push(room);
      console.log(`   ✅ ${room.name} (ID: ${room.id})`);
    }

    // ========== EQUIPMENT (6) ==========
    console.log('\n🎤 Creating equipment...');

    const equipmentList = [
      { name: 'Neumann U87', brand: 'Neumann', model: 'U87', category: 'microphone' },
      { name: 'Shure SM7B', brand: 'Shure', model: 'SM7B', category: 'microphone' },
      { name: 'Apollo x16', brand: 'Universal Audio', model: 'x16', category: 'interface' },
      { name: 'SSL 4000', brand: 'SSL', model: '4000', category: 'preamp' },
      { name: 'Fender Stratocaster', brand: 'Fender', model: 'Stratocaster', category: 'instrument' },
      { name: '1176 Compressor', brand: 'Universal Audio', model: '1176', category: 'outboard' },
    ];

    for (const eq of equipmentList) {
      await sql`
        INSERT INTO equipment (
          name, brand, model, category, status, condition, created_at, updated_at
        )
        VALUES (
          ${eq.name},
          ${eq.brand},
          ${eq.model},
          ${eq.category},
          'operational',
          ${faker.helpers.arrayElement(['excellent', 'good', 'fair'])},
          NOW(),
          NOW()
        )
      `;
    }
    console.log('   ✅ 6 equipment items created');

    // ========== PROJECTS (12) ==========
    console.log('\n🎵 Creating projects...');

    const projects = [];
    for (let i = 0; i < 12; i++) {
      const client = faker.helpers.arrayElement(individualClients);
      const projectName = faker.music.songName();
      const genre = faker.helpers.arrayElement(GENRES);
      const projectType = faker.helpers.arrayElement(['album', 'ep', 'single']);
      const status = faker.helpers.arrayElement(['recording', 'mixing', 'mastering', 'completed']);
      const startDaysAgo = faker.number.int({ min: 10, max: 90 });
      const deliveryDaysAhead = faker.number.int({ min: 30, max: 120 });
      const budget = faker.number.int({ min: 3000, max: 30000 });

      const [project] = await sql.unsafe(`
        INSERT INTO projects (
          client_id,
          name,
          artist_name,
          genre,
          type,
          status,
          start_date,
          target_delivery_date,
          budget,
          created_at,
          updated_at
        )
        VALUES (
          ${client.id},
          '${projectName.replace(/'/g, "''")}',
          '${client.name.replace(/'/g, "''")}',
          '${genre}',
          '${projectType}',
          '${status}',
          NOW() - INTERVAL '${startDaysAgo} days',
          NOW() + INTERVAL '${deliveryDaysAhead} days',
          ${budget},
          NOW(),
          NOW()
        )
        RETURNING id, name
      `);
      projects.push(project);
      console.log(`   ✅ ${project.name} (ID: ${project.id})`);
    }

    // ========== TRACKS (60-80 total - 5-8 per project) ==========
    console.log('\n🎶 Creating tracks...');

    let trackCount = 0;
    for (const project of projects) {
      const tracksPerProject = faker.number.int({ min: 5, max: 8 });
      for (let i = 0; i < tracksPerProject; i++) {
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
            genre_tags,
            mood,
            created_at,
            updated_at
          )
          VALUES (
            ${project.id},
            ${faker.music.songName()},
            ${i + 1},
            ${faker.helpers.arrayElement(['recording', 'editing', 'mixing', 'completed'])},
            ${faker.number.int({ min: 80, max: 140 })},
            ${faker.helpers.arrayElement(['C', 'Am', 'G', 'Em', 'D', 'Bm', 'F#m', 'A'])},
            ${faker.person.fullName()},
            ${faker.person.fullName()},
            'fr',
            ${JSON.stringify([faker.helpers.arrayElement(GENRES)])},
            ${faker.helpers.arrayElement(['Energetic', 'Melancholic', 'Upbeat', 'Chill', 'Aggressive', 'Dreamy'])},
            NOW(),
            NOW()
          )
        `;
        trackCount++;
      }
    }
    console.log(`   ✅ ${trackCount} tracks created`);

    // ========== MUSICIANS/TALENT (2) ==========
    console.log('\n🎸 Creating musicians/talent...');

    for (let i = 0; i < 2; i++) {
      await sql`
        INSERT INTO musicians (
          name,
          stage_name,
          email,
          phone,
          talent_type,
          primary_instrument,
          hourly_rate,
          created_at,
          updated_at
        )
        VALUES (
          ${faker.person.fullName()},
          ${faker.music.genre() + ' ' + faker.word.adjective()},
          ${faker.internet.email()},
          ${faker.phone.number('+33 6 ## ## ## ##')},
          'musician',
          ${faker.helpers.arrayElement(['Guitar', 'Bass', 'Drums', 'Keyboard', 'Vocals'])},
          ${faker.number.int({ min: 40, max: 100 })},
          NOW(),
          NOW()
        )
      `;
    }
    console.log('   ✅ 2 musicians/talent created');

    // ========== TASK TYPES (5) ==========
    console.log('\n⏱️  Creating task types...');

    const taskTypes = [];
    for (const config of TASK_TYPES_CONFIG) {
      const [taskType] = await sql`
        INSERT INTO task_types (
          name, description, hourly_rate, category, color, created_at, updated_at
        )
        VALUES (
          ${config.name},
          ${`${config.name} tasks`},
          ${config.rate},
          'billable',
          ${config.color},
          NOW(),
          NOW()
        )
        RETURNING id, name
      `;
      taskTypes.push(taskType);
    }
    console.log(`   ✅ ${taskTypes.length} task types created`);

    // ========== SESSIONS (25) ==========
    console.log('\n🎬 Creating sessions...');

    const sessions = [];
    for (let i = 0; i < 25; i++) {
      const client = faker.helpers.arrayElement([...individualClients, ...companyClients]);
      const room = faker.helpers.arrayElement(rooms);
      const project = faker.helpers.maybe(() => faker.helpers.arrayElement(projects), { probability: 0.6 });
      const isPast = faker.datatype.boolean({ probability: 0.6 }); // 60% completed
      const startTime = isPast
        ? `NOW() - INTERVAL '${faker.number.int({ min: 1, max: 60 })} days'`
        : `NOW() + INTERVAL '${faker.number.int({ min: 1, max: 30 })} days'`;

      const totalAmount = faker.number.int({ min: 200, max: 1000 });
      const depositAmount = Math.floor(totalAmount * 0.3);

      const projectId = project?.id || null;
      const title = faker.lorem.words(3).replace(/'/g, "''");
      const status = isPast ? 'completed' : 'scheduled';
      const depositPaid = faker.datatype.boolean();
      const paymentStatus = isPast
        ? faker.helpers.arrayElement(['paid', 'unpaid', 'partial'])
        : 'unpaid';
      const durationHours = faker.number.int({ min: 2, max: 8 });
      const daysOffset = isPast
        ? faker.number.int({ min: 1, max: 60 })
        : faker.number.int({ min: 1, max: 30 });
      const intervalDirection = isPast ? '-' : '+';

      const [session] = await sql.unsafe(`
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
          ${client.id},
          ${room.id},
          ${projectId},
          '${title}',
          NOW() ${intervalDirection} INTERVAL '${daysOffset} days',
          NOW() ${intervalDirection} INTERVAL '${daysOffset} days' + INTERVAL '${durationHours} hours',
          '${status}',
          ${totalAmount},
          ${depositAmount},
          ${depositPaid},
          '${paymentStatus}',
          NOW(),
          NOW()
        )
        RETURNING id, title
      `);
      sessions.push(session);
      console.log(`   ✅ Session ${i + 1} (ID: ${session.id})`);
    }

    // ========== TIME ENTRIES (40) ==========
    console.log('\n⏱️  Creating time entries...');

    const completedSessions = await sql`SELECT id FROM sessions WHERE status = 'completed'`;

    for (let i = 0; i < 40; i++) {
      const session = faker.helpers.arrayElement(completedSessions);
      const taskType = faker.helpers.arrayElement(taskTypes);
      const startHoursAgo = faker.number.int({ min: 4, max: 120 });
      const durationMinutes = faker.number.int({ min: 30, max: 360 });
      const endHoursAgo = startHoursAgo - Math.floor(durationMinutes / 60);
      const hourlyRate = parseFloat(taskType.hourly_rate || '75');

      await sql.unsafe(`
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
          ${session.id},
          NOW() - INTERVAL '${startHoursAgo} hours',
          NOW() - INTERVAL '${endHoursAgo} hours',
          ${durationMinutes},
          ${hourlyRate},
          NOW(),
          NOW()
        )
      `);
    }
    console.log('   ✅ 40 time entries created');

    // ========== INVOICES (8) ==========
    console.log('\n💳 Creating invoices...');

    for (let i = 0; i < 8; i++) {
      const client = faker.helpers.arrayElement([...individualClients, ...companyClients]);
      const invoiceNumber = `INV-${Date.now()}-${i}`;
      const subtotal = faker.number.int({ min: 500, max: 3000 });
      const taxAmount = Math.floor(subtotal * 0.2);
      const total = subtotal + taxAmount;
      const depositAmount = faker.datatype.boolean({ probability: 0.5 })
        ? Math.floor(total * 0.3)
        : null;
      const remainingBalance = depositAmount ? total - depositAmount : total;
      const issueDaysAgo = faker.number.int({ min: 1, max: 60 });
      const dueDaysAhead = faker.number.int({ min: 15, max: 90 });
      const status = faker.helpers.arrayElement(['draft', 'sent', 'paid', 'overdue']);

      await sql.unsafe(`
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
          '${invoiceNumber}',
          ${client.id},
          NOW() - INTERVAL '${issueDaysAgo} days',
          NOW() + INTERVAL '${dueDaysAhead} days',
          '${status}',
          ${subtotal},
          20.00,
          ${taxAmount},
          ${total},
          ${depositAmount},
          ${remainingBalance},
          NOW(),
          NOW()
        )
      `);
    }
    console.log('   ✅ 8 invoices created');

    // ========== INVOICE ITEMS (24 - 3 per invoice) ==========
    console.log('\n📄 Creating invoice items...');

    const invoices = await sql`SELECT id FROM invoices ORDER BY id`;
    for (const invoice of invoices) {
      for (let i = 0; i < 3; i++) {
        const quantity = faker.number.float({ min: 1, max: 8, multipleOf: 0.5 });
        const unitPrice = faker.number.int({ min: 50, max: 300 });
        const amount = Math.round(quantity * unitPrice * 100) / 100;

        await sql`
          INSERT INTO invoice_items (
            invoice_id,
            description,
            quantity,
            unit_price,
            amount,
            created_at
          )
          VALUES (
            ${invoice.id},
            ${faker.helpers.arrayElement([
              'Studio Recording Time',
              'Mixing Session',
              'Mastering',
              'Equipment Rental',
              'Post-production',
              'Editing',
            ])},
            ${quantity},
            ${unitPrice},
            ${amount},
            NOW()
          )
        `;
      }
    }
    console.log('   ✅ 24 invoice items created');

    // ========== QUOTES (6) ==========
    console.log('\n📋 Creating quotes...');

    for (let i = 0; i < 6; i++) {
      const client = faker.helpers.arrayElement([...individualClients, ...companyClients]);
      const quoteNumber = `QUO-${Date.now()}-${i}`;
      const subtotal = faker.number.int({ min: 1000, max: 5000 });
      const taxAmount = Math.floor(subtotal * 0.2);
      const total = subtotal + taxAmount;
      const status = faker.helpers.arrayElement(['draft', 'sent', 'accepted', 'rejected']);
      const validDays = 30;

      await sql.unsafe(`
        INSERT INTO quotes (
          quote_number,
          client_id,
          status,
          issue_date,
          valid_until,
          subtotal,
          tax_rate,
          tax_amount,
          total,
          created_at,
          updated_at
        )
        VALUES (
          '${quoteNumber}',
          ${client.id},
          '${status}',
          NOW(),
          NOW() + INTERVAL '${validDays} days',
          ${subtotal},
          20.00,
          ${taxAmount},
          ${total},
          NOW(),
          NOW()
        )
      `);
    }
    console.log('   ✅ 6 quotes created');

    // ========== QUOTE ITEMS (18 - 3 per quote) ==========
    console.log('\n📄 Creating quote items...');

    const quotes = await sql`SELECT id FROM quotes ORDER BY id`;
    for (const quote of quotes) {
      for (let i = 0; i < 3; i++) {
        const quantity = faker.number.float({ min: 1, max: 10, multipleOf: 0.5 });
        const unitPrice = faker.number.int({ min: 75, max: 400 });
        const amount = Math.round(quantity * unitPrice * 100) / 100;

        await sql`
          INSERT INTO quote_items (
            quote_id,
            description,
            quantity,
            unit_price,
            amount,
            display_order,
            created_at
          )
          VALUES (
            ${quote.id},
            ${faker.helpers.arrayElement([
              'Album Recording Package (10 hours)',
              'Mixing Service (per track)',
              'Mastering (per track)',
              'Studio Rental (per day)',
              'Equipment Rental',
              'Producer Fee',
            ])},
            ${quantity},
            ${unitPrice},
            ${amount},
            ${i},
            NOW()
          )
        `;
      }
    }
    console.log('   ✅ 18 quote items created');

    // ========== SUMMARY ==========
    console.log('\n📊 Seed summary:');

    const counts = await sql`
      SELECT
        (SELECT COUNT(*) FROM clients WHERE type = 'individual') as individuals,
        (SELECT COUNT(*) FROM clients WHERE type = 'company') as companies,
        (SELECT COUNT(*) FROM company_members) as members,
        (SELECT COUNT(*) FROM client_notes) as notes,
        (SELECT COUNT(*) FROM rooms) as rooms,
        (SELECT COUNT(*) FROM equipment) as equipment,
        (SELECT COUNT(*) FROM projects) as projects,
        (SELECT COUNT(*) FROM tracks) as tracks,
        (SELECT COUNT(*) FROM musicians) as musicians,
        (SELECT COUNT(*) FROM sessions) as sessions,
        (SELECT COUNT(*) FROM task_types) as task_types,
        (SELECT COUNT(*) FROM time_entries) as time_entries,
        (SELECT COUNT(*) FROM invoices) as invoices,
        (SELECT COUNT(*) FROM invoice_items) as invoice_items,
        (SELECT COUNT(*) FROM quotes) as quotes,
        (SELECT COUNT(*) FROM quote_items) as quote_items
    `;

    const summary = counts[0];
    console.log(`   Individual clients:   ${summary.individuals}`);
    console.log(`   Company clients:      ${summary.companies}`);
    console.log(`   Company members:      ${summary.members}`);
    console.log(`   Client notes:         ${summary.notes}`);
    console.log(`   Rooms:                ${summary.rooms}`);
    console.log(`   Equipment:            ${summary.equipment}`);
    console.log(`   Projects:             ${summary.projects}`);
    console.log(`   Tracks:               ${summary.tracks}`);
    console.log(`   Musicians:            ${summary.musicians}`);
    console.log(`   Sessions:             ${summary.sessions}`);
    console.log(`   Task types:           ${summary.task_types}`);
    console.log(`   Time entries:         ${summary.time_entries}`);
    console.log(`   Invoices:             ${summary.invoices}`);
    console.log(`   Invoice items:        ${summary.invoice_items}`);
    console.log(`   Quotes:               ${summary.quotes}`);
    console.log(`   Quote items:          ${summary.quote_items}`);

    const totalRecords =
      parseInt(summary.individuals as string) +
      parseInt(summary.companies as string) +
      parseInt(summary.members as string) +
      parseInt(summary.notes as string) +
      parseInt(summary.rooms as string) +
      parseInt(summary.equipment as string) +
      parseInt(summary.projects as string) +
      parseInt(summary.tracks as string) +
      parseInt(summary.musicians as string) +
      parseInt(summary.sessions as string) +
      parseInt(summary.task_types as string) +
      parseInt(summary.time_entries as string) +
      parseInt(summary.invoices as string) +
      parseInt(summary.invoice_items as string) +
      parseInt(summary.quotes as string) +
      parseInt(summary.quote_items as string);

    console.log(`\n   Total records:        ${totalRecords}`);

    console.log('\n✨ Realistic data seeded successfully!\n');
  } catch (error) {
    console.error('\n❌ Error seeding realistic data:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seedRealisticData();
