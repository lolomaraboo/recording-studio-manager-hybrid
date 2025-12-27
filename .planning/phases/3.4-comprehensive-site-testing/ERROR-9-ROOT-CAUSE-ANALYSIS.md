# Error #9 Root Cause Analysis: Projects UPDATE Empty String Issue

## Problem Statement

**Bug:** Updating a project with empty budget/totalCost fields causes 500 Internal Server Error

**Test Evidence:**
- Request body: `{"budget":"", "totalCost":""}`
- Database error: `Failed query: update "projects" set ... budget = $7, total_cost = $8 ...`
- SQL params show empty strings being passed: `,,,`
- PostgreSQL cannot cast empty string `''` to `numeric(10,2)` type

## Database Schema Verification

```sql
Column      | Type           | Nullable
------------|----------------|----------
budget      | numeric(10,2)  | YES (allows NULL)
total_cost  | numeric(10,2)  | YES (allows NULL)
```

**Conclusion:** Database schema IS correct - columns allow NULL values.

## Attempted Fix #1: Backend Transformation (FAILED)

### What Was Implemented

File: `packages/server/src/routers/projects.ts` (lines 113-138)

```typescript
.mutation(async ({ ctx, input }) => {
  const tenantDb = await ctx.getTenantDb();
  const { id, ...updateData } = input;

  // Transform empty strings to null for numeric fields
  const sanitizedData = {
    ...updateData,
    budget: updateData.budget === '' ? null : updateData.budget,
    totalCost: updateData.totalCost === '' ? null : updateData.totalCost,
  };

  const updated = await tenantDb
    .update(projects)
    .set(sanitizedData)  // ❌ NULL values not working
    .where(eq(projects.id, id))
    .returning();
```

### Why It Failed

**Root Cause:** Drizzle ORM's `.set()` method appears to handle `null` values incorrectly when the Zod schema defines fields as `z.string().optional()`.

**Evidence:**
1. Network request shows: `"budget":"", "totalCost":""`
2. Transformation code creates: `{budget: null, totalCost: null}`
3. SQL query STILL receives empty strings: params show `,,,`
4. This suggests Drizzle is either:
   - Ignoring NULL values in the update object
   - Converting NULL back to empty strings
   - Or the Zod schema is rejecting NULL before it reaches the mutation

### Zod Schema Analysis

Current schema (lines 92-111):
```typescript
update: protectedProcedure
  .input(
    z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      ...
      budget: z.string().optional(),        // ❌ Accepts "", not NULL
      totalCost: z.string().optional(),     // ❌ Accepts "", not NULL
      ...
    })
  )
```

**The Issue:**
- Frontend sends `""` (empty string) for empty fields
- Zod schema accepts `z.string().optional()` which allows `""` to pass validation
- By the time we reach the mutation handler, input already has `budget: ""`
- Our transformation `budget === '' ? null : budget` creates `null`
- But Drizzle might be re-validating against the schema or ignoring undefined/null keys

## Root Cause: Multiple Issues

1. **Frontend Issue:** Sends `""` instead of `undefined` for empty numeric fields
2. **Zod Schema Issue:** Accepts empty strings for numeric fields (`z.string()` instead of `z.coerce.number().nullable()`)
3. **Drizzle Behavior:** `.set()` with `null` values not working as expected for string-typed schema fields

## Correct Solutions (In Order of Preference)

### Solution 1: Fix Zod Schema (RECOMMENDED)

Change the input schema to handle numeric fields properly:

```typescript
// packages/server/src/routers/projects.ts lines 106-107
budget: z.string().optional()
  .transform(val => val === '' || val === undefined ? null : val)
  .pipe(z.coerce.number().nullable().optional()),
totalCost: z.string().optional()
  .transform(val => val === '' || val === undefined ? null : val)
  .pipe(z.coerce.number().nullable().optional()),
```

**Why this works:**
- Accepts empty strings from frontend
- Transforms to NULL before validation
- Coerces to number type for database
- Drizzle receives proper NULL values

### Solution 2: Fix Frontend (CLEANER)

Change frontend to not send empty strings:

```typescript
// packages/client/src/pages/ProjectDetail.tsx
const handleSave = () => {
  updateMutation.mutate({
    id: Number(id),
    name: formData.name,
    ...
    budget: formData.budget === '' ? undefined : formData.budget,
    totalCost: formData.totalCost === '' ? undefined : formData.totalCost,
    ...
  });
};
```

**Why this works:**
- Backend receives `undefined` for empty fields
- Zod `.optional()` allows `undefined`
- Drizzle skips undefined fields in UPDATE (doesn't touch column)
- Or combine with Zod transformation for explicit NULL

### Solution 3: Use SQL Literal for NULL

If Drizzle doesn't handle NULL properly, use SQL literal:

```typescript
import { sql } from 'drizzle-orm';

const sanitizedData = {
  ...updateData,
  budget: updateData.budget === '' ? sql`NULL` : updateData.budget,
  totalCost: updateData.totalCost === '' ? sql`NULL` : updateData.totalCost,
};
```

## Testing Requirements

After implementing fix, verify:

1. ✅ UPDATE with empty budget/totalCost returns 200 OK (not 500)
2. ✅ Database stores NULL (not empty string or 0)
3. ✅ UPDATE with valid budget/totalCost still works
4. ✅ GET after UPDATE shows NULL fields correctly
5. ✅ Frontend displays empty fields (not "null" or "0")

## Impact Analysis

**Same Issue Likely Affects:**
- All other numeric fields in projects (budget already has this issue)
- Invoice amounts (subtotal, taxAmount, total)
- Quote amounts
- Room rates (hourlyRate, halfDayRate, fullDayRate)
- Equipment purchase/rental prices
- Session amounts

**Recommendation:** Apply Solution 1 (Zod transformation) to ALL numeric fields across ALL routers.

## Server Infrastructure Issues Encountered

During testing, Docker networking issues prevented verification:
- `rsm-server` container not joining network properly after rebuild
- Redis DNS resolution failures (`EAI_AGAIN redis`)
- Port 3001 allocation conflicts
- Required Docker daemon restart to resolve

These are unrelated to the UPDATE bug but blocked testing.

## Next Steps

1. Implement Solution 1 (Zod schema transformation) for projects router
2. Test Projects UPDATE operation
3. Apply same fix to all other routers with numeric fields
4. Update frontend as Solution 2 for consistency (optional but cleaner)
5. Document pattern for future numeric field handling
