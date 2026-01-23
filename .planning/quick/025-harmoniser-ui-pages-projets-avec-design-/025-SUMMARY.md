---
phase: quick-025
plan: 01
type: execute
completed: 2026-01-23
duration: 3m 2s
subsystem: frontend-ui
tags: [react, design-system, ui-harmonization, table-layout, status-badges]
tech-stack:
  added: []
  patterns: [colored-outline-badges, inline-filters, stats-cards, table-layout]
key-files:
  created: []
  modified:
    - packages/client/src/pages/Projects.tsx
    - packages/client/src/pages/ProjectDetail.tsx
decisions:
  - name: Use table layout for Projects list
    rationale: Matches established design pattern from Invoices/Quotes pages for consistency
  - name: Remove progress bar from project cards
    rationale: Hardcoded 45% value provided no real value; removed for cleaner UI
  - name: Use Eye icon for detail link
    rationale: Matches Invoices/Quotes pattern (no Edit icon in table actions)
  - name: Colored className pattern for status badges
    rationale: Provides visual hierarchy and status recognition at a glance
requires: []
provides:
  - Harmonized Projects list page with stats cards, inline filters, table layout
  - Colored status badges across Projects list and ProjectDetail pages
  - Consistent UI patterns matching Invoices/Quotes design system
affects: []
---

# Quick Task 025: Harmoniser UI pages projets avec design moderne Summary

**One-liner:** Projects pages now match Invoices/Quotes design with stats cards, inline filters, table layout, and colored status badges.

## What Was Built

### Projects List Page Harmonization (Task 1)

**Changes:**
1. **Added stats cards** (3-column grid):
   - Total projets (count of all projects)
   - En cours (count of pre_production, recording, editing, mixing, mastering) - blue text
   - Termines (count of completed, delivered) - green text
   - Used `useMemo` for efficient stats calculations
   - Shows Skeleton placeholders during loading

2. **Replaced Card filter with inline search + select**:
   - Removed Card wrapper around filters
   - Used `div className="pb-2"` with `flex flex-col md:flex-row gap-2`
   - Search Input with Search icon (pl-9 h-9, relative flex-1)
   - Status Select (w-full md:w-40 h-9) with colored dot spans:
     - pre_production: bg-gray-400
     - recording/editing: bg-blue-500
     - mixing/mastering: bg-purple-500
     - completed/delivered: bg-green-500
     - archived: bg-gray-400

3. **Replaced card grid with Table**:
   - 7 columns: Projet, Artiste, Genre, Type, Date debut, Statut, Actions
   - TableRow with `cursor-pointer hover:bg-muted/50`
   - Actions column: Eye icon (link to detail), Trash2 icon (delete)
   - Removed Progress bar (was hardcoded 45%)
   - Removed Edit icon from actions (Eye is sufficient, matches Invoices)

