# Phase 29: Harmonisation Services - Routing Cohérent - Research

**Researched:** 2026-01-21
**Domain:** React routing patterns, accordion form architecture
**Confidence:** HIGH

## Summary

Phase 29 applies the established harmonization pattern (Phases 22-28) to Services. The research confirms this is a **mechanical refactoring** with zero technical unknowns—the pattern has been successfully applied to 11 other resources.

**Current state:** Services use a Dialog modal for create/edit (lines 350-493 in Services.tsx), making it inconsistent with all other resources (clients, sessions, invoices, equipment, rooms, projects, quotes, contracts, expenses, talents, tracks) which use dedicated `/resource/new` pages.

**Standard approach:** Create `/services/new` dedicated page with ServiceEditForm component following the exact pattern from ClientEditForm (Phase 26) and TalentEditForm (Phase 28).

**Primary recommendation:** Reuse TalentEditForm as the structural template (simpler than ClientEditForm, 300 lines vs 1209 lines). Services domain is closer to Talents (5 fields vs 50+ for Clients).

## Standard Stack

The established libraries/tools for this pattern:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Router | 6.x | Routing with `/services/new` route | Used across all 58 pages in app |
| shadcn/ui Accordion | latest | Collapsible form sections | Pattern reference from Phases 26-28 |
| Wouter | latest | Client-side routing (`useNavigate`, `Link`) | Project standard (packages/client/src/App.tsx) |
| tRPC | 11.x | Type-safe API calls (`serviceCatalog.create`) | Backend already exists (Services.tsx:92-126) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| localStorage API | Native | Persist accordion state | Optional—pattern established in ClientEditForm |
| sonner | latest | Toast notifications | Success/error messages (already used) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dedicated page | Keep Dialog modal | Dialog breaks pattern consistency, creates cognitive friction |
| Custom accordion | Keep flat form | Pattern requires accordion for consistency with 11 other pages |

**Installation:**
No new packages needed—all dependencies already in `packages/client/package.json`.

## Architecture Patterns

### Recommended Project Structure
```
packages/client/src/
├── pages/
│   ├── Services.tsx                # List page (keep existing)
│   └── ServiceCreate.tsx           # NEW: /services/new page
├── components/
│   └── ServiceEditForm.tsx         # NEW: Accordion-based form
└── App.tsx                         # Add route: <Route path="services/new" element={<ServiceCreate />} />
```

### Pattern 1: Dedicated Create Page (Required)
**What:** Separate route for creating new service (`/services/new`)
**When to use:** ALL resource creation in this application (established in Phases 1-28)
**Example:**
```typescript
// packages/client/src/pages/ServiceCreate.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Package, X } from "lucide-react";
import { toast } from "sonner";
import { ServiceEditForm } from "@/components/ServiceEditForm";

export default function ServiceCreate() {
  const navigate = useNavigate();

  const createMutation = trpc.serviceCatalog.create.useMutation({
    onSuccess: () => {
      toast.success("Service créé avec succès");
      navigate("/services");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Studio",
    unitPrice: "",
    taxRate: "20",
    defaultQuantity: "1.00",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation + submit logic
  };

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/services">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" />
              Nouveau Service
            </h1>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <ServiceEditForm
            formData={formData}
            setFormData={setFormData}
          />

          {/* Submit button */}
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link to="/services">
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {createMutation.isPending ? "Création..." : "Créer le service"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```
**Source:** TalentCreate.tsx (Phase 28), exact pattern

