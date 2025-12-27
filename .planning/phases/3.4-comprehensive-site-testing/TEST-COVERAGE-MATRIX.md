# Test Coverage Matrix - Comprehensive Site Testing

**Purpose:** Exhaustive checklist of ALL functionalities to test before marketing launch (Phase 4)

**Legend:**
- `[ ]` = Not tested yet
- `[✅]` = Tested and OK
- `[❌]` = Error found (documented in ERRORS-FOUND.md)
- `[⏭️]` = Skipped (not applicable or out of scope)

---

## 1. Admin Pages Navigation (47 pages)

### Dashboard & Overview
- [✅] Dashboard > Home - Page loads without error (3 P3 console warnings: vite.svg 404, WebSocket auth, form field ID)
- [✅] Dashboard > Overview cards - Display correct data (widgets render correctly)
- [✅] Dashboard > Recent activity - Shows latest actions
- [✅] Dashboard > Quick actions - All buttons functional

### Clients Management (5 pages)
- [❌] Clients > List - Page loads, table renders (**P1 Error #4**: limit=1000 validation bug breaks session/revenue data)
- [⏭️] Clients > List - Pagination works (only 1 client in test data)
- [✅] Clients > List - Search/filter functionality (search box visible)
- [✅] Clients > List - "Create Client" button appears (link to /clients/new)
- [ ] Clients > Detail - Individual client page loads
- [ ] Clients > Detail - All tabs work (Overview, Sessions, Projects, Invoices, Contracts)
- [ ] Clients > Detail - Edit button works
- [ ] Clients > Detail - Delete button works (with confirmation)
- [ ] Clients > Detail - Navigation breadcrumbs work

### Sessions Management (6 pages)
- [✅] Sessions > List - Page loads, table renders (clean, no errors)
- [✅] Sessions > List - Filter by status (scheduled, in-progress, completed, cancelled)
- [⏭️] Sessions > List - Calendar view toggle works (not tested - need to click)
- [✅] Sessions > List - "Create Session" button visible
- [ ] Sessions > Detail - Session page loads
- [ ] Sessions > Detail - All tabs work (Overview, Equipment, Tracks, Invoice)
- [ ] Sessions > Detail - Start/pause/complete actions work
- [ ] Sessions > Detail - Equipment assignment works
- [ ] Sessions > Detail - Duration tracking accurate
- [❌] Sessions > Calendar - Month/week/day views work (**P1 Error #4**: limit=1000 validation bug)
- [ ] Sessions > Calendar - Drag & drop rescheduling works
- [ ] Sessions > Calendar - Color coding by status works

### Projects Management (6 pages)
- [✅] Projects > List - Page loads, grid/list view toggle (clean, no errors)
- [✅] Projects > List - Filter by status visible
- [✅] Projects > List - "Create Project" button visible
- [ ] Projects > Detail - Project page loads
- [ ] Projects > Detail - All tabs work (Overview, Tracks, Sessions, Files, Activity)
- [ ] Projects > Detail - Progress bar shows correct %
- [ ] Projects > Detail - Add track functionality works
- [ ] Projects > Detail - Share project button works
- [ ] Projects > Kanban - Board view loads
- [ ] Projects > Kanban - Drag & drop status changes work
- [ ] Projects > Timeline - Gantt chart renders
- [ ] Projects > Timeline - Date adjustments work

### Tracks Management (5 pages)
- [ ] Tracks > List - All tracks across projects
- [ ] Tracks > List - Filter by project/status/version
- [ ] Tracks > Detail - Track page loads
- [ ] Tracks > Detail - Audio player works (play, pause, seek, volume)
- [ ] Tracks > Detail - Upload new version works
- [ ] Tracks > Detail - Version history displays correctly
- [ ] Tracks > Detail - Download track works
- [ ] Tracks > Detail - Metadata editable (copyright fields)
- [ ] Tracks > Detail - Technical details visible (BPM, key, duration)
- [ ] Tracks > Versions - 4 version types displayed (demo, rough, final, master)
- [ ] Tracks > Versions - Version comparison works

### Rooms & Equipment (4 pages)
- [✅] Rooms > List - All rooms displayed (clean, no errors)
- [✅] Rooms > List - "Create Room" button visible
- [ ] Rooms > Detail - Room page loads
- [ ] Rooms > Detail - Equipment list shows assigned items
- [ ] Rooms > Detail - Availability calendar works
- [❌] Equipment > List - All equipment displayed (**P3 Error #6**: Slow initial load, 10s timeout)
- [✅] Equipment > List - Filter by category/status (renders after load)
- [ ] Equipment > Detail - Equipment page loads
- [ ] Equipment > Detail - Maintenance log works
- [ ] Equipment > Detail - Assignment history visible

### Financial Management (9 pages)
- [✅] Invoices > List - All invoices displayed (clean, no errors)
- [✅] Invoices > List - Filter by status visible
- [✅] Invoices > List - "Create Invoice" button visible
- [ ] Invoices > Detail - Invoice page loads
- [ ] Invoices > Detail - PDF preview/download works
- [ ] Invoices > Detail - Send by email works
- [ ] Invoices > Detail - Mark as paid works
- [ ] Invoices > Detail - Payment link generation works
- [✅] Quotes > List - All quotes displayed (clean, no errors)
- [✅] Quotes > List - "Create Quote" button visible
- [ ] Quotes > Detail - Quote page loads
- [ ] Quotes > Detail - Convert to invoice works
- [ ] Expenses > List - All expenses displayed
- [ ] Expenses > List - Filter by category/date
- [ ] Expenses > List - "Add Expense" button works
- [ ] Expenses > Detail - Receipt upload works
- [ ] Expenses > Analytics - Charts render correctly
- [ ] Expenses > Analytics - Date range filter works

### Contracts & Legal (3 pages)
- [ ] Contracts > List - All contracts displayed
- [ ] Contracts > List - "Create Contract" button works
- [ ] Contracts > Detail - Contract page loads
- [ ] Contracts > Detail - Electronic signature works
- [ ] Contracts > Detail - PDF download works
- [ ] Contracts > Detail - Milestones tracking works
- [ ] Contracts > Templates - Template library loads
- [ ] Contracts > Templates - Custom template creation works

### Talents Management (2 pages)
- [ ] Talents > List - All talents displayed
- [ ] Talents > List - "Add Talent" button works
- [ ] Talents > Detail - Talent profile loads
- [ ] Talents > Detail - Sessions history visible
- [ ] Talents > Detail - Payment info editable

### Settings & Configuration (7 pages)
- [❌] Settings > Organization - Profile editable (**P3 Error #5**: Missing autocomplete attributes)
- [ ] Settings > Organization - Logo upload works
- [ ] Settings > Organization - Time zone/currency settings work
- [ ] Settings > Users - User list displays
- [ ] Settings > Users - Invite user works
- [ ] Settings > Users - Role management works
- [ ] Settings > Billing - Subscription info displays
- [ ] Settings > Billing - Payment method editable
- [ ] Settings > Billing - Plan upgrade/downgrade works
- [ ] Settings > Billing - Invoice history accessible
- [ ] Settings > Integrations - Available integrations list
- [ ] Settings > Integrations - Stripe connected
- [ ] Settings > Integrations - Cloudinary configured
- [ ] Settings > Notifications - Email preferences editable
- [ ] Settings > Notifications - Notification categories toggle
- [ ] Settings > Security - Password change works
- [ ] Settings > Security - 2FA setup (if implemented)

---

## 2. CRUD Operations (44 tests - 11 entities × 4 operations)

### Clients CRUD
- [ ] Create client - Modal opens
- [ ] Create client - Form validation (required fields: name, email)
- [ ] Create client - Email format validation
- [ ] Create client - Submit creates client successfully
- [ ] Create client - Success toast displayed
- [ ] Read client list - All clients visible
- [ ] Read client detail - Individual client loads
- [ ] Update client - Edit modal opens
- [ ] Update client - Changes save successfully
- [ ] Delete client - Confirmation modal appears
- [ ] Delete client - Deletion succeeds
- [ ] Delete client - Client removed from list

### Sessions CRUD
- [ ] Create session - Modal opens
- [ ] Create session - Form validation (client, room, date, time required)
- [ ] Create session - Date/time picker works
- [ ] Create session - Client/room selection works
- [ ] Create session - Submit creates session
- [ ] Read session list - All sessions visible
- [ ] Read session detail - Individual session loads
- [ ] Update session - Edit works
- [ ] Update session - Reschedule works
- [ ] Delete session - Confirmation required
- [ ] Delete session - Deletion succeeds

### Projects CRUD
- [ ] Create project - Modal opens
- [ ] Create project - Form validation (name, client required)
- [ ] Create project - Genre/type selection works
- [ ] Create project - Submit creates project
- [ ] Read project list - All projects visible
- [ ] Read project detail - Individual project loads
- [ ] Update project - Edit works
- [ ] Update project - Status change works
- [ ] Delete project - Confirmation required
- [ ] Delete project - Cascade warning (if has tracks)
- [ ] Delete project - Deletion succeeds

### Tracks CRUD
- [ ] Create track - Add to project works
- [ ] Create track - Form validation (name, project required)
- [ ] Create track - Metadata fields optional
- [ ] Create track - Submit creates track
- [ ] Read track list - All tracks visible
- [ ] Read track detail - Individual track loads
- [ ] Update track - Metadata edit works
- [ ] Update track - Version upload works
- [ ] Delete track - Confirmation required
- [ ] Delete track - Deletion succeeds

### Rooms CRUD
- [ ] Create room - Modal opens
- [ ] Create room - Form validation (name, capacity required)
- [ ] Create room - Submit creates room
- [ ] Read room list - All rooms visible
- [ ] Read room detail - Individual room loads
- [ ] Update room - Edit works
- [ ] Delete room - Confirmation required
- [ ] Delete room - Deletion succeeds

### Equipment CRUD
- [ ] Create equipment - Modal opens
- [ ] Create equipment - Form validation (name, category required)
- [ ] Create equipment - Submit creates equipment
- [ ] Read equipment list - All equipment visible
- [ ] Read equipment detail - Individual equipment loads
- [ ] Update equipment - Edit works
- [ ] Update equipment - Status change works
- [ ] Delete equipment - Confirmation required
- [ ] Delete equipment - Deletion succeeds

### Invoices CRUD
- [ ] Create invoice - Modal opens
- [ ] Create invoice - Line items add/remove works
- [ ] Create invoice - Tax calculation correct
- [ ] Create invoice - Total calculation correct
- [ ] Create invoice - Submit creates invoice
- [ ] Read invoice list - All invoices visible
- [ ] Read invoice detail - Individual invoice loads
- [ ] Update invoice - Edit works (draft only)
- [ ] Update invoice - Status change (sent, paid)
- [ ] Delete invoice - Confirmation required
- [ ] Delete invoice - Deletion succeeds (draft only)

### Quotes CRUD
- [ ] Create quote - Modal opens
- [ ] Create quote - Line items add/remove works
- [ ] Create quote - Submit creates quote
- [ ] Read quote list - All quotes visible
- [ ] Read quote detail - Individual quote loads
- [ ] Update quote - Edit works
- [ ] Update quote - Convert to invoice works
- [ ] Delete quote - Confirmation required
- [ ] Delete quote - Deletion succeeds

### Contracts CRUD
- [ ] Create contract - Modal/wizard opens
- [ ] Create contract - Template selection works
- [ ] Create contract - Custom terms editable
- [ ] Create contract - Submit creates contract
- [ ] Read contract list - All contracts visible
- [ ] Read contract detail - Individual contract loads
- [ ] Update contract - Edit works (unsigned only)
- [ ] Update contract - Sign works
- [ ] Delete contract - Confirmation required
- [ ] Delete contract - Deletion succeeds (unsigned only)

### Expenses CRUD
- [ ] Create expense - Modal opens
- [ ] Create expense - Form validation (amount, category required)
- [ ] Create expense - Receipt upload works
- [ ] Create expense - Submit creates expense
- [ ] Read expense list - All expenses visible
- [ ] Read expense detail - Individual expense loads
- [ ] Update expense - Edit works
- [ ] Delete expense - Confirmation required
- [ ] Delete expense - Deletion succeeds

### Talents CRUD
- [ ] Create talent - Modal opens
- [ ] Create talent - Form validation (name, specialty required)
- [ ] Create talent - Submit creates talent
- [ ] Read talent list - All talents visible
- [ ] Read talent detail - Individual talent loads
- [ ] Update talent - Edit works
- [ ] Delete talent - Confirmation required
- [ ] Delete talent - Deletion succeeds

---

## 3. UI Interactions (~200 items)

### Buttons (estimate ~50)
- [ ] Primary buttons - All clickable and functional
- [ ] Secondary buttons - All clickable and functional
- [ ] Danger buttons (delete) - Require confirmation
- [ ] Icon buttons - Tooltips display on hover
- [ ] Button loading states - Show spinner during action
- [ ] Button disabled states - Prevent clicks when disabled

### Modals (estimate ~30)
- [ ] Create modals - Open/close smoothly
- [ ] Edit modals - Pre-populate with existing data
- [ ] Confirmation modals - Yes/No actions work
- [ ] Delete modals - Show entity name in confirmation
- [ ] Modal overlay - Click outside to close works
- [ ] Modal escape key - ESC key closes modal
- [ ] Modal focus trap - Tab navigation stays within modal

### Forms (estimate ~40)
- [ ] Required field validation - Shows error on submit
- [ ] Email format validation - Rejects invalid emails
- [ ] Number field validation - Accepts only numbers
- [ ] Date picker - Calendar widget works
- [ ] Time picker - Time selection works
- [ ] Select dropdowns - Options selectable
- [ ] Multi-select - Multiple options selectable
- [ ] File upload - Browse/drag-drop works
- [ ] Form reset - Clear button resets all fields
- [ ] Form submit - Loading state during submission
- [ ] Form success - Success message/toast displayed
- [ ] Form error - Error message displayed

### Tabs (estimate ~20)
- [ ] Tab navigation - All tabs clickable
- [ ] Tab content - Correct content displays per tab
- [ ] Tab active state - Active tab highlighted
- [ ] Tab lazy loading - Content loads on first click

### Dropdowns & Selects (estimate ~40)
- [ ] Dropdown menus - Open/close on click
- [ ] Dropdown items - All items clickable
- [ ] Select fields - Options list displays
- [ ] Select search - Filtering works (if implemented)
- [ ] Multi-select - Tag display works
- [ ] Multi-select - Remove tag works

### Accordions & Collapses (estimate ~10)
- [ ] Accordion expand - Content shows on click
- [ ] Accordion collapse - Content hides on click
- [ ] Accordion icon - Arrow/chevron rotates
- [ ] Nested accordions - Multiple levels work

### Tooltips (estimate ~10)
- [ ] Icon tooltips - Display on hover
- [ ] Button tooltips - Display on hover
- [ ] Tooltip positioning - Correct placement (top/bottom/left/right)
- [ ] Tooltip delay - Appears after hover delay

### Tables
- [ ] Table sorting - Column headers clickable
- [ ] Table sorting - Ascending/descending toggle
- [ ] Table pagination - Next/previous page works
- [ ] Table pagination - Page number display correct
- [ ] Table row actions - Edit/delete buttons work
- [ ] Table row selection - Checkbox selection works
- [ ] Table bulk actions - Actions on selected rows work
- [ ] Table empty state - Shows when no data
- [ ] Table loading state - Skeleton/spinner while loading

### Search & Filters
- [ ] Global search - Opens on Cmd+K / Ctrl+K
- [ ] Global search - Search input works
- [ ] Global search - Results display correctly
- [ ] Global search - Navigate to result on click
- [ ] Page filters - Filter dropdowns work
- [ ] Page filters - Clear filters button works
- [ ] Page filters - Persist on navigation (if applicable)

### Navigation
- [ ] Sidebar navigation - All menu items clickable
- [ ] Sidebar collapse - Expand/collapse toggle works
- [ ] Sidebar active state - Current page highlighted
- [ ] Breadcrumbs - Show correct path
- [ ] Breadcrumbs - Navigate on click
- [ ] Mobile menu - Hamburger toggle works
- [ ] Mobile menu - Overlay dismisses on item click

---

## 4. Advanced Features

### AI Chatbot (37 actions)
- [ ] Chatbot - Opens on button click
- [ ] Chatbot - SSE streaming works
- [ ] Chatbot - Messages display correctly
- [ ] Chatbot - Action buttons clickable
- [ ] Chatbot - Anti-hallucination detection works (4 rules)
- [ ] Chatbot - "Create client" action works
- [ ] Chatbot - "Create session" action works
- [ ] Chatbot - "Create project" action works
- [ ] Chatbot - "Search" action works
- [ ] Chatbot - Response formatting (markdown, lists)
- [ ] Chatbot - Error handling (API errors)
- [ ] Chatbot - Loading state (typing indicator)
- [ ] Chatbot - Conversation history persists
- [ ] Chatbot - Clear conversation works

### Command Palette (Cmd+K)
- [ ] Palette opens - Keyboard shortcut works
- [ ] Palette search - Filters commands
- [ ] Palette navigation - Arrow keys work
- [ ] Palette execute - Enter key executes command
- [ ] Palette categories - Commands grouped correctly
- [ ] Palette recent - Recent commands shown
- [ ] Palette close - ESC key closes

### Global Search
- [ ] Search opens - From any page
- [ ] Search multi-entity - Searches across all entities
- [ ] Search results - Grouped by entity type
- [ ] Search highlight - Matches highlighted
- [ ] Search navigation - Click to navigate
- [ ] Search empty state - Shows when no results

### Audio Player (Professional)
- [ ] Player controls - Play/pause button works
- [ ] Player controls - Volume slider works
- [ ] Player controls - Seek bar works
- [ ] Player controls - Download button works
- [ ] Player waveform - Visual waveform displays (if implemented)
- [ ] Player metadata - Track info displays
- [ ] Player versioning - Switch between 4 versions (demo/rough/final/master)
- [ ] Player version comparison - Side-by-side playback works
- [ ] Player upload - New version upload works
- [ ] Player upload - Cloudinary integration works
- [ ] Player upload - Progress indicator shows
- [ ] Player error handling - Shows error if file missing

### Notification Center
- [ ] Notifications - Bell icon badge shows count
- [ ] Notifications - Panel opens on click
- [ ] Notifications - SSE stream receives updates
- [ ] Notifications - Mark as read works
- [ ] Notifications - Mark all as read works
- [ ] Notifications - Filter by type works
- [ ] Notifications - Click to navigate works
- [ ] Notifications - Real-time updates (SSE)

### Theme Toggle
- [ ] Theme switch - Dark/light toggle works
- [ ] Theme persistence - Persists on reload
- [ ] Theme application - All pages respect theme
- [ ] Theme colors - Correct colors in both modes
- [ ] Theme transitions - Smooth transition animation

### Other UX Components
- [ ] Breadcrumbs - Correct path on all pages
- [ ] Status badges - Correct colors per status
- [ ] Loading skeletons - Show during data fetch
- [ ] Delete confirmations - All delete actions protected
- [ ] Toast notifications - Success/error toasts display
- [ ] Toast notifications - Auto-dismiss after delay
- [ ] Responsive mobile - Works on mobile viewport
- [ ] Date formatting - French locale (if applicable)
- [ ] Type safety - No TypeScript errors in console

---

## 5. Client Portal (5 pages)

### Authentication
- [ ] Client login - Email/password works
- [ ] Client login - Magic link works (if implemented)
- [ ] Client login - Error messages display
- [ ] Client login - "Forgot password" link works
- [ ] Client signup - Registration form works
- [ ] Client signup - Email verification works
- [ ] Client logout - Session ends correctly

### Booking Page
- [ ] Booking - Calendar displays available slots
- [ ] Booking - Time slot selection works
- [ ] Booking - Room/service selection works
- [ ] Booking - Form validation works
- [ ] Booking - Submit creates booking
- [ ] Booking - Confirmation email sent (if implemented)

### Payments Page
- [ ] Payments - Stripe Checkout redirect works
- [ ] Payments - Payment processing works
- [ ] Payments - Success redirect works
- [ ] Payments - Error handling works
- [ ] Payments - Invoice display works
- [ ] Payments - Payment history visible

### Projects Page
- [ ] Projects - Client sees assigned projects only
- [ ] Projects - Project detail page loads
- [ ] Projects - Track list displays
- [ ] Projects - Audio player works
- [ ] Projects - Download tracks works
- [ ] Projects - Activity log visible

### Profile Page
- [ ] Profile - Client info displays
- [ ] Profile - Edit profile works
- [ ] Profile - Password change works
- [ ] Profile - Avatar upload works (if implemented)

### Activity Logs
- [ ] Activity - Recent actions visible
- [ ] Activity - Filter by type works
- [ ] Activity - Pagination works
- [ ] Activity - Device fingerprinting info visible
- [ ] Activity - Ownership verification works

---

## 6. Workflows End-to-End

### Onboarding New Studio
- [ ] Step 1: Registration - Create account
- [ ] Step 2: Organization setup - Enter studio details
- [ ] Step 3: Subscription - Select plan
- [ ] Step 4: Payment - Complete Stripe Checkout
- [ ] Step 5: Dashboard - Access dashboard
- [ ] Workflow: Complete flow <5 minutes (requirement)

### Booking Workflow
- [ ] Step 1: Client login
- [ ] Step 2: Select service/room
- [ ] Step 3: Choose date/time
- [ ] Step 4: Confirm booking
- [ ] Step 5: Payment (if required)
- [ ] Step 6: Confirmation email/SMS
- [ ] Workflow: End-to-end success

### Project Creation & Track Upload
- [ ] Step 1: Create project
- [ ] Step 2: Add client to project
- [ ] Step 3: Create track
- [ ] Step 4: Upload audio file (Cloudinary)
- [ ] Step 5: Add metadata (copyright, technical)
- [ ] Step 6: Upload version (demo → rough → final → master)
- [ ] Step 7: Share project with client
- [ ] Workflow: Complete flow works

### Billing Workflow
- [ ] Step 1: Create quote
- [ ] Step 2: Send quote to client
- [ ] Step 3: Convert quote to invoice
- [ ] Step 4: Send invoice
- [ ] Step 5: Client pays (Stripe)
- [ ] Step 6: Receipt generated
- [ ] Workflow: Complete flow works

### Contract Workflow
- [ ] Step 1: Create contract from template
- [ ] Step 2: Customize terms
- [ ] Step 3: Send to client
- [ ] Step 4: Client signs electronically
- [ ] Step 5: Track milestones
- [ ] Workflow: Complete flow works

---

## 7. Validation & Error Handling

### Form Validation
- [ ] Required fields - Error on empty submit
- [ ] Email format - Rejects invalid emails
- [ ] Phone format - Validates phone numbers (if implemented)
- [ ] Number fields - Rejects non-numeric input
- [ ] Date fields - Rejects invalid dates
- [ ] Min/max length - Enforces character limits
- [ ] Custom validation - Business rules enforced

### API Error Handling
- [ ] 401 Unauthorized - Redirect to login
- [ ] 403 Forbidden - Permission denied message
- [ ] 404 Not Found - Entity not found message
- [ ] 500 Internal Server Error - Generic error message
- [ ] Network timeout - Retry or error message
- [ ] Rate limiting - 429 Too Many Requests handled

### Network Errors
- [ ] Offline mode - Detect network loss
- [ ] Retry logic - Auto-retry failed requests
- [ ] Error boundaries - Catch React errors
- [ ] Fallback UI - Show fallback on crash

### Empty States
- [ ] Empty lists - "No items" message displays
- [ ] Empty search - "No results" message displays
- [ ] Empty dashboard - Onboarding hints visible

### Loading States
- [ ] Page loading - Skeleton loaders show
- [ ] Button loading - Spinner shows during action
- [ ] Table loading - Loading indicator in table
- [ ] Lazy loading - Components load on demand

---

## 8. Edge Cases

### Data Volume
- [ ] Large lists - Pagination handles >100 items
- [ ] Long names - Text truncates with ellipsis
- [ ] Long descriptions - Textarea scrolls or truncates

### Special Characters
- [ ] Emojis in text - Display correctly
- [ ] Accents in text - Display correctly (é, à, ç)
- [ ] Special chars - Quotes, apostrophes handled

### Date/Time Edge Cases
- [ ] Past dates - Validation rejects (if applicable)
- [ ] Future dates - Accepted where appropriate
- [ ] Date ranges - Start before end validation
- [ ] Timezone handling - Correct timezone display

### Permissions
- [ ] Access denied - 403 error on unauthorized access
- [ ] Read-only mode - Edit buttons hidden/disabled
- [ ] Admin-only features - Hidden for non-admins

### Concurrent Modifications
- [ ] Optimistic updates - UI updates immediately
- [ ] Conflict resolution - Shows error if stale data
- [ ] Real-time sync - SSE updates other sessions (if implemented)

---

## Summary Statistics

**Total Test Items: ~600+**

**By Category:**
- Admin Pages: ~150 items
- CRUD Operations: 132 items (11 entities × 12 tests each)
- UI Interactions: ~200 items
- Advanced Features: ~50 items
- Client Portal: ~30 items
- Workflows: ~30 items
- Validation & Errors: ~30 items
- Edge Cases: ~20 items

**Phase 3.2 Coverage (Already Tested):**
- Navigation: 47 pages load without error ✅
- Critical workflows: 5 workflows ✅
- Advanced features: 13 features ✅
- Auth flows: 7 tests ✅
- Infrastructure: 6 tests ✅

**Phase 3.4 Focus (To Be Tested):**
- CRUD operations: 132 items
- UI interactions: ~200 items
- Client Portal: ~30 items
- Validation & edge cases: ~50 items

**Total New Tests in Phase 3.4: ~410 items**

---

## Testing Approach Recommendation

**Suggested Hybrid Approach:**

1. **MCP Chrome DevTools** (Interactive testing)
   - UI interactions (buttons, modals, forms)
   - Client Portal workflows
   - Visual verification
   - Console error detection

2. **Automated Playwright** (Repeatable tests)
   - CRUD operations
   - End-to-end workflows
   - Regression testing
   - CI/CD integration

3. **Manual Testing** (UX quality)
   - Audio playback quality
   - Theme toggle smoothness
   - Mobile responsiveness
   - Accessibility

**Estimated Testing Time:**
- MCP Chrome DevTools: ~4-6 hours (410 items × ~1 min each)
- Automated Playwright: ~2-3 hours (write tests for CRUD)
- Manual UX testing: ~1-2 hours

**Total: ~8-10 hours** for comprehensive site testing
