# Recording Studio Manager - Version Hybride

**Stack:** React 19 + TypeScript + Express + tRPC 11 + PostgreSQL + Drizzle ORM
**Architecture:** Database-per-Tenant (ACTIF dès le jour 1)

---

## Vue d'ensemble

Version Hybride = **Meilleur des deux mondes**
- ✅ **Architecture Claude:** Database-per-Tenant VRAI (isolation physique PostgreSQL)
- ✅ **Stack Manus:** React 19, TypeScript, tRPC 11, shadcn/ui, type safety end-to-end

---

## Architecture

### Monorepo Structure
```
recording-studio-manager-hybrid/
├── packages/
│   ├── shared/         # Types & utilities partagés
│   ├── database/       # Drizzle ORM + PostgreSQL schemas
│   ├── server/         # Express + tRPC backend
│   └── client/         # React 19 + Vite frontend
├── package.json        # Root workspace
└── tsconfig.json       # TypeScript config (strict mode)
```

### Database-per-Tenant

**Chaque organisation a sa propre base de données PostgreSQL**

**Master DB:**
- users
- organizations
- tenant_databases (mapping org → database)
- organization_members
- invitations
- subscription_plans

**Tenant DB (1 par organisation):**
- clients
- sessions
- invoices
- equipment
- rooms
- projects

---

## Setup

### Prérequis
- Node.js ≥ 20.0.0
- pnpm ≥ 9.0.0
- PostgreSQL ≥ 16

### Installation
```bash
# 1. Installer dépendances
pnpm install

# 2. Configuration
cp .env.example .env
# Éditer .env avec vos credentials PostgreSQL

# 3. Créer Master DB
createdb rsm_master

# 4. Appliquer migrations
pnpm db:migrate

# 5. Créer première org (crée aussi tenant DB)
pnpm seed
```

---

## Développement

### Démarrage Rapide

**⚠️ IMPORTANT:** Le serveur backend nécessite `DATABASE_URL` en variable d'environnement.

```bash
# Option 1: Script de démarrage (recommandé)
./start.sh

# Option 2: Démarrage manuel avec DATABASE_URL
DATABASE_URL="postgresql://postgres:password@localhost:5432/rsm_master" pnpm dev

# Option 3: Client et serveur séparés (pour debug)
# Terminal 1 - Backend
DATABASE_URL="postgresql://postgres:password@localhost:5432/rsm_master" pnpm --filter server dev

# Terminal 2 - Frontend
pnpm --filter client dev
```

### URLs Dev

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **tRPC Endpoint:** http://localhost:3001/api/trpc
- **Health Check:** http://localhost:3001/health

### Authentification Dev

En mode développement, l'authentification utilise des **headers de test** :
- `x-test-user-id: 1`
- `x-test-org-id: 1`

Ces headers sont automatiquement ajoutés par le client tRPC (voir `packages/client/src/main.tsx`).

### Autres Commandes

```bash
# Build production
pnpm build

# Type check (0 erreur obligatoire)
pnpm check

# Tests unitaires
pnpm test

# Tests avec coverage
pnpm --filter database test:coverage
```

---

## Scripts Database

```bash
# Générer migrations
pnpm db:generate

# Appliquer migrations
pnpm db:migrate

# Drizzle Studio (GUI)
pnpm db:studio
```

---

## Différences avec Manus

| Feature | Manus | Hybride |
|---------|-------|---------|
| Database | MySQL (Single-DB) | PostgreSQL (Database-per-Tenant) |
| getTenantDb() | Commenté ❌ | Actif ✅ |
| Erreurs TypeScript | 216 | 0 obligatoire |
| Tests Database-per-Tenant | Aucun | >80% coverage |
| Isolation données | organizationId filter | DB physiquement séparées |

---

## Stack Technique

### Frontend
- React 19.1
- TypeScript 5.9 (strict mode)
- Vite 7
- TailwindCSS 4
- shadcn/ui
- tRPC 11 client
- Wouter (routing)

### Backend
- Express 4
- tRPC 11 server
- Drizzle ORM 0.44
- PostgreSQL (postgres driver)
- JWT auth (jose)
- Socket.IO (real-time)

---

## License

MIT
