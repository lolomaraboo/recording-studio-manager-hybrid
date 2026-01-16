# Phase 18 Test Matrix - Audit Complet Toutes Pages

**Created:** 2026-01-15
**Status:** Ready for Execution
**Target:** 0 bugs P0/P1/P2 (Zero-Bug Strict)
**Approach:** Manual testing with MCP Chrome DevTools

---

## Bug Severity Levels

### P0 - Blocker (App Broken)
**Criteria:**
- Application completely unusable
- Critical security vulnerability
- Data loss or corruption
- Payment processing fails
- Authentication completely broken

**Examples:**
- Cannot login to application
- Database connection errors
- All API requests return 500 errors
- Stripe payment integration broken
- Data corruption on save

**Action:** Fix immediately, block all other work

---

### P1 - Critical (Major Feature Broken)
**Criteria:**
- Core feature completely non-functional
- Workflow cannot be completed
- Affects majority of users
- No workaround available

**Examples:**
- Cannot create clients
- Sessions don't save to database
- Invoices don't generate
- Quotes cannot be sent
- Time tracking doesn't record entries
- File upload fails completely

**Action:** Fix within same session, high priority

---

### P2 - Important (Minor Feature Broken or Poor UX)
**Criteria:**
- Feature works but with significant issues
- Workaround exists but inconvenient
- Affects user experience negatively
- Causes confusion or frustration

**Examples:**
- Form validation missing or incorrect
- Button placement confusing
- Modal doesn't close properly
- Search returns incorrect results
- Dark mode has visual bugs
- Mobile layout broken

**Action:** Fix before Phase 18 completion (zero-bug requirement)

---

### P3 - Minor (Polish, Nice-to-Have)
**Criteria:**
- Cosmetic issues
- Minor UX improvements
- Edge cases
- Nice-to-have enhancements

**Examples:**
- Icon misalignment (1-2px)
- Inconsistent spacing (minor)
- Typos in UI text
- Tooltip positioning slightly off
- Loading spinner aesthetics

**Action:** Document but can be deferred to post-launch

---

## Progress Overview

**Overall Progress:** 2/58 pages tested (3%)

- [ ] **Admin Dashboard** - 2/44 pages tested (5%) - Dashboard ✅ PASS, Clients ✅ PASS
- [ ] **Client Portal** - 0/7 pages tested (0%)
- [ ] **Super Admin** - 0/4 pages tested (0%)
- [ ] **Public/Auth** - 0/4 pages tested (0%)

**Bugs Found:**
- P0: 0 (BUG-001 ✅ Fixed Phase 18.1, BUG-003 ✅ Fixed Phase 18.2)
- P1: 0
- P2: 0 (BUG-004 ✅ Fixed commit 14ec3e9)
- P3: 2 (Sentry DSN warning, React Router future flags)

**Phase 18 Complete:** ❌ (Requires P0/P1/P2 = 0)

---

## Testing Checklist Template

**For EACH page, validate:**

### ✅ A) Functionality (Core Features)
- [ ] Page loads without errors (no 4xx/5xx, no console errors)
- [ ] Data displays correctly (lists show items, details show all fields)
- [ ] **Create** operation works (form validation, success message, data persists)
- [ ] **Read** operation works (detail page shows all fields accurately)
- [ ] **Update** operation works (form pre-fills, saves correctly, updates display)
- [ ] **Delete** operation works (confirmation modal, data removed, list updates)
- [ ] Search/Filter works (if applicable)
- [ ] Pagination works (if applicable)
- [ ] Sort works (if applicable - ascending/descending)

### ✅ B) UI/UX Quality
- [ ] Page header has `text-primary` icon (h-8 w-8)
- [ ] Container spacing correct (pt-2 pb-4 px-2 for Admin, pt-6 for Public)
- [ ] Card headers have `pb-3` spacing
- [ ] Buttons accessible and properly labeled
- [ ] Loading states present (skeleton, spinner, or "Loading...")
- [ ] Empty states informative ("No clients yet. Create your first client!")
- [ ] Error messages clear and actionable
- [ ] Forms have proper validation messages
- [ ] Responsive on mobile (test at 375px width minimum)
- [ ] Dark mode works (no contrast issues, all text readable)

