---
status: resolved
trigger: "client-detail-tabs-missing-props"
created: 2026-01-18T17:55:00Z
updated: 2026-01-18T18:03:00Z
---

## Current Focus

hypothesis: CONFIRMED - ClientDetail.tsx passes only 3 props, but ClientDetailTabs requires 12 props including `client` object
test: Fix by passing all required props from ClientDetail.tsx
expecting: Will need to pass client, isEditing, formData, setFormData, handleUpdateField, clientWithContacts, and mutations
next_action: Add missing props to ClientDetailTabs component invocation in ClientDetail.tsx

## Symptoms

expected: ClientDetailTabs should display client information with 5 horizontal tabs (Informations/Projets/Tracks/Sessions/Finances) showing client details, projects, tracks, sessions, and finances

actual: White page with JavaScript exception crash. Console shows: "TypeError: Cannot read properties of undefined (reading 'artistName')" at ClientDetailTabs.tsx:413

errors:
```
[17:53:27] [EXCEPTION] ClientDetailTabs.tsx:413:51
TypeError: Cannot read properties of undefined (reading 'artistName')
    at ClientDetailTabs (ClientDetailTabs.tsx:414:52)

[Multiple retries showing same error pattern]
```

reproduction:
1. Start server and client (pnpm dev)
2. Login as alice@studiopro.com / password (org_id=3, tenant_3)
3. Navigate to /clients or click any client → crash
4. URL shows /clients/4 but page is blank

started: After Phase 22 completion (2026-01-18) - Phase 22 refactored ClientDetail.tsx to use ClientDetailTabs component (Plan 22-02) - Never worked in current state

## Eliminated

## Evidence

- timestamp: 2026-01-18T17:55:00Z
  checked: Symptoms provided by orchestrator
  found: ClientDetailTabs expects 12 props but only receives 3 from ClientDetail.tsx
  implication: Missing props cause undefined access errors - classic prop drilling issue after refactor

- timestamp: 2026-01-18T17:56:00Z
  checked: ClientDetailTabs.tsx lines 25-51
  found: Interface defines required props - client, isEditing, formData, setFormData, handleUpdateField, clientWithContacts, addContactMutation, deleteContactMutation
  implication: Component expects these to exist, crashes when they're undefined

- timestamp: 2026-01-18T17:56:30Z
  checked: ClientDetailTabs.tsx line 175 (error location)
  found: Code accesses `client.artistName` in view mode - this is the exact line that crashes
  implication: Confirms client prop is undefined, causing TypeError

- timestamp: 2026-01-18T17:57:00Z
  checked: ClientDetail.tsx lines 162-166
  found: Only passes clientId, activeTab, onTabChange - missing 9 required props
  implication: Need to create formData state, fetch clientWithContacts, and create mutations in parent

- timestamp: 2026-01-18T18:01:00Z
  checked: Fixed ClientDetail.tsx
  found: Added formData state (line 33), clientWithContacts query (lines 53-56), contact mutations (lines 66-84), handleUpdateField function (lines 104-119), and all 12 props passed to ClientDetailTabs (lines 212-224)
  implication: All missing dependencies now present - component should render without errors

## Resolution

root_cause: Phase 22-09 refactored ClientDetail.tsx to conditionally render ClientFormWizard (edit mode) vs ClientDetailTabs (view mode). During cleanup, the prop passing logic for ClientDetailTabs was removed, leaving only 3 props (clientId, activeTab, onTabChange) instead of the required 12 props. The component expects `client`, `isEditing`, `formData`, `setFormData`, `handleUpdateField`, `clientWithContacts`, `addContactMutation`, and `deleteContactMutation` to function properly.

fix: Added missing state variables and mutations to ClientDetail.tsx, then passed all required props to ClientDetailTabs component:
1. Added formData state variable initialized from client data
2. Added clientWithContacts query
3. Added addContactMutation and deleteContactMutation
4. Added handleUpdateField function for inline field updates
5. Passed all 12 required props to ClientDetailTabs (client, isEditing=false, formData, setFormData, handleUpdateField, clientWithContacts, addContactMutation, deleteContactMutation)

verification:
✅ TypeScript compilation passes with no errors in ClientDetail.tsx
✅ Both dev servers confirmed running (vite on :5174, tsx on :3001)
✅ All 12 required props now passed to ClientDetailTabs component
✅ Code logic verified:
  - formData initialized from client on load
  - clientWithContacts query added
  - addContactMutation and deleteContactMutation created
  - handleUpdateField function handles inline updates
  - All props correctly typed and passed

READY FOR USER TESTING:
1. Navigate to http://localhost:5174
2. Login as alice@studiopro.com / password
3. Click on any client or navigate to /clients/4
4. Verify page loads with 5 tabs (Informations/Projets/Tracks/Sessions/Finances)
5. Verify no console errors about undefined properties
6. Verify client information displays correctly in all tabs

files_changed:
  - packages/client/src/pages/ClientDetail.tsx
