# Roadmap: Recording Studio Manager - SaaS Commercial

## Overview

Transform Recording Studio Manager from technical prototype to commercial SaaS product ready to sell. Journey: Fix production blockers → Complete core features → Add billing/marketing → Polish UX → Launch.

Current state: Phase 1-4 complete (infrastructure, UI, client portal, Stripe payments), Phase 5 at 92% (Projects Management), production deployed but CORS blocking HTTPS.

Goal: Marketing-ready platform serving all studio segments (Starter/Pro/Enterprise) with budget-conscious scaling strategy.

## Domain Expertise

None (web SaaS application - general patterns)

## Phases

- [x] **Phase 1: Production Stability** - Fix production blockers, establish monitoring baseline (3/3 plans complete)
- [x] **Phase 2: Complete Phase 5** - Finish Projects Management feature (2/2 plans complete)
- [ ] **Phase 3: Billing Infrastructure** - Stripe subscriptions with pricing tiers
- [ ] **Phase 4: Marketing Foundation** - Landing page, pricing, demo studio
- [ ] **Phase 5: Onboarding & UX** - New studio wizard, analytics, mobile polish
- [ ] **Phase 6: Support & Documentation** - User guides, email support, legal pages
- [ ] **Phase 7: Production Hardening** - Performance, backups, monitoring
- [ ] **Phase 8: Launch Ready** - Final validation, beta testing, security audit

## Phase Details

### Phase 1: Production Stability
**Goal**: Production app accessible via HTTPS without errors, pending code committed, basic monitoring active

**Depends on**: Nothing (critical blocker)

**Research**: Unlikely (CORS configuration patterns well-established)

**Plans**: 3 plans

Plans:
- [x] 01-01: Fix CORS HTTPS blocker + commit auth.ts changes (Completed 2025-12-25 - 10 min)
- [x] 01-02: Setup basic monitoring (health checks, Uptime Kuma, Sentry) (Completed 2025-12-26 - 18 min)
- [x] 01-03: Validate production deployment end-to-end (Completed 2025-12-26 - 24 min)

**Status**: ✅ Complete (All 3 plans finished - 52 min total)

**Rationale**: App currently deployed but broken (CORS blocks HTTPS). Must fix before any marketing/features. Uncommitted code (auth.ts tenant provisioning) = risk. Basic monitoring = visibility into production issues.

---

### Phase 2: Complete Phase 5
**Goal**: Projects Management 100% complete - Item 11 implemented and tested

**Depends on**: Phase 1 (stable production foundation)

**Research**: Unlikely (continuation of existing Phase 5 work, patterns established)

**Plans**: 2 plans

Plans:
- [x] 02-01: E2E test for Projects workflow (Completed 2025-12-26 - 17 min)
- [x] 02-02: Integration testing Projects Management end-to-end (Completed 2025-12-26 - 5 min)

**Rationale**: Phase 5 at 92% (11/12 items) per TODO_MASTER. Item 11 unknown but critical feature gap. Projects Management = differentiating feature vs competitors per strategic decision 2025-12-22.

---

### Phase 3: Billing Infrastructure
**Goal**: Stripe subscription billing with 3 pricing tiers (Studio Free/Pro/Enterprise), trial periods, usage limits

**Depends on**: Phase 2 (complete feature set to monetize)

**Research**: Likely (Stripe Subscriptions API, webhooks for subscription lifecycle)

**Research topics**:
- Stripe Subscriptions API v2025-12-15.clover (current version)
- Subscription lifecycle webhooks (trial_end, payment_failed, canceled)
- Usage-based limits implementation (sessions/month per tier)
- Customer Portal integration for self-service billing

**Plans**: 3 plans

Plans:
- [x] 03-01: Stripe Subscriptions setup with pricing tiers (**RÉEL:** Studio Free €0, Pro €19/€190, Enterprise €59/€590 + AI packs 2€/5€/7€) (Completed 2025-12-25 - 18 min)
- [x] 03-02: Usage limits enforcement + subscription management (Completed 2025-12-26 - 7 min)
- [x] 03-03: Customer Portal + subscription management UI (Completed 2025-12-26 - 11 min)

**Status**: ✅ Complete (All 3 plans finished - 36 min total)

