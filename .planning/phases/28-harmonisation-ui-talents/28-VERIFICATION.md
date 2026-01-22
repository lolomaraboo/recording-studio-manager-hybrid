---
phase: 28-harmonisation-ui-talents
verified: 2026-01-22T03:36:43Z
status: gaps_found
score: 11/13 must-haves verified
gaps:
  - truth: "Table view sorts data by clicked column"
    status: failed
    reason: "Sorting UI exists (arrows, handleSort) but filteredTalents array is never actually sorted"
    artifacts:
      - path: "packages/client/src/pages/Talents.tsx"
        issue: "sortField and sortOrder state exists but no .sort() applied to filteredTalents"
    missing:
      - "Apply sorting to filteredTalents before rendering (lines 93-102)"
      - "Sort logic: compare talent[sortField] values with sortOrder direction"
  - truth: "Search uses server-side endpoint with debounce"
    status: failed
    reason: "Search is client-side only, not using backend search endpoint"
    artifacts:
      - path: "packages/client/src/pages/Talents.tsx"
        issue: "Uses client-side filter (lines 93-102) instead of trpc.musicians.list with search param"
    missing:
      - "Replace client-side filter with useQuery search parameter"
      - "Add debounced searchQuery state update (300ms delay)"
      - "Wire searchQuery to trpc.musicians.list({ search: debouncedQuery })"
---

# Phase 28: Harmonisation UI Talents Verification Report

**Phase Goal:** Appliquer toutes les améliorations UX de la page /clients à la page /talents (modes Table/Grid/Kanban, tri, copy-to-clipboard, stats, avatars, design moderne)

**Verified:** 2026-01-22T03:36:43Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can toggle between Table/Grid/Kanban view modes | ✓ VERIFIED | ViewMode state + 3 toggle buttons + localStorage persistence |
| 2 | Table view shows all talents in sortable columns | ⚠️ PARTIAL | Sortable UI exists (arrows, onClick handlers) but data NOT actually sorted |
| 3 | Table view sorts data by clicked column | ✗ FAILED | handleSort updates state but filteredTalents never sorted by sortField/sortOrder |
| 4 | Grid view displays talent cards with avatars | ✓ VERIFIED | Grid implementation with h-12 Avatar components + getInitials fallback |
| 5 | Kanban view shows talents by type (Musician/Actor) | ✓ VERIFIED | 2-column layout filtering by talentType with badges |
| 6 | All views show copy-to-clipboard buttons for email/phone | ✓ VERIFIED | CopyButton component used 9 times across all 3 views |
| 7 | Stats cards show 4 KPIs (total, VIP, credits, last activity) | ✓ VERIFIED | 4 cards using trpc.musicians.getStats |
| 8 | Avatars show photos or initials fallback | ✓ VERIFIED | Avatar + AvatarImage + AvatarFallback with getInitials(talent.name) |
| 9 | VIP talents show star badges (>10 track credits) | ✓ VERIFIED | Star icon conditional on talent.creditsCount > 10 (16 occurrences) |
| 10 | Search filters talents by name/email/phone | ✓ VERIFIED | Client-side filter on name, stageName, email, phone |
| 11 | Search uses server-side endpoint with debounce | ✗ FAILED | Search is client-side only, no backend endpoint usage |
| 12 | ViewMode preference persists in localStorage | ✓ VERIFIED | localStorage.setItem/getItem('talentsViewMode') |
| 13 | TalentEditForm uses accordion pattern like ClientEditForm | ✓ VERIFIED | 5 AccordionItems with localStorage persistence |

