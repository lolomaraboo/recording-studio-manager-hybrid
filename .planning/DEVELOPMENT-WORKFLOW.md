# Development Workflow - CRITICAL DECISIONS

## 🚨 MIGRATION STRATEGY - READ THIS FIRST

**Date:** 2026-01-17
**Context:** Phase 20.1-01 - Database reset discussion
**Decision:** NEVER fix broken tenant migrations in development

### The Problem

Chaque fois qu'on touche au schema:
- ❌ Migrations se désynchronisent
- ❌ 2-3 heures perdues à débugger
- ❌ Phase 18.1, 18.2, 18.3 = 4+ heures juste pour migrations
- ❌ Frustration massive, blocage workflow

### The Solution: INCREMENT TENANT NUMBER

**Au lieu de réparer** → **Créer nouveau tenant**

```
tenant_1 → bugué? Laisse tomber
tenant_2 → bugué? Laisse tomber
tenant_3 → NOUVEAU ✅
tenant_4 → NOUVEAU ✅
```

### Workflow Officiel

Quand schema change ou tenant bugué:

```bash
# 1. Créer nouveau tenant (30 secondes)
psql -U postgres -d rsm_master -c "
INSERT INTO organizations (name, slug, subdomain, owner_id, subscription_tier)
VALUES ('Org N', 'org-n', 'orgn', 1, 'enterprise') RETURNING id;
"
# Note l'ID retourné (ex: 5)

psql -U postgres -c "CREATE DATABASE tenant_5;"

psql -U postgres -d rsm_master -c "
INSERT INTO tenant_databases (organization_id, database_name)
VALUES (5, 'tenant_5');
"

# 2. Appliquer migrations tenant
cd packages/database
DATABASE_URL="postgresql://postgres@localhost:5432/tenant_5" \
  pnpm exec drizzle-kit migrate --config=drizzle.tenant.config.ts

# 3. Seed data
DATABASE_URL="postgresql://postgres@localhost:5432/tenant_5" \
  pnpm exec tsx src/scripts/seed-tenant-data.ts

# 4. Update .env / dev headers pour utiliser org_id=5
```

### Pourquoi ça marche

✅ **Schema toujours frais** - Utilise le code TypeScript actuel
✅ **Zero debug** - Pas de conflit migrations anciennes
✅ **Rapide** - 30 secondes vs 2-3 heures
✅ **Réaliste** - C'est exactement comme la prod (nouveaux clients = nouveaux tenants)

### Anciens tenants = Poubelle

**En développement:**
- tenant_1, tenant_2, etc. = IGNORE
- Laisse-les exister, on s'en fout
- Ils ne prennent pas de place significative

**En production:**
- Cette stratégie NE S'APPLIQUE PAS
- Production = migrations progressives obligatoires
- Zero perte de données clients

### Quand nettoyer

Optionnel, uniquement si ça dérange:

```bash
# Drop anciens tenants
psql -U postgres -c "DROP DATABASE IF EXISTS tenant_1;"
psql -U postgres -c "DROP DATABASE IF EXISTS tenant_2;"

# Nettoyer master DB
psql -U postgres -d rsm_master -c "
DELETE FROM tenant_databases WHERE organization_id IN (1, 2);
DELETE FROM organization_members WHERE organization_id IN (1, 2);
DELETE FROM organizations WHERE id IN (1, 2);
"
```

## 🎯 Configuration Drizzle Tenant

**IMPORTANT:** Il faut un fichier `drizzle.tenant.config.ts` séparé pour les migrations tenant.

Si absent, créer:

```typescript
// packages/database/drizzle.tenant.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/tenant/schema.ts",
  out: "./drizzle/migrations/tenant",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/tenant_1",
  },
  verbose: true,
  strict: true,
});
```

## 📝 Résumé

**RÈGLE D'OR EN DEV:**
- Schema change → Nouveau tenant
- Tenant bugué → Nouveau tenant
- Migration fail → Nouveau tenant

**JAMAIS:**
- ❌ Réparer migrations anciennes
- ❌ Debugger désynchronisation schema/migrations
- ❌ Perdre 2-3 heures sur ça

**TOUJOURS:**
- ✅ Incrémenter numéro tenant
- ✅ Utiliser schema actuel
- ✅ Continuer à builder

---

**Cette décision a été prise après:**
- Phase 18.1: 7 min (fix DB init)
- Phase 18.2: 4 min (schema desync)
- Phase 18.3: 67 min (nuclear reset)
- Phase 20.1: Discussion - STOP ce pattern

**Total temps perdu sur migrations:** ~80 minutes sur 3 jours

**Nouveau pattern:** 30 secondes par nouveau tenant ✅