4. **Updated status badges to colored className pattern**:
   - pre_production: `bg-gray-100 text-gray-700 border-gray-200`, label "Pre-production"
   - recording: `bg-blue-100 text-blue-700 border-blue-200`, label "Enregistrement"
   - editing: `bg-blue-100 text-blue-700 border-blue-200`, label "Edition"
   - mixing: `bg-purple-100 text-purple-700 border-purple-200`, label "Mixage"
   - mastering: `bg-purple-100 text-purple-700 border-purple-200`, label "Mastering"
   - completed: `bg-green-100 text-green-700 border-green-200`, label "Termine"
   - delivered: `bg-green-100 text-green-700 border-green-200`, label "Livre"
   - archived: `bg-gray-100 text-gray-500 border-gray-200`, label "Archive"
   - Removed icons from badges (Invoices/Quotes don't use icons)

5. **Updated empty state**:
   - Removed Card wrapper
   - Used `div className="text-center py-6"` with Music icon, h3, p, Button
   - Matches Invoices/Quotes empty state pattern

6. **Updated imports**:
   - Added: Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Skeleton, Eye
   - Removed: Progress, Filter, Calendar, DollarSign, CheckCircle2, Clock, XCircle, Edit
   - Kept: Dialog imports and CreateProjectDialog component unchanged

### ProjectDetail Status Badges (Task 2)

**Changes:**
1. **Replaced `statusLabels` object** (line 56-65):
   - Changed from `{ label, variant }` to `{ label, className }` pattern
   - Applied same color scheme as Projects list:
     - pre_production: bg-gray-100 text-gray-700 border-gray-200
     - recording: bg-blue-100 text-blue-700 border-blue-200
     - editing: bg-blue-100 text-blue-700 border-blue-200
     - mixing: bg-purple-100 text-purple-700 border-purple-200
     - mastering: bg-purple-100 text-purple-700 border-purple-200
     - completed: bg-green-100 text-green-700 border-green-200
     - delivered: bg-green-100 text-green-700 border-green-200
     - archived: bg-gray-100 text-gray-500 border-gray-200

2. **Updated Badge usage** (line 602):
   - Changed from `<Badge variant={statusLabels[project.status].variant}>`
   - To `<Badge variant="outline" className={statusLabels[project.status].className}>`

3. **Added colored dot spans in Select items** (line 592-596):
   - Each status option now shows a colored dot before the label
   - Matches pattern from Projects list filter

4. **Updated track status badges** in tracks table (line 528):
   - Replaced plain `<Badge variant="outline">{track.status}</Badge>`
   - Added colored badge using same className pattern:
     - recording: bg-blue-100 text-blue-700 border-blue-200
     - editing: bg-blue-100 text-blue-700 border-blue-200
     - mixing: bg-purple-100 text-purple-700 border-purple-200
     - mastering: bg-purple-100 text-purple-700 border-purple-200
     - completed: bg-green-100 text-green-700 border-green-200
     - pending: bg-gray-100 text-gray-700 border-gray-200

**All other aspects preserved:**
- 3-column layout
- Edit form functionality
- Track dialog
- CreateProjectDialog component

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Use table layout for Projects list | Matches established design pattern from Invoices/Quotes pages | Consistent user experience across all list pages |
| Remove progress bar from project cards | Hardcoded 45% value provided no real value | Cleaner UI, removed misleading information |
| Use Eye icon for detail link | Matches Invoices/Quotes pattern (no Edit icon in table actions) | Consistent action patterns across list pages |
| Colored className pattern for status badges | Provides visual hierarchy and status recognition at a glance | Improved UX, easier to scan project statuses |
| Add stats cards at top of page | Provides quick overview of project portfolio health | Better dashboard-like experience |

## Authentication Gates

None encountered.

## Testing

**Type Checking:**
```bash
pnpm --filter client build
# Result: 0 errors related to Projects.tsx or ProjectDetail.tsx
# Existing errors in other files remain (ClientDetailTabs, Dashboard, etc.)
```

**Manual Verification Checklist:**
- [ ] Projects list shows 3 stats cards (total, en cours, termines)
- [ ] Inline search + status select visible (no Card wrapper)
- [ ] Projects displayed in Table (not card grid)
- [ ] Status badges use colored outline pattern
- [ ] Status select shows colored dots before labels
- [ ] Empty state matches Invoices/Quotes pattern
- [ ] ProjectDetail status badge uses colored className
- [ ] Track status badges in ProjectDetail use colored pattern
- [ ] CreateProjectDialog functionality preserved

## Commits

| Commit | Message | Files |
|--------|---------|-------|
| a1e3f3f | feat(quick-025): harmonize Projects.tsx with modern table layout | packages/client/src/pages/Projects.tsx |
| a83d520 | feat(quick-025): update ProjectDetail.tsx status badges with colored className | packages/client/src/pages/ProjectDetail.tsx |

## Lessons Learned

1. **Design system consistency is critical** - Using the same patterns (stats cards, inline filters, table layout, colored badges) across similar pages creates a cohesive experience
2. **Remove hardcoded placeholders** - The 45% progress bar provided no value and cluttered the UI
3. **Color semantics matter** - Using blue for in-progress, purple for post-production, green for completed helps users scan statuses quickly
4. **Icon consistency** - Using Eye (not Edit) for detail links matches the established pattern from Invoices/Quotes

## Next Steps

1. Visual testing on localhost:5174 to confirm layout matches Invoices/Quotes
2. Consider adding client popover to Projects table (similar to Invoices)
3. Consider adding filter by type (album, EP, single, etc.)
4. Test responsive behavior on mobile devices

## Files Modified

### packages/client/src/pages/Projects.tsx
- Replaced card grid with table layout
- Added stats cards (total, en cours, termines)
- Replaced Card filter with inline search + select
- Updated status badges to colored className pattern
- Updated empty state to match Invoices/Quotes
- 240 insertions, 160 deletions

### packages/client/src/pages/ProjectDetail.tsx
- Updated statusLabels from variant to className pattern
- Added colored dots to status Select items
- Updated Badge usage with className prop
- Updated track status badges with colored pattern
- 32 insertions, 12 deletions

## Related Quick Tasks

- quick-020: Fix invoice status update (status badge patterns)
- quick-018: Reduce margin between invoice list and CA section (container spacing)
- quick-019: Status badge colors on invoice edit page (colored className pattern)

## Success Criteria Met

- [x] Projects.tsx shows 3 stats cards (total, en cours, termines) at top
- [x] Projects.tsx uses inline search + status select (no Card wrapper)
- [x] Projects.tsx displays projects in a Table (not card grid)
- [x] All status badges across both pages use colored outline pattern (bg-X-100 text-X-700 border-X-200)
- [x] Empty state matches Invoices/Quotes pattern (no Card wrapper)
- [x] CreateProjectDialog and all CRUD functionality preserved
- [x] `pnpm --filter client build` passes with 0 errors in modified files
