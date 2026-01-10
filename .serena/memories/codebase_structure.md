# Codebase Structure

## Root Directory

```
recording-studio-manager-hybrid/
├── packages/              # Monorepo packages
├── e2e/                   # E2E tests (Playwright)
├── .planning/             # Phase planning system
├── .claude/               # Claude Code configuration
├── .serena/               # Serena configuration
├── docs/                  # Documentation
├── nginx/                 # Nginx configuration
├── scripts/               # Utility scripts
├── node_modules/          # Dependencies
├── playwright-report/     # Playwright test reports
├── test-results/          # Test results
├── package.json           # Root workspace config
├── pnpm-workspace.yaml    # pnpm workspace config
├── tsconfig.json          # TypeScript root config
├── playwright.config.ts   # Playwright configuration
├── docker-compose.yml     # Docker dev environment
├── docker-compose.production.yml  # Docker production
├── start.sh               # Dev startup script
└── README.md              # Main documentation
```

## Monorepo Packages

### packages/shared

Shared types and utilities used across client and server.

```
packages/shared/
├── src/
│   ├── types/             # Shared TypeScript types
│   └── utils/             # Shared utility functions
├── package.json
└── tsconfig.json
```

### packages/database

Database schemas, migrations, and connection management.

```
packages/database/
├── src/
│   ├── master/
│   │   └── schema.ts      # Master DB schema
│   ├── tenant/
│   │   └── schema.ts      # Tenant DB schema
│   ├── connection.ts      # Connection manager (CRITICAL)
│   ├── index.ts           # Public exports
│   ├── scripts/           # Database utility scripts
│   │   ├── test-data/     # Test data SQL scripts
│   │   └── migrations/    # Manual migration scripts
│   └── __tests__/         # Unit tests
├── drizzle/               # Generated migrations
├── vitest.config.ts       # Vitest configuration
├── package.json
└── tsconfig.json
```

**Key Files:**
- `connection.ts:70-128` - `getTenantDb()` function (DATABASE-PER-TENANT)
- `master/schema.ts` - users, organizations, tenant_databases
- `tenant/schema.ts` - clients, sessions, invoices, equipment, rooms, projects

### packages/server

Express + tRPC backend API.

```
packages/server/
├── src/
│   ├── routers/           # tRPC routers (API endpoints)
│   │   ├── clients.ts
│   │   ├── sessions.ts
│   │   ├── invoices.ts
│   │   ├── equipment.ts
│   │   ├── rooms.ts
│   │   ├── projects.ts
│   │   └── ...
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic services
│   ├── utils/             # Utility functions
│   │   ├── vcard-service.ts
│   │   ├── excel-service.ts
│   │   └── csv-service.ts
│   ├── webhooks/          # Stripe webhooks
│   ├── routes/            # Express routes
│   ├── emails/            # Email templates
│   ├── lib/               # Libraries
│   ├── _core/             # Core functionality
│   ├── scripts/           # Server scripts
│   ├── __tests__/         # Unit tests
│   └── index.ts           # Server entry point
├── package.json
└── tsconfig.json
```

**Entry Point:** `src/index.ts`
- Initializes Express server
- Sets up tRPC middleware
- Configures Socket.IO
- Registers webhooks and routes

### packages/client

React 19 + Vite frontend.

```
packages/client/
├── src/
│   ├── pages/             # Page components
│   │   ├── admin/         # Admin pages
│   │   ├── client-portal/ # Client portal pages
│   │   ├── public/        # Public pages
│   │   └── superadmin/    # SuperAdmin pages
│   ├── components/        # Reusable components
│   │   ├── ui/            # shadcn/ui components
│   │   └── ...
│   ├── lib/               # Client utilities
│   ├── hooks/             # Custom React hooks
│   ├── main.tsx           # App entry point
│   ├── App.tsx            # Root component
│   └── index.css          # Global styles
├── public/                # Static assets
├── dist/                  # Build output
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # TailwindCSS config
├── package.json
└── tsconfig.json
```

**Entry Point:** `src/main.tsx`
- Sets up tRPC client
- Configures development auth headers
- Renders React app

## E2E Tests

```
e2e/
├── auth/                  # Authentication tests
├── crud/                  # CRUD operation tests
│   └── clients-enriched.spec.ts
├── features/              # Feature tests
├── workflows/             # User workflow tests
├── infrastructure/        # Infrastructure tests
├── global-setup.ts        # Playwright global setup
└── README.md
```

## Planning System

```
.planning/
├── phases/
│   └── [NN-phase-name]/
│       ├── [NN-MM-PLAN.md]
│       └── [NN-MM-SUMMARY.md]
├── PROJECT.md
└── ROADMAP.md
```

## Configuration Files

### Root Level

- `package.json` - Root workspace, scripts, dependencies
- `pnpm-workspace.yaml` - Workspace package definitions
- `tsconfig.json` - Shared TypeScript config
- `playwright.config.ts` - E2E test configuration

### Per Package

Each package has:
- `package.json` - Package dependencies and scripts
- `tsconfig.json` - Package-specific TypeScript config
- `vitest.config.ts` (if has tests) - Test configuration

### Docker

- `docker-compose.yml` - Development environment
- `docker-compose.production.yml` - Production environment
- `docker-compose.monitoring.yml` - Monitoring stack
- `.dockerignore` - Docker build exclusions

### Environment

- `.env` - Development environment variables
- `.env.example` - Environment variable template
- `.env.production.example` - Production template
- `.env.production.local` - Production overrides (gitignored)
- `.env.test` - Test environment

## Key File Locations

### Database Connection (MOST IMPORTANT)
`packages/database/src/connection.ts`

### tRPC Root Router
`packages/server/src/index.ts` (combines all routers)

### Frontend Entry
`packages/client/src/main.tsx`

### Test Data
`packages/database/scripts/test-data/setup-test-studio-ui.sql`

### UI Validation
`packages/database/scripts/test-data/validate-ui-complete.sh`

### Schemas
- Master: `packages/database/src/master/schema.ts`
- Tenant: `packages/database/src/tenant/schema.ts`

## Package Dependencies

### Dependency Graph

```
client
  ↓ imports
shared
  ↑ types

server
  ↓ imports
shared, database
  ↑ types, ↑ connection

database
  ↓ imports
shared
  ↑ types
```

**Rule:** No circular dependencies allowed.

## Hidden Directories

- `.git/` - Git repository
- `.worktrees/` - Git worktrees (feature branches)
- `node_modules/` - npm packages
- `.serena/` - Serena agent configuration
- `.auto-claude/` - Auto-claude configuration
- `.claude/` - Claude Code configuration

## Build Outputs

- `packages/client/dist/` - Client build (Vite)
- `packages/server/dist/` - Server build (if needed, currently uses tsx)
- `playwright-report/` - Playwright HTML reports
- `test-results/` - Playwright test artifacts
