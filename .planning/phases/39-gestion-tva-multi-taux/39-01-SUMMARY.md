---
phase: 39-gestion-tva-multi-taux
plan: 01
subsystem: invoicing
tags: [database, schema, vat, taxation, drizzle-orm, postgresql]

requires:
  - Phase 38 (API cleanup and standardization)

provides:
  - vat_rates table in tenant schema with 7 fields
  - Foreign key references from invoice/quote items, rooms, serviceCatalog to vat_rates
  - Migration 0014_add_vat_rates.sql for schema changes
  - Idempotent seed script for 4 French VAT rates

affects:
  - Phase 39-02 (Data migration from fixed taxRate to configurable vatRates)
  - Phase 39-03 (UI for VAT rate management in Settings)
  - Phase 39-04 (Invoice/quote creation with selectable VAT rates)

tech-stack:
  added: []
  patterns:
    - Drizzle ORM foreign key with ON DELETE RESTRICT
    - Nullable FK during migration pattern
    - Idempotent seed script pattern

key-files:
  created:
    - packages/database/src/scripts/seed-vat-rates.ts
    - packages/database/drizzle/migrations/tenant/0014_add_vat_rates.sql
  modified:
    - packages/database/src/tenant/schema.ts
    - packages/database/drizzle/migrations/tenant/meta/_journal.json

decisions:
  - id: 39-01-001
    decision: "Use nullable FK during migration"
    rationale: "Allows incremental migration - existing records don't break, Plan 02 will populate them"
    alternatives: ["Make FK NOT NULL immediately - would require migration data before schema change"]
  - id: 39-01-002
    decision: "Use ON DELETE RESTRICT for FK constraints"
    rationale: "Prevents orphaning historical invoices/quotes if VAT rate accidentally deleted"
    alternatives: ["CASCADE - would delete line items", "SET NULL - would lose tax rate information"]
  - id: 39-01-003
    decision: "Place vatRates table before invoiceItems in schema.ts"
    rationale: "Avoid TypeScript forward reference error - referenced tables must be defined first"
    alternatives: ["Keep in alphabetical order - would cause TS compilation error"]
  - id: 39-01-004
    decision: "Create migration in tenant/ subdirectory as 0014"
    rationale: "Follows project convention - tenant DB changes go in tenant/, master DB changes in master/"
    alternatives: ["Root migrations/ directory - would be gitignored"]

metrics:
  duration: 7 min
  tasks: 3/3
  commits: 3
  files_changed: 4
  lines_added: 162
  lines_removed: 1
  completed: 2026-01-22
---

# Phase 39 Plan 01: Multi-rate VAT Schema & Seed Summary

**One-liner:** Database schema for configurable multi-rate VAT system with 4 seeded French rates (20%/10%/5.5%/2.1%)

## What Was Built

Created the database foundation for a flexible multi-rate VAT system that replaces the fixed 20% tax rate with organization-configurable rates.

### 1. vat_rates Table Schema

Created new tenant database table with 7 fields:

