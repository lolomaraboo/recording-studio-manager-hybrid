---
phase: 25-gestion-relations-client-entreprise
plan: 01
subsystem: ui
tags: [react, trpc, many-to-many, company-members, relationships]

# Dependency graph
requires:
  - phase: 20.1-corriger-architecture-contacts
    provides: companyMembers table schema and many-to-many architecture
provides:
  - Complete CRUD UI for managing company-member relationships
  - Backend endpoints: addMember, updateMember, removeMember, getCompanies
  - Reusable CompanyMembersModal component (bidirectional)
  - CompanyMembersIndicator preview component
  - Integration in ClientDetailTabs (symmetrical for company/individual views)
affects: [client-management, crm-features, contact-relationships]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Bidirectional modal pattern (single component handles both company→members and individual→companies views)
    - Inline role editing with onChange + onBlur save
    - Preview indicator with count + truncated names (≤3 show all, >3 truncate)

key-files:
  created:
    - packages/client/src/components/CompanyMembersModal.tsx
    - packages/client/src/components/CompanyMembersIndicator.tsx
  modified:
    - packages/server/src/routers/clients.ts
    - packages/client/src/components/ClientDetailTabs.tsx

key-decisions:
  - "Single modal component for both views: clientType prop switches between company→members and individual→companies modes"
  - "Inline role editing: No separate edit button, click on role text to edit directly"
  - "Searchable dropdown for adding: Prevents typos, filters by type (individual/company)"
  - "Preview truncation: ≤3 members show all names, >3 show first 2 + ellipsis"

patterns-established:
  - "Bidirectional relationship UI: Same component handles both directions of many-to-many relationship"
  - "Inline editing UX: onChange updates local state, onBlur saves to backend"
  - "Modal preview pattern: Clickable indicator → full modal for detailed management"

# Metrics
duration: 6min
completed: 2026-01-20
---

# Phase 25 Plan 01: Gestion Relations Client-Entreprise Summary

**Complete many-to-many relationship management UI enabling studios to link individual contacts to company clients with roles and primary contact designation**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-20T21:07:23Z
- **Completed:** 2026-01-20T21:12:50Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Full CRUD backend endpoints for company-member relationships (add/update/remove)
- Bidirectional modal component handling both company view (manage members) and individual view (manage companies)
- Preview indicator with smart truncation (shows all names ≤3, truncates >3 with ellipsis)
- Seamless integration in ClientDetailTabs with symmetrical placement for both client types

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Missing Backend Endpoints** - `dc586e6` (feat)
   - Added getCompanies endpoint - `87bafbe` (feat)
2. **Task 2: Create CompanyMembersModal Component** - `9d25e77` (feat)
3. **Task 3: Create CompanyMembersIndicator & Integrate** - `3141bd3` (feat)

**Total commits:** 4 (including getCompanies addition discovered during Task 2 implementation)

## Files Created/Modified

**Created:**
- `packages/client/src/components/CompanyMembersModal.tsx` (362 lines) - Full CRUD modal with add/update/remove mutations, inline role editing, searchable dropdown, isPrimary checkbox, toast notifications
- `packages/client/src/components/CompanyMembersIndicator.tsx` (90 lines) - Clickable preview showing count + truncated member/company names, opens modal on click

**Modified:**
- `packages/server/src/routers/clients.ts` - Added 4 new endpoints:
  - `addMember`: Link individual to company with role and isPrimary flag (validation: type checking, duplicate prevention)
  - `updateMember`: Update role and isPrimary status inline
  - `removeMember`: Unlink member from company
  - `getCompanies`: Query companies for individual view (symmetrical to getMembers)
- `packages/client/src/components/ClientDetailTabs.tsx` - Integrated CompanyMembersIndicator after contact info section with Separator

## Decisions Made

**1. Single bidirectional modal component**
- Rationale: DRY principle, reduce code duplication, consistent UX across both views
- Impact: clientType prop switches behavior, same mutations work for both directions

**2. Inline role editing (no separate edit button)**
- Rationale: Reduce friction, fewer clicks, more fluid UX
- Pattern: onChange updates local state, onBlur calls updateMutation if changed

**3. Searchable dropdown for adding members/companies**
- Rationale: Prevents typos, type-safe selection, auto-filters by client type
- Impact: Better data integrity, faster selection

**4. Preview truncation rules (≤3 show all, >3 truncate)**
- Rationale: Balance between showing useful preview and avoiding UI overflow
- Format examples:
  - 0: "Aucun membre"
  - 1: "1 membre : Alex (Ingénieur)"
  - 3: "3 membres : Alex (Ingénieur), Sophie (Prod), Marc (Manager)"
  - 5: "5 membres : Alex (Ingénieur), Sophie (Prod)..."

## Deviations from Plan

**Auto-fixed Issues:**

**1. [Rule 3 - Blocking] Added getCompanies endpoint**
- **Found during:** Task 2 (CompanyMembersModal implementation)
- **Issue:** Plan mentioned creating getCompanies query but endpoint didn't exist in router
- **Fix:** Added getCompanies endpoint in clients.ts (symmetrical to getMembers, queries companies for individual view)
- **Files modified:** packages/server/src/routers/clients.ts
- **Verification:** TypeScript compilation 0 errors, endpoint follows same pattern as getMembers
- **Committed in:** 87bafbe (separate commit for clarity)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Essential for modal functionality. No scope creep - endpoint was implied in plan but missing from codebase.

## Issues Encountered

None - all tasks executed smoothly with no blockers.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for production use:**
- ✅ Backend endpoints validated with type checking and error handling
- ✅ Frontend components TypeScript compile with 0 errors
- ✅ Production build succeeds (Vite build completed)
- ✅ All mutations invalidate relevant queries (auto-refresh after add/update/remove)
- ✅ Toast notifications for all actions (UX feedback)

**Recommended next steps:**
- Manual testing: Verify add/update/remove flows for both company and individual views
- Edge case testing: Duplicate member addition (should show CONFLICT error), type validation (company to company should fail)
- UI polish: Consider role autocomplete based on existing roles in database (nice-to-have, not blocking)

**No blockers or concerns.**

---
*Phase: 25-gestion-relations-client-entreprise*
*Completed: 2026-01-20*