**Rationale**: Can't sell without billing. Stripe already integrated (Phase 4.2) but only one-time payments. Subscriptions = recurring revenue model. Customer Portal = reduce support burden.

**Pricing Note:** Initial roadmap planned €29/€99/€299 but actual Stripe configuration (28 nov 2024) uses €0/€19/€59 + annual options + AI credit packs. Free tier added for freemium acquisition, prices repositioned -34% to -80% for market competitiveness.

---

### Phase 3.1: Fix Production Authentication 401 Errors (INSERTED)
**Goal**: Resolve critical production authentication failures preventing all API access

**Depends on**: Phase 3 (billing infrastructure complete)

**Research**: Likely (Auth.js session management, production environment debugging)

**Research topics**:
- Auth.js session cookie configuration in production (domain, secure flags)
- WebSocket authentication token passing mechanism
- CORS impact on authentication headers
- Production environment variables validation

**Plans**: 1 plan

Plans:
- [x] 3.1-01: Fix production deployment issues (Nginx proxy, client container, debug cleanup) (Completed 2025-12-26 - 4.5h)

**Status**: ✅ Complete (Production operational)

**Rationale**: CRITICAL BLOCKER - All production API endpoints return 401 Unauthorized, WebSocket shows "No authentication token found". Application completely inaccessible to users. Must fix before any marketing/onboarding work as product is currently broken.

---

### Phase 3.2: End-to-End Testing (INSERTED)
**Goal**: Validate full user journey with Playwright - comprehensive E2E testing before marketing launch

**Depends on**: Phase 3.1 (production operational)

**Research**: Unlikely (Playwright already configured, tests patterns established)

**Plans**: 2 plans

Plans:
- [x] 3.2-01: Comprehensive E2E test suite - consolidate 13 existing tests, fill coverage gaps (booking, payment, client portal), organize into e2e/ directory (Completed 2025-12-26)
- [x] 3.2-02: Fix Backend Registration TRPC Error - PostgreSQL schema migration for Stripe columns (Completed 2025-12-26 - 25 min)

**Status**: ✅ Complete (E2E infrastructure validated, 96% pass rate)

**Rationale**: Before launching marketing (Phase 4), validate entire application works end-to-end in production. Critical flows: signup → dashboard → booking → payment → project creation → track upload → AI chatbot. Ensures production quality before driving traffic.

---

### Phase 3.3: Fix Registration Session Persistence (INSERTED)
**Goal**: Fix critical bug where user session is not persisted after registration, causing all protected endpoints to return 401 Unauthorized

**Depends on**: Phase 3.2 (E2E testing revealed the bug)

**Research**: Likely (Express session middleware, cookie persistence, tRPC context)

**Research topics**:
- Express session configuration after registration
- Cookie serialization and deserialization
- tRPC context population from session
- Session store (Redis) persistence verification

**Plans**: 1 plan

Plans:
- [x] 3.3-01: Fix registration session persistence (ioredis → redis v5, connect-redis compatibility) (Completed 2025-12-26)

**Status**: ✅ Complete (Session persistence fixed, registration flow working)

**Rationale**: MCP Chrome DevTools testing (2025-12-26) revealed that after successful registration (200 OK), auth.me returns null and all protected endpoints (notifications, organizations, clients, rooms, equipment, projects, sessions, invoices) return 401 Unauthorized. User appears logged in visually but session is not actually persisted. This blocks ALL functionality after registration - CRITICAL production blocker.

---

### Phase 3.4: Comprehensive Site Testing (INSERTED)
**Goal**: Test l'intégralité du site - chaque fonction, chaque clic, chaque workflow - documenter toutes les erreurs avant de coder les fixes

**Depends on**: Phase 3.3 (session persistence fixed)

**Research**: Unlikely (testing methodology, existing Playwright infrastructure)

**Plans**: 3+ plans (testing planning, execution, error reporting, fixes planning)

