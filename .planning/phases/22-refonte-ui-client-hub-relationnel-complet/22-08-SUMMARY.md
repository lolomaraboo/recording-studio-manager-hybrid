---
phase: 22-refonte-ui-client-hub-relationnel-complet
plan: 08
subsystem: ui
tags: [react, dnd-kit, drag-drop, typescript, preferences, client-tabs]

# Dependency graph
requires:
  - phase: 22-07
    provides: useTabPreferences hook with database-backed preferences storage
provides:
  - Drag & drop column reordering in all client detail tabs
  - Visual column ordering UI with GripVertical icons
  - Column order persistence to database via preferences API
  - Dynamic table rendering respecting columnOrder preference
affects: [future tab customization features, user preferences system]

# Tech tracking
tech-stack:
  added: ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"]
  patterns: ["SortableTableHeader component pattern", "DndContext wrapping table headers", "Column rendering based on columnOrder array"]

key-files:
  created: []
  modified:
    - packages/client/src/components/tabs/ProjectsTab.tsx
    - packages/client/src/components/tabs/TracksTab.tsx
    - packages/client/src/components/tabs/SessionsTab.tsx
    - packages/client/src/components/tabs/FinancesTab.tsx

key-decisions:
  - "Use @dnd-kit library for drag & drop over react-beautiful-dnd (modern, TypeScript-first, better performance)"
  - "Create SortableTableHeader component in each tab file (no shared component to avoid import complexity)"
  - "Use horizontalListSortingStrategy for table header reordering"
  - "Separate drag handlers for invoices and quotes tables in FinancesTab"

patterns-established:
  - "SortableTableHeader component pattern: wraps TableHead with useSortable hook, shows GripVertical icon"
  - "DndContext sensors: PointerSensor + KeyboardSensor for mouse and keyboard accessibility"
  - "Column rendering pattern: filter columnOrder by visibleColumns, map to render cells in order"
  - "handleDragEnd pattern: use arrayMove to reorder columnOrder, call updatePreferences"

# Metrics
duration: 28min
completed: 2026-01-19
---

# Phase 22 Plan 08: Column Visibility & Ordering UI Summary

**Drag & drop column reordering with GripVertical icons in all client detail tabs (Projects, Tracks, Sessions, Finances), preferences saved to database**

## Performance

- **Duration:** 28 min
- **Started:** 2026-01-19T02:55:18Z
- **Completed:** 2026-01-19T03:23:16Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Added drag & drop column reordering to all 4 client detail tabs (Projects, Tracks, Sessions, Finances)
- Installed @dnd-kit library ecosystem for modern drag & drop support
- Created SortableTableHeader components with GripVertical icons for visual feedback
- Tables now render columns in order specified by preferences.columnOrder
- Column order updates automatically saved to database via preferences API
- Keyboard accessibility support via KeyboardSensor

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useTabPreferences hook** - ✅ Already complete from Plan 22-07
2. **Task 2: Add customization UI to all tabs** - `4b154cc` (feat)
3. **Task 3: Build and validate customization** - `393e27b` (fix)

**Plan metadata:** Not yet committed (will be in final summary commit)

## Files Created/Modified
- `packages/client/src/components/tabs/ProjectsTab.tsx` - Added drag & drop for 7 columns (titre, statut, tracks, sessions, budget, genre, date)
- `packages/client/src/components/tabs/TracksTab.tsx` - Added drag & drop for 6 columns (titre, projet, artistes, durée, statut, version)
- `packages/client/src/components/tabs/SessionsTab.tsx` - Added drag & drop for 4 columns (session, salle, date, statut)
- `packages/client/src/components/tabs/FinancesTab.tsx` - Added drag & drop for both invoices and quotes tables (4 columns each: numéro, date, montant, statut)

## Decisions Made

**1. @dnd-kit over react-beautiful-dnd**
- Rationale: Modern library, TypeScript-first, better performance, still maintained (react-beautiful-dnd deprecated)
- Impact: Clean API, excellent TypeScript support, accessibility built-in

**2. SortableTableHeader component per file**
- Rationale: Avoid shared component import complexity, each tab has slightly different table structure
- Impact: ~35 lines duplicated across 4 files, but simpler to maintain and modify per-tab

**3. Separate drag handlers for FinancesTab**
- Rationale: Two independent tables (invoices and quotes) with separate preferences scopes
- Impact: `handleInvoicesDragEnd` and `handleQuotesDragEnd` functions, each updating correct preferences

**4. Column rendering by order**
- Rationale: Filter `columnOrder` by `visibleColumns`, then map to render cells in that order
- Impact: Tables respect both visibility AND order preferences, consistent behavior across tabs

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript unused variable warnings**
- **Found during:** Task 3 (Build validation)
- **Issue:** Unused `ViewMode` type definitions in all 4 tab files, unused `prefsLoading` variable in ProjectsTab
- **Fix:** Removed unused type definitions and destructuring of unused variable
- **Files modified:** All 4 tab files
- **Verification:** TypeScript compilation passes, client build succeeds
- **Committed in:** 393e27b (fix commit)

---

**Total deviations:** 1 auto-fixed (1 bug - unused code cleanup)
**Impact on plan:** Minor cleanup fix for TypeScript warnings. No scope creep.

## Issues Encountered
None - plan executed smoothly with drag & drop working as expected on first implementation

## User Setup Required
None - no external service configuration required. Feature works out of the box with existing preferences backend.

## Next Phase Readiness
- All 4 client detail tabs now have complete customization UI:
  - ✅ View mode toggle (Cards/Liste/Table/Kanban/Timeline depending on tab)
  - ✅ Column visibility toggle (checkboxes in dropdown)
  - ✅ Drag & drop column reordering (with GripVertical icons)
  - ✅ Reset button (restore defaults)
  - ✅ Preferences persist to database (cross-device sync)
- Ready for Phase 22-09 (next plan in UI refactoring phase)
- No blockers or concerns

---
*Phase: 22-refonte-ui-client-hub-relationnel-complet*
*Completed: 2026-01-19*