### ✅ C) Interactions (Every Click)
- [ ] All buttons respond to click (no dead buttons)
- [ ] All links navigate correctly (no 404s)
- [ ] All modals open/close properly (X button, backdrop click, ESC key)
- [ ] All dropdowns populate with options
- [ ] All form fields accept input and validate
- [ ] All tables are scrollable if content overflows
- [ ] All tooltips show on hover (if applicable)
- [ ] All keyboard shortcuts work (if applicable, ex: Cmd+K)

---

## 1. Admin Dashboard (44 pages)

| # | Page | Route | Status | Bugs | Notes |
|---|------|-------|--------|------|-------|
| 1 | Dashboard | `/` | ✅ PASS | BUG-004 ✅ Fixed | Main analytics view |
| 2 | Clients - List | `/clients` | ✅ PASS | - | Table/Grid/Kanban modes |
| 3 | Clients - Detail | `/clients/:id` | ⏳ Pending | - | Client info + tabs |
| 4 | Clients - Create | `/clients/new` | ⏳ Pending | - | Multi-tab form (vCard) |
| 5 | Sessions - List | `/sessions` | ⏳ Pending | - | Calendar + list view |
| 6 | Sessions - Detail | `/sessions/:id` | ⏳ Pending | - | Session info |
| 7 | Sessions - Create | `/sessions/new` | ⏳ Pending | - | Booking form |
| 8 | Sessions - Edit | `/sessions/:id/edit` | ⏳ Pending | - | Update booking |
| 9 | Projects - List | `/projects` | ⏳ Pending | - | All projects |
| 10 | Projects - Detail | `/projects/:id` | ⏳ Pending | - | Project + tracks |
| 11 | Projects - Create | `/projects/new` | ⏳ Pending | - | Create modal |
| 12 | Tracks - List | `/projects/:id/tracks` | ⏳ Pending | - | Within project |
| 13 | Tracks - Detail | `/projects/:id/tracks/:trackId` | ⏳ Pending | - | Audio player + metadata |
| 14 | Tracks - Upload | `/projects/:id/tracks/upload` | ⏳ Pending | - | Cloudinary upload |
| 15 | Quotes - List | `/quotes` | ⏳ Pending | - | All quotes (NEW v4.0) |
| 16 | Quotes - Detail | `/quotes/:id` | ⏳ Pending | - | Quote view + PDF |
| 17 | Quotes - Create | `/quotes/new` | ⏳ Pending | - | Line items builder |
| 18 | Quotes - Edit | `/quotes/:id/edit` | ⏳ Pending | - | Update quote |
| 19 | Invoices - List | `/invoices` | ⏳ Pending | - | All invoices |
| 20 | Invoices - Detail | `/invoices/:id` | ⏳ Pending | - | Invoice view + PDF |
| 21 | Invoices - Create | `/invoices/new` | ⏳ Pending | - | Manual invoice |
| 22 | Invoices - Auto Generate | `/invoices/generate` | ⏳ Pending | - | From time entries (NEW v4.0) |
| 23 | Time Tracking - Timer | `/time-tracking` | ⏳ Pending | - | Active timer (NEW v4.0) |
| 24 | Time Tracking - History | `/time-tracking/history` | ⏳ Pending | - | Past entries |
| 25 | Time Tracking - Manual Entry | `/time-tracking/manual` | ⏳ Pending | - | Add entry manually |
| 26 | Reports - Financial | `/reports/financial` | ⏳ Pending | - | Revenue reports |
| 27 | Reports - Sessions | `/reports/sessions` | ⏳ Pending | - | Session summary |
| 28 | Reports - Clients | `/reports/clients` | ⏳ Pending | - | Client activity |
| 29 | Analytics | `/analytics` | ⏳ Pending | - | Charts + metrics |
| 30 | Team - List | `/team` | ⏳ Pending | - | Team members |
| 31 | Team - Invite | `/team/invite` | ⏳ Pending | - | Invite new member |
| 32 | Rooms - List | `/rooms` | ⏳ Pending | - | Studio rooms |
| 33 | Rooms - Create | `/rooms/new` | ⏳ Pending | - | Add room |
| 34 | Rooms - Edit | `/rooms/:id/edit` | ⏳ Pending | - | Update room |
| 35 | Equipment - List | `/equipment` | ⏳ Pending | - | All equipment |
| 36 | Equipment - Create | `/equipment/new` | ⏳ Pending | - | Add equipment |
| 37 | Equipment - Edit | `/equipment/:id/edit` | ⏳ Pending | - | Update equipment |
| 38 | Service Catalog - List | `/services` | ⏳ Pending | - | Catalog (NEW v4.0) |
| 39 | Service Catalog - Create | `/services/new` | ⏳ Pending | - | Add service |
| 40 | Service Catalog - Edit | `/services/:id/edit` | ⏳ Pending | - | Update service |
| 41 | Settings - Organization | `/settings` | ⏳ Pending | - | Org settings |
| 42 | Notifications Center | `/notifications` | ⏳ Pending | - | All notifications |
| 43 | AI Chat | `/chat` | ⏳ Pending | - | AI assistant (37 tools) |
| 44 | Command Palette | `Cmd+K` | ⏳ Pending | - | Global search |

