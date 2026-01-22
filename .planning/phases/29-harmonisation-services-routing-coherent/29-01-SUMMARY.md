---
phase: 29-harmonisation-services-routing-coherent
plan: 01
subsystem: ui-harmonization
tags: [services, routing, accordion-form, ui-consistency, react, typescript]

# Dependency graph
requires:
  - phase: 28-harmonisation-ui-talents
    provides: TalentEditForm accordion pattern with localStorage persistence
  - phase: 26-harmonisation-client-edit-form
    provides: Accordion form architecture (Phase 26 original pattern)
provides:
  - ServiceCreate dedicated page with /services/new route
  - ServiceEditForm accordion component (2 sections)
  - Services list page with Link navigation (no Dialog modal)
  - Pattern consistency across all 12 resources (final harmonization)
affects:
  - Phase 30+ (if any additional resources need harmonization)
  - UI consistency documentation (all resources now use same pattern)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Accordion forms with localStorage persistence
    - Link navigation instead of Dialog modals
    - Alt+Click toggle all accordions power-user feature
    - Dedicated /resource/new pages for all create operations

key-files:
  created:
    - packages/client/src/pages/ServiceCreate.tsx
    - packages/client/src/components/ServiceEditForm.tsx
  modified:
    - packages/client/src/pages/Services.tsx
    - packages/client/src/App.tsx

key-decisions:
  - "Use 2 accordions (Identity, Pricing) not 5 like Talents - simpler domain"
  - "Copy TalentEditForm pattern exactly (Phase 28 reference)"
  - "Preserve Dialog for edit operations - only remove create modal"
  - "Keep all validation logic from Dialog in ServiceCreate validation"

patterns-established:
  - "ServiceEditForm: 2-section accordion (simpler than 5-section Talents)"
  - "localStorage key: 'serviceEditAccordions' (unique per resource)"
  - "All 12 resources now harmonized: clients, sessions, invoices, equipment, rooms, projects, quotes, contracts, expenses, talents, tracks, services"

# Metrics
duration: 4min
completed: 2026-01-22
---

# Phase 29 Plan 01: Services Harmonization Summary

**ServiceCreate dedicated page with 2-accordion form (Identity, Pricing), replacing Dialog modal - final UI harmonization completing pattern across all 12 resources**

## Performance

- **Duration:** 4 minutes
- **Started:** 2026-01-22T04:01:36Z
- **Completed:** 2026-01-22T04:05:49Z
- **Tasks:** 5/5
- **Files modified:** 4
- **Lines added:** 339 (117 ServiceCreate + 222 ServiceEditForm)
- **Lines removed:** ~37 (Dialog create code from Services.tsx)
- **Net change:** +302 lines

## Accomplishments

- ✅ ServiceCreate page (117 lines) with Package icon, form validation, navigation
- ✅ ServiceEditForm component (222 lines) with 2 accordions, localStorage persistence, Alt+Click toggle
- ✅ Services.tsx updated to use Link navigation, Dialog create code removed (edit preserved)
- ✅ /services/new route registered in App.tsx
- ✅ Build successful (6.47s), TypeScript 0 errors in new files
- ✅ Pattern consistency achieved across all 12 resources (harmonization complete)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ServiceCreate dedicated page** - `cc350e9` (feat)
2. **Task 2: Create ServiceEditForm accordion component** - `896c7a7` (feat)
3. **Task 3: Update Services.tsx navigation and remove Dialog** - `cd6b277` (refactor)
4. **Task 4: Register /services/new route in App.tsx** - `02f1420` (feat)
5. **Task 5: Build verification and type checking** - `658c331` (test)

## Files Created/Modified

**Created:**
- `packages/client/src/pages/ServiceCreate.tsx` (117 lines) - Dedicated create page with validation, navigation, ServiceEditForm integration
- `packages/client/src/components/ServiceEditForm.tsx` (222 lines) - Accordion form with 2 sections (Identity: name/category/description, Pricing: unitPrice/taxRate/defaultQuantity)

**Modified:**
- `packages/client/src/pages/Services.tsx` - Button changed to Link navigation, Dialog create code removed, updateMutation preserved for edit
- `packages/client/src/App.tsx` - ServiceCreate import added, /services/new route registered

## Decisions Made

