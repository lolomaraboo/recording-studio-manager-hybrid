# MCP Chrome DevTools Testing Protocol

**Purpose:** Systematic protocol for testing the entire site using MCP Chrome DevTools

**When to use:** Interactive UI testing, visual verification, console error detection, UX quality assurance

---

## Why MCP Chrome DevTools?

**Advantages over pure Playwright:**
- ✅ **Real browser interaction** - Navigate actual production site
- ✅ **Interactive testing** - Click, fill forms, test modals in real-time
- ✅ **Visual verification** - See exactly what users see
- ✅ **Console error capture** - Detect JavaScript errors live
- ✅ **Network inspection** - Catch 401/500 API errors
- ✅ **Screenshot documentation** - Automatic error screenshots
- ✅ **JavaScript evaluation** - Verify application state
- ✅ **Perfect for UX testing** - Audio playback, theme toggle, animations

**Complementary to Playwright:**
- Playwright: Automated regression tests (already have 71 tests)
- MCP Chrome: Exhaustive interactive exploration (new for Phase 3.4)

---

## MCP Chrome DevTools Available Tools

### Navigation
- `mcp__chrome-devtools__navigate_page({url, type})` - Navigate to URL
- `mcp__chrome-devtools__list_pages()` - List open tabs
- `mcp__chrome-devtools__select_page({pageIdx})` - Switch tab
- `mcp__chrome-devtools__new_page({url})` - Open new tab
- `mcp__chrome-devtools__close_page({pageIdx})` - Close tab

### Inspection
- `mcp__chrome-devtools__take_snapshot({verbose})` - Get page structure with UIDs
- `mcp__chrome-devtools__take_screenshot({filePath, fullPage})` - Capture screenshot
- `mcp__chrome-devtools__list_console_messages()` - Get console errors/warnings
- `mcp__chrome-devtools__get_console_message({msgid})` - Get specific console message
- `mcp__chrome-devtools__list_network_requests()` - Get API calls
- `mcp__chrome-devtools__get_network_request({reqid})` - Get specific network request

### Interaction
- `mcp__chrome-devtools__click({uid})` - Click element
- `mcp__chrome-devtools__fill({uid, value})` - Fill input field
- `mcp__chrome-devtools__fill_form([{uid, value}])` - Fill multiple fields
- `mcp__chrome-devtools__hover({uid})` - Hover over element
- `mcp__chrome-devtools__press_key({key})` - Press keyboard key
- `mcp__chrome-devtools__wait_for({text})` - Wait for text to appear

### Evaluation
- `mcp__chrome-devtools__evaluate_script({function, args})` - Run JavaScript

---

## Testing Workflow

### Step 1: Open Page
```javascript
mcp__chrome-devtools__navigate_page({
  url: "https://recording-studio-manager.com/dashboard",
  type: "url"
})
```

### Step 2: Take Snapshot
```javascript
mcp__chrome-devtools__take_snapshot()
```

**What this provides:**
- List of all interactive elements (buttons, links, forms, inputs)
- Each element has a unique `uid` for interaction
- Element types: button, link, textbox, combobox, tab, etc.
- Element names/labels for identification

**Example snapshot output:**
```
button "Create Client" uid="123"
link "Dashboard" uid="124"
textbox "Search..." uid="125"
```

### Step 3: Test Each Interactive Element

**For buttons:**
```javascript
// Click button
mcp__chrome-devtools__click({uid: "123"})

// Verify behavior (modal opens, navigation works, action completes)
mcp__chrome-devtools__take_snapshot() // Check new state

// Check for console errors
mcp__chrome-devtools__list_console_messages()
```

**For forms:**
```javascript
// Fill form
mcp__chrome-devtools__fill_form([
  {uid: "125", value: "Test Client"},
  {uid: "126", value: "test@example.com"}
])

// Submit
mcp__chrome-devtools__click({uid: "127"}) // Submit button

// Verify success/error
mcp__chrome-devtools__take_snapshot()
```

**For modals:**
```javascript
// Open modal
mcp__chrome-devtools__click({uid: "open-modal-btn"})

// Verify modal opened
mcp__chrome-devtools__take_snapshot() // Should show modal content

// Close modal
mcp__chrome-devtools__click({uid: "close-modal-btn"})

// Verify modal closed
mcp__chrome-devtools__take_snapshot() // Modal should be gone
```