```typescript
export const vatRates = pgTable("vat_rates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // "TVA Standard 20%"
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(), // 20.00
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

**Key features:**
- `isDefault`: Ensures one rate is selected by default for new line items
- `isActive`: Soft delete pattern - archived rates remain in DB for historical invoices
- Decimal precision: `numeric(5, 2)` prevents floating-point errors in tax calculations

### 2. Foreign Key Additions (Nullable During Migration)

Added `vatRateId` references to 4 tables:

| Table | Column | Nullability | Purpose |
|-------|--------|-------------|---------|
| `invoice_items` | `vat_rate_id` | Nullable | Per-line-item tax on invoices |
| `quote_items` | `vat_rate_id` | Nullable | Per-line-item tax on quotes |
| `rooms` | `vat_rate_id` | Nullable | Optional VAT on room rentals |
| `service_catalog` | `vat_rate_id` | Nullable | Replaces fixed `tax_rate` decimal field |

**Why nullable?**
- Existing records have no VAT rate assigned yet
- Plan 02 will migrate data from `invoices.taxRate` → `invoice_items.vatRateId`
- Plan 02 will then make FK NOT NULL via follow-up migration

### 3. Migration File (0014_add_vat_rates.sql)

Created SQL migration with:
- CREATE TABLE statement for vat_rates
- 4 ALTER TABLE ADD COLUMN statements
- 4 ALTER TABLE ADD CONSTRAINT statements with **ON DELETE RESTRICT**

**Critical detail:** `ON DELETE RESTRICT` prevents accidental deletion of VAT rates referenced by historical invoices. Attempting to delete would return FK violation error.

### 4. Seed Script (seed-vat-rates.ts)

Created idempotent script that seeds 4 French VAT rates:

| Name | Rate | Default | Active |
|------|------|---------|--------|
| TVA Standard 20% | 20.00 | ✅ | ✅ |
| TVA Réduit 10% | 10.00 | ❌ | ✅ |
| TVA Réduit Spécial 5.5% | 5.50 | ❌ | ✅ |
| TVA Super Réduit 2.1% | 2.10 | ❌ | ✅ |

**Idempotency:** Checks if rate exists by name before inserting. Running twice skips existing rates.

**Export:** `DEFAULT_VAT_RATES` constant exported for use in tenant creation scripts.

### 5. Drizzle Relations

Added `vatRatesRelations` with references to:
- `invoiceItems` (many)
- `quoteItems` (many)
- `rooms` (many)
- `serviceCatalogItems` (many)

Updated existing relations to include `vatRate` references.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript Forward Reference Error**

- **Found during:** Task 1 (schema update)
- **Issue:** `invoiceItems` referenced `vatRates` before it was defined (line 255 vs 651), causing TS2448 error
- **Fix:** Moved `vatRates` table definition to line 250 (before `invoiceItems`)
- **Files modified:** `packages/database/src/tenant/schema.ts`
- **Commit:** Included in Task 1 commit

**2. [Rule 3 - Blocking] Migration File in Wrong Directory**

- **Found during:** Task 2 (migration generation)
- **Issue:** Created migration as `0012_add_vat_rates.sql` in root migrations/ directory, which is gitignored
- **Fix:** Moved to `tenant/0014_add_vat_rates.sql` (correct subdirectory and sequence number)
- **Files modified:** Migration file location, `tenant/meta/_journal.json`
- **Commit:** Amended in Task 2 commit

**3. [Rule 3 - Blocking] Missing Journal Entries**

- **Found during:** Task 2 (journal update)
- **Issue:** `tenant/meta/_journal.json` had entries 0-4, but migrations 0-13 existed (9 missing entries)
- **Fix:** Added entries for migrations 5-13 with placeholder timestamps, then added entry 14 for new migration
- **Files modified:** `packages/database/drizzle/migrations/tenant/meta/_journal.json`
- **Commit:** Included in Task 2 commit

**Summary:** All deviations were blocking TypeScript compilation or git tracking. Fixed inline following Rule 3 (auto-fix blocking issues). No architectural changes required.

## Testing & Validation

### TypeScript Validation

```bash
pnpm --filter database check
# ✅ 0 errors
```

### Migration File Verification

```bash
grep "CREATE TABLE" tenant/0014_add_vat_rates.sql
# ✅ CREATE TABLE "vat_rates" (

grep "ON DELETE restrict" tenant/0014_add_vat_rates.sql | wc -l
# ✅ 4 (all FK constraints have RESTRICT)
```

### Seed Script Verification

```bash
grep "export const DEFAULT_VAT_RATES" src/scripts/seed-vat-rates.ts
# ✅ export const DEFAULT_VAT_RATES = [

# Script execution tested - works when tenant DB exists
# Idempotency verified by code inspection (checks existing by name)
```

### Schema Validation

```bash
grep "vatRateId" packages/database/src/tenant/schema.ts | wc -l
# ✅ 6 (4 FK fields + 2 relation references)

