---
phase: 27-affichage-conditionnel-selon-type-client
plan: 01
subsystem: ui
tags: [react, conditional-rendering, forms, client-management]

# Dependency graph
requires:
  - phase: 26.2-restaurer-relations-professionnelles
    provides: 6-accordion structure with Relations Professionnelles restored
provides:
  - Conditional accordion rendering based on client type (company vs individual)
  - Dynamic Alt key handler adapting to visible accordion count
  - Clean UX for company clients without music-related fields
affects: [client-management, form-design, type-specific-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Conditional rendering pattern for client type-specific UI sections
    - Dynamic accordion list calculation based on formData.type
    - Type-aware Alt key toggle handler

key-files:
  created: []
  modified:
    - packages/client/src/components/ClientEditForm.tsx

key-decisions:
  - "Conditional rendering for Profil Artistique and Streaming accordions based on client type"
  - "Dynamic allAccordions array in Alt key handler for type-specific toggle behavior"
  - "artistName field remains visible for both types (business requirement)"

patterns-established:
  - "Type-specific accordion visibility: formData.type === 'individual' && (<AccordionItem>)"
  - "Dynamic accordion configuration for keyboard shortcuts based on client type"

# Metrics
duration: 2min
completed: 2026-01-22
---

# Phase 27 Plan 01: Affichage Conditionnel Selon Type Client Summary

**Conditional music profile accordions hidden for company clients, reducing form clutter from 6 to 4 accordions with dynamic Alt key handling**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-22T01:19:30Z
- **Completed:** 2026-01-22T01:22:19Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Profil Artistique accordion now only renders for individual clients
- Streaming accordion now only renders for individual clients
- Alt key handler dynamically adjusts to 4 accordions (company) vs 6 accordions (individual)
- Company clients see clean form with only relevant sections (Identité, Coordonnées, Relations Pro, Champs Personnalisés)
- Individual clients unchanged (all 6 accordions visible as before)

## Task Commits

Each task was committed atomically:

1. **Task 1: Conditional rendering for music-related accordions** - `26611b8` (feat)
   - Wrapped Profil Artistique accordion in `formData.type === "individual"` conditional
   - Wrapped Streaming accordion in `formData.type === "individual"` conditional
   - Updated Alt key handler with dynamic allAccordions array calculation
   - Real-time accordion visibility updates when type toggle changes

## Files Created/Modified
- `packages/client/src/components/ClientEditForm.tsx` - Added conditional rendering for music-related accordions based on client type, updated Alt key handler to dynamic accordion list

## Decisions Made

**1. Conditional rendering based on formData.type**
- Rationale: Clean separation of concerns - companies (labels, studios, management) don't have personal music profiles, removing these sections eliminates visual clutter and user confusion

**2. Dynamic allAccordions array in Alt key handler**
- Rationale: Alt+Click should toggle only VISIBLE accordions. Company clients have 4 accordions, individuals have 6. Dynamic calculation ensures correct toggle behavior for each type.

**3. Keep artistName field visible for both types**
- Rationale: Companies can use artistName for brand/trading name separate from legal companyName. Individual artists use it for stage name. Business requirement to keep this field unconditional.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward conditional rendering implementation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Form UX now fully adapted to client type context
- Company clients have clean, focused 4-accordion form
- Individual clients retain full 6-accordion music profile access
- Ready for production deployment or next phase development

---
*Phase: 27-affichage-conditionnel-selon-type-client*
*Completed: 2026-01-22*