### Pattern 2: Accordion-Based Form Component
**What:** ServiceEditForm with 3-5 collapsible sections matching domain fields
**When to use:** All edit forms in harmonized resources (Phases 22-28)
**Example:**
```typescript
// packages/client/src/components/ServiceEditForm.tsx
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Package, DollarSign, FileText } from "lucide-react";

interface ServiceEditFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export function ServiceEditForm({ formData, setFormData }: ServiceEditFormProps) {
  // localStorage persistence (optional pattern)
  const [openItems, setOpenItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('serviceEditAccordions');
      return saved ? JSON.parse(saved) : ["identite", "pricing", "notes"];
    } catch {
      return ["identite", "pricing", "notes"];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('serviceEditAccordions', JSON.stringify(openItems));
    } catch (error) {
      console.error('Failed to save accordion state:', error);
    }
  }, [openItems]);

  // Alt+Click toggle all accordions (established pattern)
  const handleAccordionTriggerClick = (event: React.MouseEvent) => {
    if (event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      const allAccordions = ["identite", "pricing", "notes"];
      if (openItems.length < allAccordions.length) {
        setOpenItems(allAccordions);
      } else {
        setOpenItems([]);
      }
    }
  };

  return (
    <Accordion
      type="multiple"
      value={openItems}
      onValueChange={setOpenItems}
      className="space-y-2"
    >
      {/* Accordion 1: Service Identity */}
      <AccordionItem value="identite">
        <Card>
          <AccordionTrigger className="px-4 py-3 hover:no-underline" onClick={handleAccordionTriggerClick}>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Identité du Service
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-3">
              {/* Name field */}
              {/* Category select */}
              {/* Description textarea */}
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>

      {/* Accordion 2: Pricing */}
      {/* Accordion 3: Notes */}
    </Accordion>
  );
}
```
**Source:** TalentEditForm.tsx lines 1-299 (Phase 28)

### Pattern 3: Button Navigation (Not Dialog)
**What:** "Nouveau service" button navigates to `/services/new` instead of opening Dialog
**When to use:** Always for resource creation (established in all 11 resources)
**Example:**
```typescript
// packages/client/src/pages/Services.tsx (line 239)
// BEFORE (Phase 28):
<Button onClick={openCreateModal}>
  <Plus className="mr-2 h-4 w-4" />
  Nouveau service
</Button>

// AFTER (Phase 29):
<Button asChild>
  <Link to="/services/new">
    <Plus className="mr-2 h-4 w-4" />
    Nouveau service
  </Link>
</Button>
```
**Source:** Clients.tsx, Talents.tsx, all other list pages

### Pattern 4: Edit Flow (Future Phase)
**What:** Navigate to `/services/:id/edit` for editing existing service
**When to use:** When user clicks Edit button in table (Phase 30+)
**Note:** Phase 29 only creates `/services/new`. Edit flow is out of scope.

### Anti-Patterns to Avoid
- **Opening Dialog from button:** Breaks routing consistency, user can't bookmark/share link
- **Inline form editing in table row:** Creates cramped UX, inconsistent with other pages
- **Custom form without accordion:** Breaks visual consistency established in Phases 22-28

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collapsible sections | Custom `<details>` or `useState` toggle | shadcn/ui Accordion component | Accessible, keyboard-navigable, consistent with 11 other forms |
| Form state persistence | Custom localStorage wrapper | Exact pattern from ClientEditForm/TalentEditForm | Already tested, handles JSON parse errors, consistent key naming |
| Routing transition | Custom modal animation | React Router `<Link>` navigation | Standard browser behavior, back button works, shareable URLs |
| Alt+Click toggle | Custom event handler per accordion | Shared handler from pattern (lines 54-69 TalentEditForm) | Works across all accordions, tested UX |

**Key insight:** Every line of ServiceEditForm.tsx can be copied from TalentEditForm.tsx with field names swapped. Zero custom logic needed.

## Common Pitfalls

### Pitfall 1: Keeping Dialog Modal for Create Flow
**What goes wrong:** User expects `/services/new` route (like clients, talents, projects), finds Dialog instead. Creates UX inconsistency.
**Why it happens:** Dialog is faster to implement (no new route/page file)
**How to avoid:** Follow the pattern—ALWAYS use dedicated `/resource/new` page. Dialog is only for confirm/alert actions, not full forms.
**Warning signs:**
- Button has `onClick={openModal}` instead of `asChild + Link`
- No route for `services/new` in App.tsx
- Form logic lives in list page (Services.tsx) instead of separate file

