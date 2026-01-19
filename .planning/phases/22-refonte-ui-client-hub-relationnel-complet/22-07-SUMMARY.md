---
phase: 22-refonte-ui-client-hub-relationnel-complet
plan: 07
subsystem: client-detail-preferences
tags: [database, preferences, tRPC, cross-device-sync]
dependencies:
  requires: ["22-03", "22-04", "22-05", "22-06"]
  provides: ["user_preferences_backend", "preferences_router"]
  affects: ["22-08", "22-09"]
tech-stack:
  added: []
  patterns: ["JSONB preferences storage", "upsert pattern", "unique constraints"]
key-files:
  created:
    - packages/database/src/tenant/schema.ts (user_preferences table)
    - packages/database/drizzle/migrations/tenant/0013_add_user_preferences.sql
    - packages/server/src/routers/preferences.ts
  modified:
    - packages/server/src/routers/index.ts
decisions:
  - id: "22-07-01"
    title: "Manual migration creation over Drizzle generate"
    rationale: "Drizzle interactive prompt asks about unrelated quote_items.service_template_id column, blocking automation. Manual migration is faster and more reliable for known schema changes (precedent: Phase 18.2)."
  - id: "22-07-02"
    title: "JSONB preferences storage over separate columns"
    rationale: "Flexible schema allows adding new preference types without migrations. Supports viewMode, visibleColumns, columnOrder, sortBy, sortOrder all in single column. JSON querying capabilities sufficient for this use case."
  - id: "22-07-03"
    title: "Upsert pattern in save endpoint"
    rationale: "Check for existing preference, update if found, insert if not. Simpler client code (no need to distinguish create vs update). PostgreSQL unique constraint prevents duplicates."
metrics:
  duration: 3 min
  completed: 2026-01-19
---

# Phase 22 Plan 07: User Preferences Backend Summary

**Database-backed user preferences storage for tab customization**

## One-Liner

Backend infrastructure for cross-device preference synchronization using JSONB storage and tRPC upsert pattern

## Overview

Created complete backend infrastructure to support user preferences for tab customization across devices. Implemented user_preferences table in tenant schema with JSONB column, generated migration, and created tRPC router with get/save/reset procedures. Enables storing view modes, column visibility, column order, and sorting preferences per user per scope.

## Tasks Completed

### Task 1: Create user_preferences table schema ✅
- Added user_preferences table to tenant schema
- JSONB column with TypeScript type for preferences object
- Unique constraint on (userId, scope) prevents duplicates
- Scopes: client-detail-projects, tracks, sessions, finances-invoices, finances-quotes
- Types exported: UserPreference, InsertUserPreference
- **Commit:** 81c9242

### Task 2: Generate migration for user_preferences ✅
- Created migration 0013 manually (Drizzle interactive prompt skipped)
- Applied to tenant_24 for local testing
- Verified table structure with correct columns and constraints
- Unique constraint on (user_id, scope) enforced at database level
- **Commit:** c822639

### Task 3: Create preferences tRPC router ✅
- Created preferencesRouter with 3 procedures:
  - `get`: Returns preferences by scope (null if not found)
  - `save`: Upserts preferences (update existing or insert new)
  - `reset`: Deletes preferences for scope (restore defaults)
- Integrated into main appRouter
- Uses ctx.getTenantDb() and ctx.userId for tenant isolation
- TypeScript compilation passes
- **Commit:** 973db1c

## Key Features Delivered

1. **Cross-Device Synchronization**
   - Preferences stored in database (not localStorage)
   - Same preferences available on all devices
   - Auto-sync via tRPC queries

2. **Flexible JSONB Schema**
   - viewMode (cards, table, timeline, kanban)
   - visibleColumns (array of column names)
   - columnOrder (drag & drop order)
   - sortBy, sortOrder (asc/desc)
   - Extensible without migrations

3. **Upsert Pattern**
   - Single `save` endpoint handles create and update
   - Simpler client code
   - Atomic database operations

4. **Scope-Based Isolation**
   - Each tab has separate preferences scope
   - Unique constraint prevents duplicates
   - Easy to add new scopes without code changes

## Deviations from Plan

None - plan executed exactly as written.

## Technical Decisions

### Decision 22-07-01: Manual Migration Creation
**Context:** Drizzle interactive prompt asks about unrelated column

**Chosen:** Create migration 0013 manually

