# TODO_MASTER.md - Recording Studio Manager HYBRIDE

> **🚀 STACK HYBRIDE - Phase 2 EN COURS 🔵**
> **Phase actuelle**: Phase 2 - Features Critiques (Semaine 7-9)
> **Dernière mise à jour**: 2025-12-13 (Session: Synchronisation docs + Démarrage Phase 2)
> **Repo GitHub**: https://github.com/lolomaraboo/recording-studio-manager-hybrid

---

## 📊 Vue d'Ensemble Migration

| Phase | Durée | Budget | Status |
|-------|-------|--------|--------|
| **Phase 1: Infrastructure & Base** | 4-6 sem | ~$15k | ✅ COMPLÉTÉ (100%) |
| **Phase 2: Features Critiques** | 6-8 sem | ~$25k | 🔵 EN COURS (0%) |
| Phase 3: Enterprise | 6-8 sem | ~$25k | ⏸️ PENDING |
| Phase 4: Multi-Région | 4-6 sem | ~$15k | ⏸️ PENDING |

**Total:** 5-6 mois | ~$80k développement

---

## 🎯 Stack Technique Cible

```
Frontend: React 19 + TypeScript + TailwindCSS 4 + shadcn/ui
Backend: Express + tRPC 11 + TypeScript
Database: PostgreSQL Database-per-Tenant VRAI (isolation physique)
ORM: Drizzle ORM (TypeScript-first)
Auth: Manus OAuth + 2FA TOTP
Storage: S3 pour fichiers audio
Real-time: Socket.IO WebSockets
Multi-région: us-east-1 + eu-west-1 + ap-southeast-1
Monitoring: Prometheus + Grafana
```

---

## ✅ PHASE 1: Infrastructure & Base (4-6 semaines) - 100% COMPLÉTÉ

### ✅ Semaine 1-2: Setup Projet & Database (100% COMPLÉTÉ)

| Priorité | Tâche | Status | Notes |
|----------|-------|--------|-------|
| 🔴 HAUTE | Créer repo `recording-studio-manager-hybrid` | ✅ DONE | Commit 7d6afc5 pushé |
| 🔴 HAUTE | Setup monorepo TypeScript | ✅ DONE | pnpm workspaces configuré |
| 🔴 HAUTE | Configurer TypeScript strict mode | ✅ DONE | tsconfig.json strict: true |
| 🔴 HAUTE | Setup pnpm workspaces | ✅ DONE | pnpm-workspace.yaml créé |
| 🔴 HAUTE | Créer package @rsm/shared | ✅ DONE | Types, constants, utilities |
| 🔴 HAUTE | Créer package @rsm/database | ✅ DONE | Drizzle ORM + PostgreSQL |
| 🔴 HAUTE | Migrer schéma Master DB vers Drizzle | ✅ DONE | master/schema.ts (users, orgs, tenant_databases) |
| 🔴 HAUTE | Migrer schéma Tenant DB vers Drizzle | ✅ DONE | tenant/schema.ts (clients, sessions, invoices, etc.) |
| 🔴 HAUTE | Implémenter getTenantDb() TypeScript | ✅ DONE | connection.ts avec pooling + cache |
| 🟡 MOYENNE | Script migration initiale | ✅ DONE | packages/database/src/scripts/init.ts (560+ lignes) |
| 🟡 MOYENNE | Tests unitaires DB switching | ✅ DONE | Vitest 13 tests, coverage >80% (92.63%) |
| 🟡 MOYENNE | Seed data (3 orgs démo) | ✅ DONE | 3 orgs: Studio Pro, Beat Lab, Home Studio |

**Livrables Semaine 1-2:**
- ✅ Repo configuré avec TypeScript strict (27 fichiers, 1,576+ lignes, ~350KB)
- ✅ Schémas Drizzle master + tenant
- ✅ Fonction getTenantDb() opérationnelle avec PostgreSQL
- ✅ Script migration + seed avec 3 orgs de démo (560+ lignes)
- ✅ Configuration monorepo finalisée (pnpm-workspace.yaml, .env)
- ✅ Dépendances installées (68 packages)
- ✅ PostgreSQL 17 installé et configuré
- ✅ Tests unitaires Vitest (13 tests, coverage 92.63% >80%)

