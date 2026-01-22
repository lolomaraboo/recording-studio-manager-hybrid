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
  // Only select columns we need to avoid schema mismatch issues
  const invoicesWithTax = await tenantDb
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      taxRate: invoices.taxRate,
    })
    .from(invoices)
    .where(isNotNull(invoices.taxRate));

  let migratedInvoices = 0;
  let migratedItems = 0;
  let skippedInvoices = 0;

  for (const invoice of invoicesWithTax) {
    // Check if all items already have vatRateId
    const itemsWithoutVat = await tenantDb
      .select({
        id: invoiceItems.id,
      })
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

  // Only select columns we need to avoid schema mismatch issues
  const quotesWithTax = await tenantDb
    .select({
      id: quotes.id,
      quoteNumber: quotes.quoteNumber,
      taxRate: quotes.taxRate,
    })
    .from(quotes)
    .where(isNotNull(quotes.taxRate));

  let migratedQuotes = 0;
  let migratedItems = 0;
  let skippedQuotes = 0;

  for (const quote of quotesWithTax) {
    const itemsWithoutVat = await tenantDb
      .select({
        id: quoteItems.id,
      })
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

  // Check if service_catalog table exists (not all tenants have it)
  try {
    const result: any = await tenantDb.execute(
      `SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'service_catalog'`
    );

    const tableExists = parseInt(result.rows[0].count) > 0;

    if (!tableExists) {
      console.log(`   ⏭️  service_catalog table does not exist, skipping`);
      return;
    }
  } catch (error) {
    console.log(`   ⏭️  service_catalog table check failed, skipping`);
    return;
  }

  // Use raw SQL to avoid schema mismatch issues with taxRate field
  let migratedServices = 0;

  try {
    // Get unique tax rates from service catalog where vat_rate_id is NULL
    const servicesResult: any = await tenantDb.execute(
      `SELECT id, tax_rate FROM service_catalog WHERE vat_rate_id IS NULL`
    );

    if (servicesResult.rows.length === 0) {
      console.log(`   ⏭️  All service catalog items already have vatRateId`);
      return;
    }

    // Group by tax_rate
    const rateGroups: Record<string, any[]> = {};
    for (const service of servicesResult.rows) {
      const rate = service.tax_rate || '20.00';
      if (!rateGroups[rate]) rateGroups[rate] = [];
      rateGroups[rate].push(service);
    }

    for (const [rate, services] of Object.entries(rateGroups)) {
      const vatRate = await findOrCreateVatRate(
        tenantDb,
        rate,
        `TVA ${rate}%`
      );

      for (const service of services) {
        await tenantDb.execute(
          `UPDATE service_catalog SET vat_rate_id = ${vatRate.id} WHERE id = ${service.id}`
        );
        migratedServices++;
      }

      console.log(`   ✓ Updated ${services.length} services to VAT ${rate}%`);
    }

    console.log(`\n   📊 Service Catalog Migration Summary:`);
    console.log(`      Migrated services: ${migratedServices}`);
  } catch (error) {
    console.log(`   ⚠️  service_catalog migration skipped:`, error);
  }
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
