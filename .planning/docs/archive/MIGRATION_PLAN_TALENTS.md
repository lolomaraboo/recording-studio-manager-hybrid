# Plan de Migration: Musicians → Talents (Multi-Catégories)

**Date de création:** 2025-12-15
**Projet:** recording-studio-manager-hybrid
**Type:** Evolution architecturale
**Impact:** 🟡 MODÉRÉ - DB Schema + Router + UI
**Estimation:** 1-2 jours

---

## 📋 Contexte

**Problème:**
La table `musicians` est trop restrictive pour l'industrie créative moderne.

**Solution:**
Évolution vers un modèle "Talents" générique supportant plusieurs catégories:
- Musicians (musiciens, artistes audio)
- Actors (comédiens, voice actors)
- [Futures catégories possibles]

---

## 🎯 Objectifs

1. ✅ Ajouter support multi-catégories de talents
2. ✅ Maintenir backward compatibility (existing data)
3. ✅ Adapter l'UI pour filtres par catégorie
4. ✅ Mettre à jour les routers tRPC
5. ✅ Migration sans downtime

---

## 🏗️ Architecture Cible

### Option 1: Colonne talentType (RECOMMANDÉE)

**Avantages:**
- ✅ Backward compatible (migrations progressives)
- ✅ Pas de breaking changes
- ✅ Rollback facile si besoin

**Inconvénients:**
- ⚠️ Nom de table reste "musicians" (sémantiquement incorrect)

### Option 2: Renommage Table

**Avantages:**
- ✅ Sémantiquement correct ("talents" vs "musicians")
- ✅ Code plus clair

**Inconvénients:**
- ❌ Breaking change (requires code updates partout)
- ❌ Migrations plus complexes
- ❌ Risque downtime