**Stats Infrastructure Créée:**
- Packages: 2/4 créés (✅ shared, ✅ database, ⏳ server, ⏳ client)
- Database-per-Tenant: ✅ ACTIF dès jour 1 (pas commenté comme Manus)
- TypeScript: 0 erreur (strict mode)
- Script init: ✅ Master DB + 3 tenant DBs + seed réaliste
- Config: ✅ pnpm workspaces, .env, 68 packages installés

---

### ✅ Semaine 3-4: Backend Core & tRPC (100% COMPLÉTÉ)

| Priorité | Tâche | Status | Notes |
|----------|-------|--------|-------|
| 🔴 HAUTE | Setup Express + tRPC server | ✅ DONE | Port 3001, health endpoint OK |
| 🔴 HAUTE | Créer package @rsm/server | ✅ DONE | Express + tRPC 11 + TypeScript |
| 🔴 HAUTE | Middleware createTRPCContext | ✅ DONE | Tenant switching ACTIF (vs Manus commenté) |
| 🔴 HAUTE | Procédure protectedProcedure | ✅ DONE | Auth middleware + type narrowing |
| 🔴 HAUTE | Procédure adminProcedure | ✅ DONE | Role-based access control |
| 🔴 HAUTE | Router `auth` | ✅ DONE | login, logout, me (mock auth) |
| 🔴 HAUTE | Router `organizations` | ✅ DONE | CRUD orgs (Master DB) |
| 🔴 HAUTE | Router `sessions` | ✅ DONE | CRUD sessions (Tenant DB) |
| 🔴 HAUTE | Router `clients` | ✅ DONE | CRUD clients (Tenant DB) |
| 🔴 HAUTE | Router `invoices` | ✅ DONE | CRUD invoices (Tenant DB) |
| 🟡 MOYENNE | Tests API avec Vitest | ✅ DONE | 8 tests, tous passent ✅ |
| 🟡 MOYENNE | Documentation tRPC auto | ⏸️ SKIP | Viendra avec frontend |

**Livrables Semaine 3-4:**
- ✅ Backend Express + tRPC configuré (port 3001)
- ✅ Middleware tenant switching ACTIF (getTenantDb dans context)
- ✅ 5 routers core implémentés
- ✅ Tests API avec Vitest (8 tests, 100% pass)
- ✅ API testée et fonctionnelle (curl + health + tRPC)

---

### ✅ Semaine 5-6: Frontend Core (100% COMPLÉTÉ)

| Priorité | Tâche | Status | Notes |
|----------|-------|--------|-------|
| 🔴 HAUTE | Setup React 19 + Vite | ✅ DONE | Port 5174, build 468KB JS + 29KB CSS |
| 🔴 HAUTE | Créer package @rsm/client | ✅ DONE | Structure complète, 13 fichiers |
| 🔴 HAUTE | Configurer TailwindCSS 4 | ✅ DONE | @tailwindcss/postcss, nouvelle syntaxe @import + @theme |
| 🔴 HAUTE | Installer shadcn/ui | ✅ DONE | components.json configuré |
| 🔴 HAUTE | Installer composants shadcn/ui | ✅ DONE | 9 composants: button, card, input, select, label, dialog, dropdown-menu, table, sonner |
| 🔴 HAUTE | Configurer tRPC client | ✅ DONE | AppRouter import depuis @rsm/server, type safety OK |
| 🔴 HAUTE | Corriger routers backend | ✅ DONE | auth, orgs, invoices, sessions fixés |
| 🔴 HAUTE | Installer React Router | ✅ DONE | react-router-dom avec nested routes |
| 🔴 HAUTE | Layout avec Sidebar | ✅ DONE | Sidebar + Header + Main avec Outlet |
| 🔴 HAUTE | Page Dashboard | ✅ DONE | Widgets stats + recent activity cards |
| 🔴 HAUTE | Page Sessions | ✅ DONE | Structure prête pour calendrier + liste |
| 🔴 HAUTE | Page Clients | ✅ DONE | Structure prête pour table + formulaire |
| 🔴 HAUTE | Page Invoices | ✅ DONE | Structure prête pour liste + génération |
| 🔴 HAUTE | Bug fix tRPC port | ✅ DONE | Port 3000 → 3001 (commit 7494b5e) |
| 🟡 MOYENNE | Toast notifications | ✅ DONE | Sonner installé et configuré |
| 🟡 MOYENNE | Palettes couleurs | ✅ DONE | Gray, purple, blue scales complètes |