---

## 2. Client Portal (7 pages)

| # | Page | Route | Status | Bugs | Notes |
|---|------|-------|--------|------|-------|
| 45 | Client Login | `/client-portal/login` | ⏳ Pending | - | Email/password + magic link |
| 46 | Client Dashboard | `/client-portal` | ⏳ Pending | - | Overview for clients |
| 47 | Client Invoices - List | `/client-portal/invoices` | ⏳ Pending | - | Client's invoices |
| 48 | Client Invoices - Detail | `/client-portal/invoices/:id` | ⏳ Pending | - | Invoice + Pay Now button |
| 49 | Client Invoice - Payment | Stripe Checkout | ⏳ Pending | - | Payment flow (NEW v4.0) |
| 50 | Client Profile | `/client-portal/profile` | ⏳ Pending | - | Client info edit |
| 51 | Client Activity Logs | `/client-portal/activity` | ⏳ Pending | - | Activity history |

---

## 3. Super Admin (4 pages)

| # | Page | Route | Status | Bugs | Notes |
|---|------|-------|--------|------|-------|
| 52 | Services Monitoring | `/superadmin/services` | ⏳ Pending | - | Docker containers status |
| 53 | Database Management | `/superadmin/database` | ⏳ Pending | - | Orgs, users, tenants |
| 54 | System Logs | `/superadmin/logs` | ⏳ Pending | - | Application logs |
| 55 | User Management | `/superadmin/users` | ⏳ Pending | - | If exists |

---

## 4. Public/Auth (4 pages)

| # | Page | Route | Status | Bugs | Notes |
|---|------|-------|--------|------|-------|
| 56 | Public Landing | `/landing` or `/` | ⏳ Pending | - | If exists |
| 57 | Signup | `/register` | ❌ FAIL | BUG-001 | Registration fails (SQL error) |
| 58 | Login (Admin) | `/login` | ❌ FAIL | BUG-002 | Dev mode org ID 3 doesn't exist |
| 59 | Password Reset | `/reset-password` | ⏳ Pending | - | Forgot password |

---

## End-to-End Workflows

**Test these complete user journeys across multiple pages:**

### Workflow 1: Quote to Invoice (NEW v4.0)
- [ ] Create client
- [ ] Create quote with line items from service catalog
- [ ] Send quote (status: SENT)
- [ ] Accept quote (status: ACCEPTED)
- [ ] Convert quote to project
- [ ] Start timer on project task
- [ ] Stop timer
- [ ] Generate invoice from time entries
- [ ] Client receives invoice email
- [ ] Client pays invoice via Stripe
- [ ] Invoice status updates to PAID