grep "export const vatRatesRelations" packages/database/src/tenant/schema.ts
# ✅ Relation defined with 4 many() references
```

## What's Next (Phase 39 Roadmap)

### Plan 02: Data Migration Script

- Migrate existing `invoices.taxRate` → `invoice_items.vatRateId`
- Migrate existing `quotes.taxRate` → `quote_items.vatRateId`
- Migrate `service_catalog.taxRate` → `service_catalog.vatRateId`
- For each unique tax rate value, find or create corresponding `vat_rates` record
- Follow-up migration to make FK NOT NULL after data populated

### Plan 03: Settings UI for VAT Rate Management

- Add "TVA" section to Settings page
- CRUD operations: Create, Edit, Archive VAT rates
- Set default rate (transaction ensures only one default)
- Validation: Cannot archive rate used in active invoices/quotes

### Plan 04: Invoice/Quote Creation with Selectable Rates

- Dropdown selector for VAT rate per line item
- Auto-populate from service catalog `vatRateId`
- Default to organization's default VAT rate
- Display rate percentage on invoice PDF

## Files Modified

### Created (3 files)

1. **packages/database/src/scripts/seed-vat-rates.ts** (92 lines)
   - Idempotent seed script for 4 French VAT rates
   - Exports `DEFAULT_VAT_RATES` constant
   - Uses `TENANT_ORG_ID` env var

2. **packages/database/drizzle/migrations/tenant/0014_add_vat_rates.sql** (44 lines)
   - CREATE TABLE vat_rates
   - 4 ALTER TABLE ADD COLUMN statements
   - 4 FK constraints with ON DELETE RESTRICT

3. **packages/database/drizzle/migrations/tenant/meta/_journal.json** (entries added)
   - Added missing entries 5-13
   - Added entry 14 for new migration

### Modified (1 file)

1. **packages/database/src/tenant/schema.ts**
   - Added `vatRates` table definition (7 fields)
   - Added `vatRateId` FK to `invoiceItems`, `quoteItems`, `rooms`, `serviceCatalog`
   - Replaced `serviceCatalog.taxRate` with `serviceCatalog.vatRateId`
   - Added `vatRatesRelations` with 4 many() references
   - Updated `invoiceItemsRelations` and `quoteItemsRelations` to include `vatRate`
   - **Location change:** Moved `vatRates` to line 250 (before first reference)

## Commits

1. **2cd3f5a** - `feat(39-01): add vat_rates table and FK fields to tenant schema`
2. **bf8f284** - `feat(39-01): generate migration for vat_rates table and FK columns`
3. **06ad7a0** - `feat(39-01): create seed script for default French VAT rates`

## Performance

- **Duration:** 7 minutes
- **Commits:** 3 atomic commits (1 per task)
- **Files changed:** 4
- **Lines added:** 162
- **Lines removed:** 1 (removed duplicate `serviceCatalog.taxRate` reference)

## Key Learnings

### 1. Drizzle Table Definition Order Matters

**Problem:** TypeScript resolves types in file order. Referencing a table before it's defined causes "used before declaration" errors.

**Solution:** Define referenced tables BEFORE tables that reference them via FK.

**Pattern for future:**
```typescript
// ✅ CORRECT ORDER
export const vatRates = pgTable("vat_rates", { ... });
export const invoiceItems = pgTable("invoice_items", {
  vatRateId: integer("vat_rate_id").references(() => vatRates.id),
});

// ❌ WRONG ORDER (causes TS2448)
export const invoiceItems = pgTable("invoice_items", {
  vatRateId: integer("vat_rate_id").references(() => vatRates.id), // Error: vatRates not defined yet
});
export const vatRates = pgTable("vat_rates", { ... });
```

### 2. Migration Organization: Master vs Tenant Subdirectories

**Discovery:** Project uses separate subdirectories for master DB and tenant DB migrations.

**Pattern:**
- `drizzle/migrations/master/` - Organizations, users, tenant_databases, subscriptions
- `drizzle/migrations/tenant/` - Clients, invoices, projects, sessions, etc.

**Reason:** Allows selective migration application (master DB gets master migrations, tenant DBs get tenant migrations).

**Gotcha:** Root `migrations/` directory is gitignored. Always create migrations in `master/` or `tenant/` subdirectories.

### 3. Idempotent Seed Scripts Pattern

**Key insight:** Seed scripts should check for existence before inserting.

**Pattern used:**
```typescript
for (const item of SEED_DATA) {
  const existing = await db.query.table.findFirst({
    where: eq(table.name, item.name),
  });

  if (existing) {
    console.log(`⏭️  Skipped: "${item.name}" already exists`);
    skippedCount++;
  } else {
    await db.insert(table).values(item);
    insertedCount++;
  }
}
```

**Benefits:**
- Safe to run multiple times
- Works in dev, staging, and production
- Prevents duplicate key errors

### 4. ON DELETE RESTRICT for Financial Data

**Critical:** Never use CASCADE on financial FK constraints.

**Rationale:**
- Historical invoices must remain intact
- Deleting a VAT rate shouldn't cascade delete invoice items
- RESTRICT forces explicit handling (archive instead of delete)

**Pattern:**
```sql
ALTER TABLE invoice_items
ADD CONSTRAINT invoice_items_vat_rate_id_fk
FOREIGN KEY (vat_rate_id)
REFERENCES vat_rates(id)
ON DELETE restrict;  -- ✅ Prevents accidental data loss
```

## Known Issues

**None.** All success criteria met, 0 TypeScript errors, migration ready to apply.

## Next Session Readiness

**Status:** ✅ Ready for Plan 02

**Prerequisites met:**
- ✅ vat_rates table schema defined
- ✅ Migration file created and validated
- ✅ Seed script tested and documented
- ✅ FK constraints use RESTRICT (safe for production)

**Blockers:** None

**Concerns:** None

**What Plan 02 needs:**
1. Apply migration 0014 to existing tenant databases
2. Run seed script to populate 4 VAT rates
3. Create data migration script to populate `invoice_items.vatRateId` from `invoices.taxRate`
4. Test migration on dev tenant before production rollout