**Livrables Semaine 5-6:**
- ✅ Package @rsm/client créé avec React 19 + Vite + TypeScript
- ✅ TailwindCSS v4 configuré (nouvelle syntaxe @import + @theme)
- ✅ 9 composants shadcn/ui installés (button, card, input, select, label, dialog, dropdown-menu, table, sonner)
- ✅ React Router configuré avec navigation
- ✅ Layout complet: Sidebar + Header + Main responsive
- ✅ 4 pages core créées: Dashboard, Sessions, Clients, Invoices
- ✅ tRPC client avec type safety bout-en-bout
- ✅ Build Vite réussi (468KB JS, 29KB CSS, 2.6s)
- ✅ Bug fix critique: tRPC port 3000 → 3001
- ✅ Tests end-to-end: backend + frontend opérationnels
- ✅ Corrections backend: 4 routers fixés (auth, orgs, invoices, sessions)
- ✅ Thème enrichi avec palettes complètes (gray, purple, blue)
- ✅ Git commit 7494b5e pushé sur GitHub

---

## 🔵 PHASE 2: Features Critiques (6-8 semaines) - EN COURS

> **Status:** EN COURS - Démarré le 2025-12-13

### ✅ Pré-requis Phase 2 (COMPLÉTÉ)
| Priorité | Tâche | Status | Notes |
|----------|-------|--------|-------|
| 🔴 HAUTE | Connecter pages aux endpoints tRPC | ✅ DONE | Commit 53fc2da - Dashboard, Sessions, Clients, Invoices |
| 🔴 HAUTE | Stats calculées depuis vraies données | ✅ DONE | Sessions count, revenue, clients actifs |
| 🔴 HAUTE | Mapping clientId → name | ✅ DONE | Lookup client dans sessions/invoices |

### 🔵 Semaine 7-9: Authentification & Formulaires (EN COURS)

| Priorité | Tâche | Status | Notes |
|----------|-------|--------|-------|
| 🔴 HAUTE | Authentification JWT (backend) | ✅ DONE | JWT + refresh tokens + bcrypt |
| 🔴 HAUTE | Login/Logout pages | ✅ DONE | UI avec shadcn/ui, toast notifications |
| 🔴 HAUTE | Protected routes React Router | ✅ DONE | ProtectedRoute component + redirect |
| 🔴 HAUTE | Session management | ✅ DONE | AuthProvider + localStorage + cookies |
| 🔴 HAUTE | react-hook-form setup | ⏸️ TODO | Form library |
| 🔴 HAUTE | zod validation schemas | ⏸️ TODO | Type-safe validation |
| 🔴 HAUTE | FormField composant réutilisable | ⏸️ TODO | Input + label + error |
| 🟡 MOYENNE | DataTable composant | ⏸️ TODO | Tri, filtrage, pagination |
| 🟡 MOYENNE | LoadingSkeleton composant | ⏸️ TODO | Loading states |
| 🟡 MOYENNE | ErrorBoundary composant | ⏸️ TODO | Error handling UI |
| 🟡 MOYENNE | ConfirmDialog composant | ⏸️ TODO | Delete confirmations |

**Accomplissements Session 2025-12-13 (Auth):**
- ✅ Module JWT complet: access tokens (15min) + refresh tokens (7j)
- ✅ Bcrypt password hashing (12 rounds)
- ✅ Auth router: login, logout, me, refresh, register, switchOrganization
- ✅ AuthProvider React context avec useAuth hook
- ✅ ProtectedRoute component avec loading state
- ✅ Page Login avec UI shadcn/ui
- ✅ Header avec user menu et logout
- ✅ CORS configuré avec credentials
- ✅ Build réussi: 479KB JS + 31KB CSS

