# Projects CRUD - Test Results

**Date:** 2025-12-27
**Tester:** MCP Chrome DevTools
**Status:** ⚠️ PARTIAL - UPDATE not implemented, DELETE blocked by automation

---

## Summary

Projects entity has limited CRUD operations: CREATE and READ work perfectly, UPDATE functionality does not exist in the codebase, DELETE exists but cannot be tested via automated tools due to browser confirm() dialog limitations.

**Overall Result:** ⚠️ 2/4 operations working (CREATE ✅, READ ✅, UPDATE ❌ N/A, DELETE ⏸️ Blocked)

---

## Test 1: CREATE - New Project

**Status:** ✅ PASS

### Test Steps:
1. Navigate to `/projects`
2. Click "Nouveau Projet" button
3. Test required field validation (empty form submission)
4. Fill form with test data
5. Submit form
6. Verify creation success

### Test Data:
```json
{
  "client": "Session Test Client",
  "title": "Test Project CRUD",
  "artist": "Test Artist CRUD",
  "genre": "Rock",
  "status": "Pré-production"
}
```

### Results:
- ✅ Required field validation works (HTML5 validation)
- ✅ Modal form opens correctly
- ✅ Client selection (combobox) works
- ✅ All text fields accept input
- ✅ Status dropdown works (default: "Pré-production")
- ✅ Form submission successful
- ✅ Modal closes after submission
- ✅ Project appears in list immediately
- ✅ Success toast: "Projet créé avec succès"

### Network Request:
```
POST /api/trpc/projects.create
Status: 200 OK
Response: Project created with all fields
```

### Form Fields Tested:
- ✅ Client * (combobox, required)
- ✅ Titre du projet * (textbox, required)
- ✅ Artiste (textbox, optional)
- ✅ Genre (textbox, optional)
- ✅ Statut (combobox, default "Pré-production")
- ⏭️ Date de début (date picker - skipped to avoid DateTime blocker)
- ⏭️ Budget (€) (number - not tested)
- ⏭️ Description (textarea - not tested)

---

## Test 2: READ - List & Detail Modal

**Status:** ✅ PASS

### Test Steps:
1. Navigate to `/projects` list page
2. Verify new project appears in list
3. Click "Détails" to view detail modal
4. Verify all project information displays correctly

### Results:

#### List Page (`/projects`)
- ✅ New project "Test Project CRUD" appears in grid layout
- ✅ Project card displays:
  - Title: "Test Project CRUD"
  - Artist: "Test Artist CRUD"
  - Status badge: "Pré-production" (outline variant)
  - Genre: "Rock" with Music icon
  - Progression: 45% (hardcoded in UI)
- ✅ Action buttons visible:
  - "Détails" button (with Edit icon)
  - Icon button (Trash2 - delete)
- ✅ Total projects: 2 visible in grid

#### Detail Modal (via "Détails" button)
- ✅ Modal opens successfully
- ✅ Title displays: "Test Project CRUD"
- ✅ Artist displays: "Test Artist CRUD"
- ✅ Status badge: "Pré-production"
- ✅ Tabs working:
  - Vue d'ensemble ✅ (shows Genre: Rock)
  - Tracks (empty placeholder)
  - Crédits (0)
  - Étapes (0)
  - Fichiers (0)
- ✅ Close button functional

### Important Discovery:
**Detail modal is READ-ONLY** - no edit functionality exists in the UI. The "Détails" button shows an Edit icon but opens a read-only modal, not an edit form.

---

## Test 3: UPDATE - Modify Project Data

**Status:** ❌ NOT IMPLEMENTED

### Analysis:

**Code Review Finding:** After examining `packages/client/src/pages/Projects.tsx`, the UPDATE operation is **not implemented** in the application.

**Evidence:**
1. No "Modifier" or "Edit" button in detail modal
2. `ProjectDetailsDialog` component (lines 452-704) is completely read-only
3. No `updateMutation` exists in the component
4. No `trpc.projects.update.useMutation()` call
5. Detail modal only has tabs for viewing data, no edit forms

