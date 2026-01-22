---
phase: quick-011
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/server/src/routers/invoices.ts
  - packages/client/src/pages/InvoiceDetail.tsx
autonomous: true

must_haves:
  truths:
    - "Invoice detail page displays line items in read mode as a table"
    - "Edit mode shows editable items table with service catalog autocomplete"
    - "User can add/remove lines, select from catalog modal, and totals recalculate"
    - "Saving in edit mode sends items to backend which replaces old items and recalculates totals"
  artifacts:
    - path: "packages/server/src/routers/invoices.ts"
      provides: "updateWithItems mutation"
      contains: "updateWithItems"
    - path: "packages/client/src/pages/InvoiceDetail.tsx"
      provides: "Items display in read mode + editable items in edit mode"
      contains: "handleServiceSelect"
  key_links:
    - from: "packages/client/src/pages/InvoiceDetail.tsx"
      to: "invoices.updateWithItems"
      via: "trpc mutation call on save"
      pattern: "trpc\\.invoices\\.updateWithItems"
    - from: "packages/client/src/pages/InvoiceDetail.tsx"
      to: "serviceCatalog.list"
      via: "trpc query for autocomplete"
      pattern: "trpc\\.serviceCatalog\\.list"
---

<objective>
Add invoice line items display and editing with service catalog to InvoiceDetail page.

Purpose: Currently InvoiceDetail shows a TODO placeholder for line items and the update mutation only handles metadata. Users need to see existing items and edit them with the same service catalog autocomplete/modal UX as InvoiceCreate.

Output: Working invoice detail with items table (read mode) and editable items with catalog (edit mode), plus backend mutation to persist item changes.
</objective>

<context>
@packages/server/src/routers/invoices.ts
@packages/client/src/pages/InvoiceDetail.tsx
@packages/client/src/pages/InvoiceCreate.tsx (reference for catalog pattern)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add updateWithItems mutation to invoices router</name>
  <files>packages/server/src/routers/invoices.ts</files>
  <action>
Add a new `updateWithItems` mutation to the invoices router. This mutation:

1. Accepts input schema:
   ```
   id: z.number()
   data: {
     clientId: z.number().optional()
     invoiceNumber: z.string().optional()
     issueDate: z.string().optional()
     dueDate: z.string().optional()
     status: z.enum(['draft','sent','paid','overdue','cancelled']).optional()
     notes: z.string().optional()
     items: z.array(z.object({
       description: z.string(),
       quantity: z.number(),
       unitPrice: z.number(),
       amount: z.number(),
       vatRateId: z.number(),
     })).optional()
   }
   ```

2. Logic (reuse same pattern as `create` mutation):
   - Build updateData object from provided optional fields (same date conversion as existing `update`)
   - If `items` array is provided:
     - Calculate subtotal (sum of item.amount)
     - For each item, fetch vatRate and compute tax (item.amount * parseFloat(vatRate.rate) / 100)
     - Throw TRPCError BAD_REQUEST if vatRateId is invalid
     - Set updateData.subtotal, updateData.taxAmount, updateData.total as .toFixed(2) strings
     - Compute weighted average taxRate for backward compat (same as create)
     - Delete existing invoiceItems where invoiceId = input.id
     - Insert new items (map quantity to .toString(), unitPrice to .toFixed(2) string, amount to .toFixed(2) string, plus vatRateId)
   - Update invoice record with updateData
   - Return updated invoice using .returning()

Place this mutation after the existing `update` mutation (around line 221).
  </action>
  <verify>Run `pnpm check` from project root - should have 0 TypeScript errors in server package.</verify>
  <done>New `updateWithItems` mutation exists in invoices router, handles both metadata and items replacement with proper total recalculation.</done>
</task>

<task type="auto">
  <name>Task 2: Display items in read mode + editable items with catalog in edit mode</name>
  <files>packages/client/src/pages/InvoiceDetail.tsx</files>
  <action>
Modify InvoiceDetail.tsx to:

**A. Add missing imports (top of file):**
- Add `Table, TableBody, TableCell, TableHead, TableHeader, TableRow` from `@/components/ui/table`
- Add `Popover, PopoverContent, PopoverTrigger` from `@/components/ui/popover`
- Add `Command, CommandEmpty, CommandGroup, CommandItem, CommandList` from `@/components/ui/command`
- Add `Package, Plus` to the lucide-react import (keep existing icons)
- Import Link from react-router-dom is already there

**B. Add InvoiceItem type (same as InvoiceCreate):**
```typescript
type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  vatRateId: number;
};
```

**C. Add new state variables (after existing formData state):**
- `editItems: InvoiceItem[]` - initialized empty, populated from invoice.items when entering edit mode
- `autocompleteOpen: number | null` - which row's popover is open
- `searchQuery: { [index: number]: string }` - per-row search text
- `debouncedSearch: string` - debounced search for autocomplete query
- `currentSearchIndex: number | null` - currently active autocomplete row
- `catalogModalOpen: boolean` - catalog modal visibility
- `catalogCategory: string` - category filter for catalog modal ("all")

**D. Add new queries:**
- `trpc.vatRates.list.useQuery()` to get VAT rates
- `const defaultVatRate = vatRates?.find(r => r.isDefault)`
- `trpc.serviceCatalog.list.useQuery({ search: debouncedSearch, activeOnly: true }, { enabled: debouncedSearch.length >= 2 })` for autocomplete
- `trpc.serviceCatalog.list.useQuery({ category: catalogCategory === "all" ? undefined : catalogCategory, activeOnly: true })` for catalog modal

**E. Add debounce useEffect (same as InvoiceCreate lines 92-101).**