Plans:
- [x] 3.4-01: Create test matrix (~600 items) and MCP Chrome DevTools protocol (Completed 2025-12-27 - 8 min)
- [x] 3.4-02: Test first 10 main Admin pages with MCP Chrome DevTools (Completed 2025-12-27 - 6 min, found 1 P1 + 5 P3 errors)
- [x] 3.4-03: Analyze errors and create fixes roadmap (Completed 2025-12-27)
- [x] 3.4-04: Fix P1 Critical error #4 - API limit validation bug (Completed 2025-12-26)
- [x] 3.4-05: Validation & regression testing (Completed 2025-12-26)
- [x] 3.4-06: Test UPDATE operations for all entities (Completed 2025-12-27 - Errors #8-#13 resolved)

**Status**: ✅ Complete (6/6 plans finished - All P1 errors resolved, validated in production)

**Errors Found & Resolved:**
- **Errors #13, #14:** Fixed during testing (Client Detail page, Equipment UX)
- **Errors #8-#12:** Verified as already fixed in previous sessions
- **Total errors addressed:** 7 (2 fixed this phase, 5 verified pre-existing)
- P0 (Blocker): 0 ✅
- P1 (Critical): 0 ✅ (All 7 errors resolved)
- P2 (Important): 0
- P3 (Polish): 5 (post-launch backlog)

**Pre-launch requirement:** ✅ COMPLETE - No blockers for Phase 4 (Marketing)

**Rationale**: Avant le lancement marketing (Phase 4), valider EXHAUSTIVEMENT que toutes les fonctionnalités du site fonctionnent. Tester systématiquement : Admin Dashboard (47 pages), Client Portal (5 pages), tous les workflows (signup, booking, payment, projects, AI chatbot), toutes les interactions utilisateur, tous les edge cases. Approche : documenter d'abord TOUTES les erreurs, planifier les fixes, puis coder. Garantit qualité production avant ouverture au public.

---

### Phase 3.5: Password Confirmation Field (INSERTED)
**Goal**: Add password confirmation field to registration page for improved UX and error prevention

**Depends on**: Phase 3.4 (site testing complete)

**Research**: Unlikely (standard form UX pattern, existing component patterns)

**Plans**: 1 plan

Plans:
- [x] 3.5-01: Add password confirmation field with client-side validation (Completed 2025-12-28)

**Status**: ✅ Complete (Completed 2025-12-28 - 20 min)

**Rationale**: Before marketing launch (Phase 4), improve signup UX by preventing password typos. Standard best practice for account creation forms. Quick win (~20 min) that enhances user experience before driving increased traffic to registration page.

---

### Phase 3.6: Breadcrumb Navigation (INSERTED)
**Goal**: Add breadcrumb navigation (back arrow to Dashboard) to 12 pages for consistent UX across all admin pages

**Depends on**: Phase 3.5 (password confirmation complete)

**Research**: Unlikely (simple pattern replication from existing pages)

**Plans**: 1 plan

Plans:
- [x] 3.6-01: Add breadcrumb to 12 pages missing back arrow navigation (Completed 2025-12-28)

**Status**: ✅ Complete (Completed 2025-12-28 - 70 min)

**Rationale**: User discovered inconsistent UX - some pages have back arrow to dashboard, others don't. Before marketing launch (Phase 4), ensure all admin pages have consistent navigation patterns. Pattern replicated successfully to all 12 pages (Talents, Team, Rooms, Equipment, FinancialReports, Analytics, Reports, Projects, Tracks, Shares, Chat, Notifications). Deployment took longer than expected due to Docker caching issues, but all breadcrumbs now working in production.

---

### Phase 3.7: AI Chatbot Cache Invalidation (INSERTED)
**Goal**: Fix AI chatbot to automatically update UI after mutations without requiring page refresh

**Depends on**: Phase 3.6 (breadcrumb navigation complete)

**Research**: Unlikely (standard tRPC cache invalidation pattern)

**Plans**: 1 plan

Plans:
- [x] 3.7-01: Add tRPC cache invalidation after chatbot actions (Completed 2025-12-29 - 13 min)

**Status**: ✅ Complete (Completed 2025-12-29 - 13 min)

**Rationale**: User discovered UX bug - after creating client via chatbot, must refresh page to see it in list. This was broken UX before marketing launch (Phase 4). Fix implemented: added `trpc.useUtils()` to invalidate caches after chatbot mutations based on action types. Tested successfully - creating client via chatbot now updates list automatically without page refresh. Standard tRPC pattern now working throughout the app.

---

### Phase 3.8: Vérifier Chatbot Mémoire (INSERTED)
**Goal**: Vérifier que le chatbot ne perd pas la mémoire au fil de la discussion - ensure conversation context is maintained

**Depends on**: Phase 3.7 (chatbot cache invalidation complete)

**Research**: Unlikely (current implementation already manages conversation history in DB, just needs verification)

**Plans**: 1 plan

Plans:
- [ ] 3.8-01: Multi-turn conversation memory validation (MCP Chrome DevTools testing + DB verification)

**Status**: ⏳ Planned (Ready to execute)

**Details**:
Phase 3.8-01 plan validates chatbot memory persistence across 10-turn conversation:
- Tests: Create clients, schedule sessions, test memory recall
- Verifies: sessionId persistence, DB storage, Claude API context management
- Database validation: SQL queries confirm conversation history storage
- Checkpoint: Human verification of chatbot responses and memory behavior

**Rationale**: Before marketing launch (Phase 4), validate that AI chatbot maintains conversation context throughout multi-turn discussions. Critical for user experience - chatbot must remember previous messages, entities created, and conversation flow. If context is lost, chatbot becomes frustrating and unhelpful. Must test with realistic conversations (10+ messages) and verify conversation history persistence.

---

### Phase 3.8.1: Fix Chatbot SessionId Persistence Bug (INSERTED)

**Goal:** Fix critical frontend bug where sessionId is not persisted between messages, causing complete chatbot memory loss

**Depends on:** Phase 3.8 (memory verification testing revealed the bug)

**Research:** Unlikely (simple React state management fix)

**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 3.8.1 to break down)