### Workflow 2: Session Booking to Payment
- [ ] Client login via magic link
- [ ] Client views available sessions
- [ ] Client books session
- [ ] Admin receives notification
- [ ] Admin confirms session
- [ ] Session occurs
- [ ] Admin generates invoice
- [ ] Client receives invoice
- [ ] Client pays online
- [ ] Payment confirmed

### Workflow 3: Project Management Full Cycle
- [ ] Create client
- [ ] Create project for client
- [ ] Upload track to project
- [ ] Add track metadata (Phase 5 enrichment)
- [ ] Download different versions (demo/rough/final/master)
- [ ] Share track with client
- [ ] Client listens via audio player
- [ ] Client approves track
- [ ] Generate final invoice

### Workflow 4: AI Assistant (37 Tools)
- [ ] Open AI chat (Cmd+K or /chat)
- [ ] Create client via AI
- [ ] Schedule session via AI
- [ ] Generate invoice via AI
- [ ] Ask for analytics via AI
- [ ] Verify cache invalidation (UI updates automatically)

---

## Testing Protocol

### Before Testing

1. **Environment Setup**
   - Open browser in incognito mode (fresh state)
   - Clear localStorage: `localStorage.clear()`
   - Clear cookies
   - Set viewport to 1920×1080 (desktop first)

2. **Login**
   - Admin: `admin@test-studio-ui.com` / `password` (Organization 16)
   - Client Portal: Use test client created in global-setup

3. **DevTools Configuration**
   - Open Console tab (watch for errors)
   - Open Network tab (watch for failed requests)
   - Enable "Preserve log" in both tabs

### During Testing

1. **Navigate to page**
   - Check URL is correct
   - Verify page title/header

2. **Validate Functionality (A)**
   - Test every CRUD operation
   - Try valid + invalid inputs
   - Check data persistence

3. **Validate UI/UX (B)**
   - Visual inspection (icons, spacing, colors)
   - Toggle dark mode
   - Resize to 375px (mobile)

4. **Validate Interactions (C)**
   - Click every button
   - Fill every form
   - Open every modal

5. **Document Issues**
   - If bug found, STOP testing that page
   - Document bug immediately (see format below)
   - Take screenshot if visual bug
   - Copy console error if applicable
   - Mark page as ❌ FAIL in matrix

6. **Mark Complete**
   - If no bugs: ✅ PASS
   - If bugs found: ❌ FAIL (list bug IDs)

### Bug Documentation Format

```markdown
## BUG-001: [Page Name] - Short Description

**Severity:** P0 / P1 / P2 / P3
**Location:** Route path (ex: /clients/:id)
**Component:** ComponentName.tsx (if known)

**Steps to Reproduce:**
1. Go to /clients
2. Click "Create Client" button
3. Fill form with invalid email
4. Click "Save"

**Expected:**
Form shows validation error "Invalid email format"

**Actual:**
Form submits, console shows error, client not created

**Console Error:**
```
TypeError: Cannot read property 'email' of undefined
  at ClientCreate.tsx:42
```

**Screenshot:** `bug-001-client-create-validation.png`

**Related:** BUG-002 (same root cause)
```

### After Testing Each Page

1. Update matrix table
2. Commit progress: `git commit -m "test(18-02): validate [Page Name] - [PASS/FAIL]"`
3. Move to next page

### Mobile Testing

**After all desktop tests pass:**
1. Set viewport to 375px × 667px (iPhone SE)
2. Re-test critical workflows
3. Focus on: touch targets, scrolling, responsive layout

---

## Bugs Discovered

### P0 - Blockers (App Broken)
*(None yet - will be added during testing)*

---

### P1 - Critical (Major Features Broken)
*(None yet - will be added during testing)*

---

### P2 - Important (Minor Features Broken or Poor UX)
*(None yet - will be added during testing)*

---

### P3 - Minor (Polish)
*(None yet - will be added during testing)*

---