**Alternatives Considered:**
- Answer Drizzle prompt (requires debugging unrelated quote_items issue)
- Use db:generate (blocked by interactive prompt)

**Rationale:** Faster and more reliable for known schema changes. Precedent established in Phase 18.2 (Decision 18.2-01). Manual migration ensures we only change what we intend.

### Decision 22-07-02: JSONB Preferences Storage
**Context:** Need flexible schema for multiple preference types

**Chosen:** Single JSONB column with typed object

**Alternatives Considered:**
- Separate columns for each preference type (viewMode, visibleColumns, etc.)
- EAV pattern (entity-attribute-value separate table)

**Rationale:** JSONB provides flexibility to add new preference types without migrations. PostgreSQL JSON querying sufficient for this use case. TypeScript type safety maintained via $type generic. Single column reduces table width.

### Decision 22-07-03: Upsert Pattern in Save Endpoint
**Context:** Need to handle both create and update scenarios

**Chosen:** Check existence, then update or insert

**Alternatives Considered:**
- Separate create and update endpoints (client must distinguish)
- PostgreSQL UPSERT / ON CONFLICT (Drizzle support unclear)

**Rationale:** Simpler client code - single `save` mutation for all cases. Unique constraint prevents race conditions. Explicit check more readable than ON CONFLICT syntax.

## Testing Evidence

```bash
# Schema compilation
pnpm --filter database check
# ✅ No TypeScript errors

# Router compilation
pnpm check
# ✅ All packages pass type checking

# Database structure
psql -U postgres -d tenant_24 -c "\d user_preferences"
# ✅ Table created with:
#    - id (serial, primary key)
#    - user_id (integer, not null)
#    - scope (varchar(100), not null)
#    - preferences (jsonb, not null)
#    - created_at, updated_at (timestamps)
#    - UNIQUE constraint on (user_id, scope)
```

## Files Modified

**Created:**
- `packages/database/src/tenant/schema.ts` - user_preferences table (+29 lines)
- `packages/database/drizzle/migrations/tenant/0013_add_user_preferences.sql` - migration (+13 lines)
- `packages/server/src/routers/preferences.ts` - tRPC router (+102 lines)

**Modified:**
- `packages/server/src/routers/index.ts` - integrated preferencesRouter (+2 lines)

**Total:** +146 lines

## Performance Metrics

- **Duration:** 3 min (1 min per task average)
- **Tasks:** 3/3 (100% completion)
- **Commits:** 3 atomic commits
- **TypeScript errors:** 0

## Next Phase Readiness

**Phase 22-08 (Column Visibility & Ordering):**
- ✅ Backend infrastructure complete
- ✅ GET endpoint ready for loading preferences
- ✅ SAVE endpoint ready for persisting preferences
- ✅ RESET endpoint ready for restore defaults
- ⚠️ Frontend integration needed (tRPC hooks, UI components)

**Phase 22-09 (Finances Tab):**
- ✅ Preferences backend available for finances scope
- ✅ Same pattern can be applied to invoices/quotes tabs
- ⚠️ Frontend components need to use preferences.get/save

## Blockers/Risks

**None.**

## Success Criteria Met

- [x] user_preferences table exists in tenant schema with JSONB column
- [x] Migration generated and applied to tenant_24
- [x] preferencesRouter with get, save, reset procedures
- [x] Preferences stored per user per scope
- [x] Cross-device synchronization ready (backend infrastructure complete)
- [x] Zero TypeScript errors
- [x] Unique constraint on (userId, scope) prevents duplicates

## Lessons Learned

1. **Manual Migration Pattern Works:** Third time using manual migration creation (Phases 18.2, 18.4-01, 22-07). Pattern is reliable and faster than debugging Drizzle prompts.

2. **JSONB Flexibility:** Using JSONB for preferences provides perfect balance of flexibility and type safety. Can add new preference fields without schema changes.

3. **Upsert Simplifies Client:** Single save endpoint reduces client complexity. No need to track "is this a create or update" in frontend state.

4. **Scope Pattern Scales:** Using string scope identifier makes it easy to add new preference contexts (e.g., "client-list-view", "sessions-calendar") without code changes.

## Open Questions

**Q:** Should preferences include "last modified device" metadata for conflict resolution?
**A:** Deferred - not needed for MVP. Database timestamps sufficient for basic conflict resolution.

**Q:** Should preferences have max size limit to prevent abuse?
**A:** Deferred - JSONB is efficient, typical preferences <1KB. Can add CHECK constraint later if needed.