**F. Add updateWithItems mutation:**
```typescript
const updateWithItemsMutation = trpc.invoices.updateWithItems.useMutation({
  onSuccess: () => {
    toast.success("Facture mise a jour");
    setIsEditing(false);
    refetch();
  },
  onError: (error) => {
    toast.error(`Erreur: ${error.message}`);
  },
});
```

**G. Add item manipulation handlers (same pattern as InvoiceCreate):**
- `handleAddItem()` - adds empty item with defaultVatRate
- `handleRemoveItem(index)` - removes item (min 1)
- `handleItemChange(index, field, value)` - updates item, auto-calculates amount
- `handleServiceSelect(index, service)` - fills item from autocomplete selection
- `handleCatalogServiceSelect(service)` - adds item from catalog modal
- `calculateEditTotal()` - returns { subtotal, taxAmount, total } from editItems

**H. Update the useEffect that populates formData (around line 90-105):**
When invoice loads AND isEditing becomes true, also populate editItems:
```typescript
useEffect(() => {
  if (invoice && isEditing) {
    setEditItems(
      invoice.items && invoice.items.length > 0
        ? invoice.items.map(item => ({
            description: item.description,
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            amount: parseFloat(item.amount),
            vatRateId: item.vatRateId || defaultVatRate?.id || 1,
          }))
        : [{ description: "", quantity: 1, unitPrice: 0, amount: 0, vatRateId: defaultVatRate?.id || 1 }]
    );
  }
}, [invoice, isEditing]);
```

**I. Update handleSave (around line 107-123):**
Replace the current `updateMutation.mutate(...)` call with `updateWithItemsMutation.mutate(...)`:
```typescript
const handleSave = () => {
  updateWithItemsMutation.mutate({
    id: Number(id),
    data: {
      invoiceNumber: formData.invoiceNumber,
      clientId: formData.clientId,
      issueDate: new Date(formData.issueDate).toISOString(),
      dueDate: new Date(formData.dueDate).toISOString(),
      status: formData.status as any,
      notes: formData.notes,
      items: editItems.filter(item => item.description.trim() !== "").map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
        vatRateId: item.vatRateId,
      })),
    },
  });
};
```
Also update the Save button disabled check to use `updateWithItemsMutation.isPending`.

**J. Replace the TODO section in "Invoice Items Card" (lines 424-427):**

In READ mode (when !isEditing), show items table:
```tsx
{invoice.items && invoice.items.length > 0 ? (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead className="w-24">Quantite</TableHead>
          <TableHead className="w-32">Prix unit. (EUR)</TableHead>
          <TableHead className="w-32">TVA</TableHead>
          <TableHead className="w-32 text-right">Montant (EUR)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoice.items.map((item, index) => (
          <TableRow key={index}>
            <TableCell>{item.description}</TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell>{parseFloat(item.unitPrice).toFixed(2)}</TableCell>
            <TableCell>{vatRates?.find(r => r.id === item.vatRateId)?.rate || "20"}%</TableCell>
            <TableCell className="text-right">{parseFloat(item.amount).toFixed(2)} EUR</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
) : (
  <p className="text-sm text-muted-foreground">Aucune ligne de facturation</p>
)}
```

In EDIT mode (when isEditing), show editable items with catalog (exact same pattern as InvoiceCreate lines 322-461):
- "Articles" label + "Du catalogue" button + "Ajouter une ligne" button
- Table with Popover+Command autocomplete on description, quantity input, unitPrice input, vatRate Select, readonly amount, delete button
- Below the table: dynamic totals display (subtotal, TVA, Total TTC) using calculateEditTotal()

**K. Update the Totals section (lines 429-465):**
In read mode: keep existing totals from invoice object (subtotal, taxRate, taxAmount, total).
In edit mode: show dynamic totals from calculateEditTotal().

**L. Add catalog modal Dialog (same as InvoiceCreate lines 536-612):**
Place it after the existing Delete Dialog (after line 626). Include category filter Select and services Table with click-to-add.

Note: Use the euro sign character directly in text, e.g. "150.00 EUR" -> show proper euro symbol in JSX.
  </action>
  <verify>Run `pnpm check` from project root - should have 0 TypeScript errors. Then start dev server (`./start.sh`) and navigate to an existing invoice detail page to confirm items display in read mode and the edit mode shows the catalog UI.</verify>
  <done>InvoiceDetail displays items as table in read mode, shows editable items with service catalog autocomplete + catalog modal in edit mode, and saves items via updateWithItems mutation.</done>
</task>

</tasks>

<verification>
1. `pnpm check` passes with 0 errors across all packages
2. Navigate to an invoice with existing items - items display in a table
3. Click "Modifier" - items become editable with autocomplete on description
4. Type in description field - service catalog suggestions appear
5. Click "Du catalogue" - modal opens with services list
6. Select a service from catalog - new line item added with correct price/quantity
7. Click "Ajouter une ligne" - empty row added
8. Modify quantities/prices - amounts and totals recalculate
9. Click "Enregistrer" - items saved to backend, page refreshes with new data
10. Totals (subtotal, TVA, total TTC) match the sum of line items
</verification>

<success_criteria>
- Invoice items are visible in read mode as a formatted table
- Edit mode provides full item editing with service catalog autocomplete and modal
- Totals recalculate dynamically in edit mode
- Backend updateWithItems mutation replaces items and recalculates invoice totals
- TypeScript compiles with 0 errors
</success_criteria>

<output>
After completion, create `.planning/quick/011-invoice-edit-lines-service-catalog/011-SUMMARY.md`
</output>