### ⏸️ Semaine 10-12: Portail Client Self-Service

| Priorité | Tâche | Status | Notes |
|----------|-------|--------|-------|
| 🔴 HAUTE | Backend: clientAuth router | ⏸️ TODO | Login client avec token |
| 🔴 HAUTE | Backend: clientPortal router | ⏸️ TODO | Self-service API |
| 🔴 HAUTE | Frontend: Dashboard client | ⏸️ TODO | Vue client séparée |
| 🔴 HAUTE | Auto-réservation sessions | ⏸️ TODO | Interface booking |
| 🔴 HAUTE | Intégration Stripe | ⏸️ TODO | Paiement en ligne |
| 🟡 MOYENNE | Partage fichiers audio | ⏸️ TODO | Upload/download |

### ⏸️ Semaine 13-14: Gestion Projets Musicaux

| Priorité | Tâche | Status | Notes |
|----------|-------|--------|-------|
| 🔴 HAUTE | Schéma DB: projects, musicians, credits | ⏸️ TODO | Drizzle migrations |
| 🔴 HAUTE | Backend: projects router | ⏸️ TODO | CRUD projets |
| 🔴 HAUTE | Frontend: Kanban board | ⏸️ TODO | Drag & drop étapes |
| 🔴 HAUTE | Upload audio S3 | ⏸️ TODO | Versioning fichiers |
| 🟡 MOYENNE | Crédits musiciens | ⏸️ TODO | Producteur, ingé, etc. |

### ⏸️ Semaine 15-16: Devis & Contrats

| Priorité | Tâche | Status | Notes |
|----------|-------|--------|-------|
| 🔴 HAUTE | Backend: quotes router | ⏸️ TODO | CRUD devis |
| 🔴 HAUTE | Génération PDF devis | ⏸️ TODO | Template professionnel |
| 🔴 HAUTE | Conversion devis → facture | ⏸️ TODO | Automatique |
| 🔴 HAUTE | Intégration DocuSign | ⏸️ TODO | E-signature contrats |
| 🟡 MOYENNE | Templates contrats | ⏸️ TODO | Contrats types |

### ⏸️ Tests E2E Phase 2

| Priorité | Tâche | Status | Notes |
|----------|-------|--------|-------|
| 🔴 HAUTE | Setup Playwright | ⏸️ TODO | Config + fixtures |
| 🔴 HAUTE | Tests auth flow | ⏸️ TODO | Login/logout/protected |
| 🔴 HAUTE | Tests CRUD clients | ⏸️ TODO | Create/read/update/delete |
| 🔴 HAUTE | Tests booking sessions | ⏸️ TODO | Réservation flow |
| 🟡 MOYENNE | Tests paiement Stripe | ⏸️ TODO | Mock Stripe |

---

## ⏸️ PHASE 3: Enterprise (6-8 semaines)

> **Status:** PENDING - Démarrage après Phase 2

### Semaine 15-17: SSO/SAML + Custom Domains
- SSO: Okta, Auth0, Azure AD
- 2FA: TOTP avec QR code + backup codes
- Custom Domains: SSL automatique Let's Encrypt

### Semaine 18-20: White-Label + Audit Logging
- White-Label: Logo, couleurs, emails brandés
- Audit: Logging SOC2, dashboard admin, exports CSV

### Semaine 21-22: i18n + Multi-Devises
- i18n: EN, FR, ES, DE, IT, PT (i18next)
- Devises: EUR, USD, GBP, CAD, JPY, AUD
- API: exchangerate-api.com

---

## ⏸️ PHASE 4: Multi-Région & Polish (4-6 semaines)

> **Status:** PENDING - Démarrage après Phase 3

### Semaine 23-25: Déploiement Multi-Région
- Régions: us-east-1 (primary), eu-west-1, ap-southeast-1
- PostgreSQL: Streaming replication
- CDN: CloudFront geo-routing