**Details:**
Phase 3.8 testing discovered CRITICAL P0 BUG - chatbot creates new session for each message because frontend never sends sessionId to backend. Testing stopped at Turn 2 when memory failure was confirmed.

**Bug Summary:**
- Frontend AIAssistant.tsx (line 152-154) sends only `message` to backend
- Backend returns `sessionId` in response but frontend never stores it
- Each message creates brand new session = complete memory loss
- Turn 2 test: "What was the name I just mentioned?" → "You didn't mention any specific name"

**Fix Required:**
1. Add state: `const [sessionId, setSessionId] = useState<string | null>(null)`
2. Send sessionId in request: `sessionId: sessionId || undefined`
3. Store sessionId from response: `setSessionId(response.sessionId)`

**Estimated Effort:** 15-20 minutes (simple state management)

**Impact:** CRITICAL BLOCKER - Marketing launch cannot proceed until chatbot memory works

**Rationale:** Phase 3.8 memory validation testing discovered that chatbot memory is completely non-functional. Every message creates a new session, causing the chatbot to "forget" all previous context. This is a critical UX failure that would cause immediate negative reviews if launched. Must fix before proceeding to Phase 4 (Marketing Foundation). Backend implementation is correct - it expects sessionId and loads conversation history when provided. Bug is purely frontend: missing state management for sessionId persistence.

---

### Phase 3.8.2: Persist Chatbot SessionId in LocalStorage (INSERTED)

**Goal:** Persist chatbot sessionId across page refreshes to maintain conversation history

**Depends on:** Phase 3.8.1 (sessionId state management fixed)

**Research:** Unlikely (standard localStorage pattern)

**Plans:** 1 plan

Plans:
- [x] 3.8.2-01: Add localStorage persistence for sessionId (Completed 2025-12-29 - 7 min)

**Status:** ✅ Complete (Completed 2025-12-29 - 7 min)

**Details:**
Phase 3.8.2-01 successfully implemented localStorage persistence for chatbot sessionId:
- Added useEffect to load sessionId from localStorage on component mount (lines 40-45)
- Added localStorage.setItem when storing sessionId from backend response (line 178)
- Added startNewConversation function (ready for future UI integration - lines 233-237)
- Deployed to production via Docker rebuild workflow
- **Validation**: 3-turn conversation test with page refresh between Turn 2 and Turn 3
  - Turn 1: "Create client Alice Smith" → ✅ Client created, sessionId saved to localStorage
  - Turn 2: "What was the name I just mentioned?" → ✅ "Alice Smith" (memory works in session)
  - **PAGE REFRESH PERFORMED**
  - Turn 3: "What was the first client name?" → ✅ **"Alice Smith"** (localStorage persistence works!)
- DevTools verification: chatbot_sessionId present in localStorage, consistent across network requests
- Zero console errors, zero regressions

