---
phase: 22-refonte-ui-client-hub-relationnel-complet
plan: 03
subsystem: ui
tags: [react, trpc, client-detail, projects, view-modes, tabs]

# Dependency graph
requires:
  - phase: 22-02
    provides: ClientDetailTabs component with 5 horizontal tabs structure
provides:
  - Projets tab with 4 view modes (Cards, Liste, Table, Kanban)
  - clients.getProjects endpoint returning projects with aggregated stats
  - clients.getTracks endpoint returning all client tracks across projects
  - ProjectsTab component with localStorage persistence
affects: [22-04-tracks-tab, 22-05-sessions-tab, 22-06-finances-tab]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Multi-view mode toggle pattern (Cards/Liste/Table/Kanban) with localStorage persistence"
    - "tRPC aggregated stats endpoint pattern (tracksCount, hoursRecorded calculated server-side)"
    - "Empty state with illustration + CTA button pattern"

key-files:
  created:
    - packages/client/src/components/tabs/ProjectsTab.tsx
  modified:
    - packages/server/src/routers/clients.ts
    - packages/client/src/components/ClientDetailTabs.tsx

key-decisions:
  - "Cards mode as default view (most visual, shows all key stats)"
  - "Kanban columns by status: Planifié/En cours/Mixing/Mastering/Livré (5 production stages)"
  - "Calculate hoursRecorded from sessions duration (startTime to endTime) server-side"
  - "Navigation to /projects/{id} on card click (same tab, no modal)"

patterns-established:
  - "View mode toggle buttons with Lucide icons (LayoutGrid, List, Table2, Trello)"
  - "localStorage.getItem/setItem pattern for view mode persistence"
  - "Empty state: FolderOpen icon + message + CTA button navigating with pre-filled clientId"
  - "Status badges with colored backgrounds (bg-blue-500, bg-green-500, etc.)"

# Metrics
duration: 13min
completed: 2026-01-19
---

# Phase 22 Plan 03: Projets Tab Summary

**Projets tab with 4 view modes (Cards default, Liste, Table, Kanban) showing client's projects with tracksCount/hoursRecorded stats calculated server-side via clients.getProjects endpoint**

## Performance

- **Duration:** 13 min
- **Started:** 2026-01-19T02:18:28Z
- **Completed:** 2026-01-19T02:31:45Z
- **Tasks:** 3/3
- **Files modified:** 3

## Accomplishments
- clients.getProjects endpoint returns projects with aggregated stats (tracksCount from tracks table, hoursRecorded calculated from sessions)
- clients.getTracks endpoint returns all tracks across client's projects with projectTitle
- ProjectsTab component with 4 view modes: Cards (grid with stats), Liste (compact), Table (full columns), Kanban (5 status columns)
- View mode toggle buttons with localStorage persistence
- Empty state with folder icon + "Créer un projet" CTA navigating with clientId pre-filled
- Navigation to /projects/{id} on project click

## Task Commits

Each task was committed atomically:

1. **Task 1: Add getProjects endpoint to clients router** - `1063066` (feat)
   - Added clients.getProjects with clientId input
   - Returns projects with tracksCount and hoursRecorded aggregated stats
   - Import projects, tracks, sessions tables from @rsm/database/tenant
   - Calculate hoursRecorded from session duration (startTime to endTime in ms)
   - Also added clients.getTracks endpoint for future Tracks tab

2. **Task 2: Create ProjectsTab component with 4 view modes** - `01f528d` (feat)
   - Cards mode (default): Grid layout with project cards showing stats
   - Liste mode: Compact list with title, status badge, date, and "Voir" link
   - Table mode: Full table with all columns (titre, statut, tracks, sessions, budget, genre, date, actions)
   - Kanban mode: 5 columns by status (Planifié, En cours, Mixing, Mastering, Livré)
   - View mode toggle buttons with LayoutGrid, List, Table2, Trello icons
   - localStorage persistence for view mode selection (projects-view-mode key)
   - Empty state with FolderOpen icon + message + CTA button
   - Stats displayed: tracksCount, hoursRecorded, budget/spent formatted
   - Status badges with colored backgrounds (STATUS_COLORS mapping)

3. **Task 3: Integrate ProjectsTab into ClientDetailTabs** - `404e617` (feat)
   - Import ProjectsTab component
   - Replace projets TabsContent placeholder with ProjectsTab component
   - Pass clientId prop to ProjectsTab
   - Also integrate TracksTab component (created in parallel by system)

**Import fix:** `9ae3059` (fix: correct import from wouter to react-router-dom)
- Fixed incorrect import: useNavigate from "wouter" → "react-router-dom"
- Resolved Rollup build error (wouter package not found)

## Files Created/Modified
- `packages/server/src/routers/clients.ts` - Added getProjects and getTracks endpoints with aggregated stats
- `packages/client/src/components/tabs/ProjectsTab.tsx` - 390-line component with 4 view modes, view toggle, localStorage persistence, empty state
- `packages/client/src/components/ClientDetailTabs.tsx` - Integrated ProjectsTab and TracksTab into tabs structure

## Decisions Made

**1. Cards mode as default view**
- Rationale: Most visual presentation, shows all key stats at glance, matches existing Clients page pattern from Phase 19

**2. Kanban columns by production status**
- Rationale: Recording studio workflow: Planifié → En cours (recording/editing) → Mixing → Mastering → Livré
- 5 columns match project lifecycle stages, no drag-and-drop (nice-to-have for future)

**3. Calculate hoursRecorded server-side**
- Rationale: Aggregation logic in endpoint reduces client complexity, reusable across multiple UI views
- Formula: Sum of (session.endTime - session.startTime) for all sessions linked to projectId

**4. Navigation to project detail in same tab**
- Rationale: Standard SPA navigation, breadcrumb provides return path, no modal/drawer overlay complexity

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect navigation library import**
- **Found during:** Task 2 verification (client build)
- **Issue:** ProjectsTab imported useNavigate from "wouter" but project uses react-router-dom, causing Rollup build error "Failed to resolve import 'wouter'"
- **Fix:** Changed import from "wouter" to "react-router-dom"
- **Files modified:** packages/client/src/components/tabs/ProjectsTab.tsx
- **Verification:** pnpm --filter client build completed successfully (✓ built in 4.19s)
- **Committed in:** 9ae3059 (fix commit after Task 3)

---

**Total deviations:** 1 auto-fixed (1 bug - incorrect import)
**Impact on plan:** Critical fix for build to succeed. No scope creep.

## Issues Encountered
None - all tasks executed smoothly after import fix

## User Setup Required
None - no external service configuration required

## Next Phase Readiness
- Projets tab fully functional with 4 view modes
- clients.getTracks endpoint ready for Phase 22-04 (Tracks tab implementation)
- Pattern established for multi-view mode tabs (reusable for Tracks, Sessions, Finances)
- No blockers for next plan

---
*Phase: 22-refonte-ui-client-hub-relationnel-complet*
*Completed: 2026-01-19*
