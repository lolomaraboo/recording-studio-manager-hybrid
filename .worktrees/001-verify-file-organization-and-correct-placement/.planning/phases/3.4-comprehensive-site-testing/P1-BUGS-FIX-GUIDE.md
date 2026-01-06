# P1 Bugs - Guide de Correction Détaillé

**Date:** 2025-12-27
**Issues GitHub:** #3-#13
**Estimation totale:** 6-10 jours de développement

---

## Vue d'Ensemble

Ce guide fournit les instructions détaillées pour corriger **tous les bugs P1** identifiés lors du testing Phase 3.4.

**Ordre de correction recommandé:**
1. **Phase 1:** Silent Button Failures (1-2 jours) → Impact immédiat
2. **Phase 2:** Type Coercion Bugs (2-3 jours) → Fix backend/frontend
3. **Phase 3:** DateTime Component (3-5 jours) → Solution long-terme

---

## Phase 1: Silent Button Failures (Issues #3-#6)

**Durée estimée:** 1-2 jours
**Difficulté:** Faible (pattern répétitif)
**Impact:** Débloque 4 entités immédiatement

### Problème Identifié

**Pattern du bug:** Boutons sans onClick handlers
- Les boutons sont visibles et cliquables
- Aucun handler attaché → click ne fait rien
- Pas d'erreur console → silent failure

**Code actuel (CASSÉ):**
```tsx
// Tracks.tsx ligne 110
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Nouvelle Track
</Button>
// ❌ Pas de onClick, pas de Dialog, rien ne se passe
```

---

### Fix 1: Tracks CREATE Button (Issue #4)

**Fichier:** `packages/client/src/pages/Tracks.tsx`

**Étape 1 - Ajouter les imports nécessaires:**

```tsx
// Ligne 16, ajouter après useState:
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
```

**Étape 2 - Ajouter le state et le handler:**

```tsx
// Ligne 48, dans la fonction Tracks(), ajouter:
export default function Tracks() {
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // NOUVEAU: State pour le Dialog CREATE
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTrack, setNewTrack] = useState({
    projectId: "",
    title: "",
    status: "recording" as TrackStatus,
    trackNumber: 1,
    duration: null,
    bpm: null,
    key: null,
    notes: "",
  });

  // NOUVEAU: Mutation CREATE
  const utils = trpc.useUtils();
  const createTrack = trpc.projects.tracks.create.useMutation({
    onSuccess: () => {
      utils.projects.tracks.listAll.invalidate();
      utils.projects.tracks.getStats.invalidate();
      setIsCreateDialogOpen(false);
      setNewTrack({
        projectId: "",
        title: "",
        status: "recording",
        trackNumber: 1,
        duration: null,
        bpm: null,
        key: null,
        notes: "",
      });
    },
  });

  // NOUVEAU: Handler pour soumettre
  const handleCreateTrack = () => {
    if (!newTrack.projectId || !newTrack.title) return;
    createTrack.mutate({
      projectId: parseInt(newTrack.projectId),
      title: newTrack.title,
      status: newTrack.status,
      trackNumber: newTrack.trackNumber,
      duration: newTrack.duration,
      bpm: newTrack.bpm,
      key: newTrack.key,
      notes: newTrack.notes,
    });
  };
```

**Étape 3 - Remplacer le bouton par un Dialog:**

