# Test Data Scripts

Scripts for creating comprehensive test data for UI validation and development.

## Scripts

### `setup-test-studio-ui.sql`

Creates complete seed data for Organization 16 "Test Studio UI" on local database.

**Usage:**
```bash
docker exec -i rsm-postgres psql -U postgres -d tenant_16 < packages/database/scripts/test-data/setup-test-studio-ui.sql
```

**Creates:**
- 5 clients (Emma Dubois, Lucas Martin, Sound Production SARL, Sarah Petit, Alexandre Grand)
- 4 rooms (Studio Principal, Studio Mix, Studio Master, Salle Répétition)
- 8 equipment items (Neumann U87 Ai, Shure SM7B, Apollo x16, API 512c, Genelec 8361A, Gibson Les Paul, Yamaha C7 Piano, SSL Fusion)
- 8 sessions (mix of completed and scheduled)
- 4 projects (Horizons Lointains, Night Sessions Vol.1, Blue Notes, Delta Road)
- 10 tracks with full metadata
- 3 musicians/talents
- 3 invoices with line items

### `create-test-studio-user.sql`

Creates admin user for Test Studio UI organization.

**Usage:**
```bash
docker exec -i rsm-postgres psql -U postgres -d rsm_master < packages/database/scripts/test-data/create-test-studio-user.sql
```

**Creates:**
- Email: `admin@test-studio-ui.com`
- Password: `password` (bcrypt hashed)
- Role: Owner of Organization 16

### `validate-ui-complete.sh`

Automated bash script to validate UI harmonization patterns across all pages.

**Usage:**
```bash
cd packages/client/src/pages
bash ../../../../packages/database/scripts/test-data/validate-ui-complete.sh
```

**Validates:**
- Pages with `text-primary` icons
- Pages with `pb-3` cards
- Admin pages with `pt-2 pb-4 px-2` container
- Client Portal pages with correct spacing
- Super Admin pages with correct spacing
- Public/Auth pages with `pt-6` centering

## Purpose

These scripts were created during Phase 3.14-04 (UI Harmonization) to:
1. Provide complete realistic test data for all UI pages
2. Enable visual validation of harmonization patterns
3. Support localhost:5174 development testing

## Context

- **Phase:** 3.14-ameliorations-ui-toutes-pages
- **Plan:** 3.14-04-PLAN.md
- **Created:** 2026-01-05
- **Organization:** Test Studio UI (ID: 16, local database)