**Score:** 11/13 truths verified (2 failures)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/client/src/pages/Talents.tsx` | 3 view modes with sorting | ⚠️ PARTIAL | 798 lines, has 3 views but sorting not applied to data |
| `packages/client/src/components/TalentEditForm.tsx` | Accordion-based form | ✓ VERIFIED | 299 lines, 5 accordions, pattern matches ClientEditForm |
| `packages/client/src/components/TalentDetailTabs.tsx` | Integrated TalentEditForm | ✓ VERIFIED | Imports and renders TalentEditForm in edit mode |
| `packages/client/src/pages/TalentCreate.tsx` | Simplified using TalentEditForm | ✓ VERIFIED | 107 lines (reduced from 258), reuses TalentEditForm |
| `packages/server/src/routers/musicians.ts` | Backend endpoints for stats/search | ✓ VERIFIED | listWithStats + getStats endpoints exist |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| Talents.tsx viewMode state | Table rendering | `{viewMode === 'table' &&` | ✓ WIRED | Conditional rendering verified (line 234) |
| Talents.tsx viewMode state | Grid rendering | `{viewMode === 'grid' &&` | ✓ WIRED | Conditional rendering verified (line 415) |
| Talents.tsx viewMode state | Kanban rendering | `{viewMode === 'kanban' &&` | ✓ WIRED | Conditional rendering verified (line 504) |
| Talents.tsx CopyButton | navigator.clipboard | `navigator.clipboard.writeText(text)` | ✓ WIRED | CopyButton component functional (lines 33-52) |
| Talents.tsx stats cards | trpc.musicians.getStats | `useQuery()` | ✓ WIRED | Stats API call verified (line 73) |
| Talents.tsx table data | trpc.musicians.listWithStats | `useQuery()` | ✓ WIRED | Data fetching verified (line 69) |
| TalentDetailTabs edit mode | TalentEditForm | `<TalentEditForm .../>` | ✓ WIRED | Component imported and rendered (line 78) |
| TalentCreate.tsx | TalentEditForm | Reused component | ✓ WIRED | Form component reused, 58% code reduction |
| Talents.tsx sortField state | filteredTalents | `.sort()` call | ✗ NOT_WIRED | sortField/sortOrder state exists but never applied to data |
| Talents.tsx searchQuery | Backend search | `trpc.musicians.list({ search })` | ✗ NOT_WIRED | Client-side filter only, backend endpoint unused |

### Requirements Coverage

Phase 28 addresses harmonization between /clients and /talents pages:

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| 3 view modes (Table/Grid/Kanban) | ✓ SATISFIED | None |
| Stats cards with 4 KPIs | ✓ SATISFIED | None |
| Sortable table columns | ✗ BLOCKED | Sorting UI exists but data not sorted |
| Copy-to-clipboard for contacts | ✓ SATISFIED | None |
| Avatars with fallback | ✓ SATISFIED | None |
| VIP indicators | ✓ SATISFIED | None |
| Server-side search with debounce | ✗ BLOCKED | Client-side filter only |
| Accordion-based edit form | ✓ SATISFIED | None |
| localStorage preferences | ✓ SATISFIED | None |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| Talents.tsx | 61-62 | Unused sortField/sortOrder state | ⚠️ WARNING | Misleading UI - arrows show but data unsorted |
| Talents.tsx | 75-82 | handleSort only updates state, no effect | ⚠️ WARNING | Clicking sort headers does nothing to data order |
| Talents.tsx | 93-102 | Client-side search when backend exists | ⚠️ WARNING | Not scalable, Phase 28-01 backend unused |

### Human Verification Required

#### 1. Visual Appearance of 3 View Modes

**Test:** Open http://localhost:5174/talents, click Table/Grid/Kanban toggle buttons
**Expected:** 
- Table view: Spreadsheet-like with 7 columns, sortable headers
- Grid view: 4-column card grid with prominent avatars
- Kanban view: 2 columns (Musicians/Actors) with detailed cards

**Why human:** Visual layout verification cannot be automated

#### 2. Copy-to-Clipboard Functionality

**Test:** Click copy icon next to email/phone in any view
**Expected:** Toast appears with "Email copié!" or "Téléphone copié!" and value is in clipboard

**Why human:** clipboard.writeText() and toast feedback need browser interaction

#### 3. Avatar Image Upload

**Test:** Edit a talent, upload profile photo
**Expected:** Photo appears in all 3 views (Grid h-12 prominent, Kanban h-8 compact, Table not shown)

**Why human:** File upload and S3/Cloudinary integration needs real browser

#### 4. Accordion Form UX

**Test:** Edit talent, Alt+Click on accordion header
**Expected:** All 5 accordions toggle open/closed, state persists to localStorage

**Why human:** Alt+Click interaction and localStorage verification needs real browser

#### 5. VIP Star Badge Accuracy

**Test:** Create talent with >10 track credits
**Expected:** Yellow star appears next to name in all 3 views

**Why human:** Track credits relationship needs real database with test data

### Gaps Summary

**2 critical gaps prevent full goal achievement:**

#### Gap 1: Table Sorting Not Functional

**Current state:** 
- UI exists: Sortable headers with arrow icons
- State exists: sortField, sortOrder, handleSort function
- Data NOT sorted: filteredTalents array never uses sort()

**Impact:** Clicking table headers does nothing. User expects data to reorder but it stays in database order.

**Fix needed:**
```typescript
// After line 102, add sorting logic
const sortedTalents = filteredTalents?.sort((a, b) => {
  let aVal = a[sortField];
  let bVal = b[sortField];
  
  // Handle null/undefined
  if (!aVal && !bVal) return 0;
  if (!aVal) return 1;
  if (!bVal) return -1;
  
  // String comparison
  if (typeof aVal === 'string') {
    return sortOrder === 'asc' 
      ? aVal.localeCompare(bVal as string)
      : (bVal as string).localeCompare(aVal);
  }
  
  // Number comparison
  return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
});

// Then use sortedTalents in all 3 views instead of filteredTalents
```

**Phase 28 Context reference:** Phase 28-CONTEXT.md line 31-37 specifies "Tri sur toutes les colonnes principales" was approved decision.

#### Gap 2: Server-Side Search Not Implemented

**Current state:**
- Backend ready: Phase 28-01 implemented `musicians.list({ search })` endpoint
- Frontend uses: Client-side `.filter()` on full dataset
- Debounce: Not implemented

**Impact:** 
- Works now but won't scale to >1000 talents
- Backend endpoint from 28-01 is unused
- No debounce (searches on every keystroke)

**Fix needed:**
```typescript
import { useDebouncedValue } from '@/hooks/useDebouncedValue'; // or implement

const [searchQuery, setSearchQuery] = useState("");
const debouncedSearch = useDebouncedValue(searchQuery, 300);

const { data: talents } = trpc.musicians.list.useQuery({
  talentType: selectedType === "all" ? undefined : selectedType,
  search: debouncedSearch || undefined
});

// Remove client-side filter (lines 93-102)
```

**Phase 28 Context reference:** Phase 28-CONTEXT.md line 63-67 specifies "Server-side avec debounce 300ms" was Decision B (chosen).

---

**Both gaps have clear fixes and don't require architectural changes. They're implementation oversights, not design flaws.**

---

_Verified: 2026-01-22T03:36:43Z_
_Verifier: Claude (gsd-verifier)_