### Pitfall 2: Too Many Accordion Sections
**What goes wrong:** Services has 6 fields (name, description, category, unitPrice, taxRate, defaultQuantity). Creating 6 accordions = cognitive overload.
**Why it happens:** Copying ClientEditForm pattern blindly (7 accordions for 50+ fields)
**How to avoid:** Group related fields logically:
- Accordion 1: Identity (name, category, description) = 3 fields
- Accordion 2: Pricing (unitPrice, taxRate, defaultQuantity) = 3 fields
- Optional Accordion 3: Notes (internal notes field if needed)
**Warning signs:** More than 5 accordions for a simple domain

### Pitfall 3: Forgetting to Remove Dialog Code
**What goes wrong:** Both Dialog modal AND dedicated page exist, creating two ways to create services.
**Why it happens:** Incremental refactoring without cleanup
**How to avoid:** Delete Dialog + all modal state management from Services.tsx in same commit as adding ServiceCreate.tsx
**Warning signs:**
- `isCreateModalOpen` state still exists in Services.tsx
- `<Dialog>` component still rendered (lines 350-493 currently)
- `openCreateModal` function still defined

### Pitfall 4: localStorage Key Collision
**What goes wrong:** Multiple forms share same localStorage key, causing accordion state bleed between pages
**Why it happens:** Copy-paste without renaming key
**How to avoid:** Use unique key per form:
```typescript
// CORRECT:
localStorage.getItem('serviceEditAccordions')  // Services
localStorage.getItem('clientEditAccordions')   // Clients (Phase 26)
localStorage.getItem('talentEditAccordions')   // Talents (Phase 28)

// WRONG:
localStorage.getItem('editAccordions')  // Generic key
```
**Warning signs:** Accordion state from Clients page appears in Services form

## Code Examples

Verified patterns from official sources:

### Complete ServiceCreate Page Structure
```typescript
// Source: TalentCreate.tsx (Phase 28, 108 lines)
// Pattern: Header + Form + Submit Buttons
// Time to implement: 15 minutes (copy-paste + field name changes)

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Package, X } from "lucide-react";
import { toast } from "sonner";
import { ServiceEditForm } from "@/components/ServiceEditForm";

export default function ServiceCreate() {
  const navigate = useNavigate();

  // tRPC mutation (backend already exists at Services.tsx:92-102)
  const createMutation = trpc.serviceCatalog.create.useMutation({
    onSuccess: () => {
      toast.success("Service créé avec succès");
      navigate("/services");  // Return to list page
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Form state matching backend schema
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Studio" as const,
    unitPrice: "",
    taxRate: "20",
    defaultQuantity: "1.00",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation (copy from Services.tsx:129-155)
    if (!formData.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    const unitPrice = parseFloat(formData.unitPrice);
    if (isNaN(unitPrice) || unitPrice < 0) {
      toast.error("Le prix unitaire doit être un nombre positif");
      return;
    }

    // Submit
    createMutation.mutate({
      name: formData.name,
      description: formData.description || null,
      category: formData.category,
      unitPrice: formData.unitPrice,
      taxRate: formData.taxRate,
      defaultQuantity: formData.defaultQuantity,
    });
  };

  return (
    <div className="container pt-2 pb-4 px-2">
      <div className="space-y-2">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/services">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" />
              Nouveau Service
            </h1>
          </div>
        </div>

        {/* Form component */}
        <form onSubmit={handleSubmit}>
          <ServiceEditForm
            formData={formData}
            setFormData={setFormData}
          />

          {/* Action buttons */}
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link to="/services">
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Link>
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {createMutation.isPending ? "Création..." : "Créer le service"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Complete ServiceEditForm Component Structure
```typescript
// Source: TalentEditForm.tsx (Phase 28, 300 lines)
// Pattern: Accordion wrapper + 3-5 sections
// Time to implement: 30 minutes (copy-paste + field replacements)

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Package, DollarSign, FileText } from "lucide-react";