### Step 4: Check Console Errors
```javascript
mcp__chrome-devtools__list_console_messages()
```

**Error types to catch:**
- `error` - JavaScript errors, uncaught exceptions
- `warn` - Warnings (may indicate issues)
- Network errors - 401, 403, 404, 500 status codes
- React errors - Component errors, hydration mismatches

**Example error detection:**
```javascript
// Get all error-level messages
mcp__chrome-devtools__list_console_messages({types: ["error"]})

// Get specific error details
mcp__chrome-devtools__get_console_message({msgid: 123})
```

### Step 5: Check Network Requests
```javascript
// List all API calls
mcp__chrome-devtools__list_network_requests({
  resourceTypes: ["fetch", "xhr"]
})

// Check for failed requests
// Look for status codes: 401, 403, 404, 500

// Get details of specific request
mcp__chrome-devtools__get_network_request({reqid: 456})
```

### Step 6: Screenshot Documentation
```javascript
// Screenshot on error
mcp__chrome-devtools__take_screenshot({
  filePath: ".planning/phases/3.4-comprehensive-site-testing/errors/error-001-modal-crash.png"
})

// Full page screenshot
mcp__chrome-devtools__take_screenshot({
  filePath: ".planning/phases/3.4-comprehensive-site-testing/screenshots/dashboard.png",
  fullPage: true
})
```

### Step 7: JavaScript Evaluation (Advanced)
```javascript
// Check application state
mcp__chrome-devtools__evaluate_script({
  function: "() => { return window.localStorage.getItem('theme') }"
})

// Verify element visibility
mcp__chrome-devtools__evaluate_script({
  function: "(el) => { return el.style.display }",
  args: [{uid: "123"}]
})
```

---

## Error Documentation Template

When an error is found, document it in `ERRORS-FOUND.md` using this template:

```markdown
## Error #N: [Short descriptive title]

**Page:** [URL or page name]
**Severity:** P0 | P1 | P2 | P3
**Type:** UI Bug | API Error | Validation | Performance | UX Issue | Console Error

**Steps to reproduce:**
1. Navigate to [URL]
2. Click [element with uid]
3. Observe [error]

**Expected behavior:**
[What should happen]

**Actual behavior:**
[What actually happens]

**Console errors:**
```
[Paste console error messages]
```

**Network errors:**
```
[Paste failed API requests - status code, endpoint]
```

**Screenshot:**
![Error screenshot](./errors/error-N.png)

**Impact:**
[User impact - blocker, degraded UX, minor issue]

**Priority rationale:**
- P0: Blocker - App crashes, 500 error, critical feature completely broken
- P1: Critical - Visible error to user, major UX degradation, data loss risk
- P2: Important - Edge case failure, validation missing, minor UX issue
- P3: Nice to have - Polish, minor improvement, cosmetic

**Related test item:**
[Reference to TEST-COVERAGE-MATRIX.md item]
```

---

## Systematic Testing Approach

### For Each Page in TEST-COVERAGE-MATRIX.md:

1. **Navigate to page**
   ```javascript
   mcp__chrome-devtools__navigate_page({url: "..."})
   ```

2. **Take snapshot → Get all interactive elements**
   ```javascript
   mcp__chrome-devtools__take_snapshot()
   ```

3. **Test each interactive element:**
   - Buttons: Click and verify behavior
   - Forms: Fill and submit
   - Modals: Open and close
   - Tabs: Switch and verify content
   - Dropdowns: Open and select
   - Links: Click and verify navigation

4. **Check for errors after each interaction:**
   ```javascript
   mcp__chrome-devtools__list_console_messages({types: ["error", "warn"]})
   ```

5. **Check network requests:**
   ```javascript
   mcp__chrome-devtools__list_network_requests()
   // Look for 401, 403, 404, 500 status codes
   ```

6. **Screenshot the page:**
   ```javascript
   mcp__chrome-devtools__take_screenshot({
     filePath: ".planning/phases/3.4-comprehensive-site-testing/screenshots/[page-name].png",
     fullPage: true
   })
   ```

7. **Document any errors found:**
   - Add to ERRORS-FOUND.md
   - Mark item in TEST-COVERAGE-MATRIX.md as `[❌]`
   - Save screenshot to errors/ folder