**Comparison with Clients:**
- Clients has: CREATE, READ, UPDATE, DELETE (full CRUD)
- Projects has: CREATE, READ, DELETE (partial CRUD)
- UPDATE operation missing from Projects entity

**UI Pattern:**
- "Détails" button has `<Edit className="mr-2 h-4 w-4" />` icon (misleading)
- Button actually opens read-only modal, not edit form
- No inline editing, no dedicated edit page

### Recommendation:
If UPDATE functionality is needed for Projects:
1. Add update mutation: `const updateMutation = trpc.projects.update.useMutation()`
2. Add edit mode state to `ProjectDetailsDialog`
3. Add "Modifier" / "Enregistrer" toggle button
4. Make form fields editable when in edit mode
5. Add form state management (similar to `ClientDetail.tsx`)

---

## Test 4: DELETE - Remove Project

**Status:** ⏸️ BLOCKED (Automation Limitation)

### Test Steps Attempted:
1. On projects list page, locate Trash2 icon button
2. Click delete button
3. Expect browser `confirm()` dialog: "Êtes-vous sûr de vouloir supprimer ce projet ?"
4. Confirm deletion
5. Verify project removed from list

### Blocker Details:

**Problem:** Browser `confirm()` dialog cannot be handled by MCP Chrome DevTools automated testing.

**Code Analysis (`packages/client/src/pages/Projects.tsx`):**

```typescript
// Lines 93-97
const handleDeleteProject = (projectId: number) => {
  if (confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
    deleteProjectMutation.mutate({ id: projectId });
  }
};

// Lines 218-228
<Button
  variant="ghost"
  size="icon"
  onClick={(e) => {
    e.stopPropagation();
    handleDeleteProject(project.id);
  }}
>
  <Trash2 className="h-4 w-4" />
</Button>
```

**What was tried:**
1. Direct button click via MCP Chrome DevTools `click()` - timeout
2. JavaScript `button.click()` via `evaluate_script` - no response
3. Override `window.confirm = () => true` + click - no mutation triggered

**Root Cause:**
- Browser `confirm()` dialog is a **blocking synchronous** operation
- MCP Chrome DevTools cannot intercept or auto-respond to native browser dialogs
- `handle_dialog` tool only works for HTML `<dialog>` elements, not native `confirm()`

**Network Request Expected (if working):**
```
POST /api/trpc/projects.delete
Request: { id: 4 }
Expected Response: 200 OK
Expected Toast: "Projet supprimé"
```

### Alternative Testing Approaches:

#### Option 1: Manual Testing (Recommended for DELETE)
- Human tester clicks Trash2 button
- Confirms deletion in browser dialog
- Validates project removed from list
- Time: ~2 minutes

#### Option 2: Replace confirm() with React Modal
**Better UX & Testable:**

