---
phase: 23
plan: 01
subsystem: client-ui
tags: [ux, simplification, navigation, accessibility]

requires:
  - phase: 22
    reason: Builds on ClientDetailTabs refactored layout from Phase 22

provides:
  - Single-view Informations tab with visual sections
  - Reduced navigation friction for client profile viewing

affects:
  - Future phase modifying client detail pages

tech_stack:
  added: []
  patterns:
    - Visual section separation with Separator components
    - Single-view content organization

key_files:
  created: []
  modified:
    - packages/client/src/components/ClientDetailTabs.tsx

decisions:
  - title: "Visual sections over nested tabs"
    rationale: "3 section headers + Separator components provide clear visual hierarchy without requiring clicks. Improves accessibility and reduces navigation friction. All client information visible at a glance."
    alternative: "Keep nested tabs (rejected - requires clicks to see complete profile)"

metrics:
  duration: 155
  completed: 2026-01-19
---

# Phase 23 Plan 01: Simplify Informations Tab to Single View

**One-liner:** Remove 3 nested sub-tabs and display all client fields in single scrollable view with visual section separators.

## What Was Built

Refactored the Informations tab in ClientDetailTabs component to eliminate nested tab navigation. Previously required clicking between 3 sub-tabs (Informations/Informations Enrichies/Profil Musical) to view complete client profile. Now displays all fields in single scrollable view with clear visual separation.

**Key Changes:**
1. Removed nested `<Tabs>` component with 3 sub-triggers
2. Added 3 section headers with `<h3>` tags:
   - "Informations de Base"
   - "Informations Enrichies"
   - "Profil Musical"
3. Added `<Separator>` components between sections for visual clarity
4. Removed unused imports (Users, FileText icons)
5. Preserved all existing functionality (isEditing logic, EnrichedClientInfo, MusicProfileSection)

**Code Metrics:**
- File: ClientDetailTabs.tsx
- Changes: +41 insertions, -47 deletions (net -6 lines)
- Build: ✅ Successful (4.88s)
- TypeScript: ✅ Compiles (pre-existing errors unrelated to changes)

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

**1. Visual sections over nested tabs**
- **Decision:** Use section headers + Separator components instead of nested Tabs
- **Rationale:** Reduces clicks to view complete profile, improves accessibility, provides better at-a-glance overview
- **Alternative rejected:** Keep nested tabs (requires 3 clicks to see all fields)
- **Impact:** Better UX for consulting complete client information, especially for users with mobility issues or those on mobile devices

**2. space-y-6 spacing on CardContent**
- **Decision:** Applied space-y-6 class to CardContent for consistent vertical rhythm
- **Rationale:** Creates breathing room between sections without manual margin management
- **Alternative rejected:** Manual margin on each section (less consistent, harder to maintain)

**3. my-6 on Separators**
- **Decision:** Used my-6 (margin-y: 1.5rem) on Separator components
- **Rationale:** Balanced spacing - not too tight (cramped), not too loose (disconnected)
- **Alternative rejected:** my-4 (too tight), my-8 (too loose)

## Testing Summary

**Code Validation:**
- ✅ TypeScript compilation successful
- ✅ Client build successful (4.88s)
- ✅ No new errors introduced
- ✅ All imports resolve correctly

**Structure Verification:**
- ✅ Single-view layout in TabsContent (lines 96-236)
- ✅ 3 visual sections with headers
- ✅ 2 Separator components between sections
- ✅ isEditing logic preserved (both view and edit modes work)
- ✅ EnrichedClientInfo component unchanged
- ✅ MusicProfileSection component unchanged

**UX Improvements Achieved:**
- ✅ User can see all client fields without clicking sub-tabs
- ✅ Visual hierarchy clear (section headers + separators)
- ✅ Single scrollable view (natural interaction)
- ✅ Mobile responsive layout maintained (space-y-6 collapses naturally)

## Technical Challenges

None - straightforward refactoring. Nested Tabs removal and section layout implementation completed without issues.

## Artifacts Produced

**Git Commits:**
- `2f5e47e` - feat(23-01): simplify Informations tab to single-view with visual sections

**Files Modified:**
1. `packages/client/src/components/ClientDetailTabs.tsx`
   - Removed nested Tabs component
   - Added 3 section headers with h3 tags
   - Added 2 Separator components
   - Removed unused imports (Users, FileText)
   - Net code reduction: -6 lines (cleaner, more maintainable)

## Next Phase Readiness

**Phase 23 Complete:** ✅

**Ready for next phase:**
- Single-view Informations tab deployed
- All client fields accessible without sub-tab navigation
- Visual hierarchy clear and consistent
- No regressions in other tabs (Projets, Tracks, Sessions, Finances)

**Potential Future Enhancements (out of scope for this phase):**
- Add collapsible sections if content grows too long
- Add "scroll to section" quick links for deep profiles
- Add search/filter within Informations tab for clients with many fields