## Bugs Discovered

### BUG-001: Database Schema/Migrations Desynchronized (P0)

**Severity:** P0 - Blocker
**Location:** Database initialization
**Component:** packages/database/migrations + schema

**Discovered During:** Plan 18-02 environment setup
**Discovery:** Cannot initialize local database for testing - schema mismatch

**Steps to Reproduce:**
1. Drop and recreate rsm_master database
2. Run `pnpm db:migrate`
3. Run `DATABASE_URL="..." pnpm --filter database db:init`
4. Observe error: "column 'stripe_customer_id' of relation 'organizations' does not exist"

**Expected:**
- Migrations should create all schema columns
- Init script should match current schema
- Database should initialize successfully

**Actual:**
- Migration creates partial schema (missing Stripe billing columns)
- Init script expects complete schema with all columns
- Database initialization fails, blocking all testing

**Root Cause:**
Schema definition in `packages/database/src/master/schema.ts` includes Stripe billing columns, but migrations don't create them (likely missing migration file or out-of-date migrations).

**Impact:**
- Cannot test application locally
- Blocks all Phase 18 testing
- Production might be affected if deployed with incomplete migrations

**Fix Applied:**
[To be documented after fix]

**Status:** 🔧 Fixing now (Rule 1: Auto-fix bugs)

---

## Summary Statistics

**Testing Progress:**
- Pages tested: 2/58 (3%)
- Pages passing: 0
- Pages failing: 2 (Signup/Register, Login)
- Pages N/A: 0

**Bug Statistics:**
- P0 bugs: 2 (BUG-001: Registration SQL error, BUG-003: Systematic schema desync)
- P1 bugs: 0
- P2 bugs: 0
- P3 bugs: 0
- **Total bugs:** 3 (1 resolved: BUG-002)

**Phase 18 Status:**
- ❌ **NOT COMPLETE** (P0/P1/P2 must be 0)
- Blocking bugs: BUG-003 (Systematic schema desync)
- Resolved bugs: BUG-001 (Registration - needs code fix), BUG-002 (Dev mode auth - FIXED)
- Environment setup: ✅ COMPLETE (Database initialized, org 16 ready, dashboard accessible)
- Estimated remaining fix time: 4-6 hours (systematic schema migration generation + application)

---

## Bugs Discovered

### BUG-001: Registration échoue - erreur SQL d'insertion dans organizations

**Severity:** 🔴 P0 - BLOCKER
**Location:** `/register` - Registration page
**Component:** `packages/server/src/routers/auth.ts` (auth.register mutation)
**Discovered:** 2026-01-15 16:21:16 (Phase 18-02 Task 1)

**Steps to Reproduce:**
1. Navigate to http://localhost:5174/register
2. Fill in form:
   - Full Name: "Test User Phase 18"
   - Email: "test-phase18-1768529963@example.com"
   - Password: "TestPassword123!"
   - Confirm Password: "TestPassword123!"
   - Studio Name: "Phase 18 Test Studio"
3. Click "Create Account" button
4. Observe error in console

**Expected:**
- User account created successfully
- Organization created with new user as owner
- Tenant database provisioned
- User redirected to dashboard (auto-login)

