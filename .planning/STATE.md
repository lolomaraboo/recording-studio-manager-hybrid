# Project State

## Project Summary
[IMMUTABLE - Copy verbatim from PROJECT.md on creation. Never edit this section.]

**Building:** App SaaS multi-tenant commerciale prête à vendre pour studios d'enregistrement professionnels - Marketing ready platform for all studio segments (Starter/Pro/Enterprise)

**Core requirements:**
- Phase 5 complétée (Projects Management 100% fonctionnel)
- Production stable (0 erreurs CORS, monitoring actif)
- Stripe billing complet (Subscriptions Starter/Pro/Enterprise)
- Landing page publique + pricing visible + démo fonctionnelle
- Onboarding smooth (nouveau studio signup → première session <5min)
- Support infrastructure (email, docs utilisateur, FAQ)
- Tests end-to-end validés (signup → dashboard → booking → payment → project)
- Performance acceptable (dashboard <2s, API <500ms)
- Sécurité production (HTTPS, CORS, secrets sécurisés, backups DB)
- Legal ready (Terms, Privacy, GDPR compliance)

**Constraints:**
- Budget cloud optimisé, scaling basé sur tenants réels (VPS Hostinger €20/mois initial)
- Stack technique locked-in (TypeScript, PostgreSQL, tRPC - refonte = 3+ mois)
- Pas de deadline imposée (construire jusqu'à qualité commerciale)
- VPS 4GB RAM limite ~20-30 tenant DBs simultanés en cache

## Current Position

Phase: 39 of 45 (Gestion TVA Multi-Taux)
Plan: 4/4 complete (39-01 ✅, 39-02 ✅, 39-03 ✅, 39-04 ✅)
Status: Phase complete - VAT rate management fully functional (frontend + backend + data migration)
Last activity: 2026-01-22 - Completed quick-013: Test modification facture (E2E Playwright)

Progress: ██████████ 100% (v4.0: 24/24 plans complete ✅) + Phase 18: 2/3 plans (18-01 ✅, 18-02 ⏸️) + Phase 18.1: 1/3 plans (18.1-01 ✅) + Phase 18.2: 1/3 plans (18.2-01 ✅) + Phase 18.3: 1/1 plans (18.3-01 ✅) + Phase 18.4: 3/3 plans (18.4-01 ✅, 18.4-02 ✅, 18.4-03 ✅) + Phase 19: 4/4 plans (19-01 ✅, 19-02 ✅, 19-03 ✅, 19-04 ✅) + Phase 20: 1/1 plans (20-01 ✅) + Phase 20.1: 2/2 plans (20.1-01 ✅, 20.1-02 ✅) + Phase 21: 3/3 plans (21-01 ✅, 21-02 ✅, 21-03 ✅) + Phase 21.1: 1/1 plans (21.1-01 ✅) + Phase 22: 10/10 plans (22-01 ✅, 22-02 ✅, 22-03 ✅, 22-04 ✅, 22-05 ✅, 22-06 ✅, 22-07 ✅, 22-08 ✅, 22-09 ✅, 22-10 ✅) + Phase 23: 1/1 plans (23-01 ✅) + Phase 24: 2/2 plans (24-01 ✅, 24-02 ✅) + Phase 25: 2/2 plans (25-01 ✅, 25-02 ✅) + Phase 26: 1/1 plans (26-01 ✅) + Phase 26.1: 1/1 plans (26.1-01 ✅) + Phase 26.2: 1/1 plans (26.2-01 ✅) + Phase 27: 2/2 plans (27-01 ✅, 27-02 ✅) + Phase 28: 5/5 plans (28-01 ✅, 28-02 ✅, 28-03 ✅, 28-04 ✅, 28-05 ✅) + Phase 29: 1/1 plans (29-01 ✅) + Phase 39: 4/4 plans (39-01 ✅, 39-02 ✅, 39-03 ✅, 39-04 ✅)

## Performance Metrics

**Velocity:**
- Total plans completed: 124
- Average duration: 27.8 min
- Total execution time: 57.8 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 3/3 | 52 min | 17 min |
| 2 | 2/2 | 22 min | 11 min |
| 3 | 3/3 | 36 min | 12 min |
| 3.1 | 1/1 | 4.5h | 270 min |
| 3.2 | 2/2 | 42 min | 21 min |
| 3.4 | 6/6 | 98 min | 16.3 min |
| 3.5 | 1/1 | 20 min | 20 min |
| 3.6 | 1/1 | 70 min | 70 min |
| 3.8.1 | 1/1 | 65 min | 65 min |
| 3.8.2 | 1/1 | 7 min | 7 min |
| 3.8.3 | 1/1 | 33 min | 33 min |
| 3.8.4 | 3/3 | 26 min | 8.7 min |
| 3.9 | 2/2 | 157 min | 78.5 min |
| 3.9.1 | 1/2 | 8 min | 8 min |
| 3.9.4 | 2/2 | 480 min | 240 min |
| 3.10 | 3/3 | 84 min | 28 min |
| 3.11 | 4/4 | 55 min | 13.8 min |
| 3.13 | 2/2 | 45 min | 22.5 min |
| 3.14 | 4/4 | 170 min | 42.5 min |
| 10 | 3/6 | 47 min | 15.7 min |
| 11 | 1/3 | 795 min | 795 min |
| 11.5 | 3/3 | 43 min | 14.3 min |
| 12 | 3/3 | 20 min | 6.7 min |
| 13 | 1/1 | 90 min | 90 min |
| 14 | 1/1 | 3 min | 3 min |
| 15 | 1/1 | 16 min | 16 min |
| 15.5 | 1/1 | 89 min | 89 min |
| 16 | 3/3 | 39 min | 13 min |
| 17 | 4/4 | 80 min | 20.0 min |
| 18 | 2/3 | 8 min | 4 min |
| 18.1 | 1/3 | 7 min | 7 min |
| 18.2 | 1/3 | 4 min | 4 min |
| 18.3 | 1/1 | 67 min | 67 min |
| 19 | 4/4 | 11 min | 2.8 min |
| 20 | 1/1 | 3 min | 3 min |
| 20.1 | 2/2 | 15 min | 7.5 min |
| 21 | 3/3 | 22 min | 7.3 min |
| 21.1 | 1/1 | 5 min | 5 min |
| 18.4 | 3/3 | 46 min | 15.3 min |
| 22 | 10/10 | 87 min | 8.7 min |
| 23 | 1/1 | 3 min | 3 min |
| 24 | 2/2 | 11 min | 5.5 min |
| 25 | 2/2 | 8 min | 4 min |
| 26 | 1/1 | 7 min | 7 min |
| 26.1 | 1/1 | 47 min | 47 min |
| 26.2 | 1/1 | 2 min | 2 min |
| 27 | 2/2 | 4 min | 2 min |
| 28 | 5/5 | 18 min | 3.6 min |
| 29 | 1/1 | 4 min | 4 min |
| 39 | 4/4 | 41 min | 10.3 min |

**Recent Trend:**
- Last 5 plans: [4 min, 7 min, 7.5 min, 8 min, 18.5 min]
- Trend: Phase 39 COMPLETE (4/4 plans, 10.3 min avg). Plan 39-04 (18.5 min): Created complete VAT rate management UI in Settings Finance tab. Built VatRatesSection component with table, dropdown actions, and mutations. Implemented Create/Edit dialogs with form validation. Added default rate badge with star icon. Implemented archive prevention for rates in use. Added archived rates visibility toggle. Implemented unarchive functionality for restoring archived rates. Fixed toast import to use sonner instead of shadcn useToast for consistency. 7 atomic commits (2 core tasks + 1 integration + 4 orchestrator corrections). 520 lines of React/TypeScript code. Ready for Phase 40 (Invoices/Quotes VAT Integration).

## Accumulated Context

### Major Features Discovered (Not Originally in GSD Planning)

**During comprehensive audits (2025-12-26, 2025-12-31), discovered 93+ implemented features not documented:**

1. **AI Chatbot COMPLET (40 AI tools)** - SSE streaming, anti-hallucination detection (4 rules), Playwright tests 4/4 passing
2. **Client Portal COMPLET (10 features)** - Email/password, magic link, password reset, booking, payments, dashboard, profile, activity logs, device fingerprinting, ownership verification
3. **Audio System professionnel** - Upload Cloudinary, versioning 4 versions (demo/rough/final/master), AudioPlayer custom HTML5 (227 lines), TrackDetail 3 Phase 5 cards
4. **20 UX Components avancés** - Command Palette (Cmd+K), Notification Center, Dark/Light Theme, Global Search, Toast, Breadcrumbs, Status Badges, Loading Skeletons, Delete Confirmations, Responsive Mobile, French date formatting, Type-safe end-to-end
5. **Testing infrastructure** - Playwright E2E (8 test files: auth, command-palette, ai-chatbot, global-search, ui-validation, navigation, complete-journeys, production-health), Vitest unit (3 test files: connection, projects integration, routers)
6. **Tracks enrichment** - 17 nouveaux champs Phase 5 (copyright metadata 8 fields, technical details 5 fields, versioning 4 fields)
7. **Database schema** - 32 PostgreSQL tables (7 master + 25 per tenant) - Comprehensive multi-tenant architecture
8. **Git history** - 152 commits in 7 days (Dec 24-31, 2025) - Intensive development (21.7 commits/day average)

**Phase 5 Mystery RESOLVED:**
- TODO_MASTER showed "11/12 items (92%)" but didn't list Item 11
- Audit discovered: Item 11 = Documentation Phase 5 (FAIT Session 4), Item 12 = Tests E2E (optionnel)
- **Phase 5 = 100% fonctionnel** même sans tests E2E formels (tests manuels validés)

### Decisions Made

| Phase | Decision | Rationale |
|-------|----------|-----------|
| Init | Database-per-Tenant architecture | Isolation données maximale, conformité RGPD, performance indépendante par tenant vs Single-DB organizationId filter |
| Init | Phase 5 avant Phase 4.3 P2 | Projects Management = feature différenciante business > optimisations infrastructure invisibles |
| Init | Production VPS unique vs multi-région | Budget-conscious, scaling basé tenants réels. Multi-région AWS = $500+/mois prématuré |
| Init | CORS HTTPS fix prioritaire | Backend accepte http:// mais bloque https:// → Production broken, blocage critique |
| Init | Pricing tiers €29/€99/€299 | Adresser tous segments (Starter petits studios, Pro moyens, Enterprise gros) |
| Init | English-first, i18n v2.0 | Marché US/UK = 60%+ studios, i18n = 6 semaines dev. Canada/Europe après traction |
| Init | Stripe billing vs custom | Time-to-market, PCI compliance gratuit. Custom billing = 4+ semaines overhead |
| Init | Monitoring basique v1.0 | <100 tenants = health checks + Sentry suffit. Prometheus/Grafana = overhead ops prématuré |
| 1 | CORS regex pattern over static array | Dynamic origin callback with regex allows flexible subdomain matching vs hardcoded list. Maintains security with pattern validation. |
| 1 | Docker restart vs rebuild for deployment | Server uses tsx (no build step), restart sufficient to load new code. Rebuild would fail (no dist/ directory). |
| 1 | Automated Playwright verification | Repeatable validation > manual testing. Created test suite for future regression testing of HTTPS/CORS. |
| 1 | Uptime Kuma over UptimeRobot | Self-hosted monitoring provides more control, no external dependencies. User-requested alternative to SaaS monitoring. |
| 1 | 60-second heartbeat interval | Balanced monitoring frequency for early problem detection without excessive overhead on free tier. |
| 1 | Sentry DSN configuration deferred | Code infrastructure ready in both backend and frontend. Environment variables to be added when Sentry project created. |
| 1 | Automated testing over manual validation | Created Playwright test suite for repeatable validation and CI/CD readiness. Enables regression testing for future deploys. |
| 1 | Docker image rebuild for production fixes | Server image rebuilt with tenant provisioning fix to ensure persistence across container restarts. |
| 1 | Test account kept active in production | test-validation-1766731401390@recording-studio-manager.com remains for future regression testing and validation. |
| 2 | Test Strategy with Authentication Caveat | Registration doesn't auto-login users (likely intentional for security). Test implements graceful degradation - validates UI structure exists when authenticated. Trade-off: Full automation requires auth fix OR test-only bypass. |
| 2 | Behavioral integration testing over full CRUD mocking | Instead of complex Drizzle ORM mocks (300+ lines, brittle on ORM updates), focused integration tests on router structure, auth middleware, and input validation. E2E tests (02-01) already validate full CRUD flows with real DB. Better ROI: 24 solid tests in 200 lines vs fragile mocks. |
| 3 | Stripe SDK in database package for seeding | Added stripe@20.1.0 to database package to enable subscription plans seed script. Reuses existing Stripe SDK version from server package. Alternative would be manual Stripe API setup requiring duplicate code. |
| 3 | Subscription email templates deferred to Phase 6 | Webhook handlers mark email functions as TODO (sendSubscriptionConfirmationEmail, sendPaymentFailedEmail). Phase 6 (Support & Documentation) will implement all email templates together. Core subscription flow functional without emails. |
| 3 | Storage check in updateVersionUrl endpoint | Plan suggested uploadTrack endpoint, but actual router uses updateVersionUrl pattern. Added optional fileSizeMB parameter for flexibility and consistency with existing architecture. |
| 3 | TenantDb type for middleware | Used PostgresJsDatabase (TenantDb) instead of NodePgDatabase as codebase uses postgres.js adapter consistently. Maintains type safety across middleware and routers. |
| 3.1 | Cookie domain with leading dot | `.recording-studio-manager.com` (with dot) enables subdomain cookie sharing per RFC standard vs wildcard patterns. Required for multi-tenant authentication. |
| 3.1 | Trust proxy configuration | `app.set('trust proxy', 1)` instead of array/function for single Nginx proxy. Simple case, no need for complex trust logic. |
| 3.1 | sameSite: lax vs none | Chose 'lax' for balance of security and usability. Allows top-level navigation, blocks CSRF without requiring always-secure like 'none'. |
| 3.1 | Direct tsx command in Dockerfile | Avoid pnpm wrapper to prevent runtime DNS lookups. Workaround for VPS systemd-resolved issues where containers can't resolve DNS via 127.0.0.53. |
| 3.1 | Port 3002 vs debugging 3001 | Changed production port instead of debugging orphaned docker-proxy processes. Pragmatic choice - faster deployment, equally effective. |
| 3.1 | Google DNS in daemon.json | Use 8.8.8.8 instead of host resolver for container DNS. systemd-resolved (127.0.0.53) doesn't work inside Docker containers on Ubuntu 24.04. |
| 3.8.1 | Docker rebuild deployment strategy | Client container builds from source (not pre-built dist/), so deployment requires: rsync source → rebuild image → restart container. Discovered after attempting dist/ rsync (files not served due to baked-in image). |
| 3.8.4 | Shared Qdrant infrastructure | Reused existing Qdrant Docker container (running for 6 weeks, shared with mem0-api) instead of creating dedicated instance. Payload-based multi-tenancy via organizationId filtering ensures secure isolation. |
| 3.8.4 | OpenAI text-embedding-3-small | Selected for 5x cost efficiency ($0.02 vs $0.10/M tokens) compared to ada-002, same quality at 1536 dimensions. |
| 3.8.4 | Payload-based multi-tenancy | Official Qdrant best practice - single collection with organizationId filters instead of separate collections per tenant. Better performance and simpler management. |
| 3.8.4 | Conditional RAG strategy | Recent context (15 messages) loaded always for continuity, RAG retrieval triggered only on memory keywords (4 patterns). Zero latency for 80% normal questions, +200ms for 20% memory queries. Fire-and-forget Qdrant storage prevents response blocking. |
| 3.9 | Environment variable authentication | Used `SUPERADMIN_EMAIL` env var instead of hardcoded email for security and configurability |
| 3.9 | Read-only Docker operations | Prevented container restart/stop/exec for safety, only monitoring operations exposed |
| 3.9 | Password filtering | Excluded password hashes from user list endpoint for security |
| 3.9 | Pagination default 50 | Scalable approach for large datasets in listOrganizations and listUsers |
| 3.9 | Dedicated SuperAdmin sidebar layout | User explicitly requested "les trois onglets devrait etre dans la sidebar et on devrait avoir que ca dedans" - completely separate layout from normal dashboard with only 3 superadmin menu items (Services, Database, Logs). Improved UX clarity and admin workflow isolation. |
| 13 | Multi-context time tracking (trackId support) | Extended time tracking from session/project to also support track-level timing. User requested "on doit tout pouvoir timer" - studios bill at different granularities (session=room rental, project=album, track=individual song work). Added trackId column, XOR validation, migration created. Maximum billing flexibility. |
| 14 | Optional session-project linkage (nullable FK) | Sessions can optionally belong to a project via projectId column. Nullable FK with SET NULL on delete ensures sessions survive project deletion (historical session records preserved). Supports dual workflows: standalone sessions (hourly bookings) OR project-linked sessions (album recording). Backend ready for Phase 15 UI adaptation. |
| 15 | Display project ID instead of title in Sessions list | Sessions.tsx shows "Projet #{id}" instead of project title because sessions.list backend doesn't JOIN projects table. Trade-off: Simplicity Phase 15 (UI only, 16 min) vs perfectionism (backend modification + LEFT JOIN = out of scope, +2-3h). Functional but sub-optimal UX. Future improvement: Modify sessions router to include project.title in response. |
| 16 | Line items format for auto-invoices | Chose format "{TaskType} - {hours}h{minutes} @ {rate}€/h" for maximum client clarity. Shows exact duration and applied rate. Alternatives considered: just task name (too vague), duration only (no rate visibility), rate only (no duration detail). Selected format balances readability and transparency. |
| 16 | Session vs project invoicing modes | Implemented 2 explicit modes with strict validation. Session mode = single booking invoicing (room rental per session). Project mode = consolidated project invoicing (all work on album). Studios operate both ways depending on client relationship and service type. Validation prevents mixing entries from different contexts. |
| 16 | Time entry grouping by task type | Auto-consolidate entries of same task type into single line item. 10 Recording entries → 1 line "Recording - 5h30 @ 50€/h". Rationale: Invoice readability (2-3 lines vs 15 entries), client clarity, industry standard practice. Maintains accuracy through aggregation before calculation. |
| 16 | Arithmétique en centimes | Convertir montants en centimes entiers avant calculs pour éviter floating point errors. Pattern: `(subtotalCents * taxRateCents) / 10000`. Rationale: JavaScript floating point = imprécis (0.1 + 0.2 = 0.30000000000000004), centimes entiers garantissent exactitude financière absolue. Format cohérent end-to-end avec database decimal(10,2) stocké en strings. |
| 16 | Validation double tax calculation | 2 validations - (1) Après calculateTax, (2) Après database insert. Rationale: Garantit intégrité calcul + persistance. Catch edge cases (ex: migration changeant precision). Vérifie `total = subtotal + taxAmount` avec tolérance 0.01€ (exact avec cents arithmetic). |
| 17 | Stripe Checkout Sessions over Payment Element | Utilisé mode 'payment' avec invoice_creation auto pour génération PDF. Rationale: Stripe-hosted page = moins de PCI compliance overhead, invoice PDF auto-généré, redirect URLs simples. Alternative (Payment Element embedded) = plus de frontend complexity + PCI scope. |
| 17 | Idempotency via event tracking table | Table stripe_webhook_events avec eventId unique + processedAt timestamp. Rationale: Industry standard pattern, garantit qu'un webhook ne soit jamais traité 2x même si Stripe retry. Alternative (Redis cache) = moins durable, alternative (no idempotency) = risque double payment. |
| 17 | Database transactions for webhook handlers | Wrapper status update + event tracking dans tenantDb.transaction(). Rationale: Garantit atomicité - si event tracking fail, status update rollback (et vice-versa). Évite états inconsistants. |
| 17 | Resend over SendGrid for email | React Email integration, simpler API, 3k free emails/month. Rationale: Time-to-market faster, modern DX, sufficient free tier for MVP. Alternative (SendGrid) = plus features mais setup complexe, alternative (self-hosted SMTP) = maintenance overhead. |
| 17 | PDFKit over Puppeteer for PDF generation | Programmatic layout <100ms, lightweight 20MB RAM, no browser overhead. Rationale: MVP speed critical, simple A4 invoices suffisent, no need HTML/CSS rendering. Alternative (Puppeteer) = 500MB RAM + Chromium, alternative (react-pdf) = JSX overhead but cleaner syntax. |
| 17 | AWS S3 over filesystem for PDF storage | Scalable cloud-native storage, signed URLs with expiry, encryption at rest. Rationale: Docker/Heroku require cloud storage, S3 industry standard, 1-year lifecycle policy for tax retention. Alternative (filesystem) = ne scale pas multi-server, alternative (Cloudinary) = trop cher pour PDFs. |
| 17 | Upload PDF before email send | Guarantee attachment availability, avoid broken links if S3 fails. Rationale: User experience priority - email with attachment OR no email, never email without attachment. If S3 fails, email send also fails (logged for retry). |
| 17 | Badge colors via className custom | shadcn/ui Badge ne supporte pas variants "success"/"warning", utilisé className avec bg-green-500 (PAID) et bg-orange-500 (PARTIALLY_PAID). Alternative (créer nouveaux variants dans badge.tsx) = overhead maintenance, alternative (utiliser default partout) = moins de clarté visuelle. |
| 17 | invoices.get enrichi avec items | Query get ne chargeait pas line items → impossible d'afficher détail facture. Ajout `with: { items: true, client: true }` pour cohérence avec autres queries enrichies du router. Critique pour UX client. |
| 17-FIX | Stop at architectural boundary | Route path fix (17-03-FIX) complete, but tests exposed Client Portal auth persistence bug. Applied Rule 4 (architectural decision): stop fix plan, create new plan for auth issue rather than expanding scope. Rationale: GSD best practice = narrow scope fixes, defer discovered issues. Auth system modification = architectural change requiring separate investigation (session cookies, ProtectedClientRoute, auth context). |
| 18.2 | Manual migration creation for invoices | Created migration 0010 manually instead of `pnpm db:generate` due to Drizzle interactive prompt blocking automation. Rationale: Faster and more reliable for 6 known columns. Interactive prompt asked about quote_items.service_template_id (unrelated to our fix), would require debugging Drizzle internals. |
| 18.2 | Applied missing migrations to tenant_16 | tenant_16 (created by setup-org-16.sh) was missing migrations 0003 (sessions payment fields), 0008 (project_id), and 0010 (invoices). Applied all 3 to synchronize with schema.ts. Rationale: tenant_16 is critical for Phase 18-02 testing (org ID 16 used in dev mode headers), must be fully functional. |
| 19-02 | VIP threshold reduced to >1000€ | Changed from >10000€ to >1000€ for more relevant high-value client threshold. Rationale: Consistency with Table view, earlier warning for significant receivables. 1000€ is meaningful threshold for recording studios. |
| 19-02 | Grid layout 4 columns on xl screens | Added xl:grid-cols-4 to maximize density on large displays (1920px+). Rationale: Studio managers often use large monitors, can handle more dense layouts. Maintains readability with proper card sizing. |
| 19-02 | Avatar h-12 sizing for prominence | Used h-12 w-12 (48px) for Avatar component as primary visual anchor. Rationale: Research-backed size provides prominence without overwhelming card. Balance between visibility and card content space. |
| 19-03 | Compact avatar in Kanban (h-8 vs Grid h-12) | Kanban shows expanded context where avatar is secondary identifier, Grid uses prominent avatar for quick scanning. Rationale: Content hierarchy - Kanban prioritizes workflow info over visual identification. |
| 19-03 | Full contact display in Kanban | Phone, email, city with MapPin icon for complete workflow context. Rationale: Kanban users need all contact methods at glance for workflow decisions (vs Grid minimal contact for scanning). |
| 19-03 | Workflow indicators section | Sessions count + last session date + receivables with border-t separation. Rationale: Key workflow metrics for client management, visual separation creates clear content zones. |
| 19-03 | Button text "Voir détails complet" in Kanban | More descriptive than Grid "Voir". Rationale: Emphasizes detail page provides even more information beyond expanded Kanban card. |
| 19-03 | VIP threshold 100€ consistency | Reduced from 1000€ to match Grid and Table views. Rationale: Cross-view consistency, more meaningful warning threshold for recording studios. |
| 19-04 | Email display in Grid view | Added email below phone in Grid view during testing. Rationale: User requested more contact info visibility, email is critical contact method, implemented with Mail icon and mailto link with truncation. |
| 19-04 | Type badge repositioning in Grid | Moved badge from inline with name to separate line below. Rationale: Reduces horizontal crowding, allows full name display, better visual hierarchy and readability at all breakpoints. |
| 19-04 | Kanban shadow-lg emphasis | Kanban cards use shadow-lg vs Grid shadow-md. Rationale: Emphasizes "context-rich" nature of Kanban view vs "compact scanning" Grid, clear visual differentiation between view purposes. |
| 20-01 | COUNT(DISTINCT) for multi-JOIN accuracy | Changed notesCount and contactsCount to use COUNT(DISTINCT) instead of COUNT. Rationale: Multiple LEFT JOINs can create duplicate rows - DISTINCT prevents overcounting when client has both notes AND contacts. |
| 20-01 | Conditional Kanban contact loading | Batch contact queries enabled only when viewMode === 'kanban'. Rationale: Avoids loading contacts when Table/Grid view active, reduces unnecessary API calls. |
| 20-01 | Scoped copy-to-clipboard Phase 20 | Copy icons only in Clients.tsx Kanban view. Rationale: Plan specified "Phase 20 scope only" - universal copy feature across all pages (ClientDetail, Sessions, Invoices) deferred to future enhancement. |
| 20-01 | Primary contact sorting | Sort by isPrimary DESC, lastName ASC. Rationale: Primary contact always appears first (most important for workflows), others alphabetically for consistency and predictability. |
| 20.1-01 | 🚨 CRITICAL: Increment tenant number vs fix migrations | **DEVELOPMENT ONLY**: When schema changes or tenant breaks, create NEW tenant (tenant_3, tenant_4...) instead of debugging migrations. Rationale: 30 seconds vs 2-3 hours debugging. Phases 18.1/18.2/18.3 wasted 80+ minutes on migration fixes. New pattern: increment tenant, apply current schema, seed data, continue building. Old tenants = ignore/delete later. Documented in `.planning/DEVELOPMENT-WORKFLOW.md`. Production still requires progressive migrations. |
| 39-01 | Nullable FK during migration | Added vatRateId FK columns as nullable to invoice_items, quote_items, rooms, service_catalog. Rationale: Allows incremental migration - existing records don't break, Plan 02 will populate them via data migration script. Alternative (make NOT NULL immediately) would require complex single-step migration with data population. |
| 39-01 | ON DELETE RESTRICT for VAT rates | All FK constraints use ON DELETE RESTRICT instead of CASCADE. Rationale: Prevents orphaning historical invoices/quotes if VAT rate accidentally deleted. User must archive rate (isActive=false) instead of deleting. |
| 39-01 | vatRates table definition order | Moved vatRates table definition before invoiceItems in schema.ts. Rationale: Avoid TypeScript "used before declaration" error - Drizzle requires referenced tables defined first in file. |
| 39-01 | Migration in tenant/ subdirectory | Created migration as tenant/0014_add_vat_rates.sql instead of root migrations/. Rationale: Project convention - tenant DB changes go in tenant/, master DB changes in master/. Root directory gitignored. |
| 20.1-01 | Many-to-many company_members architecture | Replaced client_contacts (one-to-many) with company_members junction table (many-to-many). Rationale: Contacts can now belong to multiple companies, each contact is a full client record with their own page. Proper relational design enables contact reusability across organizations/groups. |
| 20.1-01 | Copy-to-clipboard in all views (Table/Grid/Kanban) | Added CopyButton component with toast feedback to ALL client views. Rationale: Universal UX need for copying contact info (email/phone). Consistency across viewing modes. Toast confirms action ('Email copié!' / 'Téléphone copié!'). |
| 20.1-02 | IIFE pattern for conditional hook usage | Used IIFE (Immediately Invoked Function Expression) to call hooks at top level while keeping rendering logic scoped and conditional. Rationale: React hooks can't be called conditionally, but we need conditional rendering based on hook data. Pattern: `{(() => { const { data } = useQuery(...); if (!data) return null; return <Component />; })()}`. Enables conditional display without violating Rules of Hooks. |
| 20.1-02 | Multi-condition enabled flag for tRPC queries | Prevent unnecessary API calls with compound enabled condition: `viewMode === 'kanban' && client.type === 'company' && contactsCount > 0`. Rationale: Only loads members when actually needed (Kanban view, company clients, has contacts). Performance optimization: 3 API calls instead of potentially dozens for Table/Grid views or individual clients. |
| 20.1-02 | Truncate class for member overflow | Applied `truncate` class to member names and roles to prevent card layout breaking. Rationale: Long names ("Alexandre Grand - Ingénieur du son principal et mixage") could overflow card width. Truncate ensures ellipsis on overflow for consistent card sizing. |
| 20.1-02 | stopPropagation on member links | Added `onClick={(e) => e.stopPropagation()}` to member Link components. Rationale: Prevents card click events from interfering with member link navigation. User clicks member name → profile page, not card background behavior. Ensures predictable click targets in nested interactive elements. |
| 21.1-01 | Express-session for Client Portal auth | Migrated Client Portal from localStorage sessionToken to express-session cookies (same pattern as Admin Portal). Rationale: localStorage tokens have no server-side validation, can be manipulated, no automatic expiration enforcement. Express-session provides battle-tested session management with Redis persistence, automatic expiration, CSRF protection via sameSite cookies, httpOnly security. Unified authentication system for both Admin and Client Portal. |
| 21.1-01 | Session save error handling pattern | All req.session.save() calls wrapped in try-catch with console.error logging. Rationale: If Redis connection fails during session save, mutation would throw unhandled exception causing generic 500 error. With try-catch wrapper, we get console.error logging for debugging production session issues and user-friendly error messages. Prevents partial state where session data is set in memory but save failed. |
| 21.1-01 | Navigate component over window.location.href | Replaced window.location.href with Navigate component in ProtectedClientRoute. Rationale: Full page reload breaks SPA navigation, loses React Router state, causes flash of loading. Navigate component preserves SPA behavior, maintains React state, is React Router v6 standard pattern. |
| 18.4-01 | Manual migration creation for music profile | Created migration 0012 manually instead of drizzle-kit generate (interactive prompt blocking automation). Rationale: Faster and more reliable for known schema changes. Interactive prompt asked about unrelated quote_items.service_template_id column, would require debugging Drizzle internals. |
| 18.4-01 | Increment tenant number for testing | Created tenant_24 for schema validation instead of fixing broken tenants. Rationale: Development workflow pattern from DEVELOPMENT-WORKFLOW.md - 30 seconds vs 2-3 hours debugging migrations. Migration 0012 applied successfully to fresh tenant with all 22 music profile fields. |
| 18.4-01 | GIN indexes for JSONB arrays | Added GIN indexes on genres and instruments columns for fast containment queries. Rationale: PostgreSQL recommended pattern for JSONB array filtering using @> operator. Enables "find all clients with genre 'Rock'" queries at scale without table scans. |
| 18.4-01 | Flat streaming URL fields | Used 11 separate varchar columns for streaming platforms instead of nested JSONB object. Rationale: Simpler querying, allows individual field validation in future, clear column names in schema. Trade-off: More columns but better developer ergonomics and type safety. |
| 21-01 | Evidence-based script audit (test results required) | Document actual test execution results (ERROR messages, missing columns) not just status markers. Rationale: Proves obsolescence with concrete evidence, enables informed decisions. Impact: Audit credibility increased, developers understand WHY scripts obsolete (e.g., "ERROR: column project_id does not exist", "missing 16 tables"). Alternative rejected: Simple WORKING/BROKEN classification without evidence. |
| 21-01 | Keep production deploy scripts unchanged despite migration-based approach | deploy-master.sh and deploy-tenants.sh marked WORKING despite using migrations. Rationale: Production tenants have migration history (can't skip migrations), sequential application correct for incremental updates, different from dev tenant creation. Impact: 2/2 DEPLOY scripts remain production-ready, production workflow unchanged. Alternative rejected: Deprecate ALL migration-based scripts uniformly. |
| 21-01 | Categorize scripts by use case (5 categories) | Group scripts into INIT/SEED/FIX/DEPLOY/MONITOR categories. Rationale: Clear purpose identification, reveals patterns (FIX 100% obsolete validates increment tenant), enables targeted recommendations. Impact: Category summaries show working/obsolete counts, critical gaps surface. Alternative rejected: Flat alphabetical list (no pattern insight). |
| 18.4-03 | Use tabbed interface for client detail | Rationale: Reduces vertical scrolling, organizes 3 major sections (basic info, enriched fields, music profile) into logical tabs. Impact: Improved UX for navigating large client profiles with many fields. |
| 18.4-03 | Backend JSONB filtering instead of client-side | Rationale: Better performance for large datasets, leverages GIN indexes created in 18.4-01, reduces data transfer. Impact: Fast filtering even with hundreds of clients, server-side filtering ensures accuracy. |
| 18.4-03 | Dynamic query builder pattern | Rationale: Avoids query duplication, conditionally adds WHERE clauses only when filters are provided. Impact: Clean, maintainable code for optional filters, easy to add more filters in future. |
| 18.4-03 | Server-side genre aggregation in stats endpoint | Rationale: Accurate counts across all clients, not just currently loaded page, reusable for future analytics. Impact: Enables reliable dashboard widget, foundation for future reporting features. |
| 18.4-03 | Conditional clear filters button | Rationale: Reduces UI clutter when no filters are active, discoverable when needed. Impact: Clean interface design, intuitive filter management. |
| 22-01 | Free navigation wizard (all tabs always clickable) | Rationale: Users can jump directly to any step without blocking validation, enabling quick access to music profile fields for established clients. Minimal validation (only name required). Submit button visible on all steps. |
| 22-01 | Reusable wizard component for create/edit modes | Rationale: Single component pattern reduces code duplication, mode prop switches behavior, initialData prop pre-populates form for edit mode. ClientCreate refactored from 726 to 54 lines (92.5% reduction). |
| 22-03 | Cards mode as default for projects view | Rationale: Most visual presentation showing all key stats at glance, matches existing Clients page pattern from Phase 19. Alternative (Table) more dense but less scannable. |
| 22-03 | Kanban columns by production status | Rationale: Recording studio workflow stages: Planifié → En cours (recording/editing) → Mixing → Mastering → Livré. 5 columns match project lifecycle stages. No drag-and-drop (nice-to-have for future). |
| 22-03 | Calculate hoursRecorded server-side | Rationale: Aggregation logic in endpoint reduces client complexity, reusable across multiple UI views. Formula: Sum of (session.endTime - session.startTime) for all sessions linked to projectId. |
| 22-03 | Navigate to project detail in same tab | Rationale: Standard SPA navigation pattern, breadcrumb provides return path. No modal/drawer overlay complexity. Alternative (modal) would require additional state management. |
| 22-07 | Manual migration creation over Drizzle generate | Rationale: Drizzle interactive prompt asks about unrelated quote_items.service_template_id column, blocking automation. Manual migration is faster and more reliable for known schema changes (precedent: Phase 18.2). |
| 22-07 | JSONB preferences storage over separate columns | Rationale: Flexible schema allows adding new preference types without migrations. Supports viewMode, visibleColumns, columnOrder, sortBy, sortOrder all in single column. JSON querying capabilities sufficient for this use case. |
| 22-07 | Upsert pattern in save endpoint | Rationale: Check for existing preference, update if found, insert if not. Simpler client code (no need to distinguish create vs update). PostgreSQL unique constraint prevents duplicates. |
| 22-08 | @dnd-kit over react-beautiful-dnd for drag & drop | Rationale: Modern library, TypeScript-first, better performance, still actively maintained (react-beautiful-dnd deprecated). Clean API with excellent TypeScript support and built-in accessibility. |
| 22-08 | SortableTableHeader component per file | Rationale: Avoid shared component import complexity since each tab has slightly different table structure. ~35 lines duplicated across 4 files, but simpler to maintain and modify per-tab. |
| 22-08 | Column rendering by columnOrder array | Rationale: Filter columnOrder by visibleColumns, then map to render cells in that order. Tables respect both visibility AND order preferences, consistent behavior across all tabs. |
| 22-09 | Reuse wizard in edit mode over inline edit form | Rationale: Single component pattern reduces code duplication (ClientDetail edit mode code reduced from 167 to 47 lines, 72% reduction), ensures consistency between create/edit flows. Impact: Cleaner code, fewer potential state sync bugs. |
| 22-09 | Hydrate arrays in useState initialization | Rationale: Arrays (phones, emails, websites, customFields) need to populate immediately when wizard mounts in edit mode. Impact: Edit mode correctly displays all vCard array fields without additional effects. |
| 22-10 | Unified search with AND logic between keywords | Rationale: User typing "basse reggae" expects clients with BOTH attributes, not either. Industry standard search behavior (Google, GitHub). Impact: Natural language search UX, more precise results. Alternative (OR logic) would be too permissive. |
| 22-10 | 300ms debounce delay | Rationale: Balance between UX responsiveness and server load reduction. 300ms feels instant while cutting API calls by ~90%. Impact: Performance optimization without sacrificing UX. Alternative (no debounce) = excessive API calls, (500ms+) = feels laggy. |
| 22-10 | JSONB text casting for ILIKE search | Rationale: Cast JSONB to text for ILIKE search (genres::text ILIKE '%keyword%') enables partial matches and flexible querying. Works with existing GIN indexes from Phase 18.4-01. Impact: Slightly slower than @> containment but more flexible. Alternative (dedicated full-text search columns) = more complex. |
| 23-01 | Visual sections over nested tabs | Rationale: 3 section headers + Separator components provide clear visual hierarchy without requiring clicks. Improves accessibility and reduces navigation friction. All client information visible at a glance. Alternative (keep nested tabs) = requires clicks to see complete profile, rejected. |
| 24-01 | Probabilistic music profile data generation | Rationale: Faker.js probability flags (50% Spotify, 35% representation, 40% biography) create realistic distributions matching real music industry patterns (not all artists have all fields). Alternative (100% coverage all fields) = unrealistic data. Impact: Test data mirrors production scenarios (independent artists, signed artists, varying streaming presence). |
| 24-01 | Genre/instrument array size limits (1-3, 1-4) | Rationale: Most artists work in 1-2 genres with occasional crossover (max 3), instrumentalists master 1-2 instruments with some multi-instrumentalists (max 4). Prevents unrealistic "plays 10 instruments in 8 genres" scenarios. Alternative (unlimited arrays) = test data quality degradation. |
| 25-01 | Single bidirectional modal component | Rationale: DRY principle, reduce code duplication, consistent UX across both views. clientType prop switches behavior between company→members and individual→companies modes. Same mutations work for both directions. Alternative (separate components) = 700+ lines duplicated, maintenance burden doubled. |
| 25-01 | Inline role editing (onChange + onBlur pattern) | Rationale: Reduce friction, fewer clicks, more fluid UX. No separate edit button needed. onChange updates local state, onBlur calls updateMutation if changed. Pattern matches industry standards (Google Sheets, Notion inline editing). |
| 25-01 | Preview truncation rules (≤3 show all, >3 truncate) | Rationale: Balance between showing useful preview and avoiding UI overflow. Format: "3 membres : Alex (Ingénieur), Sophie (Prod), Marc (Manager)" vs "5 membres : Alex (Ingénieur), Sophie (Prod)...". Alternative (always show all) = can break layout with 10+ members, alternative (always truncate) = less useful for common case (2-3 members). |
| 25-02 | HTML5 datalist over Popover/Command for autocomplete | Rationale: Simpler implementation, native browser support, no additional library dependencies. Popover/Command would add ~200 lines of UI code, datalist requires 4 lines. Trade-off: Less visual customization but fully functional autocomplete with keyboard navigation. Lightweight solution for simple use case. |
| 25-02 | Distinct query on company_members.role | Rationale: Returns unique roles only, prevents duplicate suggestions, SQL-level filtering for performance. Implementation: selectDistinct({ role }) with WHERE role IS NOT NULL AND role != '' filter. Clean autocomplete list with no duplicates or empty entries. |
| 25-02 | Conditional query enable based on modal open | Rationale: Avoid unnecessary API calls when modal closed (performance optimization). Implementation: { enabled: open } in useQuery options. Query only runs when modal is actually being used. |
| 39-04 | sonner toast instead of shadcn useToast | Rationale: Codebase standardized on sonner throughout application, shadcn useToast pattern was outdated. Consistency across UI notification system. Impact: All 3 VAT components (VatRatesSection, CreateVatRateDialog, EditVatRateDialog) use toast() from sonner for success/error notifications. |
| 39-04 | Archived rates visibility toggle | Rationale: Users may need to view archived VAT rates without cluttering main table. Pattern established for soft-deleted entities. Impact: "Show archived" switch added to Settings Finance tab header, toggles visibility of archived rates. |
| 39-04 | Unarchive functionality for VAT rates | Rationale: Users may accidentally archive rates or need to restore them later. Complete CRUD lifecycle management. Impact: Added unarchive mutation to backend + "Restaurer" action in UI for archived rates. Validation prevents duplicate rates with same percentage. |
| 39-04 | Edit dialog only allows name changes | Rationale: Preserves historical invoice integrity - rates used in past invoices must remain immutable. Rate percentage is permanent after creation. Impact: Edit dialog shows current rate percentage as read-only, only allows name field modification. |
| 26-01 | Accordion pattern over wizard for edit mode | Rationale: Eliminates cognitive friction when switching between view and edit modes by using the same visual structure. All fields accessible without navigation steps. Impact: 93% code reduction in informations tab, zero UX friction. Alternative (keep wizard) = maintains visual disconnect between view/edit. |
| 26-01 | All accordions open by default | Rationale: Users can see and edit all sections immediately without clicking. Better UX for comprehensive client profiles with 50+ fields. defaultValue array includes all 7 accordion values. Alternative (collapsed) = requires clicks to discover sections. |
| 26-01 | Comma-separated input for genres/instruments | Rationale: Simpler implementation than tag input components. Sufficient for editing existing data. Pattern: "Rock, Jazz, Hip-Hop" → splits on comma. Alternative (tag component) = more complex but better UX for future. Trade-off: simplicity vs perfect UX. |
| 26.1-01 | 5 accordions following studio workflow logic | Rationale: 7→5 restructure reduces navigation by 28%, consolidates related fields (musical profile, contact info). Studio workflow priority: Identité → Coordonnées → Profil Artistique → Streaming → Notes Studio (NOT scattered across 7 sections). Musical profile positioned 2nd (core business) instead of 5th. Impact: Faster navigation, logical grouping, workflow alignment. |
| 26.1-01 | Delete Relations Professionnelles accordion | Rationale: Company members managed in ClientDetailTabs CompanyMembersModal (Phase 25), not in edit form. Accordion contained only info message redirecting users. Impact: Simplifies edit form, removes empty section. Company member management remains fully functional via modal. |
| 26.1-01 | Move birthday and gender to Identité | Rationale: Personal identity fields grouped with other identity data (name, artistName, type). More logical than separate "Personal" accordion. Impact: Better field organization, reduces accordion count. |
| 26.1-01 | Keep only customFields in Notes Studio | Rationale: After moving birthday/gender to Identité and deleting Relations Pro, Notes Studio simplified to only customFields array. Clean separation: identity data in Identité, studio-specific notes in Notes Studio. Impact: Clear purpose per accordion. |
| 26.1-01 | Default accordion state: only Identité open | Rationale: Reduces visual overwhelm when opening edit mode. Users can expand other accordions as needed. Identité (type, name, artistName) most critical for quick edits. Alternative (all open) = overwhelming for 50+ fields. Alt key shortcut enables opening all at once. |
| 26.1-01 | Readonly auto-generated Nom complet | Rationale: Prevents manual editing conflicts with structured name fields (prefix, firstName, lastName, suffix). Auto-fills via useEffect from structured components. Visual indicators: bg-muted, cursor-not-allowed, placeholder "Se génère automatiquement". Impact: Data integrity, no duplicate entry. |
| 26.1-01 | Type de client at top of Identité | Rationale: Critical business context must be visible first. Determines if artistName or companyName is primary identifier. Workflow: Set type → relevant fields appear below. Impact: Clearer workflow, no confusion about client categorization. |
| 26.1-01 | artistName above structured name fields | Rationale: For artists/musicians, stage name is primary identity. Structured name (firstName, lastName, prefix) is secondary administrative data. Visual hierarchy: artistName → Nom complet (auto-generated) → structured fields. Impact: Matches industry practice (artists known by stage names). |
| 26.1-01 | 3-column grid for contact arrays | Rationale: Consistent layout across phones, emails, websites, addresses. grid-cols-[120px_1fr_80px] = type selector (120px) | input field (flex) | actions (Plus + Trash2, 80px). Impact: Visual consistency, predictable layout, efficient space usage. |
| 26.1-01 | Rounded corners on all select elements | Rationale: Visual consistency with input fields (rounded-md class). Previous sharp corners broke design harmony. Applied to prefix, gender, type selectors in contact arrays. Impact: Polished UI, consistent styling. |
| 26.1-01 | Consistent icon colors (text-muted-foreground) | Rationale: Plus icons inherited black from button text, Trash2 icons had explicit gray class. Visual confusion: some black, some gray. Solution: Apply text-muted-foreground to ALL action icons (Plus + Trash2). Impact: Visual consistency, professional appearance. |
| 26.2-01 | 6th accordion position 3 (after Coordonnées) | Rationale: Professional relationships are business context that comes after contact info but before artistic profile. Workflow logic: identity → contact → relations → creative profile. Impact: Intuitive navigation for studio managers managing client networks. |
| 26.2-01 | Conditional rendering prevents creation mode crash | Rationale: In creation mode, formData.id is undefined (client not yet saved). CompanyMembersIndicator queries backend with clientId, would crash. Solution: Check formData.id existence, show placeholder if undefined. Impact: Graceful UX degradation, clear user guidance. |
| 26.1-01 | Alt key accordion toggle | Rationale: Power user feature for batch operations. Alt key opens all accordions if any closed, closes all if all open. No Ctrl/Meta/Shift modifiers (avoids browser/OS conflicts). Impact: Efficiency for users editing many fields. |
| 27-01 | Conditional rendering for music accordions | Rationale: Companies (labels, studios, management) don't have personal music profiles. Profil Artistique and Streaming sections create visual clutter and user confusion for company clients. Solution: Wrap both accordions in formData.type === "individual" conditional. Impact: Clean 4-accordion form for companies, unchanged 6-accordion form for individuals. |
| 27-01 | Dynamic Alt key accordion list | Rationale: Alt+Click should toggle only VISIBLE accordions. Company clients see 4 accordions, individuals see 6. Dynamic allAccordions calculation based on formData.type ensures correct toggle behavior for each type. Impact: Keyboard shortcut adapts to client type context. |
| 27-01 | artistName field remains unconditional | Rationale: Companies can use artistName for brand/trading name separate from legal companyName. Individual artists use it for stage name. Business requirement to keep this field visible for both types. Impact: Flexible naming support for both client types. |
| 27-02 | Birthday and gender conditional rendering | Rationale: Birthday and gender are personal identity attributes that apply only to individuals, not companies. Wrapping both in same conditional block reduces code duplication and maintains consistency with structured name pattern. Impact: Company clients see clean 4-field Identité (Type, artistName, companyName, name), individual clients see full identity form (6+ fields). |
| 27-02 | Fragment wrapper for grouped conditionals | Rationale: React requires single child for conditional rendering. Fragment (`<>...</>`) allows multiple elements (birthday + gender) without adding extra DOM nodes. Matches existing structured name pattern (lines 214-279). Impact: Cleaner JSX, consistent pattern across all individual-specific fields. |

### Deferred Issues

**Production Blockers (from Phase 3.1):**
- ISSUE-001 (P0): Production database not initialized - migrations need to run on VPS
- ISSUE-006 (P3): Debug logging in context.ts should be removed after verification

**Infrastructure Improvements:**
- ISSUE-007 (P3): Deployment script missing migration step
- ISSUE-008 (P3): No automated rollback strategy for failed deployments
- ISSUE-009 (P3): VPS resource monitoring not configured

See `.planning/ISSUES.md` for full details and resolution steps.

### Roadmap Evolution

- **2026-01-21:** Phase 27 added after Phase 26.2: "Masquer Champs Musicaux pour Entreprises - Formulaire Édition" (ADDED)
- **2026-01-22:** Phase 29 added after Phase 28: "Harmonisation Services - Routing Cohérent" (ADDED)
- **2026-01-21:** Phase 39 added after Phase 38: "Gestion TVA Multi-Taux" (ADDED)
  - Reason: TVA actuellement gérée avec taux fixe 20% global par facture/devis, besoin système flexible multi-taux
  - Impact: Impossible de facturer services avec taux différents (ex: 20% standard + 5.5% réduit sur même facture)
  - Solution: Table vat_rates (tenant DB), seed 4 taux français (20%/10%/5.5%/2.1%), application par ligne (invoiceItems/quoteItems/rooms)
  - Scope: Database schema + migration données existantes + UI Settings nouvel onglet Finance + impact autres pages
  - Priority: Feature professionnelle - Norme facturation internationale (TVA par ligne)
  - Reason: Services est la SEULE ressource utilisant Dialog modal au lieu de pages dédiées /new
  - Impact: Incohérence UX - 11 ressources utilisent routing cohérent, 1 ressource (Services) utilise pattern différent
  - Discovery: User noticed during manual testing - Services doesn't follow same navigation pattern as clients/sessions/invoices/equipment/rooms/projects/quotes/contracts/expenses/talents/tracks
  - Solution: Créer ServiceCreate.tsx et routes /services/new + /services/:id/edit pour cohérence
  - Benefits: URLs partageables, back button fonctionnel, separation of concerns, pattern familier
  - Priority: UX consistency - Harmonize last resource with established routing pattern
  - Reason: Entreprises (type="company") voient actuellement tous les champs musicaux inutiles (Profil Artistique, Streaming, artistName)
  - Impact: Bruit visuel et confusion pour utilisateurs créant/éditant des clients entreprise (labels, studios de production, management)
  - Solution: Masquage conditionnel des accordéons "Profil Artistique" et "Streaming" + champs individual dans Identité quand type="company"
  - Scope: Formulaire édition uniquement (ClientEditForm.tsx), particuliers 100% inchangés (déjà correct)
  - Priority: UX improvement - Adapter formulaire au contexte métier (entreprises n'ont pas de profil artistique)
- **2026-01-20:** Phase 26.1 added after Phase 26: "Réorganisation Accordéons - Logique Studio d'Enregistrement" (ADDED)
  - Reason: User feedback that 7 accordion structure doesn't follow studio recording workflow logic
  - Impact: Musical profile (core business) positioned 5th instead of 2nd, contact info scattered across 2 sections
  - Solution: Reorganize 7 → 5 fused accordions (Identité, Profil Artistique, Coordonnées, Relations Pro, Notes Studio)
  - Benefits: Studio workflow priority (identity → artistic profile → contact → relations → notes), 28% less navigation, grouped logical sections
  - Priority: UX optimization - Align UI structure with actual studio business processes
- **2026-01-16:** Phase 21.1 inserted after Phase 21: "Fix Client Portal Authentication Persistence" (URGENT - INSERTED)
  - Reason: Critical authentication bug blocking Phase 17 UAT and production Client Portal
  - Impact: E2E tests 6/8 failing, clients cannot maintain authenticated session
  - Discovery: Phase 17 UAT testing revealed session not persisting after login
  - Root cause: ProtectedClientRoute/session cookies/auth context persistence issue
  - Priority: BLOCKER - Production client portal unusable, affects invoice payments
  - Reference: Decision 17-FIX (Rule 4 architectural boundary deferred to separate phase)
- **2026-01-17:** Phase 21 added after Phase 20: "Audit et Correction Scripts Base de Données" (ADDED)
  - Reason: User concern that database scripts became obsolete since Phase 10, causing multiple bugs
  - Impact: Scripts created before Phases 10-17 incompatible with current schema (30+ tables vs ~15 originally)
  - Evidence: Phase 18.1-18.3 systematic schema/migration desync, tenant_3 migration fix for missing vCard columns
  - Solution: Audit all scripts, test compatibility, update critical scripts, archive obsolete ones, document usage
  - Priority: Quality & Maintainability - Prevent future "broken database" debugging sessions
- **2026-01-16:** Phase 20 added after Phase 18.3: "Affichage Contacts Multiples Entreprises" (ADDED)
  - Reason: Contacts multiples (client_contacts table) ne s'affichent pas dans les listes clients
  - Impact: Entreprises avec 4-6 contacts invisibles dans Table/Grid/Kanban views
  - Discovery: Testing with real data (Mélodie Productions SAS, Midnight Groove Collective)
  - Solution: Enrichir les 3 vues pour afficher nombre de contacts + liste noms + contact principal
  - Priority: UX enhancement - contacts invisibles depuis Phase 3.9.4 implementation
- **2026-01-16:** Phase 18.3 inserted after Phase 18.2: "Database Reset for Testing Environment" (URGENT) - Complete clean reset to unblock Phase 18-02 manual testing after database chaos
- **2026-01-05:** Milestone v4.0 created: Workflow Commercial Complet, 8 phases (Phase 10-17)
  - Features: Système de Devis complet, Tasks Chronométrées, Architecture Session/Project Flexible, Facturation Automatique Temps Réel
  - Business rationale: Complete commercial workflow (quote → invoice) before marketing push
  - Phases 4-8 (Marketing & Launch) deferred to v1.0 after v4.0 features complete
  - v3.0 (Foundation & Polish) marked as SHIPPED - 49/49 plans complete (Phases 1-3.14)
- **2025-12-26:** Phase 3.1 inserted after Phase 3 - "Fix Production Authentication 401 Errors" (URGENT)
  - Reason: Critical production blocker discovered - all API endpoints returning 401 Unauthorized
  - Impact: All tRPC queries/mutations failing, WebSocket authentication broken
  - Symptoms: User reported console errors showing `GET /api/trpc/* 401`, `[WebSocket] No authentication token found`
  - Priority: BLOCKER - Must resolve before Phase 4 (Marketing) as product is currently inaccessible
- **2025-12-26:** Phase 3.2 inserted after Phase 3.1 - "End-to-End Testing" (INSERTED)
  - Reason: Validate full user journey before marketing launch
  - Impact: Comprehensive E2E tests ensure production quality before driving traffic
  - Scope: Signup → Dashboard → Booking → Payment → Project → Track upload → AI chatbot
  - Priority: Quality gate before Phase 4 (Marketing Foundation)
- **2025-12-26:** Phase 3.3 inserted after Phase 3.2 - "Fix Registration Session Persistence" (URGENT BLOCKER)
  - Reason: MCP Chrome DevTools testing revealed session not persisted after registration
  - Impact: After successful registration (200 OK), auth.me returns null, all protected endpoints return 401
  - Symptoms: 29 console errors "401 Unauthorized", user appears logged in visually but session invalid
  - Root Cause: auth.register endpoint creates user but doesn't persist session in Redis/req.session
  - Affected: All protected tRPC endpoints (notifications, organizations, clients, rooms, equipment, projects, sessions, invoices)
  - Priority: CRITICAL BLOCKER - Application completely non-functional after registration
- **2025-12-26:** Phase 3.4 added after Phase 3.3 - "Comprehensive Site Testing" (INSERTED)
  - Reason: Exhaustive testing of entire site before marketing launch
  - Impact: Validate ALL functionality works - Admin Dashboard (47 pages), Client Portal (5 pages), all workflows, all interactions
  - Approach: Document ALL errors first, plan fixes, then code - systematic quality assurance
  - Priority: Quality gate ensuring production-ready before public launch (Phase 4)
  - Plans: 3.4-01 (test matrix) → 3.4-02 (execute tests) → 3.4-03 (document errors) → 3.4-04+ (fix critical errors)
  - **Update 2025-12-27:** 3.4-01 complete - Created 600+ item test coverage matrix, MCP Chrome DevTools protocol, error tracking system
- **2025-12-28:** Phase 3.5 inserted after Phase 3.4 - "Password Confirmation Field" (INSERTED)
  - Reason: UX improvement to prevent password typos during registration
  - Impact: Standard best practice for account creation forms
  - Duration: ~20 min (client-side validation, quick deployment)
  - Priority: Pre-launch UX polish before marketing (Phase 4)
- **2025-12-28:** Phase 3.6 inserted after Phase 3.5 - "Breadcrumb Navigation" (INSERTED)
  - Reason: User discovered inconsistent UX - some pages have back arrow to dashboard, others don't
  - Impact: 12 pages missing breadcrumb navigation (Talents, Team, Rooms, Equipment, FinancialReports, Analytics, Reports, Projects, Tracks, Shares, Chat, Notifications)
  - Approach: Replicate breadcrumb pattern from Clients.tsx to all 12 pages
  - Duration: ~20 min (simple pattern replication)
  - Priority: Pre-launch UX consistency before marketing (Phase 4)
- **2025-12-28:** Phase 3.7 inserted after Phase 3.6 - "AI Chatbot Cache Invalidation" (INSERTED)
  - Reason: User discovered UX bug - after creating client via chatbot, must refresh page to see it in list
  - Impact: All chatbot mutations (create/update/delete clients, sessions, invoices, etc.) don't update UI automatically
  - Root cause: AIAssistant.tsx doesn't invalidate tRPC caches after chatbot actions
  - Solution: Add `trpc.useUtils()` and invalidate appropriate queries based on action type
  - Duration: ~20-30 min (standard tRPC pattern)
  - Priority: Critical UX bug before marketing launch (Phase 4)
- **2025-12-29:** Phase 3.8 inserted after Phase 3.7 - "Vérifier Chatbot Mémoire" (INSERTED - URGENT)
  - Reason: Need to verify AI chatbot maintains conversation context throughout multi-turn discussions
  - Impact: Critical UX concern - if chatbot loses context, becomes frustrating and unhelpful to users
  - Scope: Test conversation history persistence, Claude API context management, token limits
  - Priority: URGENT - Must validate before marketing launch (Phase 4) as chatbot is core differentiating feature
  - Research needed: Anthropic Claude API conversation management, session storage patterns
- **2025-12-29:** Phase 3.8.1 inserted after Phase 3.8 - "Fix Chatbot SessionId Persistence Bug" (URGENT - CRITICAL BLOCKER)
  - Reason: Phase 3.8 testing discovered CRITICAL P0 BUG - chatbot creates new session for each message, complete memory loss
  - Impact: Chatbot memory completely non-functional, makes feature nearly useless, would cause immediate negative reviews
  - Root cause: Frontend AIAssistant.tsx never sends sessionId to backend, backend creates new session every time
  - Fix: Simple React state management (15-20 min) - add sessionId state, send in requests, store from responses
  - Priority: CRITICAL BLOCKER - Marketing launch cannot proceed until chatbot memory works
  - Testing: Phase 3.8 stopped at Turn 2 when memory failure confirmed, must re-run after fix
- **2025-12-29:** Phase 3.8.2 inserted after Phase 3.8.1 - "Persist Chatbot SessionId in LocalStorage" (URGENT)
  - Reason: User discovered sessionId lost on page refresh - conversation not persisted across browser refreshes
  - Impact: Users lose entire conversation context when accidentally refreshing page or navigating away
  - Current behavior: sessionId stored in React state only, resets to null on component unmount/remount
  - User request: Implement localStorage persistence (Option 1) to maintain conversations across refreshes
  - Priority: URGENT - UX improvement before marketing launch (Phase 4)
- **2025-12-29:** Phase 3.8.3 inserted after Phase 3.8.2 - "Fix Chatbot Date Awareness - Add Current Date to System Context" (URGENT)
  - Reason: User reported chatbot doesn't know today's date - cannot help with scheduling or time-sensitive queries
  - Impact: Chatbot unable to answer "schedule for tomorrow", "this week", or provide date-aware responses
  - Solution: Add current date to Claude API system prompt in backend (e.g., "Today is 2025-12-29")
  - Priority: URGENT - UX issue affecting chatbot utility before marketing launch (Phase 4)
- **2025-12-29:** Phase 3.8.4 inserted after Phase 3.8.3 - "Implement RAG with Qdrant for Chatbot Long-Term Memory" (INSERTED)
  - Reason: User requested RAG implementation to enable scalable long-term memory for chatbot
  - Impact: Replace full conversation history loading with semantic search for 500+ message conversations
  - Current limitation: Context window approach loads ALL messages, doesn't scale beyond 50-100 messages
  - Proposed solution: Qdrant vector database + embeddings for semantic retrieval of relevant messages
  - Benefits: Cross-session memory, token efficiency, better context relevance
  - Trade-offs: Infrastructure complexity (self-host Docker on VPS = €0 OR Qdrant Cloud free tier 1GB), development time (3-5 days)
  - Infrastructure options: (1) Self-hosted Docker on existing VPS Hostinger (€0 extra), (2) Qdrant Cloud free tier (1GB, ~1M vectors)
  - Priority: ENHANCEMENT - Evaluate necessity before marketing launch (Phase 4)
- **2025-12-29:** Phase 3.9.1 inserted after Phase 3.9 - "Notes avec historique daté pour clients" (INSERTED)
  - Reason: User requested dated notes history feature - "je voudrais qu'on puisse prendre une note la sauvegarder, et ainsi avoir un historique daté de toutes les notes"
  - Impact: Transform single notes field into timestamped history system for better client relationship management
  - Current limitation: Single textarea overwrites previous notes, no history, no timestamps
  - Proposed solution: New client_notes table with timestamps, chronological display, audit trail
  - Benefits: Track communication history, professional CRM feature, better client management
  - Priority: UX ENHANCEMENT - Professional feature before marketing launch (Phase 4)
- **2025-12-29:** Phase 3.9.2 inserted after Phase 3.9.1 - "Chatbot accès notes clients" (INSERTED)
  - Reason: Enable AI chatbot to manage client notes via natural language
  - Impact: Chatbot can read notes history, add dated notes, delete notes via AI tools
  - Solution: 3 new AI tools (get_client_notes, add_client_note, delete_client_note) + SSE real-time UI refresh
  - Priority: UX ENHANCEMENT - AI integration for professional CRM feature
- **2025-12-29:** Phase 3.9.3 inserted after Phase 3.9.2 - "Fix chatbot input focus bug" (URGENT)
  - Reason: Chatbot textarea remains focused when clicking outside, prevents typing in other inputs
  - Impact: User cannot add client notes while chatbot is open - textarea steals focus
  - Expected: Textarea should blur when clicking outside chatbot area
  - Priority: URGENT - UX blocker preventing simultaneous chatbot + page interaction
- **2026-01-04:** Phase 3.11 inserted after Phase 3.10 - "Rangement et nettoyage du dossier" (INSERTED)
  - Reason: Organiser et nettoyer le dossier de projet avant le lancement marketing
  - Impact: Maintenir une codebase propre et professionnelle, supprimer fichiers obsolètes, organiser documentation
  - Scope: Suppression fichiers temporaires, organisation documentation, validation structure projet, nettoyage code mort
  - Priority: ORGANISATION - Qualité et maintenabilité avant Phase 4 (Marketing Foundation)
- **2026-01-04:** Phase 3.12 inserted after Phase 3.11 - "Modes d'affichage multiples clients" (INSERTED)
  - Reason: Add 3 viewing modes to /clients page (Table/Grid/Kanban) for better UX
  - Impact: Users can toggle between dense table, card grid with avatars, and detailed kanban views
  - Scope: Button toggle, localStorage persistence, Grid mode (avatars, badges), Kanban mode (max details)
  - Priority: UX ENHANCEMENT - Visual client management before marketing launch
- **2026-01-04:** Phase 3.13 inserted after Phase 3.12 - "Validation UI Complète de Toutes les Pages" (INSERTED)
  - Reason: Systematic UI validation of all pages before marketing launch (user requested)
  - Impact: Catch UI bugs, inconsistencies, broken features across 45 pages (Admin 37, Client Portal 5, Super Admin 3)
  - Scope: Manual testing of all pages, forms, navigation, error states, responsive, dark mode
  - Priority: QUALITY GATE - Ensure flawless UI before Phase 4 drives traffic
- **2026-01-16:** Phase 18.1 inserted after Phase 18 - "Fix Database Initialization - Resolve schema/migrations desync blocking all testing" (URGENT - P0 BLOCKER)
  - Reason: BUG-001 discovered during Phase 18-02 environment setup - cannot initialize local database for testing
  - Impact: Master DB schema/migrations desynchronized - TypeScript schema includes Stripe billing columns (stripe_customer_id, stripe_subscription_id, subscription_status, current_period_end, logo_url) but migration file missing these columns
  - Root cause: Schema drift - packages/database/src/master/schema.ts vs drizzle/migrations/master/0000_massive_zodiak.sql mismatch
  - Blocks: All Phase 18 testing (cannot login, cannot test any pages)
  - Fix scope: Generate missing migration, sync schema, verify init script end-to-end, test fresh database setup
  - Priority: P0 BLOCKER - Must fix before any Phase 18 testing can proceed
- **2026-01-16:** Phase 18.2 inserted after Phase 18.1 - "Fix Systematic Schema/Migration Desync - Generate and apply missing tenant migrations" (URGENT - P0 BLOCKER)
  - Reason: BUG-003 discovered during Phase 18-02 environment setup - systematic desync affecting tenant tables (sessions, invoices, musicians)
  - Impact: Sessions and invoices queries 100% broken - missing 13 columns total across 3 tables
  - Root cause: Phases 10-17 modified schema.ts but never ran `pnpm db:generate` - migrations never created
  - Blocks: ~40% of Phase 18-02 testing (sessions, invoices, time tracking, reports pages)
  - Fix scope: Generate tenant migrations, apply to tenant_1 and tenant_16, verify all affected tables
  - Priority: P0 BLOCKER - No workaround, must fix before Phase 18-02 can proceed
- **2026-01-16:** Phase 18.3 inserted after Phase 18.2 - "Database Reset for Testing Environment" (URGENT - P0 BLOCKER)
  - Reason: User extremely frustrated with database chaos - "on a passé la journée sur la db... ON REPART SUR DU NEUF!!!!!!!"
  - Impact: Phase 18-02 completely blocked by inconsistent tenant configuration (multiple orgs, wrong mappings, missing tables)
  - Root cause: Init scripts (src/scripts/init.ts) created before Phase 10-17 - missing subscription_plans, ai_credits, Stripe columns, vCard fields, quotes, time_entries, service_catalog
  - Solution: Nuclear reset - drop ALL tenants, rebuild rsm_master with migrations, create ONE fresh tenant (tenant_1), seed test data
  - Result: Clean slate - 1 master DB (7 tables), 1 tenant DB (30+ tables), zero schema mismatches, test data seeded
  - Priority: P0 BLOCKER - User cannot proceed with manual testing until database clean

- **2026-01-18:** Phase 22 added after Phase 21.1 - "Refonte UI Client - Hub Relationnel Complet" (ADDED)
  - Reason: Phase 18.4 a ajouté 22 champs musicaux mais l'UI n'a pas été réorganisée pour afficher cette quantité d'information
  - Impact: Pages création/modification client éparpillées, manque accès aux données relationnelles (projets, tracks, finances)
  - Solution: Créer composant ClientForm réutilisable avec sections organisées + ajouter onglets Projets/Tracks/Finances sur ClientDetail
  - Priority: UX enhancement - Améliorer productivité studios avec hub relationnel client complet
- **2026-01-19:** Phase 23 added after Phase 22 - "Simplification Onglet Informations Client" (ADDED)
  - Reason: L'onglet "Informations" a 3 sous-onglets (informations, enrichi, profil musical) créant navigation complexe
  - Impact: Utilisateurs doivent cliquer plusieurs fois pour voir tous les champs d'un client
  - Solution: Supprimer sous-onglets, afficher tous champs dans vue unique avec sections visuelles distinctes
  - Priority: UX simplification - Réduire friction navigation, vue d'ensemble immédiate du profil client
- **2026-01-19:** Phase 25 added after Phase 24 - "Gestion Relations Client-Entreprise" (ADDED)
  - Reason: Table companyMembers existe en DB avec relations many-to-many mais aucune UI pour gérer ces relations
  - Impact: Studios ne peuvent pas lier contacts individuels aux entreprises clientes (ex: ingénieur du son membre d'un label)
  - Solution: Créer endpoints API manquants (addMember, removeMember, updateMember) + UI complète (onglet Membres pour entreprises, section Entreprises pour individus)
  - Priority: Feature gap - Fonctionnalité relationnelle essentielle pour gestion professionnelle des contacts
### Blockers/Concerns Carried Forward

**Resolved in Phase 1 Plan 1:**
- ✅ CORS blocker fixed (now accepts https://*.recording-studio-manager.com)
- ✅ auth.ts committed (tenant auto-provisioning integrated)
- ✅ Test cleanup committed (.gitignore updated for Playwright artifacts)

**Resolved in Phase 1 Plan 2:**
- ✅ Database health check fixed (postgres-js compatibility)
- ✅ PostgreSQL authentication issue resolved in production
- ✅ Uptime Kuma monitoring deployed and configured
- ✅ All health endpoints operational (200 OK)

**Resolved in Phase 1 Plan 3:**
- ✅ Production 502 Bad Gateway fixed (client container port mapping)
- ✅ Tenant database creation bug fixed (migration path corrected)
- ✅ Signup flow validated (tenant_6 auto-provisioned successfully)
- ✅ Core flows tested (dashboard, bookings, AI chatbot all functional)

**Resolved in Phase 3.1 (Infrastructure):**
- ✅ VPS Docker DNS resolution (systemd-resolved incompatibility)
- ✅ Port 3001 conflict with orphaned docker-proxy processes
- ✅ VITE_API_URL build-time configuration for frontend
- ✅ Local client container port 80 conflict

**Resolved in Phase 3.1:**
- ✅ ISSUE-001 (P0): Production deployment fixed (Nginx proxy updated to port 3002)
- ✅ Health endpoint working: `/api/health` returns `{"status":"ok"}`
- ✅ Production site operational: https://recording-studio-manager.com
- ✅ Client container started (rsm-client on port 8080)
- ✅ Debug logging removed from context.ts
- ✅ Session cookie fix verified (authentication working)

**Resolved in Phase 18.1:**
- ✅ BUG-001 (P0): Database initialization blocker fixed
- ✅ PostgreSQL 17 added to PATH for CLI access
- ✅ Master migration generated (subscription_plans + ai_credits tables)
- ✅ rsm_master synchronized: 5→7 tables (Phase 10-17 schema added)
- ✅ tenant_1 rebuilt clean: 30 tenant-only tables
- ✅ Phase 18-02 testing unblocked

**Resolved in Phase 18.2:**
- ✅ BUG-003 (P0): Schema/migration desync blocker fixed
- ✅ Migration 0010 created manually (6 invoices columns)
- ✅ tenant_1 invoices synchronized (migration 0010 applied)
- ✅ tenant_16 fully synchronized (migrations 0003 + 0008 + 0010 applied)
- ✅ Sessions and invoices queries working (0 PostgreSQL errors)
- ✅ Phase 18-02 testing fully unblocked (~40% of scope restored)

**Resolved in Phase 18.3:**
- ✅ Database chaos blocker fixed (nuclear reset complete)
- ✅ All old tenants dropped (tenant_2 removed, tenant_1/3/16 already gone)
- ✅ rsm_master rebuilt with 7 tables (master migrations 0000-0002 applied)
- ✅ Master schema includes Phase 10-17 additions (subscription_plans, ai_credits, Stripe columns)
- ✅ tenant_1 created fresh with 30+ tables (tenant migrations 0000-0010 applied)
- ✅ Tenant schema includes all Phase 10-17 additions (vCard fields, quotes, time_entries, etc.)
- ✅ Test data seeded (5 clients, 4 rooms, 6 equipment, 4 sessions, 3 projects, etc.)
- ✅ Environment validated (backend running, frontend accessible, DB connection verified)
- ✅ Credentials documented in .continue-here.md
- ✅ Zero schema mismatches - both databases match current schema.ts
- ✅ Phase 18-02 testing fully unblocked (clean database with ONE tenant)

**Resolved in Phase 21.1:**
- ✅ Client Portal authentication persistence bug FIXED (E2E tests now 9/9 passing)
- ✅ Migrated from localStorage sessionToken to express-session cookies
- ✅ Unified authentication system (Admin Portal + Client Portal)
- ✅ Phase 17 UAT unblocked - invoice payment flow now functional

**Still outstanding:**
- ✅ Phase 5 Item 11 identity RÉSOLU - Item 11 = Documentation Phase 5 (FAIT Session 4), Item 12 = Tests E2E (optionnel, 100% fonctionnel sans)
- Sentry DSN environment variables need to be added when project created
- Debug logging cleanup in context.ts (after auth verification - ISSUE-006)
- ✅ Stripe payment UI implementation - COMPLET (Checkout Sessions, webhooks, subscriptions 3 tiers créés)
- ✅ Projects "Create Project" UI flow - COMPLET (CreateProject modal avec validation)

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Fix auto-refresh de la liste services après création | 2026-01-22 | 543ceb6 | [001-services-auto-refresh-apres-creation](./quick/001-services-auto-refresh-apres-creation/) |
| 003 | Teste la creation de devis (E2E test) | 2026-01-22 | 41826b0 | [003-teste-la-creation-de-devis](./quick/003-teste-la-creation-de-devis/) |
| 004 | Fix conversion devis→projet + cache invalidation | 2026-01-22 | 747d604 | [004-teste-conversion-devis-projet](./quick/004-teste-conversion-devis-projet/) |
| 005 | Fix quotes status display (cancelled, converted) | 2026-01-22 | fe50334 | [005-fix-quotes-status-display](./quick/005-fix-quotes-status-display/) |
| 006 | Harmonize quote badge colors list/detail | 2026-01-22 | fce86f1 | [006-fix-quotes-status-badge-colors](./quick/006-fix-quotes-status-badge-colors/) |
| 007 | Editable validity days for quotes | 2026-01-22 | 0db194c | [007-editable-validity-days](./quick/007-editable-validity-days/) |
| 008 | Revert quote to draft (sent/cancelled) | 2026-01-22 | 32006de | [008-revert-quote-to-draft](./quick/008-revert-quote-to-draft/) |
| 009 | Test creation facture (E2E Playwright) | 2026-01-22 | dbe817e | [009-test-creation-facture](./quick/009-test-creation-facture/) |
| 010 | Invoice lines from services catalog (autocomplete + modal) | 2026-01-22 | 2f444a3 | [010-invoice-lines-from-services-catalog](./quick/010-invoice-lines-from-services-catalog/) |
| 011 | Invoice edit lines with service catalog | 2026-01-22 | 44d2815 | [011-invoice-edit-lines-service-catalog](./quick/011-invoice-edit-lines-service-catalog/) |
| 012 | Invoice detail full-width layout (remove sidebar) | 2026-01-22 | eceb2d3 | [012-invoice-detail-full-width-no-sidebar](./quick/012-invoice-detail-full-width-no-sidebar/) |
| 013 | Test modification facture (E2E Playwright) | 2026-01-22 | fda0a70 | [013-test-modification-facture](./quick/013-test-modification-facture/) |

## Project Alignment

Last checked: Project initialization
Status: ✓ Aligned
Assessment: Roadmap designed directly from PROJECT.md success criteria. All 8 phases map to v1.0 commercial launch requirements.
Drift notes: None - baseline alignment at project start.

## Session Continuity

Last session: 2026-01-22T03:24:54Z
Stopped at: Phase 28 COMPLETE ✅ - Completed 28-04, harmonized TalentDetail with ClientDetail pattern
Resume context:
  - Phase 28 COMPLETE ✅: Harmonisation UI Talents (14 min total, 4/4 plans complete)
    - **Plan 28-04:** TalentDetail harmonization with tabbed interface (2 min, 3 tasks) - COMPLETE ✅
      - **Task 1:** Created TalentDetailTabs component - `b31e6bb`
        - 4 tabs: Informations, Sessions, Projets, Finances
        - Organized view sections: Identité, Contact, Profil Musical, Plateformes Streaming
        - Icons with text-primary color (User, Mail, Music, Globe)
        - Separator components between sections
        - Grid-cols-3 layouts for label/value pairs
        - JSON parsing utility for instruments/genres arrays
        - Placeholder tabs for future session/project/finance integration
        - Edit mode placeholder ready for TalentEditForm (28-05)
        - Component: 265 lines total
      - **Task 2:** Refactored TalentDetail.tsx to use tabs pattern - `b31e6bb`
        - 59% reduction: 583→240 lines
        - Header with edit/save/cancel button workflow
        - Active tab state management (activeTab, setActiveTab)
        - handleUpdateField and handleSave functions
        - Delete dialog preserved
        - All inline card forms removed (moved to TalentDetailTabs)
      - **Task 3:** Build verification and commit - `b31e6bb`
        - TypeScript compilation successful
        - Production build successful (1.7MB bundle)
        - Zero TalentDetail-related errors
        - Visual consistency with ClientDetail patterns verified
    - **Key achievements (28-04):**
      - TalentDetail page modernized with tabbed interface
      - View mode organized sections match ClientDetail patterns
      - Visual hierarchy consistent (icons, separators, grid layouts)
      - Edit mode integration ready for 28-05
      - Placeholder tabs for future phases prepared
      - Zero deviations from plan
      - Build successful, zero errors
    - **Deviations (28-04):**
      - None - plan executed exactly as written
    - **Next:** Phase 28-05 - TalentEditForm component for edit mode
    - **Plan 28-02:** Talents UI foundation components (2 min, 3 tasks) - COMPLETE ✅
      - **Tasks 1-3:** ViewMode, Stats, and Components - `e8b8216`
        - **Task 1:** ViewMode state with localStorage persistence
          - Added type definitions (ViewMode, SortField, SortOrder)
          - State initialization from localStorage key 'talentsViewMode'
          - useEffect for persistence on viewMode change
          - Toggle buttons (Table/Grid/Kanban) in CardHeader
          - Active button highlighted with 'default' variant
          - Conditional table rendering: {viewMode === 'table' && (...)}
        - **Task 2:** Stats cards with musician-specific KPIs
          - 4-card grid layout (md:grid-cols-2 lg:grid-cols-4)
          - Card 1: Total talents (stats.total)
          - Card 2: Performers VIP (stats.vipPerformers) with Star icon (yellow-500 fill)
          - Card 3: Total crédits (stats.totalCredits)
          - Card 4: Dernière activité (stats.lastActivityDate) with French date format
          - Replaced old stats (withEmail, withPhone, withWebsite)
          - Adapted to backend response (totalCredits, lastActivityDate)
        - **Task 3:** CopyButton component and Avatar imports
          - CopyButton function component (email/phone copy with toast)
          - Avatar component imported (AvatarImage, AvatarFallback)
          - getInitials utility imported from @/lib/utils
          - date-fns imports (format, fr locale)
          - Icons added: TableIcon, Grid, Columns, Copy, Star
    - **Key achievements (28-02):**
      - ViewMode state functional with 3 modes (table/grid/kanban)
      - localStorage persistence working ('talentsViewMode' key)
      - Stats cards displaying VIP performers with visual icon
      - French date formatting for last activity (dd MMM yyyy)
      - Foundation components ready for Grid/Kanban views
      - Zero deviations from plan
      - Build successful (1697KB bundle)
    - **Deviations (28-02):**
      - None - plan executed exactly as written
    - **Next:** Phase 28-03 - Talents.tsx Grid/Kanban view implementations
    - **Plan 28-01:** Enhanced musicians backend router (1 min, 3 tasks) - COMPLETE ✅
      - Backend search/sort/stats endpoints ready
      - trackCredits-based metrics (VIP threshold >10 credits)
      - JSONB text casting for array field searching
  - Phase 27 COMPLETE ✅: Affichage Conditionnel Selon Type Client (4 min total execution, 2/2 plans)
    - **Plan 27-01:** Conditional accordion rendering based on client type (2 min, 1 task)
      - **Task 1:** Conditional rendering for music-related accordions - `26611b8`
        - Wrapped Profil Artistique accordion in formData.type === "individual" conditional
        - Wrapped Streaming accordion in formData.type === "individual" conditional
        - Updated Alt key handler to dynamic allAccordions array (4 for company, 6 for individual)
        - Company clients now see 4 accordions: Identité, Coordonnées, Relations Pro, Champs Personnalisés
        - Individual clients see all 6 accordions (unchanged experience)
        - artistName field remains visible for both types (business requirement)
    - **Plan 27-02:** Gap closure - Birthday and gender conditional rendering (2 min, 1 task)
      - **Task 1:** Wrap birthday and gender fields in conditional rendering - `6da844e`
        - Birthday field only renders when formData.type === "individual"
        - Gender field only renders when formData.type === "individual"
        - Both fields wrapped in same conditional block with Fragment wrapper
        - Matched existing pattern from structured name fields (lines 214-279)
        - Company clients now see clean 4-field Identité (Type, artistName, companyName, name)
        - Individual clients unchanged (all identity fields visible)
    - **Key achievements (Phase 27):**
      - Complete type-specific UI adaptation for client forms
      - Company clients see minimal, relevant fields only (no music-related sections or personal fields)
      - Individual clients retain full form with all 6 accordions and personal fields
      - Zero deviations across both plans
      - Production build successful (1.7MB bundle)
      - Gap closure verified - all must-haves from 27-VERIFICATION.md satisfied
    - **Verification:** Phase 27 gaps CLOSED ✓
      - Music accordions conditional (27-01) ✓
      - Birthday/gender conditional (27-02) ✓
      - Dynamic visibility complete ✓
      - TypeScript passes (pre-existing errors unrelated) ✓
      - Production build successful ✓
  - **Previous context:**
  - Phase 27 COMPLETE ✅: Affichage Conditionnel Selon Type Client (4 min total execution, 2/2 plans)
    - **Plan 27-01:** Conditional accordion rendering based on client type (2 min, 1 task)
      - **Task 1:** Conditional rendering for music-related accordions - `26611b8`
        - Wrapped Profil Artistique accordion in formData.type === "individual" conditional
        - Wrapped Streaming accordion in formData.type === "individual" conditional
        - Updated Alt key handler to dynamic allAccordions array (4 for company, 6 for individual)
        - Company clients now see 4 accordions: Identité, Coordonnées, Relations Pro, Champs Personnalisés
        - Individual clients see all 6 accordions (unchanged experience)
        - artistName field remains visible for both types (business requirement)
    - **Plan 27-02:** Gap closure - Birthday and gender conditional rendering (2 min, 1 task)
      - **Task 1:** Wrap birthday and gender fields in conditional rendering - `6da844e`
        - Birthday field only renders when formData.type === "individual"
        - Gender field only renders when formData.type === "individual"
        - Both fields wrapped in same conditional block with Fragment wrapper
        - Matched existing pattern from structured name fields (lines 214-279)
        - Company clients now see clean 4-field Identité (Type, artistName, companyName, name)
        - Individual clients unchanged (all identity fields visible)
    - **Key achievements (Phase 27):**
      - Complete type-specific UI adaptation for client forms
      - Company clients see minimal, relevant fields only (no music-related sections or personal fields)
      - Individual clients retain full form with all 6 accordions and personal fields
      - Zero deviations across both plans
      - Production build successful (1.7MB bundle)
      - Gap closure verified - all must-haves from 27-VERIFICATION.md satisfied
    - **Verification:** Phase 27 gaps CLOSED ✓
      - Music accordions conditional (27-01) ✓
      - Birthday/gender conditional (27-02) ✓
      - Dynamic visibility complete ✓
      - TypeScript passes (pre-existing errors unrelated) ✓
      - Production build successful ✓
  - **Next:** Phase 27 verified complete. Ready for production deployment. Company clients now have clean, context-appropriate forms without individual-specific fields.
  - Phase 26.1 COMPLETE ✅: Réorganisation Accordéons - Logique Studio d'Enregistrement (47 min total execution, 1/1 plans)
    - **Plan 26.1-01:** 7→5 accordion restructure with iterative user feedback (47 min, 13 tasks)
      - **Task 1:** Restructure 7 accordions to 5 fused sections - `d523669`
        - Initial refactor: Identity, Profil Artistique, Coordonnées, Relations Pro, Notes Studio
        - Fused streaming + professional + career into Profil Artistique
        - Fused contact + address into Coordonnées
      - **Task 2:** Create 6th accordion for Streaming Platforms - `a8dbeae`
        - User requested separate streaming accordion (11 platform URLs)
        - Subsection separation with border-t in Profil Artistique
      - **Task 3:** User modifications (delete Relations Pro, move birthday/gender) - `ebcc787`
        - Deleted Relations Professionnelles accordion completely
        - Moved birthday and gender to Identité
        - Kept only customFields in Notes Studio
      - **Task 4:** Reorder accordions, set default state, add Alt key toggle - `a3774f3`
        - New order: Identité, Coordonnées, Profil Artistique, Streaming, Notes Studio
        - Default state: only Identité open
        - Alt key listener: toggle all open/close
      - **Task 5:** Auto-fill Nom complet from structured fields - `0b39e91`
        - useEffect auto-generates from prefix, firstName, middleName, lastName, suffix
        - Only for individual clients (not companies)
      - **Task 6:** Make Nom complet readonly - `a3396f3`
        - Added readOnly, bg-muted, cursor-not-allowed classes
        - Placeholder: "Se génère automatiquement"
      - **Task 7:** Reorder Identité fields (artistName top) - `23ae908`
        - New order: Type de client, artistName, Nom complet, structured name, birthday, gender
      - **Task 8:** Move Type de client to top position - `f1fced9`
        - Critical business context first (determines if artistName or companyName primary)
      - **Task 9:** Reorganize Coordonnées with cleaner structure - `3d1d8e9`
        - Added subsection headers: Contact (phones, emails, websites), Adresses (addresses array)
        - Visual separator with border-t between sections
      - **Task 10:** Complete 3-column grid redesign - `6cbc14a`
        - Applied grid-cols-[120px_1fr_80px] to phones, emails, websites, addresses
        - Type selector (120px) | input (flex) | actions (Plus + Trash2, 80px)
      - **Task 11:** Add rounded corners to all selects - `f3fa4b1`
        - Applied rounded-md to prefix, gender, contact type selectors
        - Visual consistency with input fields
      - **Task 12:** Standardize Trash2 icon colors - `5630d73`
        - Verified all 5 Trash2 icons had text-muted-foreground
        - Issue was Plus icons (see Task 13)
      - **Task 13:** Standardize Plus icon colors (root cause fix) - `d60ddf5`
        - Added text-muted-foreground to all 5 Plus icons
        - Root cause: Plus icons inherited black from button text, Trash2 had explicit gray
        - Now all action icons consistent gray color
    - **Key achievements (26.1-01):**
      - 7→5 accordion restructure (28% navigation reduction)
      - Studio workflow logic: identity → contact → artistic profile → streaming → notes
      - Musical profile positioned 2nd (core business focus)
      - All contact info unified in single Coordonnées accordion
      - 3-column grid layout for all array contact fields
      - Consistent icon colors (Plus and Trash2 both text-muted-foreground)
      - Auto-fill readonly Nom complet from structured name components
      - Alt key shortcut for batch accordion operations
      - Type de client and artistName prioritized at top of Identité
      - Rounded corners on all select elements
      - 13 atomic commits with user feedback loop
    - **Verification:** All success criteria met ✓
      - 5 accordion sections ✓
      - Studio workflow order ✓
      - Musical profile 2nd position ✓
      - All contact fields in Coordonnées ✓
      - 3-column grid contact arrays ✓
      - Consistent icon colors ✓
      - Auto-fill readonly Nom complet ✓
      - Alt key toggle ✓
      - TypeScript 0 errors ✓
      - Production build successful ✓
  - **Next:** Phase 26.1 verified complete. Ready for next phase or feature development. ClientEditForm fully optimized for studio workflow with 5 accordions, consistent UX, and all 50+ fields accessible.
  - Phase 26 COMPLETE ✅: Formulaire Client avec Accordéons (7 min total execution, 1/1 plans)
    - **Plan 26-01:** Accordion-based edit form refactoring (7 min, 3 tasks + documentation)
      - **Task 1:** Complete ClientEditForm with 7 accordion sections - `e5f4bfe`
        - Created ClientEditForm.tsx (1008 lines, 161% increase from 386 lines)
        - Added shadcn/ui accordion component
        - All 7 sections: Identity, Contact, Address, Personal, Streaming, Professional, Career
        - All 22 music profile fields included (Phase 18.4)
        - All vCard enriched fields included (structured name, contact arrays, address arrays)
        - Consistent styling: Card wrapper, AccordionTrigger px-4 py-3, AccordionContent space-y-3
        - All accordions open by default for immediate access
        - Array management with Plus/Trash2 icons
        - Grid layouts for related fields (md:grid-cols-2, md:grid-cols-3)
        - Comma-separated input for genres/instruments arrays
      - **Task 2:** Replace ClientFormWizard import - `bb9e769`
        - Removed unused ClientFormWizard from ClientDetail.tsx
        - Added ClientEditForm import
        - No breaking changes
      - **Task 3:** Integrate ClientEditForm into ClientDetailTabs - `a04d892`
        - Replaced 215 lines inline edit code with 7-line component
        - 93% code reduction in informations tab
        - Conditional rendering: isEditing ? ClientEditForm : Card view
        - View mode preserved unchanged
        - Production build successful (1.7MB bundle)
      - **Task 4:** Manual testing procedure documented
        - 8-step browser verification checklist
        - Expected behavior: accordion pattern, visual consistency, save/cancel workflows
    - **Key achievements (26-01):**
      - Wizard pattern eliminated completely
      - Visual consistency between view/edit modes
      - Zero cognitive friction switching modes
      - All fields accessible without navigation steps
      - TypeScript 0 errors, production build successful
    - **Verification:** All success criteria met ✓
      - 7 complete accordion sections ✓
      - All music profile fields included ✓
      - All vCard fields included ✓
      - Wizard removed ✓
      - Edit mode shows accordions ✓
      - View mode preserved ✓
      - TypeScript 0 errors ✓
      - Production build successful ✓
  - **Next:** Phase 26 verified complete. Ready for manual browser testing. Full accordion-based edit form with consistent UX across view/edit modes.
  - Phase 25 COMPLETE ✅: Gestion Relations Client-Entreprise (8 min total execution, 2/2 plans)
    - **Plan 25-01:** Full CRUD UI for many-to-many relationships (6 min, 3 tasks)
      - **Task 1:** Backend endpoints (addMember, updateMember, removeMember, getCompanies) - `dc586e6`, `87bafbe`
        - Validation: Type checking (company/individual), duplicate prevention, error handling
        - 4 new endpoints total (including getCompanies for individual view)
      - **Task 2:** CompanyMembersModal component (362 lines) - `9d25e77`
        - Bidirectional: Single component handles both company→members and individual→companies views
        - Inline role editing with onChange + onBlur save pattern
        - Searchable dropdown, isPrimary checkbox, toast notifications
        - Auto-invalidates 5 queries after mutations
      - **Task 3:** CompanyMembersIndicator component + integration (90 lines) - `3141bd3`
        - Preview with smart truncation (≤3 show all, >3 truncate with ellipsis)
        - Integrated into ClientDetailTabs after contact info section
        - Symmetrical placement for both client types
    - **Key achievements (25-01):**
      - Complete bidirectional relationship management (company ↔ individual)
      - Reusable modal pattern (clientType prop switches behavior)
      - Inline editing UX (no separate edit buttons)
      - TypeScript 0 errors, production build successful
    - **Plan 25-02:** Role autocomplete feature (2 min, 1 task)
      - **Task 3:** getRoles endpoint + HTML5 datalist autocomplete - `3dff88c`
        - Backend: Distinct query on company_members.role (non-null, non-empty, ordered)
        - Frontend: HTML5 datalist integration with conditional enable
        - Lightweight solution (4 lines vs ~30+ for Popover pattern)
    - **Key achievements (25-02):**
      - Role autocomplete prevents duplicates ("Ingénieur du son" vs "Ingénieur Son")
      - Conditional query optimization (only when modal open)
      - Native browser support (no library dependencies)
    - **Verification:** All success criteria met ✓
      - 4 backend endpoints total (addMember, updateMember, removeMember, getCompanies, getRoles)
      - Modal handles both views with single component
      - Role autocomplete suggests existing roles
      - Bidirectional UI works (add/remove from either view updates both)
      - TypeScript 0 errors, production build successful
  - **Next:** Phase 25 verified complete. Ready for manual testing and production deployment. Full company-member relationship management system with role consistency.
- **2026-01-20:** Phase 26 added after Phase 25: "Formulaire Client avec Accordéons - Refonte UI Mode Édition" (ADDED)
  - Reason: User reported design inconsistency between view page (tabs + sections) and edit page (wizard with stepper)
  - Impact: Cognitive friction for users switching between view and edit modes, wizard pattern adds navigation overhead
  - Current state: View page uses tabs with clean sections, edit mode uses ClientFormWizard with 5-step navigation
  - Solution: Replace wizard with accordion-based ClientEditForm matching view page structure (7 accordions within Informations tab)
  - Priority: UX consistency - Reduce cognitive load, improve visual coherence between view/edit modes