8. **Mark test complete:**
   - If no error: `[✅]` in TEST-COVERAGE-MATRIX.md
   - If error found: `[❌]` in TEST-COVERAGE-MATRIX.md
   - Move to next item

---

## Testing Categories Priority

### Priority 1: Critical User Flows (Test First)
1. **Authentication** - Login/logout, registration
2. **Onboarding** - New studio signup → first dashboard access
3. **Booking** - Client booking workflow
4. **Projects** - Create project → upload track → share
5. **Billing** - Subscription payment, invoice creation

**Why first:** These are the most used features. Blockers here = app unusable.

### Priority 2: CRUD Operations
6. **11 Entities CRUD** - Create, read, update, delete for each entity
   - Focus on: Clients, Sessions, Projects, Invoices (most important)
   - Then: Tracks, Contracts, Quotes
   - Finally: Rooms, Equipment, Expenses, Talents

**Why second:** Core functionality. Errors here = data management broken.

### Priority 3: Advanced Features
7. **AI Chatbot** - 37 actions, SSE streaming
8. **Audio Player** - Upload, play, versioning
9. **Notifications** - SSE stream, mark as read
10. **Command Palette** - Cmd+K navigation
11. **Global Search** - Multi-entity search
12. **Theme Toggle** - Dark/light mode

**Why third:** Differentiating features. Errors here = degraded UX but not blocking.

### Priority 4: Client Portal
13. **Client Portal** - All 5 pages and workflows

**Why fourth:** Important but smaller user base (clients vs admins).

### Priority 5: Edge Cases & Polish
14. **Validation & Error Handling**
15. **Edge Cases** - Long names, special characters, date limits
16. **Empty States**
17. **Loading States**

**Why last:** Quality polish. Important but lower impact than core functionality.

---

## File Organization

```
.planning/phases/3.4-comprehensive-site-testing/
├── TEST-COVERAGE-MATRIX.md         # Master checklist (~600 items)
├── MCP-TESTING-PROTOCOL.md         # This file
├── ERRORS-FOUND.md                 # All errors documented
├── errors/                         # Error screenshots
│   ├── error-001-dashboard-crash.png
│   ├── error-002-modal-not-closing.png
│   └── ...
└── screenshots/                    # Page screenshots
    ├── dashboard.png
    ├── clients-list.png
    ├── project-detail.png
    └── ... (47 admin pages + 5 client portal pages)
```

---

## Example: Testing Dashboard Page

### Step-by-step example:

```javascript
// 1. Navigate to dashboard
mcp__chrome-devtools__navigate_page({
  url: "https://recording-studio-manager.com/dashboard"
})

// 2. Take snapshot
const snapshot = mcp__chrome-devtools__take_snapshot()
// Identifies:
// - button "Create Client" uid="101"
// - button "Create Session" uid="102"
// - link "View All Clients" uid="103"
// - button "AI Chatbot" uid="104"

// 3. Test "Create Client" button
mcp__chrome-devtools__click({uid: "101"})

// 4. Check if modal opened
const modalSnapshot = mcp__chrome-devtools__take_snapshot()
// Should show: modal with form fields

// 5. Check console for errors
const consoleErrors = mcp__chrome-devtools__list_console_messages({
  types: ["error"]
})
// If errors found → document in ERRORS-FOUND.md

// 6. Fill form
mcp__chrome-devtools__fill_form([
  {uid: "201", value: "Test Client"},
  {uid: "202", value: "test@example.com"}
])

// 7. Submit form
mcp__chrome-devtools__click({uid: "203"}) // Submit button

// 8. Verify success
const successSnapshot = mcp__chrome-devtools__take_snapshot()
// Should show: success toast, client added to list

// 9. Check network requests
const networkRequests = mcp__chrome-devtools__list_network_requests({
  resourceTypes: ["fetch"]
})
// Verify: POST /api/trpc/clients.create returned 200

// 10. Screenshot for documentation
mcp__chrome-devtools__take_screenshot({
  filePath: ".planning/phases/3.4-comprehensive-site-testing/screenshots/dashboard-create-client-success.png"
})

// 11. Mark test complete in TEST-COVERAGE-MATRIX.md
// - [✅] Dashboard > "Create Client" button opens modal
// - [✅] Create client > Form validation works
// - [✅] Create client > Submit creates client successfully
```

