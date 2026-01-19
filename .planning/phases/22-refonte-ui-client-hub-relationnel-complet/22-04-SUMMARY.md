---
phase: 22-refonte-ui-client-hub-relationnel-complet
plan: 04
subsystem: ui
tags: [react, trpc, typescript, audio-player, tracks, react-router-dom]

# Dependency graph
requires:
  - phase: 22-02
    provides: ClientDetailTabs component with tab structure
provides:
  - Tracks tab with 3 view modes (Liste, Cards, Table)
  - clients.getTracks backend endpoint
  - Audio player integration for inline playback
affects: [22-07, 22-08, 22-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - View mode toggle with localStorage persistence pattern
    - Inline audio player integration using AudioPlayer component
    - Manual JOIN pattern for tables without relations defined

key-files:
  created:
    - packages/client/src/components/tabs/TracksTab.tsx
  modified:
    - packages/server/src/routers/clients.ts
    - packages/client/src/components/ClientDetailTabs.tsx

key-decisions:
  - "Manual JOIN instead of query builder with relations (tracks table has no relations defined)"
  - "react-router-dom Link component instead of wouter (project standard)"
  - "Compact AudioPlayer mode for Liste view to save space"

patterns-established:
  - "View mode toggle pattern: 3 buttons + localStorage persistence"
  - "Empty state with icon + CTA button navigation pattern"
  - "Status badge color coding pattern for track statuses"

# Metrics
duration: 13min
completed: 2026-01-19
---

# Phase 22 Plan 04: Tracks Tab with Audio Player Summary

**Tracks tab with 3 view modes (Liste avec audio player, Cards visuelles, Table metadata) and inline audio playback using AudioPlayer component**

## Performance

- **Duration:** 13 min
- **Started:** 2026-01-19T02:18:28Z
- **Completed:** 2026-01-19T02:31:24Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Backend endpoint `clients.getTracks` returns all tracks from client's projects with project title
- TracksTab component with 3 view modes (Liste, Cards, Table) and toggle buttons
- Inline audio player integration using compact AudioPlayer component
- Empty state with CTA to create track
- View mode persistence in localStorage

## Task Commits

Each task was committed atomically:

1. **Task 1: Add getTracks endpoint to clients router** - `23ef361` (feat)
2. **Task 2: Create TracksTab component with 3 view modes** - `25615e2` (feat)
3. **Task 3: Fix react-router-dom Link usage** - `6baa207` (fix)

## Files Created/Modified
- `packages/server/src/routers/clients.ts` - Added getTracks endpoint with manual JOIN for project title
- `packages/client/src/components/tabs/TracksTab.tsx` - Created TracksTab with 3 view modes and AudioPlayer
- `packages/client/src/components/ClientDetailTabs.tsx` - Integrated TracksTab (already done in commit 404e617)

## Decisions Made

**1. Manual JOIN instead of Drizzle relations**
- **Rationale:** Tracks table has no relations defined in schema, query builder `with:` clause doesn't work
- **Solution:** Used manual `.select().from(tracks).leftJoin(projects, eq(...))` pattern
- **Impact:** More verbose but type-safe, all 50+ track fields explicitly listed

**2. react-router-dom Link instead of wouter**
- **Rationale:** Project uses react-router-dom, not wouter (discovered during build)
- **Solution:** Changed import and `href` → `to` prop
- **Impact:** Build error resolved, consistent with other tabs (SessionsTab, FinancesTab)

**3. Compact AudioPlayer mode for Liste view**
- **Rationale:** Liste view has limited horizontal space with inline player
- **Solution:** Used `compact={true}, showTime={false}, showVolume={false}` props
- **Impact:** Clean inline player with just play/pause button and progress bar

**4. Composer field for artist name fallback**
- **Rationale:** Plan specified "artist names" but tracks.musicians relation not used
- **Solution:** Display track.composer field as artist (copyright metadata field)
- **Impact:** Shows composer/lyricist instead of trackCredits musician names

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed react-router-dom Link syntax**
- **Found during:** Task 3 (Build verification)
- **Issue:** Build failed with "Rollup failed to resolve import 'wouter'" - TracksTab used wouter Link instead of react-router-dom
- **Fix:** Changed import from 'wouter' to 'react-router-dom', replaced all `href` props with `to` props (5 instances)
- **Files modified:** packages/client/src/components/tabs/TracksTab.tsx
- **Verification:** `pnpm --filter client build` succeeded
- **Committed in:** 6baa207 (fix commit)

**2. [Rule 2 - Missing Critical] Explicit track field selection for manual JOIN**
- **Found during:** Task 1 (getTracks endpoint implementation)
- **Issue:** Tracks table has no relations defined, query builder `with:` clause returned type error
- **Fix:** Manually listed all 35+ track fields in `.select()` clause with explicit project.title JOIN
- **Files modified:** packages/server/src/routers/clients.ts
- **Verification:** TypeScript compilation passed, no type errors
- **Committed in:** 23ef361 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both auto-fixes necessary for correct build and type safety. No scope creep.

## Issues Encountered

**1. Tracks table missing relations definition**
- **Problem:** Tried to use Drizzle query builder `with: { project: ... }` but tracks table has no relations defined
- **Discovery:** TypeScript error "Property 'project' does not exist on type 'never'"
- **Solution:** Used manual JOIN with explicit field selection
- **Prevention:** Future: Define tracksRelations in schema.ts for cleaner query API

**2. AudioPlayer component API verification**
- **Problem:** Plan said "verify AudioPlayer exists before implementing"
- **Discovery:** AudioPlayer.tsx exists at packages/client/src/components/AudioPlayer.tsx with expected props
- **Result:** Props interface matched expectations (src, compact, showTime, showVolume), integration successful

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Plan 22-05 (Sessions tab) and 22-06 (Finances tab):**
- TracksTab pattern established for view mode toggles + localStorage
- AudioPlayer integration pattern documented
- Empty state + CTA pattern reusable
- Backend getTracks endpoint ready for frontend consumption

**Considerations for future work:**
- Add tracksRelations definition to schema.ts for cleaner queries
- Consider using trackCredits table for more accurate artist names
- Add waveform visualization if track.waveformUrl available

---
*Phase: 22-refonte-ui-client-hub-relationnel-complet*
*Completed: 2026-01-19*