```tsx
// Ligne 110-113, REMPLACER:
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Nouvelle Track
</Button>

// PAR:
<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
  <DialogTrigger asChild>
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Nouvelle Track
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Créer une nouvelle Track</DialogTitle>
      <DialogDescription>
        Ajoutez une track à un projet existant
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="track-project">Projet *</Label>
        <Select
          value={newTrack.projectId}
          onValueChange={(val) => setNewTrack({ ...newTrack, projectId: val })}
        >
          <SelectTrigger id="track-project">
            <SelectValue placeholder="Sélectionner un projet" />
          </SelectTrigger>
          <SelectContent>
            {projects?.map((p: any) => (
              <SelectItem key={p.id} value={p.id.toString()}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="track-title">Titre *</Label>
        <Input
          id="track-title"
          value={newTrack.title}
          onChange={(e) => setNewTrack({ ...newTrack, title: e.target.value })}
          placeholder="Ex: Verse 1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="track-status">Status</Label>
          <Select
            value={newTrack.status}
            onValueChange={(val: TrackStatus) => setNewTrack({ ...newTrack, status: val })}
          >
            <SelectTrigger id="track-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recording">Recording</SelectItem>
              <SelectItem value="editing">Editing</SelectItem>
              <SelectItem value="mixing">Mixing</SelectItem>
              <SelectItem value="mastering">Mastering</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="track-number">Numéro</Label>
          <Input
            id="track-number"
            type="number"
            value={newTrack.trackNumber}
            onChange={(e) => setNewTrack({ ...newTrack, trackNumber: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="track-duration">Durée (sec)</Label>
          <Input
            id="track-duration"
            type="number"
            value={newTrack.duration || ""}
            onChange={(e) => setNewTrack({ ...newTrack, duration: parseInt(e.target.value) || null })}
            placeholder="240"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="track-bpm">BPM</Label>
          <Input
            id="track-bpm"
            type="number"
            value={newTrack.bpm || ""}
            onChange={(e) => setNewTrack({ ...newTrack, bpm: parseInt(e.target.value) || null })}
            placeholder="120"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="track-key">Key</Label>
          <Input
            id="track-key"
            value={newTrack.key || ""}
            onChange={(e) => setNewTrack({ ...newTrack, key: e.target.value || null })}
            placeholder="C major"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="track-notes">Notes</Label>
        <Textarea
          id="track-notes"
          value={newTrack.notes}
          onChange={(e) => setNewTrack({ ...newTrack, notes: e.target.value })}
          placeholder="Notes additionnelles..."
          rows={3}
        />
      </div>
    </div>
    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => setIsCreateDialogOpen(false)}
      >
        Annuler
      </Button>
      <Button
        onClick={handleCreateTrack}
        disabled={!newTrack.projectId || !newTrack.title || createTrack.isPending}
      >
        {createTrack.isPending ? "Création..." : "Créer la Track"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Étape 4 - Fix Update Button (ligne 273-275):**

```tsx
// REMPLACER:
<Button variant="ghost" size="sm">
  Edit
</Button>

// PAR (solution simple - navigation vers page dédiée):
<Button
  variant="ghost"
  size="sm"
  onClick={() => {
    // TODO: Implémenter TrackDetail page ou Edit dialog inline
    alert(`Edit track ${track.id} - À implémenter`);
  }}
>
  Edit
</Button>
```

**Étape 5 - Vérifier le backend tRPC:**

```bash
# Vérifier que l'endpoint projects.tracks.create existe:
grep -r "tracks.*create" packages/server/src/routers/
```

Si l'endpoint n'existe pas, créer dans `packages/server/src/routers/projects.ts`.

**Étape 6 - Tester:**

```bash
# 1. Build
cd packages/client && npm run build

# 2. Tester manuellement:
# - Ouvrir /tracks
# - Cliquer "Nouvelle Track"
# - Vérifier que le dialog s'ouvre
# - Remplir le formulaire
# - Vérifier que la track est créée
# - Vérifier que la liste se rafraîchit
```

---

### Fix 2: Team CREATE (Issue #3)

**Fichier:** `packages/client/src/pages/Team.tsx`

**ATTENTION:** Cette page utilise du **MOCK DATA** (ligne 47-104). Elle n'est **PAS connectée au backend**.

**Options:**

**Option A - Quick Fix (Mock fonctionnel):**
Le dialog "Inviter un membre" existe déjà (ligne 141-197) et fonctionne. Le problème était que le texte du bouton ne correspondait pas aux tests ("Inviter un membre" vs "Nouvelle équipe").

**Aucune action nécessaire** - fermer Issue #3 comme "Won't Fix - Mock page".

**Option B - Implémentation complète (Long-terme):**
1. Créer backend tRPC pour team management
2. Remplacer mock data par vraies queries
3. Implémenter mutations (create, update, delete)
4. Tester avec vraies données

**Recommandation:** Option A pour l'instant (page mock documentée).

---

### Fix 3: Audio Files UPDATE (Issue #5)

**Fichier:** `packages/client/src/pages/AudioFiles.tsx`

**Rechercher le pattern existant:**

```bash
# Trouver où sont les action buttons:
grep -n "button.*Edit\|MoreVertical" packages/client/src/pages/AudioFiles.tsx
```

**Ajouter state et handler pour Edit:**

```tsx
// Dans la fonction AudioFiles(), ajouter:
const [editFileId, setEditFileId] = useState<number | null>(null);
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

const handleEditFile = (fileId: number) => {
  setEditFileId(fileId);
  setIsEditDialogOpen(true);
};

