# Phase 39: Gestion TVA Multi-Taux - Research

**Researched:** 2026-01-21
**Domain:** Multi-rate VAT management for multi-tenant SaaS invoicing
**Confidence:** HIGH

## Summary

This phase transforms the current single-rate VAT system (20% fixed at invoice/quote level) into a flexible multi-rate VAT system with per-line-item taxation. The research confirms that France maintains four stable VAT rates (20%, 10%, 5.5%, 2.1%) as of 2026, and best practices recommend moving VAT calculation from header level to line item level for maximum flexibility.

The standard approach involves:
1. Creating a configurable `vat_rates` table per tenant
2. Adding foreign key references from invoice/quote line items to VAT rates
3. Migrating existing header-level `taxRate` data to line-item level
4. Providing organization-level VAT rate management UI

**Primary recommendation:** Use Drizzle ORM's built-in foreign key support with identity columns, implement data migration script that preserves existing tax amounts during transition, and provide a Finance settings tab for VAT rate CRUD operations.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Drizzle ORM | 0.44+ | Database schema & migrations | Already project standard, supports PostgreSQL identity columns and foreign key actions |
| PostgreSQL | 16+ | Relational database | Already project standard, handles decimal precision for tax rates |
| Zod | 3.x | Input validation | Already project standard for tRPC input schemas |
| React Hook Form | 7.x | Form management | Standard for complex forms in React apps |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Table | Latest | Data table for VAT rates | Already in project, consistent UI |
| shadcn/ui Dialog | Latest | Create/edit VAT rate modals | Already in project, accessible modals |
| TailwindCSS | 4.x | Styling | Already in project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom VAT table | External tax API (Avalara, TaxJar) | Custom = full control, simpler for single-country. API = automatic rate updates but $$ and overkill for France-only |
| Drizzle FK | Manual reference via ID | Drizzle FK enforces referential integrity at database level |

**Installation:**
```bash
# No new dependencies needed - all libraries already in project
pnpm --filter database db:generate  # Generate migration after schema changes
pnpm --filter database db:migrate   # Apply migration
```

## Architecture Patterns

### Recommended Database Schema Pattern

**Tenant DB Changes:**

```typescript
// New table: vat_rates
export const vatRates = pgTable("vat_rates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // "TVA standard 20%"
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(), // 20.00
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Updated: invoiceItems (add vatRateId FK)
export const invoiceItems = pgTable("invoice_items", {
  // ... existing fields ...
  vatRateId: integer("vat_rate_id").references(() => vatRates.id).notNull(),
});

// Updated: quoteItems (add vatRateId FK)
export const quoteItems = pgTable("quote_items", {
  // ... existing fields ...
  vatRateId: integer("vat_rate_id").references(() => vatRates.id).notNull(),
});

// Updated: rooms (add vatRateId FK)
export const rooms = pgTable("rooms", {
  // ... existing fields ...
  vatRateId: integer("vat_rate_id").references(() => vatRates.id),
});

// Updated: serviceCatalog (replace taxRate with vatRateId)
export const serviceCatalog = pgTable("service_catalog", {
  // ... existing fields ...
  // REMOVE: taxRate: decimal("tax_rate", ...)
  vatRateId: integer("vat_rate_id").references(() => vatRates.id).notNull(),
});
```

### Pattern 1: Default VAT Rate Selection

**What:** Ensure exactly one VAT rate is marked as default per organization
**When to use:** When creating new line items, rooms, or service catalog entries
**Example:**
```typescript
// Source: Industry best practice for multi-rate tax systems
async function setDefaultVatRate(tenantDb: TenantDb, vatRateId: number) {
  // Transaction: unset all defaults, then set new default
  await tenantDb.transaction(async (tx) => {
    // Unset all existing defaults
    await tx.update(vatRates)
      .set({ isDefault: false })
      .where(eq(vatRates.isDefault, true));

    // Set new default
    await tx.update(vatRates)
      .set({ isDefault: true })
      .where(eq(vatRates.id, vatRateId));
  });
}
```

### Pattern 2: Data Migration Strategy (Header to Line Item)