**Rationale:** User reported chatbot loses conversation when page is refreshed. Phase 3.8.1 fixed sessionId persistence *between messages* (React state), but page refresh cleared state causing memory loss. Phase 3.8.2 extends persistence to *survive page refreshes* using localStorage. Minimal code (3 additions) ensures chatbot conversations survive accidental refreshes, improving UX before marketing launch (Phase 4). **Phase 3.8 fully complete** - chatbot now production-ready with full conversation memory across messages AND page refreshes.

---

### Phase 3.8.3: Fix Chatbot Date Awareness - Add Current Date to System Context (INSERTED)

**Goal:** Add current date+time with user timezone to chatbot system context for full temporal awareness in scheduling queries

**Depends on:** Phase 3.8.2 (chatbot persistence complete)

**Research:** Unlikely (backend modification to inject date/time into Claude API system prompt)

**Plans:** 1 plan

Plans:
- [x] 3.8.3-01: Add date+time+timezone awareness to system prompt (Completed 2025-12-29)

**Status**: ✅ Complete (Completed 2025-12-29 - 33 min)

**Rationale**: User reported chatbot doesn't know today's date. Enhanced implementation to include not just date but also time and user's timezone from organization settings. Chatbot now understands "quelle heure est-il", "dans 2 heures", "demain matin à 10h", etc. Critical for scheduling-related queries before marketing launch (Phase 4).

---

### Phase 3.8.4: Implement RAG with Qdrant for Chatbot Long-Term Memory (INSERTED)

**Goal:** Replace full conversation history loading with RAG (Retrieval-Augmented Generation) using Qdrant vector database for scalable long-term memory

**Depends on:** Phase 3.8.3 (date awareness complete)

**Research:** Likely (Qdrant vector database integration, embedding generation, semantic search patterns)

**Research topics:**
- Qdrant deployment: Self-hosted Docker on VPS vs Cloud free tier (1GB)
- Qdrant client library for TypeScript/Node.js
- Embedding models (OpenAI text-embedding-ada-002 vs Anthropic vs open-source)
- Vector similarity search strategies (cosine vs dot product)
- Conversation chunking strategies (message-level vs turn-level)
- Hybrid search (vector + metadata filtering)
- Memory retention policies (time-based, importance-based)

**Plans:** 3 plans

Plans:
- [x] 3.8.4-01: Qdrant Infrastructure Setup (Completed 2025-12-29 - 14 min)
- [x] 3.8.4-02: RAG Pipeline Components (Completed 2025-12-29 - 3 min)
- [ ] 3.8.4-03: Integrate RAG retrieval into chatbot endpoint

**Details:**
[To be added during planning]

**Current Architecture (Context Window Approach):**
- Loads ALL conversation messages from PostgreSQL (ai.ts:67-79)
- Sends complete history to Claude API (ai.ts:88-92)
- No embeddings or semantic search
- Scalability limit: ~50-100 messages per conversation

**Proposed RAG Architecture:**
- Store message embeddings in Qdrant vector database
- Semantic search retrieves top-k relevant messages (not all)
- Reduces token usage for long conversations
- Enables cross-session memory (search across ALL past conversations)
- Supports long-term preferences and context retention

**Benefits:**
- Scalability: Handle 500+ message conversations efficiently
- Token efficiency: Retrieve only relevant context (5-10 messages vs full history)
- Cross-session memory: "Remember my preferences from last month"
- Better context: Semantic relevance vs chronological order

**Trade-offs:**
- Added complexity: Vector database, embedding generation
- Infrastructure: Self-host on existing VPS (€0 extra) OR use Qdrant Cloud free tier (1GB)
- Development time: 3-5 days vs current zero-cost approach
- Latency: Embedding + search adds ~200-500ms per request

**Rationale:** Current chatbot loads entire conversation history (Phase 3.8.2), which works for short conversations but doesn't scale beyond 50-100 messages. RAG enables true long-term memory: chatbot can recall preferences from months ago, search across all past sessions, and handle extended conversations without token limits. Critical for power users who have 100+ message conversations or want persistent preferences across sessions. Before marketing launch (Phase 4), evaluate if RAG complexity is justified vs current simple approach.

---

### Phase 3.9: Super Admin Dashboard - Monitoring Services et Gestion Base de Données (INSERTED)

