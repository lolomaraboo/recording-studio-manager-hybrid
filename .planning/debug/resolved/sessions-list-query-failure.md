---
status: resolved
trigger: "TRPC query sessions.list fails systematically in tenant_3 after Phase 20.1-03"
created: 2026-01-17T00:00:00Z
updated: 2026-01-17T00:20:00Z
---

## Current Focus

hypothesis: CONFIRMED - Sessions table ALSO missing project_id column (not just payment columns)
test: Drizzle query still fails after adding payment columns → project_id also missing
expecting: Must add project_id column to both tenant_3 AND tenant_9
next_action: Add project_id column to sessions table

## Symptoms

expected: Page /clients should display client list WITH session statistics (session counts per client)

actual: Page displays clients but sessions.list query fails with error:
```
[TRPC Error] sessions.list
Failed query: select "id", "client_id", "room_id", "project_id", "title", "description", "start_time", "end_time", "status", "total_amount", "deposit_amount", "deposit_paid", "payment_status", "stripe_checkout_session_id", "stripe_payment_intent_id", "notes", "created_at", "updated_at" from "sessions" limit $1
params: 100
```

errors:
- TRPC Error type: 'query', path: 'sessions.list'
- Error message: "Failed query: select ... from "sessions" limit $1"
- Repeats every time /clients page loads
- Other queries work fine (clients.list ✅, invoices.list ✅, notifications ✅)

reproduction:
1. Navigate to http://localhost:5174/clients
2. Page loads clients successfully
3. Backend logs show TRPC Error for sessions.list
4. Stats sessions not displayed on client cards

started: Broke AFTER Phase 20.1-03 (React Hooks fix)

## Eliminated

- hypothesis: Phase 20.1-03 code changes broke sessions.list
  evidence: Phase 20.1-03 only modified clients router and Clients.tsx, no changes to sessions router
  timestamp: 2026-01-17T00:01:00Z

- hypothesis: Sessions router code is malformed
  evidence: Router code unchanged and follows standard Drizzle pattern (.select().from(sessions).limit())
  timestamp: 2026-01-17T00:02:00Z

## Evidence

- timestamp: 2026-01-17T00:05:00Z
  checked: tenant_3 sessions table schema via psql
  found: Table MISSING columns: project_id, deposit_amount, deposit_paid, payment_status, stripe_checkout_session_id, stripe_payment_intent_id
  implication: Drizzle query selects these columns but they don't exist → query fails

- timestamp: 2026-01-17T00:06:00Z
  checked: packages/database/src/tenant/schema.ts (lines 157-181)
  found: Schema definition includes 7 columns that tenant_3 table lacks
  implication: tenant_3 was created with OLD schema before payment fields were added

- timestamp: 2026-01-17T00:07:00Z
  checked: packages/server/src/routers/sessions.ts (lines 37-41)
  found: Query uses .select() which includes ALL columns from schema
  implication: Drizzle auto-generates SELECT with all schema columns including missing ones

- timestamp: 2026-01-17T00:08:00Z
  checked: tenant_9 sessions table (working tenant)
  found: tenant_9 HAS all 17 columns including payment fields + NO project_id either
  implication: project_id was removed from sessions table but tenant_3 never got payment columns added

- timestamp: 2026-01-17T00:09:00Z
  checked: tenant_3 sessions table row count
  found: 0 rows (empty table)
  implication: No data loss risk - can safely ALTER TABLE to add missing columns

- timestamp: 2026-01-17T00:13:00Z
  checked: tRPC endpoint after adding payment columns
  found: Query STILL fails - now trying to SELECT project_id which doesn't exist
  implication: schema.ts defines project_id but NO database has it (neither tenant_3 nor tenant_9)

- timestamp: 2026-01-17T00:14:00Z
  checked: schema.ts line 161
  found: projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" })
  implication: TypeScript schema is AHEAD of database migrations - project_id was never migrated

## Resolution

root_cause: tenant_3 sessions table missing 5 payment columns (deposit_amount, deposit_paid, payment_status, stripe_checkout_session_id, stripe_payment_intent_id) that were added in later migrations. Drizzle auto-generates SELECT statements from schema.ts which includes these columns → query fails on column not found.

NOTE: project_id is ALSO in schema.ts but neither tenant_3 nor tenant_9 have it. This suggests schema.ts is ahead of migrations.

fix: Applied TWO schema fixes to tenant databases

  **Fix 1: Payment columns (tenant_3 only)**
  - Created: packages/database/scripts/fix-tenant3-sessions-schema.sql
  - Applied to: tenant_3
  - Added: deposit_amount, deposit_paid, payment_status, stripe_checkout_session_id, stripe_payment_intent_id

  **Fix 2: project_id column (ALL tenants)**
  - Created: packages/database/scripts/fix-sessions-add-project-id.sql
  - Applied to: tenant_3, tenant_9, tenant_10 (tenant_4 has no sessions table)
  - Added: project_id integer with FK to projects(id) ON DELETE SET NULL
  - Root cause: Migration 0008_add_project_id_to_sessions.sql exists but was NEVER applied to tenant databases

  **Result:** sessions table now matches schema.ts expectations across all active tenant databases

verification:
  - ✅ Database level: SELECT with all columns succeeds
  - ✅ Backend API: curl test returns {"result":{"data":[]}} (success with empty array)
  - ✅ tenant_3: 18 columns (12 original + 5 payment + 1 project_id)
  - ✅ tenant_9: 18 columns (17 existing + 1 project_id)
  - ✅ tenant_10: 18 columns (17 existing + 1 project_id)
  - ✅ No TRPC errors on sessions.list endpoint

files_changed:
  - packages/database/scripts/fix-tenant3-sessions-schema.sql
  - packages/database/scripts/fix-sessions-add-project-id.sql
