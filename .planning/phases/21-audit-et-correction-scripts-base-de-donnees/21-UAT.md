---
status: testing
phase: 21-audit-et-correction-scripts-base-de-donnees
source: 21-01-SUMMARY.md, 21-02-SUMMARY.md, 21-03-SUMMARY.md
started: 2026-01-17T08:05:00Z
updated: 2026-01-17T08:05:00Z
---

## Current Test

number: 1
name: Audit report exists and is comprehensive
expected: |
  File packages/database/scripts/audit-report.md should exist and contain:
  - 16 status entries (13 scripts + 3 category summaries)
  - Actual test results with ERROR messages
  - Compatibility matrix table
  - Category summaries (INIT/SEED/FIX/DEPLOY/MONITOR)
awaiting: user response

## Tests

### 1. Audit report exists and is comprehensive
expected: File packages/database/scripts/audit-report.md should exist and contain: 16 status entries (13 scripts + 3 category summaries), actual test results with ERROR messages, compatibility matrix table, category summaries (INIT/SEED/FIX/DEPLOY/MONITOR).
result: [pending]

### 2. README updated with Phase 21 audit results
expected: File packages/database/scripts/README.md should contain Phase 21 audit summary at top with CRITICAL warning, best practices section, script status table with 13 scripts + legend, updated schema counts (7 master, 31 tenant).
result: [pending]

### 3. Create tenant script works with auto-increment
expected: Running `pnpm --filter database tsx scripts/init/create-tenant.ts` should auto-detect next available tenant number, create tenant database, apply all 12 migrations, validate exactly 31 tables created, output success message with tenant info.
result: [pending]

### 4. Create tenant script with explicit number
expected: Running `pnpm --filter database tsx scripts/init/create-tenant.ts 99` should create tenant_99 database with exactly 31 tables via migrations, validate table count, output structured summary.
result: [pending]

### 5. Base seed data creates minimal records
expected: After creating a tenant, running `pnpm --filter database tsx scripts/init/seed-base-data.ts [tenant-num]` should create approximately 20 records across multiple tables (clients, rooms, equipment, sessions, projects, tracks, invoices) with Phase 21 schema fields populated (vCard, deposits, company_members).
result: [pending]

### 6. Realistic seed data creates comprehensive test data
expected: Running `pnpm --filter database tsx scripts/init/seed-realistic-data.ts [tenant-num]` should create 60-78 records with faker-generated realistic data across 15 entity types, all Phase 21 schema fields populated, zero PostgreSQL errors.
result: [pending]

### 7. Obsolete scripts archived with migration guide
expected: Directory packages/database/scripts/archived/ should exist with 7 archived scripts (init-tenant.ts, seed-tenant-3.ts, add-new-tenant-tables.sql, fix-sessions-add-project-id.sql, fix-tenant3-sessions-schema.sql, add-company-with-contacts.sql, setup-test-studio-ui.sql) and comprehensive README.md explaining why obsolete, what replaces them, migration paths.
result: [pending]

### 8. Deploy-master.sh works with current schema
expected: Running deploy-master.sh on a test database should apply 4 migrations (0000-0003) and create exactly 7 tables (users, organizations, organization_members, invitations, tenant_databases, subscription_plans, ai_credits) with zero errors.
result: [pending]

### 9. Deploy-tenants.sh works with current schema
expected: Running deploy-tenants.sh on a test tenant database should apply 12 migrations (0000-0011) and create exactly 31 tables (clients, sessions, invoices, projects, tracks, rooms, equipment, service_catalog, time_entries, quotes, company_members, etc.) with zero errors.
result: [pending]

## Summary

total: 9
passed: 0
issues: 0
pending: 9
skipped: 0

## Gaps

[none yet]