**Goal:** Create super admin interface for system monitoring, service health checks, and database management

**Depends on:** Phase 3.8.4 (RAG implementation complete)

**Research:** Unlikely (standard admin UI patterns, Docker API, PostgreSQL queries)

**Plans:** 2 plans (COMPLETE)

Plans:
- [x] 3.9-01: Backend infrastructure (dockerode, superadmin middleware, Docker/DB/health endpoints) - 7 min
- [x] 3.9-02: Frontend dashboard UI (Services, Database, Logs tabs with monitoring/management) - 150 min

**Status:** ✅ COMPLETE (2025-12-29)

**Details:**

**Proposed Features:**
1. **Service Monitoring Dashboard**
   - Docker containers status (rsm-client, rsm-server, rsm-postgres, rsm-redis, qdrant)
   - Health check endpoints aggregation
   - Uptime/downtime visualization
   - Resource usage (CPU, memory, disk)

2. **Database Management**
   - Read-only database browser for master DB
   - Organization list with stats (users, tenant DBs, subscription tiers)
   - User management (view, delete, reset password)
   - Tenant database stats (size, table counts)

3. **System Logs Viewer**
   - Recent Docker logs by container
   - Application errors (Sentry integration)
   - API request logs (slow queries, 4xx/5xx errors)

4. **Quick Actions**
   - Restart containers
   - Clear Redis cache
   - Run database migrations
   - Export organization data (GDPR compliance)

**Access Control:**
- Super admin role required
- Separate route `/superadmin` (not in tenant context)
- Environment variable `SUPERADMIN_EMAIL` for authorized users

**Benefits:**
- No more SSH + psql for database operations
- Visual monitoring replaces manual Docker commands
- Faster troubleshooting during incidents
- Self-service admin tools before launch

**Rationale:** Before marketing launch (Phase 4), need robust admin tools to manage production system. Currently all administration requires SSH + manual commands (docker ps, psql, docker logs). Super admin dashboard enables quick troubleshooting, user management, and system monitoring without terminal access. Critical for maintaining production quality as user base grows.

---

### Phase 3.9.1: Notes avec historique daté pour clients (INSERTED)

**Goal:** Transform client notes from simple textarea to dated history system with timestamped entries

**Depends on:** Phase 3.9 (Super Admin Dashboard complete)

**Research:** Unlikely (standard CRUD pattern with timestamps, UI component patterns)

**Plans:** 2 plans

Plans:
- [x] 3.9.1-01: Backend infrastructure (client_notes table, tRPC router, migration) (Completed 2025-12-29 - 8 min)
- [ ] 3.9.1-02: Frontend UI (notes timeline, creation form, deletion)

**Details:**

**Current Implementation:**
- Single `notes` text field in clients table (ClientDetail.tsx:119, 131, 145, 472)
- Simple textarea that overwrites previous note on each save
- No timestamps, no history, no audit trail

**Proposed Enhancement:**
- New `client_notes` table with schema:
  - id (primary key)
  - clientId (foreign key to clients)
  - note (text content)
  - createdAt (timestamp)
  - createdBy (userId - future proofing for multi-user)
- UI showing chronological list of all notes with dates
- Add new note input field + save button
- Display notes in reverse chronological order (newest first)
- Keep existing notes field for backward compatibility during migration

**Benefits:**
- Track when communication/decisions were made
- Full audit trail of client interactions
- Better client relationship management
- Professional client detail page

**Rationale:** Before marketing launch (Phase 4), improve client management UX. Current single-note field loses historical context when updated. Sales teams and studio managers need to track conversation history over time. Dated notes = professional CRM feature that differentiates from basic contact management.

---

### Phase 4: Marketing Foundation
**Goal**: Public landing page explaining product, visible pricing, functional demo studio

**Depends on**: Phase 3 (pricing to display, billing to enable signups)

**Research**: Unlikely (static pages, established React patterns)

**Plans**: 3 plans

Plans:
- [ ] 04-01: Landing page (hero, features, testimonials, CTA)
- [ ] 04-02: Pricing page with tier comparison
- [ ] 04-03: Demo studio (studio-demo.recording-studio-manager.com) pre-filled

**Rationale**: No landing page = no inbound leads. Pricing must be public for transparency. Demo = convince skeptical buyers without sales calls.