---

## Session Management

### Multiple Pages Testing

Use tabs to test multiple pages efficiently:

```javascript
// Open multiple pages in tabs
mcp__chrome-devtools__new_page({
  url: "https://recording-studio-manager.com/clients"
})

mcp__chrome-devtools__new_page({
  url: "https://recording-studio-manager.com/sessions"
})

// List all tabs
mcp__chrome-devtools__list_pages()

// Switch between tabs
mcp__chrome-devtools__select_page({pageIdx: 0}) // Dashboard
mcp__chrome-devtools__select_page({pageIdx: 1}) // Clients
mcp__chrome-devtools__select_page({pageIdx: 2}) // Sessions

// Close tab when done
mcp__chrome-devtools__close_page({pageIdx: 2})
```

### Authentication Persistence

MCP Chrome DevTools maintains session cookies:
- Login once at start of testing session
- Authentication persists across page navigations
- No need to re-login for each page

```javascript
// Login once at start
mcp__chrome-devtools__navigate_page({
  url: "https://recording-studio-manager.com/login"
})

mcp__chrome-devtools__fill_form([
  {uid: "email", value: "admin@example.com"},
  {uid: "password", value: "password123"}
])

mcp__chrome-devtools__click({uid: "login-button"})

// Now authenticated for all subsequent pages
```

---

## Tips & Best Practices

### 1. Test in Order of TEST-COVERAGE-MATRIX.md
- Follow the matrix top-to-bottom
- Mark items as you test them
- Don't skip items

### 2. Document Everything
- Every error gets an entry in ERRORS-FOUND.md
- Every page gets a screenshot in screenshots/
- Error screenshots go in errors/

### 3. Check Console After Every Interaction
- Errors may appear delayed
- Some errors only show on specific actions

### 4. Test Both Success and Error Paths
- Valid form submission (should succeed)
- Invalid form submission (should show validation errors)

### 5. Verify Network Requests
- Successful requests: 200, 201, 204
- Failed requests: 400, 401, 403, 404, 500
- Check request/response payloads if error

### 6. Use Descriptive Screenshot Names
- Good: `error-001-create-client-modal-validation-missing.png`
- Bad: `screenshot1.png`

### 7. Priority-Based Testing
- If time-limited: Focus on P0/P1 items first
- Critical flows before edge cases

### 8. Batch Similar Tests
- Test all CRUD operations for one entity
- Then move to next entity
- More efficient than jumping around

---

## Next Steps

After creating this protocol:

1. **Phase 3.4-02:** Execute tests using this protocol
   - Systematic page-by-page testing
   - Document all errors in ERRORS-FOUND.md
   - Mark items in TEST-COVERAGE-MATRIX.md

2. **Phase 3.4-03:** Prioritize errors found
   - Categorize by P0/P1/P2/P3
   - Create fix plans for each priority

3. **Phase 3.4-04+:** Fix errors systematically
   - One plan per priority level
   - Re-test after fixes

---

## Estimated Testing Time

**Based on 600 test items:**

- Average time per item: ~1-2 minutes
  - Navigate to page: 10s
  - Take snapshot: 10s
  - Test interaction: 30s
  - Check console/network: 20s
  - Screenshot if needed: 10s
  - Document if error: 2-5 min (only if error found)

**Time estimates:**
- Simple items (navigation, button clicks): ~1 min
- Medium items (form fills, modals): ~2 min
- Complex items (CRUD operations, workflows): ~3-5 min

**Total time estimate:**
- Optimistic (no errors): ~600 min = 10 hours
- Realistic (some errors): ~720 min = 12 hours
- Pessimistic (many errors): ~900 min = 15 hours

**Recommendation:** Plan for 3-4 testing sessions of 3-4 hours each.

---

## Success Criteria

Testing phase complete when:
- [ ] All 600 items in TEST-COVERAGE-MATRIX.md marked (✅ or ❌)
- [ ] All errors documented in ERRORS-FOUND.md
- [ ] All pages screenshot in screenshots/
- [ ] All errors screenshot in errors/
- [ ] Errors prioritized (P0/P1/P2/P3)
- [ ] Fix plans created for critical errors (P0/P1)

Then ready for Phase 4 (Marketing) or error fixing phases (3.4-04+).
