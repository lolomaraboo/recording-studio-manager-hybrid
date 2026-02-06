---
phase: quick
plan: 002
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true

must_haves:
  truths:
    - "Client 'Studio Test Artist' exists in system"
    - "Project created and linked to client"
    - "Session scheduled and linked to project"
    - "Timer can start/stop for Recording/Mixing/Mastering tasks"
    - "Invoice auto-generated from timed tasks"
  artifacts: []
  key_links:
    - from: "Client"
      to: "Project"
      via: "clientId foreign key"
    - from: "Session"
      to: "Project"
      via: "projectId foreign key"
    - from: "TimeEntry"
      to: "Invoice"
      via: "invoice generation service"
---

<objective>
E2E Browser Test: Complete studio workflow from client creation to automatic invoicing

Purpose: Validate Phases 12-17 features work end-to-end via Chrome browser automation
Output: Confirmed workflow functionality or documented issues
</objective>

<context>
@.planning/phases/12-tasks-chrono-timer-database/12-01-SUMMARY.md
@.planning/phases/13-tasks-chronometrees-ui/13-01-SUMMARY.md
@.planning/phases/16-facturation-automatique-backend/16-01-SUMMARY.md

**App URLs:**
- Base: http://localhost:5174
- Clients: /clients, /clients/new
- Projects: /projects, /projects/new
- Sessions: /sessions, /sessions/new
- Task Types: /task-types
- Invoices: /invoices

**Chrome Extension:** Connected (tabId: 452141854)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create Client "Studio Test Artist"</name>
  <files>N/A (browser automation)</files>
  <action>
Use Chrome browser automation tools to create a new client:

1. Navigate to http://localhost:5174/clients/new (if not already there)
2. Fill the client creation form:
   - Type: Individual (artist)
   - First Name: Studio
   - Last Name: Test Artist
   - Email: studio.test.artist@example.com
   - Phone: +33 6 12 34 56 78
3. Submit the form
4. Verify redirect to client list or detail page
5. Note the created client ID from URL or page content

**Tools to use:**
- mcp__claude-in-chrome__get_page_content (to read form structure)
- mcp__claude-in-chrome__execute_browser_action (to fill and submit)
- mcp__claude-in-chrome__navigate_to (if navigation needed)
  </action>
  <verify>Client "Studio Test Artist" visible in /clients list with email displayed</verify>
  <done>Client created successfully, ID captured for next tasks</done>
</task>

<task type="auto">
  <name>Task 2: Create Project and Schedule Session</name>
  <files>N/A (browser automation)</files>
  <action>
Create a project linked to the client, then schedule a session:

**Project Creation:**
1. Navigate to http://localhost:5174/projects/new
2. Fill project form:
   - Name: "Album Test E2E"
   - Client: Select "Studio Test Artist" from dropdown
   - Description: "Test project for E2E validation"
   - Status: In Progress
3. Submit and capture project ID

**Session Creation:**
1. Navigate to http://localhost:5174/sessions/new
2. Fill session form:
   - Name: "Recording Session E2E"
   - Project: Select "Album Test E2E"
   - Room: Select first available room
   - Date: Today
   - Start Time: Current time + 1 hour
   - Duration: 2 hours
3. Submit and capture session ID

**Tools to use:**
- mcp__claude-in-chrome__navigate_to
- mcp__claude-in-chrome__get_page_content
- mcp__claude-in-chrome__execute_browser_action
  </action>
  <verify>Project and Session visible in their respective lists, linked together</verify>
  <done>Project "Album Test E2E" and Session "Recording Session E2E" created and linked</done>
</task>

<task type="auto">
  <name>Task 3: Execute Timer Workflow (Recording/Mixing)</name>
  <files>N/A (browser automation)</files>
  <action>
Test the time tracking workflow on the session:

1. Navigate to session detail page: /sessions/{sessionId}
2. Locate the ActiveTimer widget component
3. Test Recording task:
   - Select task type "Recording" from dropdown
   - Click Start button
   - Wait 5-10 seconds (observe timer counting)
   - Click Stop button
   - Verify time entry appears in TimeHistory table
4. Test Mixing task:
   - Select task type "Mixing" from dropdown
   - Click Start button
   - Wait 5-10 seconds
   - Click Stop button
   - Verify second time entry appears

**Expected UI elements (from Phase 13-01):**
- ActiveTimer: Live HH:MM:SS display, task type selector, Start/Stop buttons
- TimeHistory: Table with columns (task type, start, end, duration, cost, notes)
- Green border when timer running, gray when stopped

**Note:** If task types don't exist, first navigate to /task-types and create them
  </action>
  <verify>Two time entries visible in TimeHistory table (Recording + Mixing) with calculated costs</verify>
  <done>Timer start/stop working, time entries recorded with hourly rate calculations</done>
</task>

<task type="auto">
  <name>Task 4: Verify Invoice Auto-Generation</name>
  <files>N/A (browser automation)</files>
  <action>
Test automatic invoice generation from time entries:

1. Navigate to /invoices or look for "Generate Invoice" button on session page
2. If generate button exists on session:
   - Click "Generate Invoice from Time Entries"
   - Verify modal/confirmation appears
   - Confirm generation
3. If manual navigation needed:
   - Go to /invoices/new
   - Look for "Generate from Time Entries" option
   - Select the session/project with time entries
   - Generate invoice

**Expected invoice content (from Phase 16-01):**
- Line items grouped by task type
- Format: "{TaskType} - {hours}h{minutes} @ {rate}EUR/h = {total}"
- Invoice number format: INV-YYYY-NNNN

4. Navigate to /invoices list
5. Verify new invoice appears with:
   - Client: Studio Test Artist
   - Status: Draft or Pending
   - Total calculated from time entries
  </action>
  <verify>Invoice created with line items matching time entries, correct totals</verify>
  <done>Automatic invoice generation working, line items correctly calculated from timer data</done>
</task>

</tasks>

<verification>
After completing all tasks:
1. Client "Studio Test Artist" exists in /clients
2. Project "Album Test E2E" linked to client
3. Session "Recording Session E2E" linked to project
4. Time entries recorded with Recording and Mixing task types
5. Invoice generated with correct line items and totals
6. All Phase 12-17 features validated end-to-end
</verification>

<success_criteria>
- All 4 tasks complete without blocking errors
- Timer UI functional (start/stop/history)
- Invoice auto-generation produces correct calculations
- Full client->project->session->timer->invoice workflow validated
</success_criteria>

<output>
After completion, document results in STATE.md quick tasks section:
- Workflow steps completed
- Any issues encountered
- Features confirmed working
- Bugs discovered (if any)
</output>