### Semaine 26-28: Tests, Monitoring & Documentation
- Tests: E2E (Playwright), unitaires (Vitest >80%), load (k6)
- Monitoring: Prometheus, Grafana, Sentry
- Docs: User guide, API docs, runbooks

---

## 🚀 Prochaines Actions Immédiates

### ✅ PRIORITÉ 1 - SEMAINE 1-2 (COMPLÉTÉ)
1. ✅ ~~Créer GitHub repo `recording-studio-manager-hybrid`~~ (DONE)
2. ✅ ~~Setup structure monorepo avec pnpm workspaces~~ (DONE)
3. ✅ ~~Configurer TypeScript strict mode~~ (DONE)
4. ✅ ~~Créer package @rsm/shared~~ (DONE)
5. ✅ ~~Créer package @rsm/database~~ (DONE)
6. ✅ ~~Créer script migration initiale + seed 3 orgs~~ (DONE)
7. ✅ ~~Installer PostgreSQL 17 + exécuter migration~~ (DONE)
8. ✅ ~~Créer tests unitaires getTenantDb() avec Vitest (>80% coverage)~~ (DONE - 92.63%)

### ✅ PRIORITÉ 2 - SEMAINE 3-4 (COMPLÉTÉE)
1. ✅ ~~Créer package @rsm/server (Express + tRPC)~~ (DONE)
2. ✅ ~~Implémenter middleware createTRPCContext~~ (DONE)
3. ✅ ~~Créer procédures protectedProcedure + adminProcedure~~ (DONE)
4. ✅ ~~Créer 5 routers core (auth, orgs, sessions, clients, invoices)~~ (DONE)
5. ✅ ~~Créer tests API avec Vitest (8 tests, tous passent)~~ (DONE)

### ✅ PRIORITÉ 3 - SEMAINE 5-6 (COMPLÉTÉE)
1. ✅ ~~Setup React 19 + Vite~~ (DONE - build 468KB JS + 29KB CSS)
2. ✅ ~~Créer package @rsm/client~~ (DONE - 13 fichiers)
3. ✅ ~~Configurer TailwindCSS 4~~ (DONE - @tailwindcss/postcss)
4. ✅ ~~Installer shadcn/ui~~ (DONE - components.json)
5. ✅ ~~Installer composants shadcn/ui~~ (DONE - 9 composants)
6. ✅ ~~Configurer tRPC client~~ (DONE - type safety OK)
7. ✅ ~~Corriger routers backend~~ (DONE - auth, orgs, invoices, sessions)
8. ✅ ~~Installer React Router~~ (DONE - nested routes)
9. ✅ ~~Créer Layout avec Sidebar~~ (DONE - Sidebar + Header + Main)
10. ✅ ~~Créer 4 pages core~~ (DONE - Dashboard, Sessions, Clients, Invoices)
11. ✅ ~~Bug fix tRPC client port~~ (DONE - 3000 → 3001, commit 7494b5e)
12. ✅ ~~Tests end-to-end~~ (DONE - backend + frontend opérationnels)

### 🔵 PRIORITÉ 4 - PHASE 2 SEMAINE 7-9 (EN COURS)
1. ✅ ~~Connecter pages aux endpoints tRPC (fetch real data)~~ (DONE - commit 53fc2da)
2. ✅ ~~Implémenter authentification JWT (remplacer mock)~~ (DONE - JWT + bcrypt + refresh tokens)
3. ✅ ~~Login/Logout pages + Protected routes~~ (DONE - AuthProvider + ProtectedRoute)
4. 🔵 Ajouter formulaires avec react-hook-form + zod ← **PROCHAINE TÂCHE**
5. ⏸️ Créer composants réutilisables (FormField, DataTable, etc.)
6. ⏸️ Tests Vitest pour composants React
7. ⏸️ Backend: clientAuth router (portail client)
8. ⏸️ Frontend: Dashboard client self-service
9. ⏸️ Intégration Stripe pour paiements
10. ⏸️ Tests E2E avec Playwright
11. ⏸️ Auto-réservation sessions pour clients