**1. Use 2 accordions (not 5 like Talents)**
- **Rationale:** Services domain simpler than Talents (no streaming, instruments, biography)
- **Sections:** Identity (name, category, description) + Pricing (unitPrice, taxRate, defaultQuantity)
- **Total fields:** 6 (vs 11 for Talents)

**2. Copy TalentEditForm pattern exactly**
- **Rationale:** Phase 28 pattern proven, well-tested, consistent
- **Features:** localStorage persistence, Alt+Click toggle, Card wrappers, same accordion structure

**3. Preserve Dialog for edit operations**
- **Rationale:** Inline table editing useful for quick updates (no navigation away)
- **Removed:** Only CREATE modal code (createMutation, openCreateModal, handleCreateSubmit create branch)
- **Kept:** Edit Dialog, updateMutation, openEditModal, edit-specific code

**4. Keep all validation logic from Dialog**
- **Copied to ServiceCreate:** name required, unitPrice numeric >= 0, taxRate 0-100, defaultQuantity > 0
- **Location:** ServiceCreate.tsx handleSubmit lines 40-61
- **Same validation:** Exact same rules as removed Dialog validation (lines 129-155)

## Deviations from Plan

None - plan executed exactly as written.

**Pattern application:**
- ✅ TalentCreate structure copied (lines 1-108 → ServiceCreate 117 lines)
- ✅ TalentEditForm structure copied (5 accordions → 2 accordions for Services)
- ✅ localStorage key unique ('serviceEditAccordions')
- ✅ Alt+Click toggle implemented
- ✅ Button asChild + Link navigation
- ✅ Route registered in App.tsx

**No auto-fixes needed:**
- All validation copied from existing Dialog code
- No missing dependencies (ServiceEditForm uses existing shadcn components)
- No blocking issues
- Build succeeded first time

## Issues Encountered

None.

**Smooth execution:**
- ✅ TypeScript compilation: 0 errors in new files
- ✅ Build: 6.47s, no warnings from new code
- ✅ Pattern copy: TalentEditForm adapted cleanly (5 accordions → 2)
- ✅ Routing: ServiceCreate import + route added without conflicts

**Pre-existing TypeScript warnings:** Ignored (not introduced by this phase, exist in other files like ClientDetailTabs, Dashboard, server routers).

## User Setup Required

None - no external service configuration required.

**No environment variables added.**
**No API keys needed.**
**No database migrations required.**

## Next Phase Readiness

**Phase 29 complete - all 12 resources harmonized.**

**Resources with dedicated /resource/new pages:**
1. Clients → /clients/new (ClientCreate + ClientEditForm)
2. Sessions → /sessions/new (SessionCreate + SessionEditForm)
3. Invoices → /invoices/new (InvoiceCreate + InvoiceEditForm)
4. Equipment → /equipment/new (EquipmentCreate + EquipmentEditForm)
5. Rooms → /rooms/new (RoomCreate + RoomEditForm)
6. Projects → /projects/new (ProjectCreate + ProjectEditForm)
7. Quotes → /quotes/new (QuoteCreate + QuoteEditForm)
8. Contracts → /contracts/new (ContractCreate + ContractEditForm)
9. Expenses → /expenses/new (ExpenseCreate + ExpenseEditForm)
10. Talents → /talents/new (TalentCreate + TalentEditForm)
11. Tracks → /tracks/new (TrackCreate + TrackEditForm)
12. Services → /services/new (ServiceCreate + ServiceEditForm) ✅

**Pattern benefits:**
- ✅ Bookmarkable URLs for all create operations
- ✅ Shareable links (send /services/new to colleague)
- ✅ Browser back/forward works correctly
- ✅ No cognitive friction - same interaction pattern everywhere
- ✅ localStorage persistence - accordion state survives page refresh
- ✅ Power-user feature - Alt+Click toggle all accordions

**Technical debt: ZERO**
- No Dialog modal create code remains in any list page
- All 12 resources use identical pattern (dedicated page + accordion form)
- No mixed patterns (no resources using Dialog for create)

**Next phases can reference:**
- ServiceEditForm as simplest accordion example (2 sections)
- TalentEditForm as complex accordion example (5 sections)
- Phase 29 as final harmonization completion

---
*Phase: 29-harmonisation-services-routing-coherent*
*Completed: 2026-01-22*
