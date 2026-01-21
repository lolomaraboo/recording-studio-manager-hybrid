# Debug Session: Client Edit Save 500 Error

**Date:** 2026-01-21
**Status:** ✅ RESOLVED
**Phase:** 26.1
**Commit:** e312a28

## Symptoms

- **URL:** http://localhost:5174/clients/4?edit=true
- **Trigger:** Clicking "Enregistrer les modifications" button
- **Error:** 500 Internal Server Error on `clients.update` mutation
- **User Impact:** Cannot save client modifications

## Investigation Timeline

### 1. Initial Hypothesis (Incorrect)
- Thought phone number format corruption ("x" being removed)
- User clarified they manually changed "x" - real issue is 500 error

### 2. Server Logs Analysis
Found tRPC error in server logs:
```
Failed query: update "clients" set ... where "clients"."id" = $52
PostgresError: invalid input syntax for type date: ""
where: unnamed portal parameter $26 = ''
```

### 3. Field Filtering Attempt
Added filtering to remove invalid fields:
- `id` (redundant, already in WHERE)
- `userId` (should be `user_id`)
- `createdAt`, `updatedAt` (read-only)
- `clientNotes` (relation, not a column)

Result: Still failed with same error

### 4. Debug Logging
Added detailed logging to capture full PostgreSQL error:
```typescript
console.log('[Client Update Debug] Filtered data:', JSON.stringify(validData, null, 2));
console.error('[Client Update Error] Full error:', error);
```

### 5. Root Cause Identified
PostgreSQL error revealed:
```
invalid input syntax for type date: ""
where: unnamed portal parameter $26 = ''
```

Looking at filtered data:
```json
"birthday": "",
```

**Root Cause:**
- Frontend `sanitizeFormData()` converts `null` → `""` (empty string)
- PostgreSQL `date` columns reject empty strings
- Must be either `null` or valid date string

## Solution

### Code Change
**File:** `packages/server/src/routers/clients.ts`

Added conversion before UPDATE query:
```typescript
// Convert empty strings to null for date fields (PostgreSQL requirement)
if (validData.birthday === '') {
  validData.birthday = null;
}
```

### Why This Works
1. Frontend sends `birthday: ""`
2. Backend converts `"" → null`
3. PostgreSQL accepts `null` for date columns
4. Update succeeds

## Verification

**Server Logs After Fix:**
```json
"birthday": null,
```

**Frontend Behavior:**
1. Clicked "Enregistrer les modifications"
2. No error in server logs
3. Frontend made `clients.get` request (successful refetch)
4. Page exited edit mode
5. URL changed from `?edit=true` to clean URL

## Related Issues

### Pattern: sanitizeFormData null conversion
**Location:** `packages/client/src/pages/ClientDetail.tsx` (lines 112-130)

This function recursively converts `null → ""` for all fields to prevent backend validation errors. However, this creates issues for PostgreSQL date columns.

**Alternative Solutions Considered:**
1. ❌ Remove sanitizeFormData - would break backend validation
2. ❌ Change sanitizeFormData to skip date fields - harder to maintain
3. ✅ Backend converts empty strings back to null for date fields - simpler, backend controls data type

## Future Improvements

### Short-term
- Consider adding same conversion for other date fields if added to schema

### Long-term
- Type-aware sanitization that preserves `null` for date fields
- Backend validation schema that accepts empty strings for optional date fields
- Frontend DatePicker component that sends `null` instead of `""`

## Lessons Learned

1. **Always check PostgreSQL errors directly** - The error message `invalid input syntax for type date: ""` immediately revealed the issue
2. **Frontend/backend data type mismatch** - Empty strings vs null values need careful handling
3. **Debug logging is essential** - Seeing the actual filtered data showed `"birthday": ""` clearly
4. **Backend is the right place for data type conversion** - Backend controls database schema and should normalize data types

## Files Modified

- `packages/server/src/routers/clients.ts` (lines 449-463)

## Commit

```
fix(26.1): convert empty strings to null for birthday field in client update

- Root cause: Frontend sanitizeFormData converts null → empty string
- PostgreSQL date columns reject empty strings
- Fix: Convert birthday === '' to null before UPDATE query
- Resolves 500 error when saving client modifications

Commit: e312a28
```