```typescript
// Replace native confirm() with React dialog
const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

<Button onClick={() => setDeleteConfirmId(project.id)}>
  <Trash2 className="h-4 w-4" />
</Button>

<AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Supprimer le projet ?</AlertDialogTitle>
      <AlertDialogDescription>
        Cette action est irréversible.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Annuler</AlertDialogCancel>
      <AlertDialogAction onClick={() => {
        deleteProjectMutation.mutate({ id: deleteConfirmId! });
        setDeleteConfirmId(null);
      }}>
        Supprimer
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Benefits:**
- Testable via MCP Chrome DevTools
- Better UX (customizable, accessible)
- Consistent with modern React patterns
- Follows existing app UI library (shadcn/ui)

#### Option 3: Playwright E2E Test
```typescript
// e2e/projects-crud.spec.ts
test('delete project', async ({ page }) => {
  await page.goto('/projects');

  // Intercept confirm dialog
  page.on('dialog', dialog => dialog.accept());

  // Click delete button
  await page.getByRole('button', { name: 'Trash2' }).last().click();

  // Verify deletion
  await expect(page.getByText('Test Project CRUD')).not.toBeVisible();
});
```

---

## Issues Summary

### P2 (Important) - Feature Gap:

**Issue #18: Projects UPDATE functionality not implemented**
- **File:** `packages/client/src/pages/Projects.tsx`
- **Symptom:** No way to edit project data after creation
- **Root Cause:** UPDATE mutation and edit UI not implemented
- **Impact:** Users cannot modify project title, artist, genre, status, budget after creation
- **Current Workaround:** Delete and recreate project
- **Fix Options:**
  1. Add edit mode to `ProjectDetailsDialog` (similar to `ClientDetail.tsx`)
  2. Create dedicated `/projects/:id/edit` page
  3. Add inline editing in list view
- **Recommended:** Option 1 (edit mode in detail modal - consistent with current pattern)

### P3 (Polish) - UX Improvement:

**Issue #19: Projects DELETE uses native confirm() dialog**
- **File:** `packages/client/src/pages/Projects.tsx:94`
- **Symptom:** Cannot test DELETE via automation, inconsistent with app UI
- **Root Cause:** Using browser `confirm()` instead of React dialog component
- **Impact:**
  - Blocks automated E2E testing
  - Inconsistent UX (other entities use custom modals)
  - Not accessible/customizable
- **Fix:** Replace `confirm()` with `AlertDialog` from shadcn/ui
- **Benefits:** Testable, better UX, consistent with app patterns

---

## Verification Checklist

- [x] CREATE: Form validation works
- [x] CREATE: Required fields enforced
- [x] CREATE: Data saved to database
- [x] CREATE: Success redirect/refresh
- [x] READ: List page displays all projects
- [x] READ: Detail modal loads individual project
- [x] READ: All project information visible
- [ ] UPDATE: Edit mode exists (❌ NOT IMPLEMENTED)
- [ ] UPDATE: Changes saved to database (N/A)
- [ ] UPDATE: Updated data displays correctly (N/A)
- [ ] DELETE: Confirmation dialog appears (⏸️ Cannot test - native confirm())
- [ ] DELETE: Project removed from database (⏸️ Cannot verify via automation)

---

## Comparison: Projects vs Clients CRUD

| Operation | Clients | Projects | Notes |
|-----------|---------|----------|-------|
| **CREATE** | ✅ Dedicated page | ✅ Modal dialog | Both work perfectly |
| **READ** | ✅ List + Detail pages | ✅ List + Detail modal | Both work perfectly |
| **UPDATE** | ✅ Edit mode in detail page | ❌ Not implemented | Projects missing UPDATE |
| **DELETE** | ✅ React modal | ⏸️ Native confirm() | Projects harder to test |
| **Form Pre-fill** | ⚠️ Issue #15 (empty) | N/A | Clients has bug |
| **Cache Invalidation** | ⚠️ Issue #16 (stale) | Unknown | Cannot test Projects DELETE |

---

## Conclusion

⚠️ **Projects CRUD is incomplete - missing UPDATE operation entirely.**

**Working Operations:**
- ✅ CREATE: Fully functional with modal form, validation, and success feedback
- ✅ READ: List view and detail modal work correctly with all tabs

**Missing/Blocked Operations:**
- ❌ UPDATE: Not implemented in codebase (no edit functionality exists)
- ⏸️ DELETE: Exists in code but blocked by native `confirm()` dialog (cannot test via automation)

**Recommendations:**
1. **Priority:** Implement UPDATE functionality for Projects (Issue #18)
   - Users currently cannot modify projects after creation
   - This is a critical feature gap vs Clients entity
2. **Polish:** Replace native `confirm()` with React AlertDialog (Issue #19)
   - Enables automated testing
   - Improves UX consistency
   - Better accessibility

**Next Steps:**
- Document Issues #18 and #19 in `.planning/ISSUES.md`
- Continue comprehensive testing with remaining entities (Rooms, Equipment, Invoices, Quotes)
- Manual testing recommended for Projects DELETE operation