// Ajouter Dialog pour Edit après le Dialog CREATE existant:
<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modifier le fichier audio</DialogTitle>
      <DialogDescription>
        Mettre à jour les métadonnées du fichier
      </DialogDescription>
    </DialogHeader>
    {/* Form fields similaires au CREATE */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
        Annuler
      </Button>
      <Button onClick={() => {
        // TODO: updateFile.mutate({ id: editFileId, ... })
      }}>
        Enregistrer
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Attacher le handler aux boutons Edit:**

Trouver les action buttons et ajouter `onClick={() => handleEditFile(file.id)}`.

---

### Fix 4: Shares CREATE + UPDATE (Issue #6)

**Fichier:** `packages/client/src/pages/Shares.tsx`

**Même pattern que Tracks:** Ajouter Dialog pour CREATE et UPDATE.

**État à ajouter:**

```tsx
const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
const [editShareId, setEditShareId] = useState<number | null>(null);
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
```

**Dialogs à implémenter:**
1. CREATE Dialog pour "Nouveau partage"
2. UPDATE Dialog pour Edit button

**Champs du formulaire:**
- Projet/Track selection
- Email destinataire
- Limite d'accès
- Date d'expiration

---

## Phase 2: Type Coercion Bugs (Issues #7-#11)

**Durée estimée:** 2-3 jours
**Difficulté:** Moyenne (frontend + backend)
**Impact:** Débloque UPDATE pour 5 entités

### Fix 1: Sessions UPDATE - useState → useEffect (Issue #7)

**Fichier:** `packages/client/src/pages/SessionDetail.tsx`
**Lignes:** 77-91

**CASSÉ (ligne 77):**
```tsx
useState(() => {
  if (session) {
    setFormData({ ...fields });
  }
});
```

**CORRIGER EN:**
```tsx
useEffect(() => {
  if (session) {
    setFormData({
      // ... tous les champs
    });
  }
}, [session]); // Dependency array importante!
```

**Import à ajouter (ligne 1):**
```tsx
import { useState, useEffect } from "react";
```

---

### Fix 2: Projects UPDATE - Empty Strings → NULL (Issue #8)

**Fichier:** `packages/server/src/routers/projects.ts`
**Ligne:** Après ligne 108 (dans UPDATE mutation)

**AJOUTER cette transformation:**
```tsx
.mutation(async ({ ctx, input }) => {
  const tenantDb = await ctx.getTenantDb();

  // Transform empty strings to null for numeric fields
  const updateData = {
    ...input,
    budget: input.budget === '' ? null : input.budget,
    totalCost: input.totalCost === '' ? null : input.totalCost,
  };

  const [updated] = await tenantDb
    .update(projects)
    .set(updateData)
    .where(eq(projects.id, input.id))
    .returning();

  return updated;
})
```

---

### Fix 3: Contracts UPDATE - Same Pattern (Issue #9)

**Fichier:** `packages/server/src/routers/contracts.ts`

**Même fix que Projects:**
```tsx
const updateData = {
  ...input,
  value: input.value === '' ? null : input.value,
  terms: input.terms === '' ? null : input.terms,
};
```

---

### Fix 4: Quotes CREATE/UPDATE - z.coerce.date() (Issue #10)

**Fichier:** `packages/server/src/routers/quotes.ts`
**Lignes:** 56 (CREATE), 85 (UPDATE)

**CASSÉ:**
```tsx
validUntil: z.date()
```

**CORRIGER EN:**
```tsx
validUntil: z.coerce.date()
```

Appliquer aux deux endroits (CREATE et UPDATE schemas).

---

### Fix 5: Rooms UPDATE - z.coerce.number() (Issue #11)

**Fichier:** `packages/server/src/routers/rooms.ts`
**Lignes:** 90-92

**CASSÉ:**
```tsx
hourlyRate: z.number().optional()
halfDayRate: z.number().optional()
fullDayRate: z.number().optional()
```

**CORRIGER EN:**
```tsx
hourlyRate: z.coerce.number().optional()
halfDayRate: z.coerce.number().optional()
fullDayRate: z.coerce.number().optional()
```

---

### Fix 6: Invoices UPDATE - Add Missing Fields

**Fichier:** `packages/server/src/routers/invoices.ts`
**Ligne:** ~120-130 (UPDATE schema)

**AJOUTER ces champs:**
```tsx
update: protectedProcedure
  .input(
    z.object({
      id: z.number(),
      data: z.object({
        // ... existing fields ...
        subtotal: z.string().optional(),
        taxRate: z.string().optional(),    // AJOUTER
        taxAmount: z.string().optional(),  // AJOUTER
        total: z.string().optional(),      // AJOUTER
        // ... rest ...
      }),
    })
  )
```

**ET dans InvoiceDetail.tsx:**
Vérifier que handleSave() inclut ces champs dans le payload.

---

## Phase 3: DateTime Component (Issue #12)

**Durée estimée:** 3-5 jours
**Difficulté:** Moyenne-Haute
**Impact:** Débloque automated testing pour 4 entités

### Option A: Manual Testing (1 jour)

**Action:** Accepter le blocker, documenter procédures de test manuel.

**Avantages:**
- Rapide
- Aucun code à changer
- Users non affectés

**Inconvénients:**
- Pas de regression tests automatisés
- CI/CD incomplet

---

### Option B: Playwright E2E (3 jours) ✅ RECOMMANDÉ

**Action:** Créer suite de tests Playwright pour entités avec DateTime.

**Installation:**
```bash
cd packages/client
npm install -D @playwright/test
npx playwright install
```

**Créer fichiers de test:**

`packages/client/e2e/sessions-crud.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test('create session with datetime fields', async ({ page }) => {
  await page.goto('/sessions/new');

  // Playwright peut remplir les champs DateTime
  await page.getByLabel('Date de début *').fill('2025-12-27T14:00');
  await page.getByLabel('Date de fin *').fill('2025-12-27T16:00');

  await page.getByLabel('Titre *').fill('Test Session');
  await page.getByLabel('Client').selectOption('1');
  await page.getByLabel('Salle').selectOption('1');

  await page.getByRole('button', { name: 'Créer la session' }).click();

  await expect(page).toHaveURL(/\/sessions\/\d+/);
  await expect(page.getByText('Test Session')).toBeVisible();
});

test('update session', async ({ page }) => {
  await page.goto('/sessions/1');
  await page.getByRole('button', { name: 'Modifier' }).click();

  await page.getByLabel('Titre').fill('Session Modifiée');
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await expect(page.getByText('Session Modifiée')).toBeVisible();
});
```

**Répéter pour:** Invoices, Quotes, Expenses.

**Config Playwright:**

`packages/client/playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'https://recording-studio-manager.com',
    // ou 'http://localhost:5173' en dev
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
```

**Run tests:**
```bash
npx playwright test
npx playwright test --headed  # Mode visual
```

---

### Option C: Replace DateTime Component (5 jours)

**Action:** Migrer vers HTML5 inputs standard.

**Pour date-only fields (Invoices, Quotes, Expenses):**
```tsx
<input
  type="date"
  name="issueDate"
  required
  className="..."
/>
```

**Pour datetime fields (Sessions):**
```tsx
<input
  type="datetime-local"
  name="startTime"
  required
  className="..."
/>
```

**Avantages:**
- Native browser support
- Meil compatibilité
- Facile à tester
- UX standard

**Inconvénients:**
- Changement UI visible
- 5 jours de travail
- Requiert design review

---

## Checklist de Test Finale

Après toutes les corrections:

### Silent Button Failures (Phase 1)
- [ ] Tracks: "Nouvelle Track" ouvre le dialog
- [ ] Tracks: Dialog CREATE fonctionne
- [ ] Tracks: Boutons Edit fonctionnent
- [ ] Audio Files: Boutons Edit fonctionnent
- [ ] Shares: "Nouveau partage" ouvre le dialog
- [ ] Shares: Boutons Edit fonctionnent

### Type Coercion (Phase 2)
- [ ] Sessions UPDATE: POST renvoie 200 OK (pas 500)
- [ ] Projects UPDATE: Empty budget/totalCost acceptés
- [ ] Contracts UPDATE: Empty value/terms acceptés
- [ ] Quotes CREATE: Date string acceptée
- [ ] Rooms UPDATE: String rates convertis en numbers

### DateTime (Phase 3)
- [ ] Sessions: Tests Playwright passent
- [ ] Invoices: Tests Playwright passent
- [ ] Quotes: Tests Playwright passent
- [ ] Expenses: Tests Playwright passent

### Regression Testing
- [ ] Entities qui marchaient avant marchent toujours
- [ ] Rooms, Clients, Talents: CRUD complet OK
- [ ] Aucune nouvelle erreur console
- [ ] Build réussit sans erreurs TypeScript

---

## Déploiement

**Après toutes les corrections:**

```bash
# 1. Build client
cd packages/client
npm run build

# 2. Build server
cd ../server
npm run build

# 3. Deploy
./scripts/deploy.sh

# 4. Smoke test production
npm run test:e2e:prod

# 5. Monitor for 24h
# Check logs, error rates, user reports
```

---

## Success Criteria

**Phase 4 peut commencer quand:**
- [ ] 11/11 bugs P1 résolus (Issues #3-#11, sauf #12 optionnel)
- [ ] 11/14 entités (80%+) ont CRUD fonctionnel
- [ ] Aucun silent button failure
- [ ] Tous les UPDATE operations fonctionnent
- [ ] Tests de régression passent
- [ ] Production stable pendant 24h

**Timeline réaliste:**
- Phase 1: 1-2 jours
- Phase 2: 2-3 jours
- Phase 3: 0-5 jours (selon option choisie)
- Testing: 1 jour
- **Total: 4-11 jours**

---

**Guide créé:** 2025-12-27
**Status:** Prêt pour implémentation
**Reviewer:** À assigner
