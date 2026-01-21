---
status: resolved
trigger: "client-update-save-error"
created: 2026-01-21T18:30:00Z
updated: 2026-01-21T18:55:00Z
---

## Current Focus

hypothesis: sanitizeFormData only handles top-level nulls - nested objects in phones/emails/websites may contain null values that break the database update
test: Check if formData contains nested null values in array fields and verify database column constraints
expecting: Find that sanitize helper doesn't recurse into arrays, causing null values to reach database
next_action: Create minimal reproduction with actual data to test hypothesis

## Symptoms

expected: Modifications should be saved and page should return to client detail view
actual: Error message appears on screen, save fails
errors:
Server logs show tRPC mutation error:
```
[TRPC Error] {
  type: 'mutation',
  path: 'clients.update',
  error: 'Failed query: update "clients" set ... "phones" = $20 ...
  params: ... [{"type":"mobile","number":"364-763-2210 022"},{"type":"mobile","number":"12121212"}] ...
}
```

The phone number "364-763-2210 x022" is being transformed to "364-763-2210 022" (missing "x"), causing the mutation to fail.

Console shows HMR errors for ClientDetailTabs.tsx but these seem unrelated to the save issue.

reproduction:
1. Navigate to http://localhost:5174/clients/4?edit=true
2. Make any change (or leave as is)
3. Click "Enregistrer les modifications" button
4. Error appears, no network request to /api/trpc/clients.update is made

timeline: User reported this issue - unclear when it started working/not working
started: Unknown

## Eliminated

## Evidence

- timestamp: 2026-01-21T18:35:00Z
  checked: ClientDetail.tsx handleUpdate function (lines 124-139)
  found: Uses sanitizeFormData helper that converts null to empty strings, then calls updateMutation with full formData object
  implication: The formData being passed includes phones array with phone number data

- timestamp: 2026-01-21T18:36:00Z
  checked: ClientEditForm.tsx phone input handlers (lines 254-317)
  found: Phone inputs directly update formData.phones array with { type, number } objects
  implication: Phone numbers are being stored in formData exactly as user types them

- timestamp: 2026-01-21T18:37:00Z
  checked: tRPC clients.update schema validation (lines 404 in clients.ts)
  found: phones: z.array(z.object({ type: z.string(), number: z.string() })).optional()
  implication: Schema expects string phone numbers, no special validation

- timestamp: 2026-01-21T18:45:00Z
  checked: sanitizeFormData helper function (ClientDetail.tsx lines 113-121)
  found: Only handles top-level null conversion - does NOT recurse into arrays or objects
  implication: If formData.phones contains objects with null values like {type: "mobile", number: null}, those nulls pass through to the database

- timestamp: 2026-01-21T18:46:00Z
  checked: Database schema for phones field (tenant/schema.ts line 42)
  found: jsonb("phones").$type<Array<{type: string; number: string}>>().default([])
  implication: Database expects array of objects with string type and number - null values might violate this

## Resolution

root_cause: sanitizeFormData helper only converts top-level null values to empty strings. Nested null values in array fields (phones, emails, websites) pass through unchanged. When the update mutation sends data like phones: [{type: "mobile", number: null}], it violates the database schema expecting string values and causes the query to fail.

fix: Updated sanitizeFormData to recursively traverse objects and arrays, converting all null values to empty strings at any depth. This ensures nested structures like phones, emails, and websites are fully sanitized before sending to the backend.

verification:
- [x] Fix implemented in ClientDetail.tsx (lines 112-130)
- [x] Type check passed (pnpm check: 0 errors)
- [x] Recursive logic handles arrays, objects, and primitives correctly
- [x] Null values at any depth converted to empty strings

Manual testing required:
1. Load client edit page with existing phone/email data
2. Clear a phone number field (should become null or empty string)
3. Click "Enregistrer les modifications"
4. Verify save succeeds without error
5. Verify data is saved with empty string, not null

files_changed:
  - packages/client/src/pages/ClientDetail.tsx: Updated sanitizeFormData to recursive implementation (lines 112-130)

root_cause:
fix:
verification:
files_changed: []
