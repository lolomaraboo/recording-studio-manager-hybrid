# Fixes Roadmap - Phase 3.4 Critical Errors

Based on ERRORS-ANALYSIS.md, here are the correction plans needed before Phase 4 (Marketing Launch).

---

## Pre-Launch Fixes (Must complete before Phase 4)

### Phase 3.4-04: Fix P1 Critical Error #4

**Error:** API validation bug - limit parameter mismatch
**Impact:** Clients page cannot show session counts and revenue totals, Calendar page cannot load sessions
**Effort:** ~1h
**Priority:** CRITICAL (blocking core business functionality)

**Tasks:**

1. **Locate frontend components making limit=1000 requests**
   - Search for `sessions.list` calls in client codebase
   - Search for `invoices.list` calls in client codebase
   - Expected locations:
     - `packages/client/src/pages/Clients.tsx` (or similar)
     - `packages/client/src/pages/Calendar.tsx` (or similar)

2. **Fix limit parameter in Clients page**
   - Change `limit: 1000` to `limit: 100` where sessions.list is called
   - Change `limit: 1000` to `limit: 100` where invoices.list is called
   - **Note:** If client needs >100 sessions for stats, implement pagination OR request backend validation increase

3. **Fix limit parameter in Calendar page**
   - Change `limit: 1000` to `limit: 100` where sessions.list is called
   - **Note:** If calendar needs >100 sessions displayed, implement pagination

4. **Rebuild client package**
   - Run: `pnpm --filter @rsm/client build`
   - Verify build succeeds without errors

5. **Deploy to production VPS**
   - Copy new client build to VPS
   - Restart Nginx/Docker containers if needed

6. **Verification (embedded in fix plan)**
   - Navigate to https://recording-studio-manager.com/clients
   - Open Network tab in DevTools
   - Verify: All API calls return 200 OK (no 400 errors)
   - Verify: Client table shows session counts (not all zeros)
   - Verify: Client table shows revenue totals (not all zeros)
   - Navigate to https://recording-studio-manager.com/calendar
   - Verify: Calendar loads sessions without errors
   - Verify: Calendar displays events correctly

**Success Criteria:**
- [ ] No 400 errors in Network tab on /clients or /calendar
- [ ] Clients page displays correct session counts for each client
- [ ] Clients page displays correct revenue totals for each client
- [ ] Calendar page loads sessions and displays events
- [ ] No console errors related to API validation
- [ ] Error #4 marked as FIXED in ERRORS-FOUND.md

**Estimated Duration:** 1 hour (30min fix + 15min deploy + 15min verify)

---

### Phase 3.4-05: Validation & Regression Testing

**Goal:** Verify P1 fix works correctly and didn't introduce regressions
**Effort:** ~30min
**Priority:** HIGH (ensure fix quality before launch)

**Tasks:**

1. **Re-test fixed pages with MCP Chrome DevTools**
   - Open https://recording-studio-manager.com/clients
   - Take snapshot: `mcp__chrome-devtools__take_snapshot`
   - Check console messages: `mcp__chrome-devtools__list_console_messages`
   - Check network requests: `mcp__chrome-devtools__list_network_requests`
   - Verify: No 400 errors, data displays correctly
   - Open https://recording-studio-manager.com/calendar
   - Repeat MCP Chrome DevTools checks
   - Verify: Sessions load, calendar renders

2. **Run Playwright E2E test suite (from Phase 3.2)**
   - Execute: `npx playwright test`
   - Verify: All tests pass (especially auth, booking, navigation)
   - Verify: No new failures introduced by client rebuild

3. **Spot-check other pages for regressions**
   - Navigate to /dashboard - verify still loads
   - Navigate to /sessions - verify list still loads
   - Navigate to /projects - verify list still loads
   - Ensure limit parameter change didn't affect other pages

4. **Update ERRORS-FOUND.md**
   - Change Error #4 status from "Open" to "Fixed"
   - Add "Fixed Date: 2025-12-27"
   - Add "Fix verification: Tested on production, all API calls return 200 OK, data displays correctly"
   - Update summary statistics: P1 errors: 1 → 0

**Success Criteria:**
- [ ] /clients and /calendar pages work correctly in production
- [ ] Playwright E2E tests all passing
- [ ] No regressions observed on other pages
- [ ] ERRORS-FOUND.md updated to reflect fix

**Estimated Duration:** 30 minutes

---

## Launch Decision Gate

**Before proceeding to Phase 4 (Marketing):**

**Required:**
- [x] Phase 3.4-03 complete (error analysis done)
- [ ] Phase 3.4-04 complete (P1 error fixed)
- [ ] Phase 3.4-05 complete (validation passed)
- [ ] P0 errors: 0 ✅
- [ ] P1 errors: 0 ✅ (after 3.4-04)

**Quality Checklist:**
- [ ] All critical functionality works (auth, CRUD, booking, payment, AI chatbot)
- [ ] No 401/500 errors on tested pages
- [ ] Core business features functional (client tracking, revenue, sessions)
- [ ] Playwright E2E suite passing

**If ALL required items complete:**
✅ **PROCEED TO PHASE 4 (Marketing Foundation)**

**If any required item NOT complete:**
❌ **BLOCK Phase 4** until fixed

---

## Post-Launch Fixes (After Phase 4)

### Backlog: P3 Polish Items (5 errors)

**Priority:** Low - Nice to have, not blocking launch

**Quick Wins (<30min each):**