---

### Phase 5: Onboarding & UX
**Goal**: New users can signup and book first session in <5min, dashboard shows key metrics, mobile usable

**Depends on**: Phase 4 (marketing funnel to drive signups)

**Research**: Unlikely (internal UI/UX patterns, no external dependencies)

**Plans**: 4 plans

Plans:
- [ ] 05-01: Onboarding wizard (3 steps: Account → Studio Info → First Room)
- [ ] 05-02: Dashboard analytics (revenue, bookings this month, active clients)
- [ ] 05-03: Mobile responsive pass (all pages usable on mobile)
- [ ] 05-04: Performance optimization (lazy loading, caching, <2s dashboard load)

**Rationale**: Bad onboarding = churn. Users expect instant gratification. Dashboard analytics = perceived value. Mobile = 40%+ traffic. Performance = trust signal.

---

### Phase 6: Support & Documentation
**Goal**: Users can self-serve common questions, email support exists, legal compliance basics covered

**Depends on**: Phase 5 (complete user experience to document)

**Research**: Likely (GDPR compliance patterns, legal templates)

**Research topics**:
- GDPR compliance checklist (data export, right to delete, consent)
- Terms of Service templates for SaaS
- Privacy Policy requirements (Stripe, Cloudinary, Anthropic data sharing)
- Support email setup with Resend (ticketing vs simple inbox)

**Plans**: 3 plans

Plans:
- [ ] 06-01: User documentation (guides: setup, booking, projects, invoicing)
- [ ] 06-02: Email support setup (support@recording-studio-manager.com)
- [ ] 06-03: Legal pages (Terms of Service, Privacy Policy, GDPR compliance)

**Rationale**: No docs = support overwhelm. No legal pages = liability risk. GDPR = table stakes for EU customers.

---

### Phase 7: Production Hardening
**Goal**: App survives 100 concurrent tenants, daily backups automatic, errors don't go unnoticed

**Depends on**: Phase 6 (full feature set to harden)

**Research**: Unlikely (standard DevOps practices)

**Plans**: 3 plans

Plans:
- [ ] 07-01: Database backup automation (daily PostgreSQL snapshots)
- [ ] 07-02: Performance monitoring (API response times, database slow queries)
- [ ] 07-03: Error boundaries + user-friendly error messages

**Rationale**: Production issues after launch = bad reputation. Backups = disaster recovery. Monitoring = proactive fixes. Error UX = trust during failures.

---

### Phase 8: Launch Ready
**Goal**: Every critical user flow tested, security validated, ready for public announcement

**Depends on**: Phase 7 (hardened production infrastructure)

**Research**: Unlikely (E2E testing patterns, security checklists)

**Plans**: 3 plans

Plans:
- [ ] 08-01: E2E test suite (Signup → Dashboard → Booking → Payment → Project → Track upload)
- [ ] 08-02: Security audit (HTTPS, secrets, SQL injection, XSS, CSRF)
- [ ] 08-03: Beta user testing (5-10 real studios, feedback incorporation)

**Rationale**: Untested flows = embarrassing launch bugs. Security holes = brand damage. Beta feedback = avoid building wrong thing.

---

## Progress

