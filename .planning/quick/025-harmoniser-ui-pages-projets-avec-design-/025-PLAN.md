---
phase: quick-025
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/client/src/pages/Projects.tsx
  - packages/client/src/pages/ProjectDetail.tsx
autonomous: true

must_haves:
  truths:
    - "Projects list page uses table layout matching Invoices/Quotes pattern"
    - "Projects list shows stats cards (total projects, in progress, completed)"
    - "Projects list has inline search + status select filter (no Card wrapper)"
    - "Status badges use colored className pattern matching Invoices/Quotes"
    - "ProjectDetail status badges also use colored className pattern"
  artifacts:
    - path: "packages/client/src/pages/Projects.tsx"
      provides: "Harmonized project list with table, stats, inline filters"
    - path: "packages/client/src/pages/ProjectDetail.tsx"
      provides: "Updated status badges with colored className pattern"
  key_links:
    - from: "Projects.tsx"
      to: "Invoices.tsx/Quotes.tsx"
      via: "Same UI patterns (container, stats cards, inline filters, table)"
      pattern: "container pt-2 pb-4 px-2"
---

<objective>
Harmonize Projects.tsx and ProjectDetail.tsx to match the modern design pattern already used in Invoices.tsx and Quotes.tsx.

Purpose: Visual consistency across all list pages in the application. Projects currently uses card grid + filter card while Invoices/Quotes use table + inline filters + stats cards.

Output: Both project pages updated to match the established design system.
</objective>

<context>
@packages/client/src/pages/Invoices.tsx (reference design - stats cards + inline filters + table)
@packages/client/src/pages/Quotes.tsx (reference design - same pattern)
@packages/client/src/pages/Projects.tsx (to harmonize - currently uses card grid)
@packages/client/src/pages/ProjectDetail.tsx (to harmonize - status badges only)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Harmonize Projects.tsx list page</name>
  <files>packages/client/src/pages/Projects.tsx</files>
  <action>
Rewrite the Projects.tsx page to match the Invoices.tsx/Quotes.tsx pattern:

1. **Add stats cards** (3 cards in a grid):
   - "Total projets" (count of all projects)
   - "En cours" (count of projects with status in [pre_production, recording, editing, mixing, mastering], text-blue-600)
   - "Termines" (count of projects with status in [completed, delivered], text-green-600)
   Use `useMemo` to compute stats from the projects array. Use CardHeader pb-3, CardDescription for label, CardTitle text-3xl for value. Show Skeleton placeholders during loading.

2. **Replace Card filter with inline search + select** (matching Invoices/Quotes):
   - Remove the Card wrapping the filters
   - Use a `div className="pb-2"` wrapper with `flex flex-col md:flex-row gap-2`
   - Search Input with Search icon (pl-9 h-9, relative flex-1)
   - Status Select (w-full md:w-40 h-9) with colored dot spans for each status option:
     - pre_production: bg-gray-400
     - recording: bg-blue-500
     - editing: bg-blue-500
     - mixing: bg-purple-500
     - mastering: bg-purple-500
     - completed: bg-green-500
     - delivered: bg-green-500
     - archived: bg-gray-400

3. **Replace card grid with Table** (matching Invoices/Quotes):
   - Columns: Projet, Artiste, Genre, Type, Date debut, Statut, Actions
   - TableRow with `cursor-pointer hover:bg-muted/50`
   - Actions column: Eye icon button linking to `/projects/{id}`, Trash2 icon button for delete
   - Remove the Progress bar (was hardcoded 45% anyway)
   - Remove the Edit icon from actions (Eye is sufficient, like Invoices)

