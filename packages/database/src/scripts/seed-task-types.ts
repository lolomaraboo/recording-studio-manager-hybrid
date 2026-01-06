/**
 * Seed Default Task Types
 *
 * Creates 5 default task types for development and testing:
 * 1. Setup (Billable, $50/hr, blue)
 * 2. Recording (Billable, $75/hr, red)
 * 3. Mixing (Billable, $60/hr, green)
 * 4. Mastering (Billable, $80/hr, purple)
 * 5. Break (Non-billable, $0/hr, gray)
 *
 * This script is idempotent - safe to run multiple times.
 *
 * Usage:
 * DATABASE_URL="postgresql://postgres:password@localhost:5432/rsm_master" TENANT_DB_NAME="tenant_1" pnpm tsx src/scripts/seed-task-types.ts
 */

import { eq } from 'drizzle-orm';
import { getTenantDb } from '../connection.js';
import { taskTypes } from '../tenant/schema.js';

const DEFAULT_TASK_TYPES = [
  {
    name: 'Setup',
    description: 'Studio setup and preparation time',
    hourlyRate: '50.00',
    category: 'billable' as const,
    color: '#3B82F6', // Blue
    sortOrder: 1,
  },
  {
    name: 'Recording',
    description: 'Active recording session time',
    hourlyRate: '75.00',
    category: 'billable' as const,
    color: '#EF4444', // Red
    sortOrder: 2,
  },
  {
    name: 'Mixing',
    description: 'Audio mixing and production time',
    hourlyRate: '60.00',
    category: 'billable' as const,
    color: '#10B981', // Green
    sortOrder: 3,
  },
  {
    name: 'Mastering',
    description: 'Audio mastering and finalization time',
    hourlyRate: '80.00',
    category: 'billable' as const,
    color: '#8B5CF6', // Purple
    sortOrder: 4,
  },
  {
    name: 'Break',
    description: 'Break time (non-billable)',
    hourlyRate: '0.00',
    category: 'non-billable' as const,
    color: '#6B7280', // Gray
    sortOrder: 5,
  },
];

async function seedTaskTypes() {
  try {
    console.log('🌱 Seeding task types...\n');

    // Get tenant database (organization 1 by default)
    const organizationId = 1;
    const tenantDb = await getTenantDb(organizationId);

    console.log(`✓ Connected to tenant database for organization ${organizationId}\n`);

    // Check each task type and insert if not exists
    let insertedCount = 0;
    let skippedCount = 0;

    for (const taskType of DEFAULT_TASK_TYPES) {
      // Check if task type already exists by name
      const existing = await tenantDb.query.taskTypes.findFirst({
        where: eq(taskTypes.name, taskType.name),
      });

      if (existing) {
        console.log(`⏭️  Skipped: "${taskType.name}" already exists (ID: ${existing.id})`);
        skippedCount++;
      } else {
        // Insert task type
        const [inserted] = await tenantDb
          .insert(taskTypes)
          .values({
            ...taskType,
            isActive: true,
          })
          .returning();

        console.log(
          `✓ Inserted: "${taskType.name}" (${taskType.category}, $${taskType.hourlyRate}/hr) - ID: ${inserted.id}`
        );
        insertedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Inserted: ${insertedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total: ${insertedCount + skippedCount}`);
    console.log(`\n✅ Task types seed complete!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding task types:', error);
    process.exit(1);
  }
}

// Run seed
seedTaskTypes();