---

## 📁 Fichiers Clés Créés

**✅ Phase 1 - Semaine 1-2 (COMPLÉTÉS):**
- `/packages/shared/src/types.ts` - Types partagés
- `/packages/shared/src/constants.ts` - Constantes
- `/packages/shared/package.json` - Config package shared
- `/packages/database/src/master/schema.ts` - Schéma Master DB
- `/packages/database/src/tenant/schema.ts` - Schéma Tenant DB
- `/packages/database/src/connection.ts` - getTenantDb() + pooling
- `/packages/database/src/scripts/init.ts` - Script migration + seed
- `/packages/database/vitest.config.ts` - Config Vitest + coverage
- `/packages/database/src/__tests__/setup.ts` - Setup tests
- `/packages/database/src/__tests__/connection.test.ts` - 13 tests (92.63% coverage)
- `/packages/database/package.json` - Config package database
- `/pnpm-workspace.yaml` - Workspace config
- `/tsconfig.json` - TypeScript config strict
- `/README.md` - Documentation projet

**⏸️ Phase 1 - Semaine 3-4 (À CRÉER):**
- `/packages/server/src/index.ts` - Express app
- `/packages/server/src/trpc/context.ts` - createTRPCContext
- `/packages/server/src/trpc/routers/auth.ts`
- `/packages/server/src/trpc/routers/organizations.ts`
- `/packages/server/src/trpc/routers/sessions.ts`
- `/packages/server/src/trpc/routers/clients.ts`
- `/packages/server/src/trpc/routers/invoices.ts`

**⏸️ Phase 1 - Semaine 5-6 (À CRÉER):**
- `/packages/client/src/main.tsx` - React entry point
- `/packages/client/src/pages/Dashboard.tsx`
- `/packages/client/src/pages/Sessions.tsx`
- `/packages/client/src/pages/Clients.tsx`
- `/packages/client/src/pages/Invoices.tsx`
- `/packages/client/src/components/Layout.tsx`
- `/packages/client/src/components/Sidebar.tsx`
- `/packages/client/src/components/CommandPalette.tsx`

---

## 📚 Références

**Documentation complète:**
- Resume session: `~/.claude/resumes/recording-studio-manager/resume.md`
- Analyse Manus: `Memories/vault/projects/recording-studio-manager/versions/manus/_INDEX.md`
- Plan migration: Voir documentation Obsidian

**Repos GitHub:**
- Version Claude (legacy): https://github.com/lolomaraboo/recording-studio-manager
- Version Manus (référence): https://github.com/lolomaraboo/recording-studio-manager_Manus
- Version Hybride (cible): https://github.com/lolomaraboo/recording-studio-manager-hybrid ⭐

---

## 💡 Notes Importantes

### Différences Critiques vs Version Manus
1. **Architecture:** Database-per-Tenant VRAI ✅ (pas commenté comme Manus)
2. **Database:** PostgreSQL (pas MySQL)
3. **TypeScript:** 0 erreur obligatoire (Manus avait 216 erreurs)
4. **Tests:** >80% coverage obligatoire dès le début
5. **getTenantDb():** Actif dès jour 1 (pas commenté pour plus tard)

### Pourquoi Stack Hybride?
- ✅ Architecture Claude: Production-ready, sécurité maximale (Database-per-Tenant VRAI)
- ✅ Stack Manus: Type safety, UX moderne, DX excellent
- ✅ Meilleur des deux mondes: Robustesse + Modernité

### Progrès Phase 1
- **Semaine 1-2:** ✅ 100% complétée (infra + migration + seed + tests + PostgreSQL)
- **Semaine 3-4:** ⏸️ Backend tRPC (à démarrer)
- **Semaine 5-6:** ⏸️ Frontend React (à démarrer)

---

**Créé le:** 2025-12-13
**Par:** Claude Opus 4
**Repo:** https://github.com/lolomaraboo/recording-studio-manager-hybrid
**Commit actuel:** En cours - Auth JWT implémenté
**Phase actuelle:** Phase 2 - Authentification ✅ / Formulaires ⏸️
