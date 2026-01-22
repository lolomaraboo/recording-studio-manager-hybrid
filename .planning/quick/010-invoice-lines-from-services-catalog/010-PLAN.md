---
phase: quick-010
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/client/src/pages/InvoiceCreate.tsx
autonomous: true

must_haves:
  truths:
    - "Typing 2+ chars in description field shows autocomplete dropdown with matching services"
    - "Selecting a service from autocomplete fills description, quantity, unitPrice, amount, and vatRateId"
    - "Clicking 'Du catalogue' button opens a modal with category filter and full service list"
    - "Clicking a service in the catalog modal adds a new pre-filled line item"
    - "Manual entry still works (user can type freely without selecting from autocomplete)"
  artifacts:
    - path: "packages/client/src/pages/InvoiceCreate.tsx"
      provides: "Service catalog integration (autocomplete + modal)"
      contains: "handleServiceSelect"
  key_links:
    - from: "packages/client/src/pages/InvoiceCreate.tsx"
      to: "trpc.serviceCatalog.list"
      via: "useQuery with search/category params"
      pattern: "trpc\\.serviceCatalog\\.list\\.useQuery"
---

<objective>
Add service catalog integration to InvoiceCreate.tsx, replicating the exact same UX already working in QuoteCreate.tsx: autocomplete dropdown on description field + "Du catalogue" button with browseable modal.

Purpose: Invoices should allow picking services from the catalog just like quotes do, for consistency and speed.
Output: InvoiceCreate.tsx with autocomplete + catalog modal, same pattern as QuoteCreate.tsx.
</objective>

<context>
@packages/client/src/pages/InvoiceCreate.tsx
@packages/client/src/pages/QuoteCreate.tsx (reference pattern - lines 74-180 for state/handlers, lines 307-371 for autocomplete UI, lines 514-591 for catalog modal)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add service catalog autocomplete and modal to InvoiceCreate.tsx</name>
  <files>packages/client/src/pages/InvoiceCreate.tsx</files>
  <action>
Modify InvoiceCreate.tsx to add the service catalog integration. All changes are in this single file:

