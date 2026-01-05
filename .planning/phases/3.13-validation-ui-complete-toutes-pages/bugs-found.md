# UI Validation Bugs Found - Phase 3.13-02

**Testing Session:** Phase 3.13 Plan 02 - UI Validation Tests
**Date Started:** 2026-01-04
**Production URL:** https://recording-studio-manager.com
**Test Account:** e2e-test-user@example.com

---

## Summary Statistics

**Total Pages Tested:** 47 / 58 (via Playwright E2E tests)
**Total Bugs Found:** 3

**Bugs by Severity:**
- P0 (Critical): 0
- P1 (High): 0
- P2 (Medium): 2
- P3 (Low): 1

**Bugs by Category:**
- UI: 0
- UX: 0
- Functional: 1
- Performance: 0
- Test Infrastructure: 2

---

## Bugs List

## BUG-001: E2E global-setup.ts missing confirmPassword field

**Page:** /register (affects E2E test infrastructure)
**Severity:** P2
**Category:** Test Infrastructure
**Browser:** Chromium (Playwright)
**Date found:** 2026-01-04

### Description
The E2E test global setup script (`e2e/global-setup.ts`) does not fill the "Confirm Password" field when creating the test user, causing registration to fail with validation error "Please fill out this field."

### Steps to Reproduce
1. Run `npx playwright test` with a fresh database (no existing E2E user)
2. Global setup attempts to register E2E test user
3. Form validation prevents submission
4. All downstream tests fail due to missing test user

### Expected Behavior
Global setup should fill all required registration fields including:
- Full Name
- Email
- Password
- **Confirm Password** ← Missing
- Studio Name

### Actual Behavior
Form shows validation error on confirmPassword field, registration fails, all tests cannot run.

### Screenshot
![global-setup-after-register](./screenshots/bug-001-global-setup.png)

### Fix Applied
Added missing line in `e2e/global-setup.ts:50`:
```typescript
await page.fill('#confirmPassword, input[name="confirmPassword"]', password);
```

### Additional Context
This bug was blocking ALL E2E tests from running. After fix, tests can proceed normally.

---

## BUG-002: E2E ui-validation test has ambiguous password selector

**Page:** /register (test infrastructure)
**Severity:** P2
**Category:** Test Infrastructure
**Browser:** Chromium (Playwright)
**Date found:** 2026-01-04

### Description
The E2E UI validation test for the register page fails with "strict mode violation" because the selector `input[type="password"]` matches 2 elements (password AND confirmPassword fields).

### Steps to Reproduce
1. Run `npx playwright test e2e/ui-validation.spec.ts`
2. Test "Register page loads and displays form" fails
3. Error: "strict mode violation: locator('input[type="password"]') resolved to 2 elements"

### Expected Behavior
Test should use a more specific selector like:
```typescript
const passwordInput = page.locator('#password, input[name="password"]').first();
// OR
const passwordInput = page.getByRole('textbox', { name: 'Password', exact: true });
```

### Actual Behavior
Test fails with strict mode violation because selector is ambiguous.

### Console Errors
```
Error: strict mode violation: locator('input[type="password"]') resolved to 2 elements:
  1) <input id="password" type="password" ...>
  2) <input id="confirmPassword" type="password" ...>
```

### Fix Needed
Update `e2e/ui-validation.spec.ts:70` to use more specific selector.

---

## BUG-003: 404 resource not found console error on login page

**Page:** /login (homepage)
**Severity:** P3
**Category:** Functional
**Browser:** Chromium
**Date found:** 2026-01-04

### Description
Console shows a 404 error for a resource that failed to load on the login page.

### Steps to Reproduce
1. Navigate to https://recording-studio-manager.com/login
2. Open DevTools Console
3. Observe error: "Failed to load resource: the server responded with a status of 404 (Not Found)"

### Expected Behavior
All resources should load successfully with 200 status codes.

### Actual Behavior
One resource returns 404.

### Console Errors
```
Failed to load resource: the server responded with a status of 404 (Not Found)
```

### Additional Context
Need to investigate which specific resource is failing. Likely a missing asset (image, font, or JS file). This was detected during UI validation tests.

---

<!-- Add new bugs below using the template -->

<!-- Template:
## BUG-XXX: [Short title]

**Page:** [URL/route]
**Severity:** [P0/P1/P2/P3]
**Category:** [UI/UX/Functional/Performance/Security]
**Browser:** [Chrome 120 / Firefox 121 / Safari 17]
**Date found:** [YYYY-MM-DD]

### Description
[Clear description of what's wrong]

### Steps to Reproduce
1. [First step]
2. [Second step]
3. [Third step]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Screenshot
![bug](./screenshots/bug-xxx.png)

### Console Errors (if applicable)
```
[Paste relevant console errors]
```

### Additional Context
[Any other relevant information]

---
-->