**What:** Safely migrate existing invoice/quote VAT from header level to line items
**When to use:** During migration from old schema to new schema
**Example:**
```typescript
// Migration script pattern
async function migrateInvoiceVatToLineItems(tenantDb: TenantDb) {
  // 1. Get all invoices with taxRate
  const invoicesWithTax = await tenantDb.select()
    .from(invoices)
    .where(isNotNull(invoices.taxRate));

  for (const invoice of invoicesWithTax) {
    // 2. Find or create matching VAT rate
    let vatRate = await tenantDb.query.vatRates.findFirst({
      where: eq(vatRates.rate, invoice.taxRate),
    });

    if (!vatRate) {
      // Create VAT rate if doesn't exist
      [vatRate] = await tenantDb.insert(vatRates)
        .values({
          name: `TVA ${invoice.taxRate}%`,
          rate: invoice.taxRate,
          isDefault: false,
          isActive: true,
        })
        .returning();
    }

    // 3. Update all line items for this invoice
    await tenantDb.update(invoiceItems)
      .set({ vatRateId: vatRate.id })
      .where(eq(invoiceItems.invoiceId, invoice.id));
  }
}
```

### Pattern 3: VAT Rate Archiving (Not Deletion)

**What:** Prevent deletion of VAT rates used in historical invoices/quotes
**When to use:** When organization wants to "delete" a VAT rate
**Example:**
```typescript
// Backend validation pattern
const archiveVatRate = protectedProcedure
  .input(z.object({ id: z.number() }))
  .mutation(async ({ ctx, input }) => {
    const tenantDb = await ctx.getTenantDb();

    // Check if VAT rate is used in active invoices/quotes
    const usedInInvoices = await tenantDb.query.invoiceItems.findFirst({
      where: eq(invoiceItems.vatRateId, input.id),
      with: { invoice: true },
    });

    if (usedInInvoices && usedInInvoices.invoice.status !== 'cancelled') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot archive VAT rate used in active invoices',
      });
    }

    // Archive instead of delete
    await tenantDb.update(vatRates)
      .set({ isActive: false })
      .where(eq(vatRates.id, input.id));
  });
```

### Anti-Patterns to Avoid