**1. Update imports (line 1-12):**
- Add `useEffect` to the existing `useState` import from "react"
- Add: `import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";`
- Add: `import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";`
- Add: `import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";`
- Add `Package` to the lucide-react import (alongside ArrowLeft, Save, FileText, Plus, Trash2)
- Add: `import { Link } from "react-router-dom";` (Link is already imported from react-router-dom on line 2, just ensure it's there)

**2. Add state hooks (after line 60, after the items useState):**
```typescript
// Autocomplete state
const [autocompleteOpen, setAutocompleteOpen] = useState<number | null>(null);
const [searchQuery, setSearchQuery] = useState<{ [index: number]: string }>({});
const [debouncedSearch, setDebouncedSearch] = useState("");
const [currentSearchIndex, setCurrentSearchIndex] = useState<number | null>(null);

// Catalog modal state
const [catalogModalOpen, setCatalogModalOpen] = useState(false);
const [catalogCategory, setCatalogCategory] = useState<string>("all");
```

**3. Add tRPC queries (after the state hooks):**
```typescript
// Service catalog queries
const { data: autocompleteServices } = trpc.serviceCatalog.list.useQuery(
  { search: debouncedSearch, activeOnly: true },
  { enabled: debouncedSearch.length >= 2 }
);

const { data: catalogServices } = trpc.serviceCatalog.list.useQuery({
  category: catalogCategory === "all" ? undefined : (catalogCategory as any),
  activeOnly: true,
});
```

**4. Add debounce useEffect (after the queries):**
```typescript
// Debounce search
useEffect(() => {
  if (currentSearchIndex !== null && searchQuery[currentSearchIndex]) {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery[currentSearchIndex]);
    }, 200);
    return () => clearTimeout(timer);
  } else {
    setDebouncedSearch("");
  }
}, [searchQuery, currentSearchIndex]);
```

**5. Add handleServiceSelect (after handleItemChange, around line 92):**
IMPORTANT: InvoiceItem uses `number` types, NOT strings. Use parseFloat to convert service values.
```typescript
// Handle service selection from autocomplete
const handleServiceSelect = (index: number, service: any) => {
  const newItems = [...items];
  const quantity = parseFloat(service.defaultQuantity) || 1;
  const unitPrice = parseFloat(service.unitPrice) || 0;
  newItems[index] = {
    ...newItems[index],
    description: service.name,
    quantity,
    unitPrice,
    amount: quantity * unitPrice,
    vatRateId: service.vatRateId || defaultVatRate?.id || 1,
  };
  setItems(newItems);
  setAutocompleteOpen(null);
  setSearchQuery({ ...searchQuery, [index]: service.name });
};
```

**6. Add handleCatalogServiceSelect (after handleServiceSelect):**
```typescript
// Handle service selection from catalog modal
const handleCatalogServiceSelect = (service: any) => {
  const quantity = parseFloat(service.defaultQuantity) || 1;
  const unitPrice = parseFloat(service.unitPrice) || 0;
  const newItem: InvoiceItem = {
    description: service.name,
    quantity,
    unitPrice,
    amount: quantity * unitPrice,
    vatRateId: service.vatRateId || defaultVatRate?.id || 1,
  };
  setItems([...items, newItem]);
  setCatalogModalOpen(false);
};
```

**7. Update the "Articles" header section (around line 249-255):**
Add the "Du catalogue" button next to "Ajouter une ligne":
```tsx
<div className="flex items-center justify-between">
  <Label className="text-base font-semibold">Articles</Label>
  <div className="flex gap-2">
    <Button type="button" size="sm" variant="secondary" onClick={() => setCatalogModalOpen(true)}>
      <Package className="h-4 w-4 mr-2" />
      Du catalogue
    </Button>
    <Button type="button" size="sm" variant="outline" onClick={handleAddItem}>
      <Plus className="h-4 w-4 mr-2" />
      Ajouter une ligne
    </Button>
  </div>
</div>
```

**8. Replace the description TableCell (lines 272-278):**
Replace the simple `<Input>` in the description cell with the Popover+Command autocomplete:
```tsx
<TableCell>
  <Popover open={autocompleteOpen === index} onOpenChange={(open) => setAutocompleteOpen(open ? index : null)}>
    <PopoverTrigger asChild>
      <Input
        value={item.description}
        onChange={(e) => {
          handleItemChange(index, "description", e.target.value);
          setSearchQuery({ ...searchQuery, [index]: e.target.value });
          setCurrentSearchIndex(index);
          if (e.target.value.length >= 2) {
            setAutocompleteOpen(index);
          }
        }}
        onFocus={() => {
          setCurrentSearchIndex(index);
          if (item.description.length >= 2) {
            setAutocompleteOpen(index);
          }
        }}
        onBlur={() => setTimeout(() => setAutocompleteOpen(null), 200)}
        placeholder="Tapez pour rechercher..."
      />
    </PopoverTrigger>
    <PopoverContent className="w-[400px] p-0" align="start">
      <Command>
        <CommandList>
          {!autocompleteServices || autocompleteServices.length === 0 ? (
            <CommandEmpty>
              {searchQuery[index]?.length >= 2 ? "Aucun service trouve" : "Tapez au moins 2 caracteres"}
            </CommandEmpty>
          ) : (
            <CommandGroup>
              {autocompleteServices.slice(0, 10).map((service) => (
                <CommandItem
                  key={service.id}
                  onSelect={() => handleServiceSelect(index, service)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="font-medium">{service.name}</div>
                    <div className="text-xs text-muted-foreground">{service.category}</div>
                  </div>
                  <div className="text-sm font-medium">{parseFloat(service.unitPrice).toFixed(2)} EUR</div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</TableCell>
```

**9. Add Catalog Modal Dialog (after the closing `</form>` tag, before the final closing `</div>`s):**
```tsx
{/* Catalog Modal */}
<Dialog open={catalogModalOpen} onOpenChange={setCatalogModalOpen}>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>Selectionner un service du catalogue</DialogTitle>
      <DialogDescription>
        Choisissez un service pre-defini pour l'ajouter a la facture
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex items-center gap-4">
        <Label>Categorie:</Label>
        <Select value={catalogCategory} onValueChange={setCatalogCategory}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les categories</SelectItem>
            <SelectItem value="Studio">Studio</SelectItem>
            <SelectItem value="Post-production">Post-production</SelectItem>
            <SelectItem value="Location materiel">Location materiel</SelectItem>
            <SelectItem value="Autre">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Services Table */}
      {!catalogServices || catalogServices.length === 0 ? (
        <div className="py-8 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Aucun service dans le catalogue.</p>
          <Link to="/services" className="text-sm text-primary hover:underline mt-2 inline-block">
            Creez-en un dans la page Services
          </Link>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Categorie</TableHead>
                <TableHead className="text-right">Prix unitaire</TableHead>
                <TableHead className="text-right">TVA</TableHead>
                <TableHead className="text-right">Qte defaut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {catalogServices.map((service) => (
                <TableRow
                  key={service.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleCatalogServiceSelect(service)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{service.name}</div>
                      {service.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {service.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{service.category}</TableCell>
                  <TableCell className="text-right">{parseFloat(service.unitPrice).toFixed(2)} EUR</TableCell>
                  <TableCell className="text-right">{service.taxRate}%</TableCell>
                  <TableCell className="text-right">{service.defaultQuantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  </DialogContent>
</Dialog>
```

**Key difference from QuoteCreate:** InvoiceItem uses `number` for quantity/unitPrice/amount (not strings). The handleServiceSelect and handleCatalogServiceSelect use parseFloat and assign numbers directly, NOT `.toString()` or `.toFixed(2)` strings.

**Use proper French characters in the actual code:** Use the actual accented characters (e, a, etc.) - the action above uses ASCII for clarity but the real implementation should match QuoteCreate's French text exactly:
- "Aucun service trouve" -> "Aucun service trouve" (with accent)
- "Selectionner" -> with accent
- "pre-defini" -> with accent
- "Categorie" -> with accent
- "categories" -> with accent
- "materiel" -> with accent
- "Creez-en" -> with accent
- "Qte" -> "Qte" with accent
  </action>
  <verify>
Run `pnpm check` from project root - InvoiceCreate.tsx must compile with 0 TypeScript errors. Verify the file contains:
- `trpc.serviceCatalog.list.useQuery` (2 calls)
- `handleServiceSelect`
- `handleCatalogServiceSelect`
- `catalogModalOpen`
- `Popover` / `PopoverContent` / `PopoverTrigger`
- `Dialog` / `DialogContent`
  </verify>
  <done>
InvoiceCreate.tsx has autocomplete on description field (Popover+Command, triggers at 2+ chars, shows matching services with name/category/price, fills all fields on select) and "Du catalogue" button (opens Dialog with category filter and clickable service table that adds new pre-filled line items). InvoiceItem type unchanged (numbers). TypeScript compiles cleanly.
  </done>
</task>

</tasks>

<verification>
- `pnpm check` passes with 0 errors
- Open http://localhost:5174/invoices/new in browser
- Type 2+ characters in a description field - autocomplete dropdown appears
- Select a service - quantity, price, amount, VAT auto-fill
- Click "Du catalogue" button - modal opens with category filter
- Click a service in the modal - new line item added with correct values
- Manual typing still works without selecting from autocomplete
</verification>

<success_criteria>
- InvoiceCreate.tsx service catalog integration matches QuoteCreate.tsx UX exactly
- Autocomplete triggers at 2+ characters with 200ms debounce
- Catalog modal shows services filterable by category
- Both selection methods correctly fill InvoiceItem fields as numbers
- TypeScript compilation passes (`pnpm check`)
</success_criteria>

<output>
After completion, create `.planning/quick/010-invoice-lines-from-services-catalog/010-SUMMARY.md`
</output>