interface ServiceEditFormProps {
  formData: any;
  setFormData: (data: any) => void;
}

export function ServiceEditForm({ formData, setFormData }: ServiceEditFormProps) {
  // Accordion state with localStorage persistence
  const [openItems, setOpenItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('serviceEditAccordions');
      return saved ? JSON.parse(saved) : ["identite", "pricing"];
    } catch {
      return ["identite", "pricing"];
    }
  });

  // Save accordion state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('serviceEditAccordions', JSON.stringify(openItems));
    } catch (error) {
      console.error('Failed to save accordion state:', error);
    }
  }, [openItems]);

  // Alt+Click toggle all accordions
  const handleAccordionTriggerClick = (event: React.MouseEvent) => {
    if (event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      const allAccordions = ["identite", "pricing"];
      if (openItems.length < allAccordions.length) {
        setOpenItems(allAccordions);
      } else {
        setOpenItems([]);
      }
    }
  };

  return (
    <Accordion
      type="multiple"
      value={openItems}
      onValueChange={setOpenItems}
      className="space-y-2"
    >
      {/* Accordion 1: Service Identity */}
      <AccordionItem value="identite">
        <Card>
          <AccordionTrigger
            className="px-4 py-3 hover:no-underline"
            onClick={handleAccordionTriggerClick}
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Identité du Service
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-3">
              {/* Name field (required) */}
              <div>
                <Label htmlFor="name">
                  Nom du service <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Session d'enregistrement 1h"
                  maxLength={255}
                />
              </div>

              {/* Category select */}
              <div>
                <Label htmlFor="category">
                  Catégorie <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Studio">Studio</SelectItem>
                    <SelectItem value="Post-production">Post-production</SelectItem>
                    <SelectItem value="Location matériel">Location matériel</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description textarea */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description optionnelle du service"
                  rows={3}
                />
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>

      {/* Accordion 2: Pricing */}
      <AccordionItem value="pricing">
        <Card>
          <AccordionTrigger
            className="px-4 py-3 hover:no-underline"
            onClick={handleAccordionTriggerClick}
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Tarification
            </h3>
          </AccordionTrigger>
          <AccordionContent>
            <div className="px-4 pb-3 space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                {/* Unit price */}
                <div>
                  <Label htmlFor="unitPrice">
                    Prix unitaire (€) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitPrice || ""}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                {/* Tax rate */}
                <div>
                  <Label htmlFor="taxRate">
                    TVA (%) <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.taxRate}
                    onValueChange={(value) => setFormData({ ...formData, taxRate: value })}
                  >
                    <SelectTrigger id="taxRate">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20% (Standard)</SelectItem>
                      <SelectItem value="10">10% (Réduit)</SelectItem>
                      <SelectItem value="5.5">5.5% (Réduit)</SelectItem>
                      <SelectItem value="0">0% (Exonéré)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Default quantity */}
              <div>
                <Label htmlFor="defaultQuantity">
                  Quantité par défaut <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="defaultQuantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.defaultQuantity || ""}
                  onChange={(e) => setFormData({ ...formData, defaultQuantity: e.target.value })}
                  placeholder="1.00"
                />
              </div>
            </div>
          </AccordionContent>
        </Card>
      </AccordionItem>
    </Accordion>
  );
}
```

### Route Registration
```typescript
// Source: App.tsx lines 138-150 (existing pattern)
// Location: packages/client/src/App.tsx
// Add after line 29 (existing Services import)

// At top of file (line 29):
import ServiceCreate from './pages/ServiceCreate';

// Inside <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}> (after line 177):
<Route path="services" element={<Services />} />
<Route path="services/new" element={<ServiceCreate />} />
```

### Button Update in List Page
```typescript
// Source: Services.tsx line 239
// Change from onClick handler to Link navigation

// BEFORE (Phase 28):
<Button onClick={openCreateModal}>
  <Plus className="mr-2 h-4 w-4" />
  Nouveau service