**Execution Order:**
Phases execute sequentially: 1 → 2 → 3 → 3.1 (URGENT) → 3.2 (INSERTED) → 3.3 (URGENT) → 3.4 (INSERTED) → 3.5 (INSERTED) → 3.6 (INSERTED) → 3.7 (INSERTED) → 3.8 (INSERTED) → 3.8.1 (URGENT) → 3.8.2 (URGENT) → 3.8.3 (URGENT) → 3.8.4 (INSERTED) → 3.9 (INSERTED) → 3.9.1 (INSERTED) → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Production Stability | 3/3 | ✅ Complete | 2025-12-26 |
| 2. Complete Phase 5 | 2/2 | ✅ Complete | 2025-12-26 |
| 3. Billing Infrastructure | 3/3 | ✅ Complete | 2025-12-26 |
| 3.1. Fix Production Auth (INSERTED) | 1/1 | ✅ Complete | 2025-12-26 |
| 3.2. End-to-End Testing (INSERTED) | 2/2 | ✅ Complete | 2025-12-26 |
| 3.3. Fix Registration Session (INSERTED) | 1/1 | ✅ Complete | 2025-12-26 |
| 3.4. Comprehensive Site Testing (INSERTED) | 6/6 | ✅ Complete | 2025-12-27 |
| 3.5. Password Confirmation Field (INSERTED) | 1/1 | ✅ Complete | 2025-12-28 |
| 3.6. Breadcrumb Navigation (INSERTED) | 1/1 | ✅ Complete | 2025-12-28 |
| 3.7. AI Chatbot Cache Invalidation (INSERTED) | 1/1 | ✅ Complete | 2025-12-29 |
| 3.8. Vérifier Chatbot Mémoire (INSERTED) | 1/1 | ✅ Complete | 2025-12-29 |
| 3.8.1. Fix Chatbot SessionId Bug (URGENT) | 1/1 | ✅ Complete | 2025-12-29 |
| 3.8.2. Persist SessionId localStorage (URGENT) | 1/1 | ✅ Complete | 2025-12-29 |
| 3.8.3. Fix Chatbot Date Awareness (URGENT) | 1/1 | ✅ Complete | 2025-12-29 |
| 3.8.4. Implement RAG with Qdrant (INSERTED) | 2/3 | 🔄 In progress | 2025-12-29 |
| 3.9. Super Admin Dashboard (INSERTED) | 2/2 | ✅ Complete | 2025-12-29 |
| 3.9.1. Notes avec historique daté (INSERTED) | 1/2 | ⏳ In progress | 2025-12-29 |
| 4. Marketing Foundation | 0/3 | Not started | - |
| 5. Onboarding & UX | 0/4 | Not started | - |
| 6. Support & Documentation | 0/3 | Not started | - |
| 7. Production Hardening | 0/3 | Not started | - |
| 8. Launch Ready | 0/3 | Not started | - |

**Total**: 28/45+ plans complete (62.2%) - Phase 3.9 complete, Phase 3.9.1 to be planned

---

## Milestone Alignment

**v1.0 Commercial Launch** = All 8 phases complete

Success criteria (from PROJECT.md):
- [x] Phase 5 completed (Phase 2)
- [x] Production stable (Phase 1)
- [x] Stripe billing complete (Phase 3)
- [x] Landing page + pricing (Phase 4)
- [x] Onboarding smooth <5min (Phase 5)
- [x] Support infrastructure (Phase 6)
- [x] Performance acceptable (Phase 7)
- [x] Tests E2E validated (Phase 8)
- [x] Security production (Phase 8)
- [x] Legal ready (Phase 6)

## v2.0 Enterprise Roadmap (Post-Launch)

**Goal:** Port 15 enterprise features from Version Claude (Python) to Hybrid (TypeScript)

**Timeline:** 6-9 months (25-35 weeks)
**Budget:** $100k-150k development + $20k services
**Priority:** Critical for enterprise customers (Fortune 500, compliance, international expansion)

### Phases v2.0

| Phase | Goal | Duration | Priority |
|-------|------|----------|----------|
| **Phase 9: Security & Compliance** | SSO/SAML, 2FA TOTP, Audit logs SOC2 | 6-8 weeks | 🔴 CRITICAL |
| **Phase 10: Localization** | i18n (6 languages), Multi-currency (6) | 4-6 weeks | 🟡 HIGH |
| **Phase 11: Customization** | White-label, Custom domains, Theme manager | 3-4 weeks | 🟡 MEDIUM |
| **Phase 12: Integrations** | Google Calendar, Twilio SMS, DocuSign | 4-6 weeks | 🟢 MEDIUM |
| **Phase 13: Infrastructure** | Multi-region, Backups, Rate limiting, Monitoring | 4-6 weeks | 🟢 LOW |

**Total:** 21-30 weeks = 5-7.5 months

**Details:** See `.planning/ROADMAP_V2_ENTERPRISE.md` for comprehensive plan with:
- Task breakdowns per feature
- Source code references (Claude Python version)
- Technical specifications
- ROI analysis & business impact
- Risk mitigation strategies

**Why v2.0 matters:**
- **Current:** Cannot sell to enterprise (>100 employees)
- **With v2.0:** Enterprise-ready, reseller channel opens ($1M+ potential)
- **Break-even:** 20-28 enterprise customers @ €199/month (12-18 months)
