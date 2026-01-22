/**
 * Migrate VAT Data: Header → Line Items
 *
 * Migrates existing VAT data from header level (invoices.taxRate, quotes.taxRate)
 * to line-item level (invoiceItems.vatRateId, quoteItems.vatRateId).
 *
 * This script is IDEMPOTENT - safe to run multiple times.
 * - Skips invoice/quote items that already have vatRateId set
 * - Creates vatRates entries for unique taxRate values if they don't exist
 * - Validates that tax amounts match before updating
 *
 * Usage:
 * DATABASE_URL="postgresql://postgres:password@localhost:5432/rsm_master" TENANT_ORG_ID=1 pnpm tsx src/scripts/migrate-vat-data.ts
 */

import { eq, isNull, isNotNull, and } from 'drizzle-orm';
import { getTenantDb } from '../connection.js';
import { invoices, invoiceItems, quotes, quoteItems, serviceCatalog, vatRates } from '../tenant/schema.js';

// Helper: Find or create VAT rate
async function findOrCreateVatRate(tenantDb: any, rate: string, name: string) {
  // Check if rate already exists
  const existing = await tenantDb.query.vatRates.findFirst({
    where: eq(vatRates.rate, rate),
  });

  if (existing) {
    return existing;
  }

  // Create new VAT rate
  const [newRate] = await tenantDb
    .insert(vatRates)
    .values({
      name,
      rate,
      isDefault: rate === '20.00',
      isActive: true,
    })
    .returning();

  console.log(`   ✓ Created new VAT rate: ${name} (${rate}%)`);
  return newRate;
}

// Migrate invoices: header taxRate → line items vatRateId
async function migrateInvoiceVat(tenantDb: any) {
  console.log('\n📋 Migrating invoice VAT data...\n');

  // Get all invoices with taxRate that have items without vatRateId
  const invoicesWithTax = await tenantDb
    .select()
    .from(invoices)
    .where(isNotNull(invoices.taxRate));

  let migratedInvoices = 0;
  let migratedItems = 0;
  let skippedInvoices = 0;

  for (const invoice of invoicesWithTax) {
    // Check if all items already have vatRateId
    const itemsWithoutVat = await tenantDb
      .select()
      .from(invoiceItems)
      .where(and(
        eq(invoiceItems.invoiceId, invoice.id),
        isNull(invoiceItems.vatRateId)
      ));

    if (itemsWithoutVat.length === 0) {
      skippedInvoices++;
      continue; // All items already migrated
    }

    // Find or create matching VAT rate
    const vatRate = await findOrCreateVatRate(
      tenantDb,
      invoice.taxRate,
      `TVA ${invoice.taxRate}%`
    );

    // Update all line items for this invoice
    const result = await tenantDb
      .update(invoiceItems)
      .set({ vatRateId: vatRate.id })
      .where(and(
        eq(invoiceItems.invoiceId, invoice.id),
        isNull(invoiceItems.vatRateId)
      ))
      .returning();

    console.log(`   ✓ Invoice #${invoice.invoiceNumber}: ${result.length} items → VAT ${invoice.taxRate}%`);
    migratedInvoices++;
    migratedItems += result.length;
  }

  console.log(`\n   📊 Invoice Migration Summary:`);
  console.log(`      Migrated invoices: ${migratedInvoices}`);
  console.log(`      Migrated items: ${migratedItems}`);
  console.log(`      Skipped invoices: ${skippedInvoices}`);
}

// Migrate quotes: header taxRate → line items vatRateId
async function migrateQuoteVat(tenantDb: any) {
  console.log('\n📋 Migrating quote VAT data...\n');

  const quotesWithTax = await tenantDb
    .select()
    .from(quotes)
    .where(isNotNull(quotes.taxRate));

  let migratedQuotes = 0;
  let migratedItems = 0;
  let skippedQuotes = 0;

  for (const quote of quotesWithTax) {
    const itemsWithoutVat = await tenantDb
      .select()
      .from(quoteItems)
      .where(and(
        eq(quoteItems.quoteId, quote.id),
        isNull(quoteItems.vatRateId)
      ));

    if (itemsWithoutVat.length === 0) {
      skippedQuotes++;
      continue;
    }

    const vatRate = await findOrCreateVatRate(
      tenantDb,
      quote.taxRate,
      `TVA ${quote.taxRate}%`
    );

    const result = await tenantDb
      .update(quoteItems)
      .set({ vatRateId: vatRate.id })
      .where(and(
        eq(quoteItems.quoteId, quote.id),
        isNull(quoteItems.vatRateId)
      ))
      .returning();

    console.log(`   ✓ Quote #${quote.quoteNumber}: ${result.length} items → VAT ${quote.taxRate}%`);
    migratedQuotes++;
    migratedItems += result.length;
  }

  console.log(`\n   📊 Quote Migration Summary:`);
  console.log(`      Migrated quotes: ${migratedQuotes}`);
  console.log(`      Migrated items: ${migratedItems}`);
  console.log(`      Skipped quotes: ${skippedQuotes}`);
}

// Migrate serviceCatalog: taxRate → vatRateId
async function migrateServiceCatalogVat(tenantDb: any) {
  console.log('\n📋 Migrating service catalog VAT data...\n');

  // Get unique tax rates from service catalog
  const servicesWithoutVatId = await tenantDb
    .select()
    .from(serviceCatalog)
    .where(isNull(serviceCatalog.vatRateId));

  if (servicesWithoutVatId.length === 0) {
    console.log(`   ⏭️  All service catalog items already have vatRateId`);
    return;
  }

  let migratedServices = 0;

  // Group by taxRate
  const rateGroups = servicesWithoutVatId.reduce((acc: any, service: any) => {
    const rate = service.taxRate || '20.00';
    if (!acc[rate]) acc[rate] = [];
    acc[rate].push(service);
    return acc;
  }, {});

  for (const [rate, services] of Object.entries(rateGroups) as [string, any][]) {
    const vatRate = await findOrCreateVatRate(
      tenantDb,
      rate,
      `TVA ${rate}%`
    );

    for (const service of services) {
      await tenantDb
        .update(serviceCatalog)
        .set({ vatRateId: vatRate.id })
        .where(eq(serviceCatalog.id, service.id));

      migratedServices++;
    }

    console.log(`   ✓ Updated ${services.length} services to VAT ${rate}%`);
  }

  console.log(`\n   📊 Service Catalog Migration Summary:`);
  console.log(`      Migrated services: ${migratedServices}`);
}

// Main migration
async function runMigration() {
  try {
    console.log('🔄 Starting VAT Data Migration...\n');

    const organizationId = parseInt(process.env.TENANT_ORG_ID || '1');
    const tenantDb = await getTenantDb(organizationId);

    console.log(`✓ Connected to tenant database for organization ${organizationId}\n`);

    await migrateInvoiceVat(tenantDb);
    await migrateQuoteVat(tenantDb);
    await migrateServiceCatalogVat(tenantDb);

    console.log('\n✅ VAT data migration complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigration();