1. **Error #1: Missing vite.svg favicon → 404**
   - Fix: Remove `<link rel="icon" href="/vite.svg">` from index.html OR add proper favicon file
   - Effort: <15min
   - Impact: Eliminates console 404 error

2. **Error #2: WebSocket authentication warning on page load**
   - Fix: Suppress warning in production build OR delay WebSocket connection until after auth.me completes
   - Effort: <30min
   - Impact: Cleaner console output

3. **Error #3: Form field missing id/name attribute (Dashboard AI Assistant)**
   - Fix: Add `id="ai-assistant-input"` to message input field component
   - Effort: <15min
   - Impact: Better screen reader accessibility

4. **Error #5: Form fields missing autocomplete attribute (Settings page)**
   - Fix: Add `autocomplete="email"`, `autocomplete="name"`, `autocomplete="organization"` to relevant inputs
   - Effort: <30min
   - Impact: Better browser autocomplete UX and accessibility

**Medium Effort (1-2h):**

5. **Error #6: Equipment page slow initial load (10s timeout)**
   - Fix: Profile component with React DevTools, optimize expensive renders or skeleton loading
   - Effort: 1-2h (profiling + optimization)
   - Impact: Faster Equipment page load

**Total P3 Effort:** ~3 hours

**Recommendation:** Schedule P3 fixes as low-priority backlog items. Track in `.planning/ISSUES.md` or product roadmap. Address based on user feedback post-launch.

---

## Continuous Improvement Backlog

**For v1.1 or later releases:**

1. **Accessibility Audit**
   - Run axe-core on all pages
   - Fix all WCAG 2.1 AA violations
   - Test with screen readers (NVDA, JAWS)
   - Effort: 4-8h

2. **Performance Baseline**
   - Run Lighthouse on all pages
   - Target >90 Performance score
   - Optimize bundle size, lazy loading, image optimization
   - Effort: 8-16h

3. **Console Hygiene**
   - Zero console errors/warnings in production build
   - Remove all dev-only logging
   - Implement proper error boundaries
   - Effort: 2-4h

4. **Form Validation Review**
   - Audit all forms for proper validation
   - Ensure clear error messages
   - Test edge cases (empty, invalid, boundary values)
   - Effort: 4-6h

5. **Complete Testing Coverage**
   - Continue MCP Chrome testing for remaining 37 Admin pages
   - Test Client Portal 5 pages
   - Test all CRUD operations
   - Test workflows end-to-end
   - Effort: 8-12h

---

## Recommended Execution Plan

### Sprint 1: Pre-Launch Critical (1.5h) ⚡ URGENT

1. Execute Phase 3.4-04: Fix P1 error #4 (~1h)
2. Execute Phase 3.4-05: Validation & regression testing (~30min)
3. Mark Phase 3.4 complete
4. **LAUNCH READY** ✅

### Sprint 2: Post-Launch Polish (3h) 📅 After Phase 4

1. Fix Error #1: vite.svg 404 (<15min)
2. Fix Error #2: WebSocket warning (<30min)
3. Fix Error #3: AI input id/name (<15min)
4. Fix Error #5: Settings autocomplete (<30min)
5. Fix Error #6: Equipment performance (1-2h)

### Sprint 3: Continuous Improvement (20-30h) 📅 v1.1

1. Accessibility audit (4-8h)
2. Performance baseline (8-16h)
3. Console hygiene (2-4h)
4. Form validation review (4-6h)
5. Complete test coverage (8-12h)

---

## Risk Mitigation

**If P1 fix takes longer than expected (>2h):**
- **Fallback:** Increase backend validation from `max(100)` to `max(1000)` temporarily
- **Pros:** Faster fix (1-line change in server)
- **Cons:** Allows frontend to request large datasets (potential performance issue)
- **Recommendation:** Only use if frontend fix blocked, but prefer fixing frontend limit

**If P1 fix introduces regressions:**
- **Rollback:** Revert client build to previous version
- **Debug:** Identify what broke (likely other components using same API calls)
- **Fix:** Adjust all components affected by limit change
- **Timeline:** +1-2h for debugging and comprehensive fix

**If validation testing reveals more P0/P1 errors:**
- **Decision:** Delay Phase 4 until all P0/P1 fixed
- **Re-prioritize:** Create additional 3.4-06, 3.4-07 plans as needed
- **Update roadmap:** Adjust Phase 4 start date accordingly

---

## Success Metrics

**Phase 3.4 Complete When:**
- ✅ All errors analyzed and prioritized (ERRORS-ANALYSIS.md)
- ✅ Fixes roadmap created (this document)
- ✅ P0 errors: 0
- ✅ P1 errors: 0 (fixed and verified)
- ✅ Regression tests passing
- ✅ Production validated with MCP Chrome DevTools

**Ready for Phase 4 (Marketing) When:**
- ✅ Phase 3.4 complete (above criteria met)
- ✅ User confidence: "App works well enough to show customers"
- ✅ Core value proposition functional: Studio can manage clients, book sessions, track revenue
- ✅ No embarrassing bugs visible to first-time visitors

**Post-launch success:**
- Monitor real user feedback on first 10 customers
- Track P3 errors - do users complain about them?
- Prioritize fixes based on actual user pain vs theoretical issues

---

**Last Updated:** 2025-12-27
**Status:** Ready for execution
**Next Step:** Execute Phase 3.4-04 (Fix P1 error #4)