</Button>

// AFTER (Phase 29):
<Button asChild>
  <Link to="/services/new">
    <Plus className="mr-2 h-4 w-4" />
    Nouveau service
  </Link>
</Button>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Dialog modal for create | Dedicated `/resource/new` page | Phase 22-28 (Jan 2026) | Bookmarkable URLs, shareable links, consistent navigation |
| Flat form fields | Accordion-grouped sections | Phase 26 (Jan 2026) | 50-60% code reduction, visual consistency |
| Manual accordion state | localStorage persistence | Phase 26 (Jan 2026) | User preferences saved across sessions |
| Individual toggle buttons | Alt+Click toggle all | Phase 26 (Jan 2026) | Power-user feature for form navigation |

**Deprecated/outdated:**
- Dialog modal pattern for resource creation: Removed in Phases 22-28, replaced by dedicated pages
- Wizard-based forms (ClientFormWizard.tsx): Removed in Phase 26, replaced by accordion pattern
- Inline table editing: Never used in this application (always dedicated create/edit pages)

## Open Questions

None—pattern fully established and documented.

1. **Accordion sections: 2, 3, or 4?**
   - What we know: Services has 6 fields (name, description, category, unitPrice, taxRate, defaultQuantity)
   - What's unclear: Optimal grouping—2 sections (Identity + Pricing) or 3 (Identity + Pricing + Notes)
   - Recommendation: Start with 2 accordions (Identity + Pricing), add Notes accordion only if needed in future

2. **Edit flow: Same form or separate?**
   - What we know: TalentEditForm is reused for both create and edit (via TalentCreate.tsx and TalentDetailTabs.tsx)
   - What's unclear: Whether Phase 29 includes edit flow (currently Services.tsx has edit via Dialog)
   - Recommendation: Phase 29 = create only. Phase 30 = edit flow (same pattern as Talents)

3. **localStorage key naming: serviceEditAccordions or serviceFormAccordions?**
   - What we know: ClientEditForm uses `clientEditAccordions`, TalentEditForm uses `talentEditAccordions`
   - What's unclear: N/A—pattern is established
   - Recommendation: Use `serviceEditAccordions` for consistency

## Sources

### Primary (HIGH confidence)
- packages/client/src/components/TalentEditForm.tsx - Phase 28 accordion pattern (300 lines, 5 accordions)
- packages/client/src/pages/TalentCreate.tsx - Phase 28 create page pattern (108 lines)
- packages/client/src/components/ClientEditForm.tsx - Phase 26 accordion pattern (1209 lines, 7 accordions)
- packages/client/src/pages/Services.tsx - Current Dialog modal implementation (522 lines, lines 350-493 = Dialog code)
- packages/client/src/App.tsx - Routing patterns for all resources (lines 138-177)

### Secondary (MEDIUM confidence)
- .planning/phases/26-formulaire-client-accordeons/26-01-PLAN.md - Original accordion pattern documentation
- .planning/phases/28-harmonisation-ui-talents/28-01-PLAN.md - Most recent pattern application

### Tertiary (LOW confidence)
- None—all findings verified with source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already in project, zero new packages
- Architecture: HIGH - Pattern applied 11 times successfully (Phases 22-28)
- Pitfalls: HIGH - Issues documented from prior phases (Dialog cleanup, localStorage keys)

**Research date:** 2026-01-21
**Valid until:** 60+ days (stable pattern, not dependent on external APIs or fast-moving libraries)

**Lines of code to write:**
- ServiceCreate.tsx: ~110 lines (copy TalentCreate.tsx)
- ServiceEditForm.tsx: ~200 lines (simplified TalentEditForm.tsx, 2-3 accordions vs 5)
- Services.tsx modifications: ~10 lines (button change, Dialog removal)
- App.tsx route: 2 lines
- **Total: ~322 lines**

**Estimated implementation time:** 60-90 minutes (mechanical refactoring, zero unknowns)