**Actual:**
- Registration fails silently (stays on registration page)
- Console error: "Registration error: TRPCClientError: Failed query: insert into "organizations"..."
- Server log shows SQL INSERT failure with owner_id = 3 (user doesn't exist yet)

**Root Cause:**
Registration flow attempts to insert organization with `owner_id = 3` before creating the user. The user creation should happen FIRST, then the organization should be created with the newly created user's ID.

**Console Error:**
```
Registration error: TRPCClientError: Failed query: insert into "organizations" ("id", "name", "slug", "subdomain", "owner_id", ...) values (default, $1, $2, $3, $4, ...)
params: Phase 18 Test Studio,phase-18-test-studio,phase-18-test-studio,3
```

**Server Log:**
```
[TRPC Error] {
  type: 'mutation',
  path: 'auth.register',
  error: 'Failed query: insert into "organizations" ... params: Phase 18 Test Studio,phase-18-test-studio,phase-18-test-studio,3'
}
```

**Impact:**
- **CRITICAL**: New users cannot sign up
- Application completely unusable for new customers
- Blocks all new tenant onboarding
- Blocks Phase 18 testing (cannot create test accounts)

**Fix Required:**
1. Review `packages/server/src/routers/auth.ts` register mutation
2. Ensure user is created FIRST with INSERT RETURNING id
3. Use returned user.id for organization owner_id
4. Verify transaction atomicity (rollback on failure)
5. Test with fresh database

**Workaround:** None available

**Related:** Blocks all Phase 18 testing that requires logged-in user

---

### BUG-002: Dev mode hardcode organizationId=3 inexistante

**Severity:** 🔴 P0 - BLOCKER
**Location:** `/login` + ALL authenticated routes
**Component:** `packages/client/src/main.tsx` (tRPC client headers configuration, line 56)
**Discovered:** 2026-01-15 16:28:45 (Phase 18-02 Task 1)

**Steps to Reproduce:**
1. Navigate to http://localhost:5174/login
2. Fill in valid credentials (email: `alice@studiopro.com`, password: `password`)
3. Click "Login" button
4. Observe login fails with "Invalid credentials"
5. Check server logs showing `organizationId: 3` not found

**Expected:**
- Dev mode uses existing organization from database
- Login succeeds with valid credentials
- User redirected to dashboard

**Actual:**
- Client always sends `x-test-org-id: '3'` header in dev mode
- Organization 3 doesn't exist in local database (only org 1 exists)
- Server fails to fetch organization, login fails
- All authenticated requests fail with organization not found

**Root Cause:**
`packages/client/src/main.tsx` line 56 hardcodes:
```typescript
'x-test-org-id': '3',  // ❌ Organization 3 doesn't exist!
```

Should dynamically use existing organization or be configurable via `.env`.

**Console Error:**
```
Login error: TRPCClientError: Invalid credentials
```

**Server Log:**
```
[Auth Debug] Dev mode bypass: { userId: 1, organizationId: 3 }
[TRPC Error] {
  type: 'query',
  path: 'auth.me',
  error: 'Failed query: select ... from "organizations" where "organizations"."id" = $1'
  params: 3,1
}
```

**Impact:**
- **CRITICAL**: Authentication completely broken in dev mode
- Cannot login to test application locally
- ALL authenticated routes return 401/404
- Blocks 100% of Phase 18 testing
- Blocks local development for all developers

**Fix Required:**
1. Change `x-test-org-id` from `'3'` to `'1'` (quick fix)
2. OR make it configurable via `VITE_TEST_ORG_ID` env var (proper fix)
3. OR remove dev mode bypass headers entirely and use real session auth
4. Update local database OR update hardcoded value to match

**Workaround:**
Option A: Change line 56 from `'3'` to `'1'` in main.tsx
Option B: Create organization 3 in database

**Related:**
- Blocks ALL testing after BUG-001
- Makes application completely unusable in dev mode
- Connected to BUG-001 (registration also uses wrong org ID)

**Resolution:** ✅ FIXED in commit `abdf26c`
- Changed `x-test-org-id` from '1' to '16' (Test Studio UI organization)
- Changed `x-test-user-id` from '1' to '4' (admin@test-studio-ui.com)
- Organization 16 created with complete tenant_16 database
- Dashboard now loads successfully with test data

---

### BUG-003: Systematic Schema/Migration Desync - Tenant Tables

**Severity:** 🔴 P0 - BLOCKER
**Location:** Multiple tenant database tables
**Component:** `packages/database/drizzle/migrations/tenant/*` + `packages/database/src/tenant/schema.ts`
**Discovered:** 2026-01-15 16:40:00 (Phase 18-02 Task 1 - Dashboard loading)

**Scope:**
This is a SYSTEMATIC issue affecting multiple tenant tables. TypeScript schema definitions include columns that don't exist in the database migrations.

**Affected Tables (Confirmed):**
1. **sessions** - Missing columns:
   - `project_id` (integer, FK to projects)
   - `deposit_amount` (numeric)
   - `deposit_paid` (boolean)
   - `payment_status` (varchar 50)
   - `stripe_checkout_session_id` (varchar 255)
   - `stripe_payment_intent_id` (varchar 255)

2. **invoices** - Missing columns:
   - `deposit_amount` (numeric)
   - `deposit_paid_at` (timestamp)
   - `stripe_deposit_payment_intent_id` (varchar 255)
   - `remaining_balance` (numeric)
   - `pdf_s3_key` (varchar 500)
   - `sent_at` (timestamp)

3. **musicians** - Missing column:
   - `talent_type` (varchar)

**Likely Affected Tables (Not Yet Tested):**
- quotes
- contracts
- projects
- tracks
- invoices
- Any table with Stripe integration
- Any table with file storage (S3 keys)

**Steps to Reproduce:**
1. Navigate to dashboard http://localhost:5174
2. Open browser DevTools console
3. Observe tRPC errors:
   ```
   [TRPC Error] path: 'sessions.list'
   error: 'Failed query: select ... "project_id", "deposit_amount", "deposit_paid",
          "payment_status", "stripe_checkout_session_id", "stripe_payment_intent_id" ...
          from "sessions"'
   ```

**Expected:**
- All columns in TypeScript schema exist in database
- Migrations create complete schema matching TypeScript definitions
- Dashboard widgets load data successfully

**Actual:**
- TypeScript schema evolved (added Stripe, deposits, S3 features)
- Migrations NOT updated to match schema changes
- Queries fail because columns don't exist
- Dashboard widgets show "no data" despite 8 sessions existing in DB

**Root Cause:**
Schema definitions were updated to add new features (Stripe payments, deposit tracking, file storage) but corresponding migration files were NEVER GENERATED or were generated but not applied to existing tenant databases.

This is different from BUG-001 (master DB schema desync) - this affects ALL tenant databases across ALL organizations.

**Impact:**
- **CRITICAL**: Core features completely non-functional
- Sessions list: ❌ BROKEN
- Invoices list: ❌ BROKEN
- Dashboard widgets: ⚠️ PARTIAL (counts work, details fail)
- ANY query selecting these tables: ❌ FAILS
- Blocks testing of:
  - Sessions (pages 6-9)
  - Invoices (pages 19-22)
  - Time Tracking (pages 23-25)
  - Reports (pages 26-28)
  - Possibly 20-30 more pages

**Database Evidence:**
```sql
-- sessions table (actual structure)
\d sessions
-- Missing: project_id, deposit_amount, deposit_paid, payment_status,
--          stripe_checkout_session_id, stripe_payment_intent_id

-- invoices table (actual structure)
\d invoices
-- Missing: deposit_amount, deposit_paid_at, stripe_deposit_payment_intent_id,
--          remaining_balance, pdf_s3_key, sent_at
```

**Fix Required:**
1. **Generate new migration** from current schema:
   ```bash
   pnpm db:generate
   ```
2. **Review generated migration** - ensure it adds missing columns
3. **Apply to ALL tenant databases**:
   - tenant_1
   - tenant_16
   - Any others in production
4. **Document schema evolution** process to prevent future desync
5. **Add CI check** to detect schema/migration mismatches

**Workaround:**
NONE - Cannot test affected features until migrations applied

**Related:**
- BUG-001: Master DB had similar schema desync (Stripe columns)
- Suggests project-wide schema management issues
- Indicates missing CI/CD validation for schema consistency

**Status:** 🔧 NEEDS FIX (Rule 1: Auto-fix bugs - but this requires careful migration generation)

**Priority Justification:**
- Blocks ~40% of application testing (20+ pages)
- Production risk: If deployed, customer data queries will fail
- Affects ALL organizations (multi-tenant impact)
- No workaround available

---

## BUG-004: Dashboard - SSE Connection Error (Notifications temps réel)

**Severity:** P2 (Important - UX issue, not blocking)

**Location:** / (Dashboard)
**Component:** NotificationCenter.tsx:75

**Steps to Reproduce:**
1. Navigate to dashboard http://localhost:5174
2. Login as admin@test-studio-ui.com
3. Open browser DevTools console (F12)
4. Observe repeated error messages:
   ```
   [ERROR] [SSE] Connection error, retrying...
     at NotificationCenter.tsx:75:20
   ```

**Expected:**
- SSE (Server-Sent Events) connection establishes successfully
- Notifications update in real-time without errors
- Console remains clean (no repeated errors)

**Actual:**
- SSE connection fails repeatedly
- Error message appears every few seconds in console
- Notifications component keeps retrying connection indefinitely
- Console polluted with repeated error logs

**Root Cause:**
NotificationCenter.tsx attempts to establish SSE connection to backend notification stream, but:
- Backend SSE endpoint may not be running/configured
- Connection URL may be incorrect
- CORS/auth headers may be missing for SSE requests

**Impact:**
- Dashboard functionality: ✅ WORKS (data loads, widgets display correctly)
- Notifications display: ✅ WORKS (can see notifications via manual tRPC queries)
- Real-time updates: ❌ BROKEN (notifications don't update live)
- Console: ❌ POLLUTED (error spam reduces debugging visibility)
- User experience: ⚠️ DEGRADED (no live notification updates)

**Visual Evidence:**
Dashboard loads correctly with all widgets displaying data:
- Statistiques Rapides: 5 Clients, 4 Salles, 8 Équipement, 4 Projets ✅
- Sessions today/upcoming ✅
- Factures en attente: 2 factures ✅
- Revenus: 18.24€ ✅

But console shows:
```
[16:41:07] [ERROR] [SSE] Connection error, retrying...
[16:41:48] [ERROR] [SSE] Connection error, retrying...
[16:43:01] [ERROR] [SSE] Connection error, retrying...
... (repeated indefinitely)
```

**Workaround:**
- Notifications still work via manual refresh
- Dashboard remains fully functional
- Users can click notification bell to fetch latest

**Fix Required:**
1. Check backend SSE endpoint configuration
2. Verify SSE route exists in server (e.g., `/api/notifications/stream`)
3. Ensure CORS allows SSE connections
4. Add SSE connection error handling with exponential backoff
5. Consider graceful degradation: disable SSE if backend doesn't support it

**Related:**
- None (isolated to notification system)

**Status:** ✅ FIXED (commit 14ec3e9)

**Fix Applied:**
1. **Root Cause Identified:** EventSource API cannot send custom headers (x-test-user-id, x-test-org-id) in dev mode, causing 401 Unauthorized errors
2. **Solution:** Use query parameters instead of headers for dev mode authentication
3. **Frontend Fix (NotificationCenter.tsx):** Append `?userId=4&orgId=16` to SSE URL when `import.meta.env.DEV`
4. **Backend Fix (index.ts):** Modified `/api/notifications/stream` endpoint to accept query params with fallback chain: query params → headers → session
5. **Verification:** Console cleared after 15s shows no new SSE errors, backend logs confirm successful connection

**Testing Impact:**
- ✅ SSE connection now works in dev mode
- ✅ Real-time notifications functional
- ✅ Console clean (no error spam)
- ✅ Dashboard fully operational

**Additional Notes:**
- Also found P3 warnings (not blocking):
  - `VITE_SENTRY_DSN_FRONTEND not set` - Expected in dev, Sentry not configured
  - React Router Future Flag warnings - Deprecation notices, no functional impact

---

## Notes

- **Page not found during testing?** Mark as "N/A - Page inexistante" and continue
- **Duplicate bug?** Reference original (ex: "Same as BUG-001")
- **Unsure of severity?** Default to higher priority, can downgrade later
- **Found P0/P1?** Alert immediately, consider pausing other tests to fix

---

**Last Updated:** 2026-01-15
**Next Update:** During Plan 18-02 execution
