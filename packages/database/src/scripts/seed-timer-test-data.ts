/**
 * Seed Timer Test Data
 *
 * Creates complete test data for timer testing:
 * - 3 clients
 * - 3 rooms
 * - 5 task types
 * - 1 test session
 *
 * Usage:
 * cd packages/database
 * DATABASE_URL="postgresql://localhost:5432/rsm_master" pnpm tsx src/scripts/seed-timer-test-data.ts
 */

import { getTenantDb, closeAllConnections } from '../connection.js';
import {
  clients,
  rooms,
  taskTypes,
  sessions,
} from '../tenant/schema.js';

async function seedTimerTestData() {
  try {
    console.log('🌱 Seeding Timer Test Data for Organization 2...\n');

    // Connect to tenant_2 (organization 2 used in dev mode)
    const organizationId = 2;
    const db = await getTenantDb(organizationId);

    console.log(`✓ Connected to tenant database for organization ${organizationId}\n`);

    // ========================================
    // 1. SEED CLIENTS
    // ========================================
    console.log('👥 Seeding Clients...');

    const clientData = [
      {
        name: 'Sophie Martin',
        email: 'sophie.martin@test.com',
        phone: '+33 6 12 34 56 78',
        type: 'individual' as const,
        address: '15 rue de la Musique',
        city: 'Paris',
        country: 'France',
        notes: 'Chanteuse professionnelle',
        isVip: true,
        portalAccess: true,
      },
      {
        name: 'Marc Dubois',
        email: 'marc.dubois@test.com',
        phone: '+33 6 23 45 67 89',
        type: 'individual' as const,
        address: '42 avenue du Hip-Hop',
        city: 'Lyon',
        country: 'France',
        notes: 'Rappeur',
        isVip: false,
        portalAccess: true,
      },
      {
        name: 'Production Sound SARL',
        email: 'contact@production-sound.fr',
        phone: '+33 1 42 56 78 90',
        type: 'company' as const,
        address: '89 boulevard des Studios',
        city: 'Paris',
        country: 'France',
        notes: 'Label de production',
        isVip: false,
        portalAccess: false,
      },
    ];

    const insertedClients = await db.insert(clients).values(clientData).returning();
    console.log(`  ✅ Created ${insertedClients.length} clients\n`);

    // ========================================
    // 2. SEED ROOMS
    // ========================================
    console.log('🏠 Seeding Rooms...');

    const roomData = [
      {
        name: 'Studio A - Recording',
        description: 'Grande salle d\'enregistrement professionnelle',
        type: 'recording' as const,
        hourlyRate: '75.00',
        halfDayRate: '280.00',
        fullDayRate: '500.00',
        capacity: 8,
        size: 45,
        hasIsolationBooth: true,
        hasLiveRoom: true,
        hasControlRoom: true,
        color: '#e74c3c',
        isActive: true,
        isAvailableForBooking: true,
      },
      {
        name: 'Studio B - Mixing',
        description: 'Salle de mixage avec monitoring haute qualité',
        type: 'mixing' as const,
        hourlyRate: '60.00',
        halfDayRate: '220.00',
        fullDayRate: '400.00',
        capacity: 4,
        size: 30,
        hasIsolationBooth: false,
        hasLiveRoom: false,
        hasControlRoom: true,
        color: '#3498db',
        isActive: true,
        isAvailableForBooking: true,
      },
      {
        name: 'Studio C - Mastering',
        description: 'Salle de mastering avec traitement acoustique premium',
        type: 'mastering' as const,
        hourlyRate: '80.00',
        halfDayRate: '300.00',
        fullDayRate: '550.00',
        capacity: 2,
        size: 20,
        hasIsolationBooth: false,
        hasLiveRoom: false,
        hasControlRoom: true,
        color: '#2ecc71',
        isActive: true,
        isAvailableForBooking: true,
      },
    ];

    const insertedRooms = await db.insert(rooms).values(roomData).returning();
    console.log(`  ✅ Created ${insertedRooms.length} rooms\n`);

    // ========================================
    // 3. SEED TASK TYPES
    // ========================================
    console.log('⏱️  Seeding Task Types...');

    const taskTypeData = [
      {
        name: 'Setup',
        description: 'Installation et préparation du studio',
        hourlyRate: '50.00',
        category: 'billable' as const,
        color: '#3B82F6',
        sortOrder: 1,
        isActive: true,
      },
      {
        name: 'Recording',
        description: 'Enregistrement actif',
        hourlyRate: '75.00',
        category: 'billable' as const,
        color: '#EF4444',
        sortOrder: 2,
        isActive: true,
      },
      {
        name: 'Mixing',
        description: 'Mixage et production audio',
        hourlyRate: '60.00',
        category: 'billable' as const,
        color: '#10B981',
        sortOrder: 3,
        isActive: true,
      },
      {
        name: 'Mastering',
        description: 'Mastering et finalisation',
        hourlyRate: '80.00',
        category: 'billable' as const,
        color: '#8B5CF6',
        sortOrder: 4,
        isActive: true,
      },
      {
        name: 'Break',
        description: 'Pause (non facturable)',
        hourlyRate: '0.00',
        category: 'non-billable' as const,
        color: '#6B7280',
        sortOrder: 5,
        isActive: true,
      },
    ];

    const insertedTaskTypes = await db.insert(taskTypes).values(taskTypeData).returning();
    console.log(`  ✅ Created ${insertedTaskTypes.length} task types\n`);

    // ========================================
    // 4. SEED TEST SESSION
    // ========================================
    console.log('📅 Seeding Test Session...');

    const sessionData = {
      clientId: insertedClients[0].id,
      roomId: insertedRooms[0].id,
      title: 'Test Timer Session',
      description: 'Session de test pour le chronomètre',
      startTime: new Date(),
      endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      status: 'in-progress' as const,
      totalAmount: '300.00',
      depositAmount: '90.00',
      depositPaid: true,
      paymentStatus: 'partial' as const,
    };

    const insertedSessions = await db.insert(sessions).values(sessionData).returning();
    console.log(`  ✅ Created ${insertedSessions.length} session\n`);

    // ========================================
    // SUMMARY
    // ========================================
    console.log('✅ ✅ ✅ TIMER TEST DATA SEEDED! ✅ ✅ ✅\n');
    console.log('📊 Summary:');
    console.log(`   - Organization: ${organizationId} (tenant_2)`);
    console.log(`   - Clients: ${insertedClients.length}`);
    console.log(`   - Rooms: ${insertedRooms.length}`);
    console.log(`   - Task Types: ${insertedTaskTypes.length}`);
    console.log(`   - Sessions: ${insertedSessions.length}\n`);

    console.log('🎯 Test Session Details:');
    console.log(`   - Session ID: ${insertedSessions[0].id}`);
    console.log(`   - Title: ${insertedSessions[0].title}`);
    console.log(`   - Client: ${insertedClients[0].name}`);
    console.log(`   - Room: ${insertedRooms[0].name}`);
    console.log(`   - Status: ${insertedSessions[0].status}\n`);

    console.log('🔗 Access the session:');
    console.log(`   http://localhost:5174/sessions/${insertedSessions[0].id}\n`);

    console.log('⚡ Next Steps:');
    console.log('   1. Refresh the browser (http://localhost:5174)');
    console.log('   2. Navigate to the test session');
    console.log('   3. Test the timer with the created task types\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding timer test data:', error);
    process.exit(1);
  } finally {
    await closeAllConnections();
  }
}

// Run seed
seedTimerTestData();