- **Deleting VAT rates:** Always archive (set `isActive: false`) instead of DELETE to preserve historical data integrity
- **Allowing multiple defaults:** Use database transaction to ensure atomic default switching
- **Storing tax rate as decimal on line items:** Always reference `vatRates` table via FK for consistency
- **Cascading deletes on vatRates:** Use `onDelete: 'restrict'` or validation to prevent breaking historical invoices

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tax rate updates for multiple countries | Custom rate tracking | Existing VAT databases (EU VAT rates are stable, France rates haven't changed since 2014) | France rates are stable; manual updates sufficient. External APIs add complexity. |
| Decimal precision for tax calculations | JavaScript numbers | PostgreSQL `decimal(10, 2)` + string parsing | Floating point errors in JS cause cent-level discrepancies. Database decimal = accurate. |
| VAT validation rules | Custom regex | Zod schema validation | `.min(0).max(100)` for rate percentage, `.precision(2)` for decimals |
| Table CRUD UI | Custom table component | shadcn/ui Data Table | Sorting, filtering, pagination already built. |

**Key insight:** Tax calculation accuracy is critical for legal compliance. Use database-level decimal precision, not JavaScript floating point math.

## Common Pitfalls

### Pitfall 1: Floating Point Tax Calculation Errors

**What goes wrong:** Using JavaScript `number` type for tax calculations leads to rounding errors (e.g., `0.1 + 0.2 = 0.30000000000000004`)

**Why it happens:** IEEE 754 floating point representation cannot precisely store decimal fractions

**How to avoid:**
- Store tax rates as PostgreSQL `decimal(5, 2)` (e.g., 20.00)
- Parse to string in TypeScript, use string-based decimal library if needed
- Perform final calculations in PostgreSQL or with proper decimal library

**Warning signs:**
- Invoice totals off by 0.01€
- Tax amounts don't match manual calculations

### Pitfall 2: Multiple Default VAT Rates

**What goes wrong:** Two VAT rates both marked as `isDefault: true`, causing unpredictable behavior when creating new line items

**Why it happens:** Concurrent updates or missing transaction wrapper when changing default

**How to avoid:**
- Wrap default change in database transaction
- Unset all existing defaults BEFORE setting new default
- Add unique partial index: `CREATE UNIQUE INDEX idx_vat_rates_default ON vat_rates (is_default) WHERE is_default = true;`

**Warning signs:**
- Dropdown showing multiple "default" rates
- Different line items getting different default rates

### Pitfall 3: Orphaned Line Items After VAT Rate Deletion

**What goes wrong:** Deleting a VAT rate breaks foreign key references in `invoiceItems`, causing queries to fail

**Why it happens:** Using `onDelete: 'cascade'` or allowing hard deletes

**How to avoid:**
- Never DELETE from `vat_rates` table
- Use soft delete pattern (`isActive: false`)
- Validate before archive: check if rate is used in active invoices/quotes
- Use `onDelete: 'restrict'` on foreign key

**Warning signs:**
- "Foreign key violation" errors when querying invoices
- Missing VAT rate data in invoice display

### Pitfall 4: Migrating Data Without Preserving Tax Amounts

**What goes wrong:** Migration script recalculates tax using new rate structure, changing historical invoice totals

**Why it happens:** Migration logic creates new VAT rate based on current invoice `taxRate`, but doesn't verify amounts match

**How to avoid:**
- Migration should be idempotent: find existing rate OR create new rate with exact same percentage
- Verify `taxAmount` on invoice matches recalculated amount before updating
- Log any discrepancies for manual review

**Warning signs:**
- Customer complaints about invoice total changes
- Audit logs showing modified paid invoices

### Pitfall 5: UI Not Disabling Archived Rates

**What goes wrong:** Dropdowns still show archived VAT rates (`isActive: false`), allowing users to select outdated rates

**Why it happens:** Query doesn't filter by `isActive`

**How to avoid:**
- Filter queries: `where: eq(vatRates.isActive, true)`
- Separate queries for active vs archived rates
- Admin view shows archived rates, user-facing dropdowns hide them

**Warning signs:**
- Users selecting "old" VAT rates
- Inconsistent rate selection across different forms

## Code Examples

Verified patterns from project standards:

### tRPC Router for VAT Rates CRUD

```typescript
// Source: Existing project routers pattern (rooms.ts, invoices.ts)
export const vatRatesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const tenantDb = await ctx.getTenantDb();
    return await tenantDb.query.vatRates.findMany({
      where: eq(vatRates.isActive, true),
      orderBy: [desc(vatRates.isDefault), asc(vatRates.rate)],
    });
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      rate: z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number),
      isDefault: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // If setting as default, unset others first
      if (input.isDefault) {
        await tenantDb.update(vatRates)
          .set({ isDefault: false })
          .where(eq(vatRates.isDefault, true));
      }

      const [newRate] = await tenantDb.insert(vatRates)
        .values({
          name: input.name,
          rate: input.rate.toFixed(2),
          isDefault: input.isDefault,
          isActive: true,
        })
        .returning();

      return newRate;
    }),

  setDefault: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      await tenantDb.transaction(async (tx) => {
        await tx.update(vatRates)
          .set({ isDefault: false });

        await tx.update(vatRates)
          .set({ isDefault: true })
          .where(eq(vatRates.id, input.id));
      });
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const tenantDb = await ctx.getTenantDb();

      // Validate not used in active invoices
      const usedInActiveInvoice = await tenantDb
        .select({ id: invoiceItems.id })
        .from(invoiceItems)
        .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
        .where(and(
          eq(invoiceItems.vatRateId, input.id),
          inArray(invoices.status, ['draft', 'sent', 'paid'])
        ))
        .limit(1);

      if (usedInActiveInvoice.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot archive VAT rate used in active invoices or quotes',
        });
      }

      await tenantDb.update(vatRates)
        .set({ isActive: false, isDefault: false })
        .where(eq(vatRates.id, input.id));
    }),
});
```

### Frontend VAT Rate Management Component

```typescript
// Source: Existing Settings.tsx patterns
function VatRatesSection() {
  const { data: vatRates } = trpc.vatRates.list.useQuery();
  const createVatRate = trpc.vatRates.create.useMutation();
  const setDefault = trpc.vatRates.setDefault.useMutation();
  const archive = trpc.vatRates.archive.useMutation();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Gestion de la TVA</CardTitle>
        <CardDescription className="text-sm">
          Configurez les taux de TVA applicables à vos factures et devis
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Taux</TableHead>
              <TableHead>Par défaut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vatRates?.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell>{rate.name}</TableCell>
                <TableCell>{rate.rate}%</TableCell>
                <TableCell>
                  {rate.isDefault && <Badge>Défaut</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDefault.mutate({ id: rate.id })}>
                        Définir par défaut
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => archive.mutate({ id: rate.id })}>
                        Archiver
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button onClick={() => {/* Open create dialog */}}>
          Ajouter un taux de TVA
        </Button>
      </CardContent>
    </Card>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Header-level VAT only | Line-item VAT with FK to rates table | 2020s (industry shift) | Enables mixed-rate invoices (20% services + 10% products) |
| Hard-coded tax rates | Configurable rates per organization | Modern SaaS standard | Multi-country support, rate changes without code deploy |
| `serial` columns | `identity` columns (PostgreSQL 10+) | 2017+ | PostgreSQL-native identity, better standards compliance |
| Manual decimal math | Database decimal precision | Always recommended | Prevents floating point errors in financial calculations |

**Deprecated/outdated:**
- `serial` type: Use `.generatedAlwaysAsIdentity()` instead (Drizzle recommendation 2025+)
- Global tax rate constants: Store in database per tenant for flexibility

## Open Questions

Things that couldn't be fully resolved:

1. **Should we allow custom VAT rates beyond the 4 French rates?**
   - What we know: France has 4 standard rates (20%, 10%, 5.5%, 2.1%)
   - What's unclear: Whether studios need custom rates (e.g., 0% for exports, special regional rates)
   - Recommendation: Allow custom rates but seed the 4 French rates as defaults. Add validation: rate must be between 0-100%.

2. **How to handle VAT rate changes mid-invoice period?**
   - What we know: France VAT rates have been stable since 2014
   - What's unclear: If a rate changes (e.g., 20% → 21%), how to handle in-progress invoices
   - Recommendation: Historical invoices keep their `vatRateId` (immutable). New invoices use updated rate. Archive old rate, create new rate with updated percentage.

3. **Should rooms have optional or required VAT rate?**
   - What we know: Rooms currently have pricing (`hourlyRate`, etc.) but no VAT field
   - What's unclear: Whether VAT on room rentals is always required or sometimes exempt
   - Recommendation: Make `rooms.vatRateId` NULLABLE. Null = no VAT (rare case). Most rooms should have default VAT rate auto-selected.

4. **How to handle serviceCatalog migration from `taxRate` to `vatRateId`?**
   - What we know: serviceCatalog currently has `taxRate: decimal` column
   - What's unclear: Migration strategy—create matching vatRate for each unique taxRate, or default all to 20%?
   - Recommendation: Create vatRate for each unique serviceCatalog.taxRate value during migration. Preserves existing pricing logic.

## Sources

### Primary (HIGH confidence)
- [France VAT Rates 2026](https://vatcalcul.com/france-vat-calculator/) - Official rates: 20%, 10%, 5.5%, 2.1%
- [Drizzle ORM PostgreSQL Best Practices Guide (2025)](https://gist.github.com/productdevbook/7c9ce3bbeb96b3fabc3c7c2aa2abc717) - Identity columns, FK patterns
- [Drizzle ORM - Indexes & Constraints](https://orm.drizzle.team/docs/indexes-constraints) - Foreign key actions
- [How to Design an ER Diagram for an Invoice Management System](https://www.red-gate.com/blog/erd-for-invoice-management) - Invoice line item patterns

### Secondary (MEDIUM confidence)
- [Global VAT legislative Changes as of January 1, 2026](https://www.vatupdate.com/2026/01/01/global-vat-legislative-changes-as-of-january-1-2026/) - Rate update patterns
- [2026 global VAT rate changes](https://www.vatcalc.com/global/2026-global-vat-rate-changes/) - International context
- [Migration to Header Level Posting (HLP) - AvaTax](https://support.accountingseed.com/hc/en-us/articles/360044408173-Migration-to-Header-Level-Posting-HLP-AvaTax) - Migration strategy patterns

### Tertiary (LOW confidence)
- [Create an Invoice with VAT taxes, specifically Line Item Level Non-US Tax](https://success.mitratech.com/Collaborati/User_Guides/Invoices/Create_a_Manual_Invoice/16_Create_an_Invoice_with_VAT_taxes,_specifically_Line_Item_Level_Non-US_Tax) - Line item VAT patterns
- [The developer's guide to SaaS multi-tenant architecture](https://workos.com/blog/developers-guide-saas-multi-tenant-architecture) - Multi-tenant configuration patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, Drizzle patterns well-documented
- Architecture: HIGH - Database schema patterns verified with official Drizzle docs and industry best practices
- Pitfalls: HIGH - Floating point errors, soft delete patterns, FK constraints are well-known issues
- Migration strategy: MEDIUM - Industry patterns exist, but project-specific implementation needs validation
- France VAT rates: HIGH - Official sources confirm 20%/10%/5.5%/2.1% stable since 2014

**Research date:** 2026-01-21
**Valid until:** 90 days (VAT rates stable; Drizzle ORM patterns mature)