**DÉCISION: Option 1** (ajouter colonne, garder nom table pour l'instant)

---

## 📊 Schéma Database

### État Actuel (musicians table)

```typescript
export const musicians = pgTable("musicians", {
  id: serial("id").primaryKey(),

  // Identity
  name: varchar("name", { length: 255 }).notNull(),
  stageName: varchar("stage_name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),

  // Professional
  bio: text("bio"),

  // Image
  imageUrl: varchar("image_url", { length: 500 }),

  // Notes
  notes: text("notes"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### État Cible (avec talentType)

```typescript
export const musicians = pgTable("musicians", {
  id: serial("id").primaryKey(),

  // Identity
  name: varchar("name", { length: 255 }).notNull(),
  stageName: varchar("stage_name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),

  // Professional
  bio: text("bio"),

  // 🆕 NEW: Talent Category
  talentType: varchar("talent_type", { length: 50 })
    .notNull()
    .default('musician'), // Default pour backward compatibility

  // Image
  imageUrl: varchar("image_url", { length: 500 }),

  // Notes
  notes: text("notes"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### Valeurs Enum talentType

```typescript
// packages/shared/src/types/talent.ts
export const TALENT_TYPES = {
  MUSICIAN: 'musician',
  ACTOR: 'actor',
  // Future: voice_actor, dancer, producer, etc.
} as const;

export type TalentType = typeof TALENT_TYPES[keyof typeof TALENT_TYPES];
```

---

## 🔄 Plan de Migration (7 étapes)

### Phase 1: Backend Schema (Jour 1 matin)

**Étape 1.1: Modifier le schéma Drizzle**
- Fichier: `packages/database/src/tenant/schema.ts`
- Action: Ajouter champ `talentType` avec default 'musician'
- Durée: 15 min

**Étape 1.2: Créer type shared**
- Fichier: `packages/shared/src/types/talent.ts`
- Action: Export TALENT_TYPES enum et TalentType
- Durée: 10 min

**Étape 1.3: Générer migration Drizzle**
```bash
cd packages/database
pnpm drizzle-kit generate --config=drizzle.config.tenant.ts
```
- Durée: 5 min

**Étape 1.4: Review migration SQL**
- Fichier: `packages/database/drizzle/migrations/tenant/000X_add_talent_type.sql`
- Vérifier: `ALTER TABLE musicians ADD COLUMN talent_type VARCHAR(50) DEFAULT 'musician' NOT NULL;`
- Durée: 10 min

**Étape 1.5: Appliquer migration (dev)**
```bash
# Option 1: db:push (dev rapide)
pnpm --filter @rsm/database run db:push:tenant

# Option 2: migration (prod-like)
./packages/database/scripts/migrate-tenant.sh tenant_1
./packages/database/scripts/migrate-tenant.sh tenant_2
./packages/database/scripts/migrate-tenant.sh tenant_3
```
- Durée: 10 min

**Tests:**
```sql
-- Vérifier la colonne existe
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'musicians' AND column_name = 'talent_type';

-- Vérifier data existante a default
SELECT id, name, talent_type FROM musicians LIMIT 5;
```

---

### Phase 2: Backend tRPC Router (Jour 1 après-midi)

**Étape 2.1: Renommer router (optionnel)**
- Fichier actuel: `packages/server/src/routers/musicians.ts`
- Option A: Garder nom (backward compat) ✅
- Option B: Renommer → `talents.ts`
- **DÉCISION:** Garder `musicians.ts` pour l'instant

**Étape 2.2: Ajouter filtres par talentType**
```typescript
// packages/server/src/routers/musicians.ts

export const musiciansRouter = t.router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      talentType: z.enum(['musician', 'actor']).optional(), // 🆕 NEW
    }))
    .query(async ({ ctx, input }) => {
      const db = await getContextDb(ctx);

      const where = input.talentType
        ? eq(musicians.talentType, input.talentType)
        : undefined;

      return await db
        .select()
        .from(musicians)
        .where(where)
        .limit(input.limit)
        .offset(input.offset);
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      stageName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      bio: z.string().optional(),
      talentType: z.enum(['musician', 'actor']).default('musician'), // 🆕 NEW
      imageUrl: z.string().url().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getContextDb(ctx);
      const [musician] = await db.insert(musicians).values(input).returning();
      return musician;
    }),

  // update, delete similaires
});
```
- Durée: 30 min

**Étape 2.3: Tests router**
```typescript
// packages/server/src/routers/__tests__/musicians.test.ts

describe('musicians router', () => {
  it('should filter by talentType=musician', async () => {
    const result = await caller.musicians.list({ talentType: 'musician' });
    expect(result.every(m => m.talentType === 'musician')).toBe(true);
  });

  it('should filter by talentType=actor', async () => {
    const result = await caller.musicians.list({ talentType: 'actor' });
    expect(result.every(m => m.talentType === 'actor')).toBe(true);
  });

  it('should create musician with default talentType', async () => {
    const musician = await caller.musicians.create({ name: 'Test' });
    expect(musician.talentType).toBe('musician');
  });

  it('should create actor explicitly', async () => {
    const actor = await caller.musicians.create({
      name: 'Actor Test',
      talentType: 'actor'
    });
    expect(actor.talentType).toBe('actor');
  });
});
```
- Durée: 30 min

---

### Phase 3: Frontend UI (Jour 2)

**Étape 3.1: Créer Talents.tsx (porter de Manus Musicians.tsx)**
- Fichier source: `recording-studio-manager-manus/client/src/pages/Musicians.tsx`
- Fichier destination: `recording-studio-manager-hybrid/packages/client/src/pages/Talents.tsx`
- Ajouter: Tabs ou Dropdown pour filtrer par talentType
- Durée: 2h

**Structure UI suggérée:**
```tsx
export function Talents() {
  const [selectedType, setSelectedType] = useState<TalentType | 'all'>('all');

  const { data: talents } = trpc.musicians.list.useQuery({
    talentType: selectedType === 'all' ? undefined : selectedType,
  });

  return (
    <div>
      {/* Header avec filtres */}
      <div className="flex items-center justify-between mb-6">
        <h1>Talents</h1>

        {/* Tabs pour catégories */}
        <Tabs value={selectedType} onValueChange={setSelectedType}>
          <TabsList>
            <TabsTrigger value="all">All ({talents?.length})</TabsTrigger>
            <TabsTrigger value="musician">Musicians</TabsTrigger>
            <TabsTrigger value="actor">Actors</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table talents */}
      <TalentsTable data={talents} />
    </div>
  );
}
```

**Étape 3.2: Formulaire création avec sélecteur type**
```tsx
<FormField
  control={form.control}
  name="talentType"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Type de talent</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <SelectTrigger>
          <SelectValue placeholder="Sélectionner un type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="musician">Musicien</SelectItem>
          <SelectItem value="actor">Comédien/Acteur</SelectItem>
        </SelectContent>
      </Select>
    </FormItem>
  )}
/>
```
- Durée: 1h

**Étape 3.3: Mettre à jour routing**
```tsx
// packages/client/src/App.tsx
<Route path="/talents" element={<Talents />} />
```

**Étape 3.4: Mettre à jour Sidebar navigation**
```tsx
// packages/client/src/components/layout/Sidebar.tsx
{
  title: 'Talents', // était "Musicians"
  path: '/talents',
  icon: Users,
}
```
- Durée: 15 min

---

## ✅ Checklist de Validation

### Backend
- [ ] Colonne `talent_type` ajoutée au schéma Drizzle
- [ ] Migration générée et appliquée (dev DBs)
- [ ] Type `TalentType` exporté dans `@rsm/shared`
- [ ] Router `musicians.list` accepte filtre `talentType`
- [ ] Router `musicians.create` accepte champ `talentType`
- [ ] Tests unitaires passent (filtres par type)
- [ ] Data existante a default `'musician'`

### Frontend
- [ ] Page `Talents.tsx` créée (clone Manus)
- [ ] Tabs/Dropdown pour filtrer par catégorie
- [ ] Formulaire création avec sélecteur type
- [ ] Navigation Sidebar mise à jour
- [ ] Route `/talents` configurée
- [ ] Build frontend sans erreurs TypeScript

### Testing
- [ ] Créer talent type=musician → succès
- [ ] Créer talent type=actor → succès
- [ ] Filtrer liste par musician → OK
- [ ] Filtrer liste par actor → OK
- [ ] Data legacy affichée correctement

### Documentation
- [ ] ROADMAP.md mis à jour
- [ ] Commit message détaillé
- [ ] mem0 sauvegarde décision
- [ ] (Optionnel) Doc Obsidian décision architecture

---

## 🚀 Timeline

**Jour 1 (4-5h):**
- Matin: Phase 1 Backend Schema (1h)
- Après-midi: Phase 2 Router tRPC + Tests (2h)

**Jour 2 (3-4h):**
- Phase 3 Frontend UI (3h)
- Testing & Validation (1h)

**Total: 7-9h** (réparti sur 1-2 jours)

---

## 🔄 Rollback Plan

Si problème détecté en prod:

**Option 1: Rollback DB (si migration récente)**
```sql
ALTER TABLE musicians DROP COLUMN talent_type;
```

**Option 2: Rollback code (si déployé)**
```bash
git revert <commit-hash>
git push
# Redeploy version précédente
```

**Option 3: Fix forward**
- Identifier bug
- Patcher rapidement
- Deploy hotfix

---

## 📝 Notes Additionnelles

### Futures Évolutions Possibles

1. **Renommage table complet:**
   - musicians → talents (breaking change)
   - Requiert migration majeure + update tous les imports

2. **Nouvelles catégories:**
   - voice_actor
   - dancer
   - producer
   - sound_engineer
   - etc.

3. **Sous-catégories:**
   - musician → guitarist, drummer, pianist, etc.
   - actor → theater, film, voice, etc.

### Considérations Sécurité

- ✅ Validation enum stricte côté backend (Zod)
- ✅ Pas de SQL injection (Drizzle ORM)
- ✅ Permission checks dans routers (protectedProcedure)

### Performance

- Index suggéré pour filtres rapides:
```sql
CREATE INDEX idx_musicians_talent_type ON musicians(talent_type);
```

---

**Prêt pour implémentation:** ✅
**Approuvé par:** [À remplir]
**Date début:** [À remplir]
**Date fin:** [À remplir]
