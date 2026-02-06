---
phase: quick-024
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/server/src/lib/aiTools.ts
  - packages/server/src/lib/aiActions.ts
autonomous: true

must_haves:
  truths:
    - "delete_client resolves client by name when no ID provided"
    - "update_client resolves client by name when no ID provided"
    - "update_quote resolves quote by quote_number when no ID provided"
    - "delete_quote resolves quote by quote_number when no ID provided"
  artifacts:
    - path: "packages/server/src/lib/aiTools.ts"
      provides: "Tool definitions with optional name/number alternative params"
      contains: "client_name"
    - path: "packages/server/src/lib/aiActions.ts"
      provides: "Resolution logic for name/number lookups"
      contains: "resolvedClientId"
  key_links:
    - from: "packages/server/src/lib/aiActions.ts"
      to: "clients table"
      via: "ilike name lookup"
      pattern: "ilike.*clients\\.name"
    - from: "packages/server/src/lib/aiActions.ts"
      to: "quotes table"
      via: "eq quoteNumber lookup"
      pattern: "eq.*quotes\\.quoteNumber"
---

<objective>
Fix entity resolution bugs in chatbot tools: delete_client, update_client, update_quote, and delete_quote cannot resolve entities by name/number -- they only accept numeric IDs which the LLM often hallucinates.

Purpose: Allow the AI chatbot to reliably find clients by name and quotes by quote_number, matching the pattern already working in update_invoice.
Output: Updated tool definitions and action implementations with name/number resolution fallback.
</objective>

<context>
@packages/server/src/lib/aiTools.ts
@packages/server/src/lib/aiActions.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add name/number alternative params to tool definitions</name>
  <files>packages/server/src/lib/aiTools.ts</files>
  <action>
Modify 4 tool definitions in AI_TOOLS array:

1. `delete_client` (line ~226-237):
   - Add property `client_name: { type: "string", description: "Nom du client. Alternative a client_id pour identifier le client par son nom." }`
   - Remove `"client_id"` from `required` array (make it `required: []`)

2. `update_client` (line ~196-223):
   - Add property `client_name: { type: "string", description: "Nom du client. Alternative a client_id pour identifier le client par son nom." }`
   - Remove `"client_id"` from `required` array (make it `required: []`)

3. `update_quote` (line ~699-757):
   - Add property `quote_number: { type: "string", description: "Numero du devis (ex: QT-2025-001). Alternative a quote_id." }`
   - Remove `"quote_id"` from `required` array (make it `required: []`)

4. `delete_quote` (line ~759-771):
   - Add property `quote_number: { type: "string", description: "Numero du devis (ex: QT-2025-001). Alternative a quote_id." }`
   - Remove `"quote_id"` from `required` array (make it `required: []`)

Do NOT modify any other tools. The descriptions should be in French to match existing tool descriptions.
  </action>
  <verify>Run `pnpm check` from project root -- zero TypeScript errors expected (tool defs are plain objects, no type constraints broken).</verify>
  <done>All 4 tool definitions accept both ID and name/number alternatives, with neither being strictly required.</done>
</task>

<task type="auto">
  <name>Task 2: Add entity resolution logic to action implementations</name>
  <files>packages/server/src/lib/aiActions.ts</files>
  <action>
Add `ilike` to the drizzle-orm import on line 2:
```typescript
import { eq, gte, lte, and, desc, sql, ilike } from "drizzle-orm";
```

Then modify 4 action methods:

1. **delete_client** (line ~491-506):
   Change signature from `{ client_id: number }` to `{ client_id?: number; client_name?: string }`.
   Add resolution logic at the start (BEFORE the soft delete):
   ```typescript
   let resolvedClientId = client_id;
   if (!resolvedClientId && client_name) {
     const found = await this.db
       .select({ id: clients.id, name: clients.name })
       .from(clients)
       .where(and(ilike(clients.name, `%${client_name}%`), eq(clients.isActive, true)))
       .limit(2);
     if (found.length === 0) {
       throw new Error(`Client "${client_name}" introuvable`);
     }
     if (found.length > 1) {
       throw new Error(`Plusieurs clients correspondent a "${client_name}": ${found.map(c => c.name).join(', ')}. Precisez le nom complet ou utilisez l'ID.`);
     }
     resolvedClientId = found[0].id;
   }
   if (!resolvedClientId) {
     throw new Error("Veuillez fournir client_id ou client_name");
   }
   ```
   Then use `resolvedClientId` instead of `client_id` in the `.where(eq(clients.id, resolvedClientId))`.

2. **update_client** (line ~460-486):
   Change signature from `{ client_id: number; ... }` to `{ client_id?: number; client_name?: string; ... }`.
   Add same resolution logic as delete_client (identical pattern with ilike + active check + ambiguity error).
   Use `resolvedClientId` in the `.where(eq(clients.id, resolvedClientId))`.

3. **update_quote** (line ~1306-1372):
   Change signature from `{ quote_id: number; ... }` to `{ quote_id?: number; quote_number?: string; ... }`.
   Add resolution logic matching the update_invoice pattern:
   ```typescript
   let resolvedQuoteId = quote_id;
   if (!resolvedQuoteId && quote_number) {
     const found = await this.db
       .select({ id: quotes.id })
       .from(quotes)
       .where(eq(quotes.quoteNumber, quote_number))
       .limit(1);
     if (found.length === 0) {
       throw new Error(`Devis "${quote_number}" introuvable`);
     }
     resolvedQuoteId = found[0].id;
   }
   if (!resolvedQuoteId) {
     throw new Error("Veuillez fournir quote_id ou quote_number");
   }
   ```
   Replace all occurrences of `quote_id` with `resolvedQuoteId` in the method body (the delete quoteItems, insert quoteItems, update quotes queries).

4. **delete_quote** (line ~1374-1385):
   Change signature from `{ quote_id: number }` to `{ quote_id?: number; quote_number?: string }`.
   Add same resolution logic as update_quote.
   Use `resolvedQuoteId` in the delete queries.

IMPORTANT: For client resolution, use `ilike` with `%name%` pattern (case-insensitive partial match) because users say names naturally. For quote resolution, use exact `eq` match on quoteNumber (quote numbers are unique identifiers like "QT-2025-001").
  </action>
  <verify>Run `pnpm check` from project root -- zero TypeScript errors. Also verify the existing update_invoice resolution pattern (lines 882-893) is NOT modified -- it should remain untouched as reference.</verify>
  <done>All 4 actions resolve entities by name/number when ID is not provided, with proper error messages for not-found and ambiguous matches (clients only).</done>
</task>

</tasks>

<verification>
- `pnpm check` passes with 0 errors
- Tool definitions in aiTools.ts have `client_name` on delete_client/update_client, `quote_number` on update_quote/delete_quote
- Action methods in aiActions.ts use `ilike` for client name resolution, `eq` for quote number resolution
- Ambiguity protection exists for client name matches (error if >1 match)
- Error messages are in French matching existing codebase style
</verification>

<success_criteria>
- delete_client({ client_name: "Dubois" }) resolves to correct client ID via ilike search
- update_client({ client_name: "Martin", is_vip: true }) resolves and updates
- update_quote({ quote_number: "QT-2025-001", status: "sent" }) resolves and updates
- delete_quote({ quote_number: "QT-2025-001" }) resolves and deletes
- Ambiguous client names throw helpful error listing matches
- Missing both ID and name/number throws clear error
- Existing ID-based calls continue to work unchanged
</success_criteria>
