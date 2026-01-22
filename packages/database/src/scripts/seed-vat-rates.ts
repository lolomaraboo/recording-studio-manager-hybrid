/**
 * Seed Default VAT Rates (France)
 *
 * Creates 4 default French VAT rates:
 * 1. TVA Standard 20% (default)
 * 2. TVA Réduit 10%
 * 3. TVA Réduit Spécial 5.5%
 * 4. TVA Super Réduit 2.1%
 *
 * This script is idempotent - safe to run multiple times.
 *
 * Usage:
 * DATABASE_URL="postgresql://postgres:password@localhost:5432/rsm_master" TENANT_ORG_ID="1" pnpm tsx src/scripts/seed-vat-rates.ts
 */

import { eq } from 'drizzle-orm';
import { getTenantDb } from '../connection.js';
import { vatRates } from '../tenant/schema.js';

export const DEFAULT_VAT_RATES = [
  {
    name: 'TVA Standard 20%',
    rate: '20.00',
    isDefault: true,
    isActive: true,
  },
  {
    name: 'TVA Réduit 10%',
    rate: '10.00',
    isDefault: false,
    isActive: true,
  },
  {
    name: 'TVA Réduit Spécial 5.5%',
    rate: '5.50',
    isDefault: false,
    isActive: true,
  },
  {
    name: 'TVA Super Réduit 2.1%',
    rate: '2.10',
    isDefault: false,
    isActive: true,
  },
];

async function seedVatRates() {
  try {
    console.log('🌱 Seeding VAT rates...\n');

    const organizationId = parseInt(process.env.TENANT_ORG_ID || '1');
    const tenantDb = await getTenantDb(organizationId);

    console.log(`✓ Connected to tenant database for organization ${organizationId}\n`);

    let insertedCount = 0;
    let skippedCount = 0;

    for (const vatRate of DEFAULT_VAT_RATES) {
      // Check if VAT rate already exists by name
      const existing = await tenantDb.query.vatRates.findFirst({
        where: eq(vatRates.name, vatRate.name),
      });

      if (existing) {
        console.log(`⏭️  Skipped: "${vatRate.name}" already exists (ID: ${existing.id})`);
        skippedCount++;
      } else {
        const [inserted] = await tenantDb
          .insert(vatRates)
          .values(vatRate)
          .returning();

        console.log(`✓ Inserted: "${vatRate.name}" - ID: ${inserted.id}`);
        insertedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Inserted: ${insertedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total: ${insertedCount + skippedCount}`);
    console.log(`\n✅ VAT rates seed complete!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding VAT rates:', error);
    process.exit(1);
  }
}

seedVatRates();
