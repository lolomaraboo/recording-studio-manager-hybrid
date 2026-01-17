---
phase: 20-affichage-contacts-multiples-entreprises
plan: 01
subsystem: ui
tags: [react, trpc, typescript, drizzle, contacts, multi-tenant]

# Dependency graph
requires:
  - phase: 19-differencier-vues-grid-kanban-clients
    provides: Table/Grid/Kanban view infrastructure
provides:
  - Contact count display in Table and Grid views
  - Full contact list display in Kanban view
  - Copy-to-clipboard functionality for emails and phones
  - Batch contact loading for Kanban performance
affects: [client-detail, sessions, invoices]

# Tech tracking
tech-stack:
  added: []
  patterns: [batch tRPC queries for performance, conditional query enabling, copy-to-clipboard with toast feedback]

key-files:
  created: []
  modified:
    - packages/server/src/routers/clients.ts
    - packages/client/src/pages/Clients.tsx

key-decisions:
  - "Use COUNT(DISTINCT) for both notesCount and contactsCount to avoid duplicates with multiple LEFT JOINs"
  - "Batch load contacts only when Kanban view is active (enabled: viewMode === 'kanban') for performance"
  - "Copy-to-clipboard scoped to Clients.tsx only (Phase 20) - universal implementation deferred to future phase"
  - "Sort contacts by isPrimary first, then alphabetically by lastName for consistent display"

patterns-established:
  - "Batch contact loading: Map client IDs to tRPC queries, build Map for O(1) lookup"
  - "Copy-to-clipboard pattern: Button with Copy icon + navigator.clipboard + toast notification"
  - "Contact badge display: Only show for type='company' with contactsCount > 0"

# Metrics
duration: 3min
completed: 2026-01-17
---

# Phase 20 Plan 01: Affichage Contacts Multiples Entreprises Summary

**Multiple contacts from client_contacts table now visible across all client views: count badges in Table/Grid, full contact list with copy-to-clipboard in Kanban**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-17T02:02:51Z
- **Completed:** 2026-01-17T02:05:58Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- Companies with multiple contacts display accurate count badges in Table and Grid views
- Kanban view shows complete contact information for all contacts (name, title, email, phone)
- Primary contact marked with ⭐ icon and appears first in Kanban list
- Copy-to-clipboard functionality with toast feedback for all emails and phones in Kanban view
- Batch contact loading optimized to only trigger when Kanban view is active

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend backend clients.list to include contactsCount** - `fbddc34` (feat)
2. **Task 2: Add contact count badges to Table and Grid views** - `4dd5213` (feat)
3. **Task 3: Display full contact list in Kanban view with copy-to-clipboard** - `01ca3a7` (feat)

## Files Created/Modified
- `packages/server/src/routers/clients.ts` - Added contactsCount via LEFT JOIN COUNT(DISTINCT clientContacts.id), changed notesCount to use DISTINCT
- `packages/client/src/pages/Clients.tsx` - Added contact badges (Table/Grid), full contact section (Kanban), batch loading, copy-to-clipboard

## Decisions Made

**1. COUNT(DISTINCT) for accuracy with multiple JOINs**
- Changed notesCount from `COUNT(${clientNotes.id})` to `COUNT(DISTINCT ${clientNotes.id})`
- Added `COUNT(DISTINCT ${clientContacts.id})` for contactsCount
- Rationale: Multiple LEFT JOINs can create duplicate rows - DISTINCT prevents overcounting

**2. Conditional Kanban contact loading**
- Batch contact queries have `enabled: viewMode === 'kanban'`
- Rationale: Avoids loading contacts when Table/Grid view active, reduces API calls

**3. Scoped copy-to-clipboard to Clients.tsx**
- Copy icons only in Kanban view contact section
- Rationale: Plan specified "Phase 20 scope only" - universal copy feature deferred to future enhancement

**4. Primary contact sorting**
- Sort by `isPrimary DESC, lastName ASC`
- Rationale: Primary contact always appears first (most important), others alphabetically for consistency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed smoothly with TypeScript 0 errors and production build succeeding.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 18-02 (Manual UI Validation):**
- All client views (Table/Grid/Kanban) now display contact information
- Contact functionality testable with Organization 16 test data (Mélodie Productions SAS with 4 contacts, Midnight Groove Collective with 6 musicians)
- Copy-to-clipboard ready for manual testing in Kanban view

**Potential future enhancements:**
- Universal copy-to-clipboard across all pages (ClientDetail, Sessions, Invoices, etc.)
- Add contacts column sorting in Table view
- Inline contact editing in Kanban view

---
*Phase: 20-affichage-contacts-multiples-entreprises*
*Completed: 2026-01-17*
