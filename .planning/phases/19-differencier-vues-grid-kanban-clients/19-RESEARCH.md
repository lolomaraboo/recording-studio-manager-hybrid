# Phase 19 Research: Différencier vues Grid/Kanban clients

**Research Question:** What do I need to know to PLAN this phase well?

**Date:** 2026-01-16

---

## Executive Summary

Researched modern CRM view patterns, shadcn/ui best practices, and responsive grid layouts to inform Phase 19 implementation. Key findings:

- **View Differentiation:** Grid = compact scanning (data analysis), Kanban = workflow management (visual process)
- **Current Problem:** Our Grid and Kanban views are too similar (both show basic cards with minimal info)
- **Solution Path:** Leverage industry patterns + TailwindCSS responsive grids + shadcn/ui cards
- **Effort:** 3-4 hours estimated (aligned with industry best practices)

---

## 1. Modern CRM View Patterns (2025)

### When to Use Table vs Grid vs Kanban

**Research sources:**
- [Why Should You Use Kanban View in Dynamics 365?](https://www.crmsoftwareblog.com/2025/10/why-should-you-use-kanban-view-in-dynamics-365/)
- [The Complete Guide to Using Kanban Boards in Dynamics 365 CRM](https://msdynamicsworld.com/blog/complete-guide-using-kanban-boards-dynamics-365-crm)

#### Table View - Best For:
- **Comprehensive data analysis**: View all contacts with multiple columns of detailed information simultaneously
- **Bulk data operations**: Grid accommodates users who prefer list-based data or bulk operations
- **Detailed filtering and sorting**: Move columns around, filter, and sort as you like
- **Static reporting**: See everything at once in spreadsheet-like format
- **High information density**: Maximum data per screen (7-10 columns visible)

**Quote:** "Traditional list view provides rows of data, filters, and grids that show you everything"

#### Grid View - Best For:
- **Quick scanning**: Compact cards with prominent visuals (avatars, badges)
- **Visual browsing**: 3-4 column layout on desktop, stacks on mobile
- **Minimal info per card**: Name, type, key contact, primary stat
- **Responsive design**: Adapts to different screen sizes gracefully
- **Avatar-first design**: Profile pictures/logos as primary visual anchor

**Key Insight:** Grid view provides "information but not clarity" - use for browsing, not analyzing.

#### Kanban View - Best For:
- **Visual workflow management**: "In a list view, you know what exists; in a Kanban view, you see how it moves"
- **Process-driven work**: Categorizes contacts based on stages, drag-and-drop between columns
- **Sales pipeline tracking**: Deals as cards in columns representing sales stages
- **Quick prioritization**: "Progress becomes visible, priorities clearer, and teamwork effortless"
- **Maximum context per card**: Notes, projects, sessions history, all visible

**Quote:** "Kanban View gives CRM workflows a more fluid, visual, and immediately actionable form, surfacing where work is piling up, what's ready to move, and what needs attention"

### User Flexibility
- Users should easily switch between views (button toggle)
- Each view serves different use cases (not redundant)
- Preference persisted in localStorage

---

## 2. CRM UI/UX Design Best Practices (2025)

**Research sources:**
- [Enterprise CRM UI/UX Design Patterns & Examples](https://www.coders.dev/blog/great-examples-of-enterprise-applications-crm-ui-ux-design-patterns.html)
- [Top 10 CRM Design Best Practices for Success](https://www.aufaitux.com/blog/crm-ux-design-best-practices/)
- [8 CRM UX Design Best Practices](https://www.designstudiouiux.com/blog/crm-ux-design-best-practices/)

### Key Patterns for 2025:
1. **Role-based dashboards**: Different views for different user roles
2. **Inline editable data tables**: Edit-in-place without modal dialogs
3. **Progressive disclosure in forms**: Show complexity only when needed
4. **Visual Kanban pipelines**: Essential for reducing friction and increasing productivity
5. **AI-powered automation**: Predictive analytics, voice-assisted interactions (future consideration)
6. **Dark mode and high-contrast interfaces**: Accessibility standard
7. **Minimalist UI with micro-interactions**: Clean visuals, mobile responsiveness

**Quote:** "In 2025, real-time interactivity, clean visuals, mobile responsiveness, and smart personalization aren't 'nice to have' but expected."

### Visual Hierarchy Guidelines:
- **Avatars/logos**: Primary visual anchor (large, prominent)
- **Badges**: Color-coded status indicators (VIP, type, tier)
- **Name/title**: Largest text, bold
- **Contact info**: Secondary text, icon-prefixed
- **Stats**: Tertiary text, right-aligned or badge format
- **Actions**: Minimal, icon-only or small text buttons

---

## 3. shadcn/ui Card Layout Best Practices

**Research sources:**
- [Shadcn Card Component](https://www.shadcn.io/ui/card)
- [Shadcn Card - UI Components and Variants](https://shadcnstudio.com/docs/components/card)
- [shadcn/ui Grid Discussion](https://github.com/shadcn-ui/ui/discussions/1088)

### Card Component Patterns:

#### Content Organization:
- **Keep cards focused**: Each card covers one topic
- **Action hierarchy**: Quick actions (edit, delete) in header, primary actions (save, submit) in footer
- **Content length planning**: Cards in grids need consistent heights or masonry layout

#### Responsive Design:
- **Mobile-first**: Cards stack beautifully on mobile
- **Desktop grids**: Use TailwindCSS grid utilities (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- **Flexible layouts**: Grid, list, masonry-style arrangements

**Quote:** "Cards are responsive by default - stacking beautifully on mobile and using grids on desktop"

#### Customization:
- **TailwindCSS utilities**: Backgrounds, borders, shadows, spacing, typography
- **shadcn/ui composability**: CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **Consistent spacing**: Use project guidelines (pb-3 headers, text-base titles)

---

## 4. Responsive Grid Layouts (TailwindCSS)

### Grid Implementation Strategy:

#### Desktop (lg breakpoint):
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {/* Cards */}
</div>
```

- **3 columns** (lg): Optimal for scanning, not too dense
- **4 columns** (xl): For large screens (1920px+), maximum density
- **Gap 4**: 1rem spacing between cards (consistent with project)

#### Tablet (md breakpoint):
```tsx
md:grid-cols-2
```
- **2 columns**: Balance between density and readability
- Avatars remain visible and prominent

#### Mobile (default):
```tsx
grid-cols-1
```
- **Single column**: Full-width cards, vertical scroll
- Maximum readability on small screens

### Kanban Layout:
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
  {/* Column 1: Particuliers */}
  {/* Column 2: Entreprises */}
</div>
```

- **2 columns fixed** (desktop): Logical split by type
- **1 column** (mobile): Vertical stacking of categories

---

## 5. Avatar/Logo Display Patterns

### Avatar Component (Phase 3.9.4 vCard Integration):

Current implementation supports:
- **Individual clients**: `avatar` field (photo upload)
- **Company clients**: `logo` field (logo upload)
- **Fallback**: Initials from name (e.g., "Emma Dubois" → "ED")

### Grid View Avatar Pattern:
```tsx
<div className="flex items-center gap-3">
  <Avatar className="h-12 w-12">
    <AvatarImage src={client.avatar || client.logo} />
    <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
  </Avatar>
  <div>
    <h3>{client.name}</h3>
    <Badge>{client.type}</Badge>
  </div>
</div>
```

**Size guidelines:**
- **Grid view**: h-12 w-12 (48px) - prominent but not overwhelming
- **Kanban view**: h-8 w-8 (32px) - compact, secondary to content
- **Table view**: h-6 w-6 (24px) - minimal, data-first

---

## 6. Badge System (Visual Differentiation)

### Client Type Badges:
- **Particulier**: Blue badge (`bg-blue-500`)
- **Entreprise**: Purple badge (`bg-purple-500`)

### Status Badges (Future):
- **VIP**: Yellow star icon + badge (`bg-yellow-500`)
- **Active**: Green badge (`bg-green-500`)
- **Inactive**: Gray badge (`bg-gray-500`)

### Stats Badges (Grid View):
- **Sessions count**: Small badge with number
- **Accounts receivable**: Colored by amount (green = 0, orange = < 1000€, red = > 1000€)

---

## 7. Current Implementation Analysis

### File: `packages/client/src/pages/Clients.tsx`

#### Current State (Lines 505-711):
- **Grid View** (lines 505-572): 3-column responsive grid with basic cards
- **Kanban View** (lines 574-711): 2-column split (Particuliers | Entreprises)

#### Problems Identified:
1. **Grid cards** (lines 508-569):
   - No avatars displayed (only name + artistName + badge)
   - Contact info shows phone/email but no visual hierarchy
   - Address field uses wrong icon (Phone instead of MapPin)
   - No stats badges (sessions, receivables)
   - Button says "Voir détails" (too verbose)

2. **Kanban cards** (lines 589-634, 656-701):
   - Too similar to Grid (same structure, slightly smaller)
   - No expanded context (notes, projects, sessions history)
   - Missing workflow indicators (last activity, next action)
   - Same "Voir" button as Grid

3. **Shared Issues**:
   - Both views show identical information density
   - No visual differentiation (Grid = scanning, Kanban = workflow)
   - User confusion: "When do I use which view?"

---

## 8. Proposed Solution (Aligned with Research)

### Grid View Refactor (1 hour):

**Goal**: Compact 3-4 column layout for quick scanning

**Components**:
```tsx
<Card className="hover:shadow-md transition-shadow">
  <CardHeader className="pb-3">
    <div className="flex items-center gap-3">
      {/* Large avatar - primary visual anchor */}
      <Avatar className="h-12 w-12">
        <AvatarImage src={client.avatar || client.logo} />
        <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <CardTitle className="text-base flex items-center gap-2">
          {client.name}
          {client.accountsReceivable > 100000 && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
        </CardTitle>
        {client.artistName && <CardDescription className="text-sm">{client.artistName}</CardDescription>}
      </div>

      {/* Type badge - visual category indicator */}
      <Badge variant={client.type === "company" ? "default" : "secondary"}>
        {client.type === "company" ? "Entreprise" : "Particulier"}
      </Badge>
    </div>
  </CardHeader>

  <CardContent className="space-y-2">
    {/* Primary contact only (phone OR email) */}
    {client.phone && (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Phone className="h-3 w-3" />
        <a href={`tel:${client.phone}`}>{client.phone}</a>
      </div>
    )}

    {/* Stats badges - compact */}
    <div className="flex gap-2">
      <Badge variant="outline" className="text-xs">
        {client.sessionsCount} sessions
      </Badge>
      {client.accountsReceivable > 0 && (
        <Badge variant="outline" className="text-xs text-orange-600">
          {(client.accountsReceivable / 100).toFixed(0)}€
        </Badge>
      )}
    </div>

    {/* Minimal action button */}
    <Button variant="ghost" size="sm" className="w-full" asChild>
      <Link to={`/clients/${client.id}`}>
        <Eye className="h-3 w-3 mr-1" /> Voir
      </Link>
    </Button>
  </CardContent>
</Card>
```

**Layout**:
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {filteredClients.map((client) => (
    <GridClientCard key={client.id} client={client} />
  ))}
</div>
```

---

### Kanban View Refactor (2 hours):

**Goal**: 2-column workflow management with expanded cards showing full context

**Components**:
```tsx
{/* Column Header - Visual grouping */}
<div className="space-y-4">
  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
    <h3 className="font-semibold flex items-center gap-2">
      <Users className="h-5 w-5 text-primary" />
      Particuliers
    </h3>
    <Badge variant="secondary">
      {filteredClients.filter(c => c.type === 'individual').length}
    </Badge>
  </div>

  {/* Expanded cards */}
  <div className="space-y-3">
    {filteredClients
      .filter(c => c.type === 'individual')
      .map((client) => (
        <Card key={client.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              {/* Avatar - secondary to content */}
              <Avatar className="h-8 w-8">
                <AvatarImage src={client.avatar} />
                <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <CardTitle className="text-sm flex items-center gap-2">
                  {client.name}
                  {client.accountsReceivable > 100000 && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                </CardTitle>
                {client.artistName && <CardDescription className="text-xs">{client.artistName}</CardDescription>}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Full contact info */}
            <div className="space-y-1 text-xs">
              {client.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <a href={`tel:${client.phone}`}>{client.phone}</a>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <a href={`mailto:${client.email}`}>{client.email}</a>
                </div>
              )}
              {client.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{client.city}</span>
                </div>
              )}
            </div>

            {/* Workflow indicators - Extended data */}
            <div className="space-y-2 text-xs border-t pt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sessions:</span>
                <span className="font-medium">{client.sessionsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dernière session:</span>
                <span className="font-medium">
                  {client.lastSessionAt
                    ? format(new Date(client.lastSessionAt), "dd MMM yyyy", { locale: fr })
                    : "Jamais"
                  }
                </span>
              </div>
              {client.accountsReceivable > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comptes débiteurs:</span>
                  <span className="font-medium text-orange-600">
                    {(client.accountsReceivable / 100).toFixed(2)}€
                  </span>
                </div>
              )}
            </div>

            {/* Notes preview (if exists) */}
            {client.notes && (
              <div className="text-xs text-muted-foreground border-t pt-2">
                <p className="line-clamp-2">{client.notes}</p>
              </div>
            )}

            {/* Action button */}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to={`/clients/${client.id}`}>
                <Eye className="h-3 w-3 mr-2" />
                Voir détails complet
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
  </div>
</div>
```

**Layout**:
```tsx
<div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
  {/* Particuliers Column */}
  <KanbanColumn type="individual" clients={filteredClients} />

  {/* Entreprises Column */}
  <KanbanColumn type="company" clients={filteredClients} />
</div>
```

---

## 9. Implementation Breakdown (3-4 hours)

### Task 1: Grid View Refactor (1 hour)
1. **Component extraction** (15 min):
   - Create `GridClientCard` component
   - Extract avatar/badge logic
   - Add stats badges

2. **Layout updates** (15 min):
   - Update grid columns (lg:grid-cols-3 xl:grid-cols-4)
   - Fix spacing and gaps
   - Test responsive breakpoints

3. **Data integration** (15 min):
   - Wire up avatar/logo URLs from Phase 3.9.4
   - Calculate stats (sessions, receivables)
   - Add VIP indicator logic

4. **Polish** (15 min):
   - Hover states
   - Transition animations
   - Icon consistency

### Task 2: Kanban View Refactor (2 hours)
1. **Extended data queries** (30 min):
   - Fetch client notes (if not already loaded)
   - Load last session date
   - Calculate workflow indicators

2. **Component creation** (45 min):
   - Create `KanbanClientCard` component
   - Add workflow indicator section
   - Notes preview with line-clamp
   - Expanded contact info

3. **Column layout** (30 min):
   - Update column headers with icons
   - Fix gap spacing
   - Test mobile stacking

4. **Polish** (15 min):
   - Hover effects (shadow-lg)
   - Border styling
   - Consistent typography

### Task 3: Responsive Testing (1 hour)
1. **Desktop validation** (20 min):
   - Test Grid 3-4 columns
   - Test Kanban 2 columns
   - Verify hover states

2. **Tablet validation** (20 min):
   - Test Grid 2 columns
   - Test Kanban 1 column
   - Check touch interactions

3. **Mobile validation** (20 min):
   - Test Grid 1 column
   - Test Kanban stacked
   - Verify buttons accessible

---

## 10. Technical Considerations

### Performance:
- **Virtualization**: Not needed (< 100 clients expected per page)
- **Lazy loading**: Consider if client list exceeds 200 items
- **Memo optimization**: Wrap GridClientCard and KanbanClientCard in React.memo if re-renders excessive

### Accessibility:
- **Keyboard navigation**: All buttons keyboard-accessible
- **Screen readers**: Semantic HTML (h3, section, article)
- **Color contrast**: Badges meet WCAG AA standards
- **Focus indicators**: Visible focus rings

### Data Requirements:
- **Existing**: name, artistName, type, email, phone, city, avatar, logo, notes
- **Calculated**: sessionsCount, accountsReceivable, lastSessionAt (already computed in Clients.tsx lines 46-70)
- **Future**: VIP flag (currently inferred from accountsReceivable > 1000000 cents)

---

## 11. Design System Alignment

### UI-DESIGN-GUIDELINES.md Compliance:
- **Icons**: text-primary on column headers ✅
- **Cards**: pb-3 on CardHeader ✅
- **Container**: pt-2 pb-4 px-2 on page wrapper ✅
- **Typography**: text-base on CardTitle ✅
- **Spacing**: gap-4 between cards ✅

### Phase 3.14 Patterns:
- Consistent with 58-page harmonization
- Same badge/button patterns
- Same hover/transition effects

---

## 12. Risks & Mitigations

### Risk 1: Avatar URLs Missing
**Mitigation**: Fallback to initials (already implemented in AvatarFallback)

### Risk 2: Performance Degradation
**Mitigation**: Monitor with React DevTools Profiler, add React.memo if needed

### Risk 3: Mobile UX Cramped
**Mitigation**: Test early on mobile devices, adjust card heights/spacing

### Risk 4: User Confusion Persists
**Mitigation**: Add tooltips on view toggle buttons ("Quick scanning", "Workflow management")

---

## 13. Success Metrics

### Qualitative:
- ✅ Users understand when to use Grid vs Kanban
- ✅ Grid view feels "fast" for scanning many clients
- ✅ Kanban view feels "informative" for workflow management
- ✅ No user complaints about view similarity

### Quantitative:
- ✅ Grid renders < 100ms for 50 clients
- ✅ Kanban renders < 150ms for 50 clients
- ✅ Mobile responsive tests pass (320px width)
- ✅ Zero TypeScript errors
- ✅ Zero layout shift (CLS score)

---

## 14. Future Enhancements (Post-Phase 19)

### Grid View:
- **Filtering by badges**: Click VIP badge → show only VIP clients
- **Hover actions**: Quick edit/delete on card hover
- **Multi-select**: Bulk operations (export, tag, delete)

### Kanban View:
- **Drag-and-drop**: Move clients between Particuliers/Entreprises (if type change supported)
- **Inline editing**: Edit notes directly in Kanban card
- **Workflow stages**: Add custom stages beyond type (Active/Inactive/Archived)

### Both Views:
- **Search highlighting**: Highlight search query matches in cards
- **Saved filters**: Remember user filter preferences
- **Export by view**: Export Grid as spreadsheet, Kanban as PDF report

---

## 15. References & Sources

### CRM Patterns:
- [Why Should You Use Kanban View in Dynamics 365?](https://www.crmsoftwareblog.com/2025/10/why-should-you-use-kanban-view-in-dynamics-365/)
- [The Complete Guide to Using Kanban Boards in Dynamics 365 CRM](https://msdynamicsworld.com/blog/complete-guide-using-kanban-boards-dynamics-365-crm)
- [Enterprise CRM UI/UX Design Patterns & Examples](https://www.coders.dev/blog/great-examples-of-enterprise-applications-crm-ui-ux-design-patterns.html)
- [Top 10 CRM Design Best Practices for Success](https://www.aufaitux.com/blog/crm-ux-design-best-practices/)
- [8 CRM UX Design Best Practices](https://www.designstudiouiux.com/blog/crm-ux-design-best-practices/)

### shadcn/ui Documentation:
- [Shadcn Card Component](https://www.shadcn.io/ui/card)
- [Shadcn Card - UI Components and Variants](https://shadcnstudio.com/docs/components/card)
- [shadcn/ui Grid Discussion](https://github.com/shadcn-ui/ui/discussions/1088)

### Additional Reading:
- [20 Principles Modern Dashboard UI/UX Design for 2025 Success](https://medium.com/@allclonescript/20-best-dashboard-ui-ux-design-principles-you-need-in-2025-30b661f2f795)
- [10 Best data grid designs shaping UI UX trends](https://octet.design/journal/the-definative-list-of-10-datagrids-shaping-ui-ux-trends/)

---

## 16. Conclusion

Phase 19 is well-scoped and achievable in 3-4 hours. Research confirms:

1. **Clear differentiation**: Grid = scanning (compact, avatar-first), Kanban = workflow (expanded, context-rich)
2. **Industry patterns**: Aligned with 2025 CRM best practices
3. **Technical feasibility**: TailwindCSS + shadcn/ui provide all necessary components
4. **User value**: Eliminates confusion, improves UX for different use cases

**Recommendation**: Proceed with planning Phase 19-01 (Grid refactor) → 19-02 (Kanban refactor) → 19-03 (Responsive testing).
