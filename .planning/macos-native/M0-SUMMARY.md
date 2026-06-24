# M0 — Fondations sync côté serveur — SUMMARY

**Date :** 2026-06-11
**Statut :** ✅ TERMINÉ — validé en local le 2026-06-11 sur tenant_25 (org 25, E2E Test Studio) : upgrade appliqué, triggers vérifiés via psql, 4/4 tests d'intégration passés contre le serveur live, `pnpm check` exit 0. Fix au passage : clauses `IN` au lieu de `ANY(array)` dans sync.ts (binding Drizzle).

## Livré

| Fichier | Rôle |
|---|---|
| `packages/database/src/tenant/schema.ts` | `syncColumns` (sync_uuid, sync_version) sur les 33 tables + nouvelles tables `sessionStaff`, `sessionEquipment`, `trackRevisions`, `syncLog` + colonnes workflow (`sessions.bookingType/seriesId/recurrenceRule`, `projects.includedRevisions`, `clients.defaultDepositPercent`) |
| `packages/database/src/tenant/sync-upgrade.sql` | Upgrade SQL idempotent : colonnes sync, sync_log, tables workflow, triggers (bump version + changelog + `pg_notify('rsm_sync')`) |
| `packages/database/src/scripts/apply-sync-upgrade.ts` | Applique l'upgrade à un tenant (`tenant_16`) ou `--all` |
| `packages/server/src/routes/sync.ts` | API REST `/api/sync/pull` (delta par curseur sync_log) + `/api/sync/push` (mutations avec détection de conflit par version, LWW sur delete, émission Socket.IO `sync:dirty`) |
| `packages/server/src/index.ts` | Montage de `/api/sync` |
| `packages/server/src/__tests__/sync.integration.test.ts` | Tests d'intégration (guarded par `SYNC_TEST_ORG_ID`) |

## Décisions techniques

1. **Changelog par triggers DB** (pas de modification des 30 routeurs tRPC) : toute écriture web est automatiquement journalisée dans `sync_log` → visible des Macs. Zéro risque de divergence.
2. **Contrat snake_case** : l'API sync parle les noms de colonnes DB natifs (simple côté Swift/GRDB).
3. **Conflits** : update = optimistic concurrency sur `sync_version` (bump par trigger) ; delete = last-write-wins ; insert = idempotent (`ON CONFLICT (sync_uuid) DO NOTHING`).
4. **Sécurité** : whitelist de 27 tables synchronisées, colonnes validées contre `information_schema`, colonnes protégées (`id`, `sync_version`, `created_at`) ignorées, identifiants via `sql.identifier`.
5. **`pg_notify('rsm_sync')`** émis par les triggers — le bridge LISTEN → Socket.IO (notif temps réel des écritures web vers les Macs) est reporté à M1.

## Validation effectuée

- **Triggers SQL : 15/15 checks** passés contre PostgreSQL 18 (PGlite) — idempotence (double application), génération uuid, bump version, tombstones, sémantique conflit/idempotence du push.
- **Typecheck : 0 erreur** sur database, server, shared (`tsc --noEmit`).
- Corrections au passage de 3 erreurs TS préexistantes : `migrate-vat-data.ts` (import inutilisé), `clients.ts:1025` (`projects.title` → `projects.name`), `preferences.ts` (`ctx.userId` → `ctx.user.id`).

## À faire sur ta machine (Postgres requis)

```bash
# 1. Appliquer l'upgrade au tenant de dev
DATABASE_URL="postgresql://postgres:password@localhost:5432/rsm_master" \
  pnpm --filter database tsx src/scripts/apply-sync-upgrade.ts tenant_16

# 2. Lancer le serveur puis les tests d'intégration
./start.sh
SYNC_TEST_ORG_ID=16 pnpm --filter server test sync.integration

# 3. Vérification globale
pnpm check
```

## Hors périmètre M0 (reporté)

- Bridge `LISTEN rsm_sync` → Socket.IO (M1)
- Auth par token JWT/Keychain pour le client Mac — l'API accepte session + headers dev pour l'instant (M1)
- Validation métier au push (chevauchement de salles/staff → statut `conflict`) (M3)
- Erreurs `tsc` strict du package client (préexistantes, hors gate `pnpm check`)
