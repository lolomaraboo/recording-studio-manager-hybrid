# Phase 10 Plan 1: Database Schema & Migrations Summary

**Database schema created for quote management system with state machine support**

## Accomplishments

- ✅ Created quotes table with 7-state workflow (draft/sent/accepted/rejected/expired/cancelled/converted_to_project)
- ✅ Created quote_items table for line item management with display ordering
- ✅ Generated and applied Drizzle migration (0008_update_quotes_state_machine.sql)
- ✅ Established quote-to-project conversion tracking (convertedToProjectId FK)
- ✅ Followed invoice schema pattern for financial consistency (subtotal, taxRate, taxAmount, total)
- ✅ Implemented calculated expiration pattern (expiresAt timestamp + validityDays)
- ✅ Added support for future service templates (serviceTemplateId nullable FK)
- ✅ Separated client-visible notes from internal notes

## Files Created/Modified

- **Modified:** `packages/database/src/tenant/schema.ts`
  - Updated quotes table: removed old fields (projectId, issueDate, validUntil, convertedToInvoiceId, title, description)
  - Added new fields: sentAt, respondedAt, expiresAt, validityDays, internalNotes, convertedToProjectId
  - Updated quote_items table: removed sessionId/equipmentId, added serviceTemplateId, displayOrder

- **Created:** `packages/database/drizzle/migrations/0008_update_quotes_state_machine.sql`
  - Transforms existing quotes table structure to match 7-state FSM specification
  - Adds foreign key constraint to projects table for conversion tracking

- **Modified:** `packages/database/drizzle/migrations/meta/_journal.json`
  - Added migration entry for 0008_update_quotes_state_machine

## Decisions Made

1. **Migration Strategy:** Used ALTER TABLE statements to transform existing quotes/quote_items tables rather than DROP/CREATE to preserve any existing data
2. **Removed Quote-to-Invoice Conversion:** Replaced `convertedToInvoiceId` with `convertedToProjectId` per DISCOVERY.md specification (quotes convert to projects, not invoices)
3. **Removed Optional Links:** Dropped `sessionId` and `equipmentId` from quote_items as they were not in the DISCOVERY.md specification
4. **Added Display Order:** Included `displayOrder` field in quote_items for controlling line item sequence in PDF generation
5. **Nullable Service Templates:** Made `serviceTemplateId` nullable to support both template-based and freeform quote items

## Schema Highlights

### Quotes Table (Updated)
- **7 States:** draft, sent, accepted, rejected, expired, cancelled, converted_to_project
- **State Tracking:** sentAt, respondedAt, expiresAt timestamps
- **Expiration Logic:** validityDays (default 30) + expiresAt (locked when sent)
- **Financial Fields:** subtotal, taxRate (20%), taxAmount, total (matching invoice pattern)
- **Conversion:** convertedToProjectId → projects.id FK

### Quote Items Table (Updated)
- **Core Fields:** description, quantity, unitPrice, amount
- **Ordering:** displayOrder for PDF rendering sequence
- **Future-Ready:** serviceTemplateId for optional template system (Phase 11+)

## Verification Results

✅ All TypeScript compilation checks passed (`pnpm check`)
✅ Migration applied successfully to rsm_master database
✅ quotes table structure verified (19 columns, 2 FKs)
✅ quote_items table structure verified (9 columns, 1 FK)
✅ Schema exports quotes and quoteItems tables correctly
✅ Relations defined correctly (client, items, project)

## Database Migration Applied To

- **Master DB:** rsm_master (via Docker container rsm-postgres)
- **Tenant DBs:** Migration will auto-apply when new organizations are created
- **Existing Tenant DBs:** Requires manual migration or script (not in Phase 10 scope)

## Issues Encountered

**Issue:** Drizzle-kit interactive migration wizard hung on prompt for `service_template_id` column (create vs rename)

**Resolution:** Created migration manually with explicit ALTER TABLE statements, then updated _journal.json metadata. This approach gave more control over the migration and avoided ambiguity about column transformations.

## Next Step

Ready for Plan 2 (10-02-PLAN.md): tRPC Router & State Machine implementation

**Router Tasks:**
- CRUD endpoints (list, get, create, update, delete)
- State transitions (send, accept, reject, cancel)
- Conversion logic (convertToProject)
- Quote number generation
- Expiration calculation helpers