4. **Update status badges to colored className pattern** (matching Invoices/Quotes):
   Replace the `getStatusBadge` function to use `Badge variant="outline" className={config.className}` pattern:
   - pre_production: bg-gray-100 text-gray-700 border-gray-200, label "Pre-production"
   - recording: bg-blue-100 text-blue-700 border-blue-200, label "Enregistrement"
   - editing: bg-blue-100 text-blue-700 border-blue-200, label "Edition"
   - mixing: bg-purple-100 text-purple-700 border-purple-200, label "Mixage"
   - mastering: bg-purple-100 text-purple-700 border-purple-200, label "Mastering"
   - completed: bg-green-100 text-green-700 border-green-200, label "Termine"
   - delivered: bg-green-100 text-green-700 border-green-200, label "Livre"
   - archived: bg-gray-100 text-gray-500 border-gray-200, label "Archive"
   Remove the icon from badges (Invoices/Quotes don't use icons in badges).

5. **Update empty state** to match Invoices/Quotes pattern:
   - Remove the Card wrapper on the empty state
   - Use `div className="text-center py-6"` with Music icon, h3, p, Button (same as Invoices empty state)

6. **Update imports**: Add Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Skeleton, Eye. Remove Progress, Filter, Calendar, DollarSign, CheckCircle2, Clock, XCircle, Edit (unused after changes). Keep Dialog imports and CreateProjectDialog as-is.

7. **Keep the CreateProjectDialog** component unchanged.
  </action>
  <verify>Run `pnpm --filter client build` and confirm no TypeScript errors. Visually confirm the page now shows stats + inline filters + table layout.</verify>
  <done>Projects.tsx displays stats cards, inline search/select filters, table with colored status badges, matching Invoices.tsx/Quotes.tsx layout pattern.</done>
</task>

<task type="auto">
  <name>Task 2: Update ProjectDetail.tsx status badges</name>
  <files>packages/client/src/pages/ProjectDetail.tsx</files>
  <action>
Update the status badge rendering in ProjectDetail.tsx to use the colored className pattern:

1. **Replace `statusLabels` object** (line 56-65): Change from `{ label, variant }` to `{ label, className }` pattern matching the same colors defined in Task 1:
   - pre_production: { label: "Pre-production", className: "bg-gray-100 text-gray-700 border-gray-200" }
   - recording: { label: "Enregistrement", className: "bg-blue-100 text-blue-700 border-blue-200" }
   - editing: { label: "Edition", className: "bg-blue-100 text-blue-700 border-blue-200" }
   - mixing: { label: "Mixage", className: "bg-purple-100 text-purple-700 border-purple-200" }
   - mastering: { label: "Mastering", className: "bg-purple-100 text-purple-700 border-purple-200" }
   - completed: { label: "Termine", className: "bg-green-100 text-green-700 border-green-200" }
   - delivered: { label: "Livre", className: "bg-green-100 text-green-700 border-green-200" }
   - archived: { label: "Archive", className: "bg-gray-100 text-gray-500 border-gray-200" }

2. **Update Badge usage** at line 602: Change from `<Badge variant={statusLabels[project.status].variant}>` to `<Badge variant="outline" className={statusLabels[project.status].className}>`.

3. **Update the Select items in editing mode** (line 592-596): Add colored dot spans before each label in SelectItem, matching the pattern from Task 1 filter select.

4. **Update track status badges** in the tracks table (line 528): Replace the plain `<Badge variant="outline">{track.status || "pending"}</Badge>` with a colored badge using the same className pattern:
   - recording: bg-blue-100 text-blue-700 border-blue-200
   - editing: bg-blue-100 text-blue-700 border-blue-200
   - mixing: bg-purple-100 text-purple-700 border-purple-200
   - mastering: bg-purple-100 text-purple-700 border-purple-200
   - completed: bg-green-100 text-green-700 border-green-200

Keep all other aspects of ProjectDetail.tsx unchanged (3-column layout, edit form, track dialog, etc.)
  </action>
  <verify>Run `pnpm --filter client build` and confirm no TypeScript errors. Status badges in project detail and track table now use colored outlines.</verify>
  <done>ProjectDetail.tsx uses colored status badges matching the harmonized design pattern from Invoices/Quotes.</done>
</task>

</tasks>

<verification>
```bash
# Type check passes
pnpm --filter client build

# Both pages render without errors
# Projects list: stats cards visible, table layout, colored badges
# Project detail: colored status badges in header and track table
```
</verification>

<success_criteria>
- Projects.tsx shows 3 stats cards (total, en cours, termines) at top
- Projects.tsx uses inline search + status select (no Card wrapper)
- Projects.tsx displays projects in a Table (not card grid)
- All status badges across both pages use colored outline pattern (bg-X-100 text-X-700 border-X-200)
- Empty state matches Invoices/Quotes pattern (no Card wrapper)
- CreateProjectDialog and all CRUD functionality preserved
- `pnpm --filter client build` passes with 0 errors
</success_criteria>
