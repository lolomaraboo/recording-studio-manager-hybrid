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

```bash
# Dev mode (client + server en parallèle)
pnpm dev

# Build
pnpm build

# Type check (0 erreur obligatoire)
pnpm check

# Tests
pnpm test
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
