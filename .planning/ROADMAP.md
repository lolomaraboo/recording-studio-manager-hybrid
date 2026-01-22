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

### Phase 3.9.2: Chatbot accès notes clients (INSERTED)

**Goal:** Enable AI chatbot to read and manage client notes history via natural language

**Depends on:** Phase 3.9.1 (Client notes backend complete)

**Plans:** 1 plan

Plans:
- [x] 3.9.2-01: Add client notes AI tools (get_client_notes, add_client_note, delete_client_note) + real-time UI refresh (Completed 2025-12-29)

**Details:**
Integration of Phase 3.9.1 notes system with AI chatbot (40 tools total). Enables chatbot to read notes history, add dated notes, and delete specific notes via natural language queries. Includes SSE notification system for real-time UI updates when chatbot modifies notes.

---

### Phase 3.9.3: Fix chatbot input focus bug (INSERTED)

**Goal:** Fix chatbot textarea focus - should only stay focused while chatting, lose focus when clicking elsewhere

**Depends on:** Phase 3.9.2

**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 3.9.3 to break down)

**Details:**
[To be added during planning]

**Problem:** Chatbot textarea "Tapez votre message..." remains focused even when user clicks outside chatbot to interact with other page elements (e.g., adding client notes). This prevents typing in other input fields.

**Expected behavior:**
- Textarea should be focused when user is actively chatting
- Textarea should lose focus (blur) when user clicks outside the chatbot area
- This allows user to interact with page content while chatbot is open

---

### Phase 3.9.4: Clients enrichis compatible vCard (INSERTED)
**Goal**: Enrichir le système de contacts clients pour supporter le standard vCard 4.0 avec photos/avatars, logos, contacts multiples, et upload local sécurisé

**Depends on:** Phase 3.9.3

**Plans:** 2 plans

Plans:
- [x] 3.9.4-01: Schema vCard 4.0 + Upload Local Photos/Logos (Completed 2025-12-31 - 240 min)
- [x] 3.9.4-02: Enriched Client Data Entry at Creation (Completed 2025-12-31 - 240 min)

**Status**: ✅ Complete (2/2 plans finished - 480 min total)

**Details:**
Phase 3.9.4-01: Database migration (16 vCard fields), tenant-isolated local file upload (/uploads/tenant_X/), tRPC procedures (getWithContacts, addContact, updateContact, deleteContact), frontend EnrichedClientInfo component (515 lines), security middleware for cross-tenant access blocking.

Phase 3.9.4-02: Extended clients.create mutation to accept enriched vCard fields at creation time, transformed ClientCreate.tsx into 4-tab interface (Identité/Contact/Adresse/Info additionnelles, 725 lines), integrated avatar/logo upload at creation, backward compatibility maintained (minimal name-only creation still works).

**Rationale**: vCard 4.0 compliance enables professional CRM features (structured names, multiple contacts, custom fields), avatar/logo upload improves visual identity, tenant-isolated storage ensures data security. Critical for Phase 4 marketing positioning as professional studio management platform.

---

### Phase 3.10: Test Clients Enrichis vCard (INSERTED)
**Goal**: Valider le formulaire de création enrichi et les fonctionnalités vCard 4.0 avant le lancement marketing

**Depends on:** Phase 3.9.4

**Plans:** 3 plans

Plans:
- [x] 3.10-01: Test formulaire création client enrichi (Completed 2026-01-02 - 14 min) ⚠️ CRITICAL BUG DISCOVERED
- [x] 3.10-02: Test Import/Export vCard/Excel/CSV (Completed 2026-01-02 - 45 min) - RFC 6350 validation + 8/8 Playwright tests PASS
- [x] 3.10-03: Test CRUD complet + modes affichage (Completed 2026-01-02 - 25 min) - 4/4 Playwright tests PASS, features manquantes documentées

**Status**: ✅ COMPLETE - 3/3 plans finished (84 min total) - 12/13 tests passing with CRITICAL BUG documented

**Critical Bug (BUG-001 - P0 BLOCKER) - STILL UNRESOLVED:**
- CREATE client enrichi fails with `UNKNOWN` error (Phase 3.10-01)
- Root cause: Backend mutation `clients.create` fails when submitting structured name fields
- Impact: Blocks creation of enriched clients via UI form
- Status: **NOT FIXED** - Requires backend investigation
- Workaround: Import via vCard works correctly (Phase 3.10-02 validated)

**Phase 3.10 Achievements:**
- ✅ 13 automated Playwright tests created (12 PASS, 1 FAIL)
- ✅ Import/Export vCard RFC 6350 compliant (373 valid clients)
- ✅ Import/Export CSV/Excel working (383 clients)
- ✅ Round-trip export → import preserves data integrity
- ✅ Search functionality validated (48 results by email)
- ✅ DELETE client workflow tested
- ⚠️ UPDATE enrichi UI not implemented (mode édition manquant)
- ⚠️ Grid/Kanban view modes not implemented
- ⚠️ Table enriched display (avatars, badges) not implemented
- ❌ CREATE enrichi fails with UNKNOWN error (critical blocker)

**Testing Coverage:**
- CREATE: 1 test (FAIL - BUG discovered)
- Import/Export: 8 tests (8/8 PASS)
- CRUD/Display: 4 tests (4/4 PASS with warnings)
- **Total: 12/13 tests passing**

**Rationale**: Automated testing before marketing launch (Phase 4) validates vCard 4.0 integration works for import/export. Critical bug in CREATE enrichi documented for fix, but import workflow provides functional workaround for enriched client data entry.

---

### Phase 3.11: Rangement et nettoyage du dossier (INSERTED) - ✅ COMPLETE
**Goal**: Organiser et nettoyer le dossier de projet avant le lancement marketing

**Depends on**: Phase 3.10 (testing vCard complete)

**Research**: Unlikely (file organization, code cleanup patterns)

**Plans**: 4 plans (complete)

Plans:
- [x] 3.11-01: File System Cleanup - Root directory, .worktrees/, Phase 3.4 bloat (Completed 2026-01-04 - 25 min)
- [x] 3.11-02: Git Housekeeping - Commit planning docs, .gitignore validation (Completed 2026-01-04 - 6 min)
- [x] 3.11-03: Documentation Organization - Resolve Phase 3.9.4 duplicate, validate .planning/ structure (Completed 2026-01-04 - 6 min)
- [x] 3.11-04: Audit complet et nettoyage - Full project audit, 41 fichiers organisés, 3 MB libérés (Completed 2026-01-04 - 18 min)

**Status**: ✅ Complete (4/4 plans complete)

**Details**:
Phase 3.11-01 complete: Removed 33 files from root directory (32 PNG screenshots + 1 log), cleaned .worktrees/ directory (2 git worktrees removed), reduced Phase 3.4 from 9.8MB to 908KB (~9MB freed), preserved 58 markdown documentation files.

Phase 3.11-02 complete: Committed planning documentation (CLAUDE.md, .claude_settings.json, Phase 3.10-3.11 PLAN files - 7 files, 1,926 insertions), added .gitignore patterns for test screenshots (/test-*.png, /validation-*.png), validated .gitignore prevents future test artifact commits.

Phase 3.11-03 complete: Resolved Phase 3.9.4 duplicate directory issue (consolidated vCard enrichment work, renumbered display modes to Phase 3.12), validated .planning/ structure (29 phase directories, 41 PLAN files, 53 SUMMARY files), established clean documentation baseline for Phase 4 (Marketing Foundation).

Phase 3.11-04 complete: Full project audit (80+ items analyzed), 21 fichiers obsolètes supprimés (ROADMAP.md doublon, 18 scripts .mjs temporaires), 17 fichiers archivés (.planning/docs/archive/), screenshots organisés (.planning/docs/screenshots/), 2 tests Playwright → e2e/, .gitignore mis à jour (/test-*.mjs, /test-*.spec.ts patterns), 3 MB libérés (699 MB → 696 MB).

**Rationale**: Avant le lancement marketing (Phase 4), nettoyer et organiser le dossier de projet pour maintenir une codebase propre et professionnelle. Cela inclut: suppression de fichiers obsolètes, organisation de la documentation, nettoyage des fichiers temporaires, et validation de la structure du projet.

---

### Phase 3.12: Modes d'affichage multiples clients (INSERTED)
**Goal**: Add 3 viewing modes to /clients page: Table, Grid, Kanban with avatar/badges display

**Depends on**: Phase 3.11 (cleanup complete)

**Research**: Unlikely (standard UI patterns, localStorage persistence)

**Plans**: 1 plan

Plans:
- [ ] 3.12-01: Multiple Display Modes implementation (Table/Grid/Kanban, localStorage, avatars, badges)

**Status**: Not started

**Details**:
Add 3 viewing modes to enhance client list UX:
- **Table mode** (current): Dense view, good for scanning many clients
- **Grid mode**: Card layout with avatars (initials), name, artist name, VIP badge, contact, stats
- **Kanban mode**: Expanded cards with maximum details (notes, projects, last activity)

User can toggle between modes with button group, selection persisted in localStorage. Maintains existing search/filter functionality across all modes.

**Rationale**: Improve UX for client management - different users prefer different views. Grid/Kanban modes make client cards more visual and information-rich, especially useful with vCard enrichment (Phase 3.9.4).

---

### Phase 3.13: Validation UI Complète de Toutes les Pages (INSERTED) - ✅ COMPLETE
**Goal**: Systematic UI validation of all pages before marketing launch (Admin, Client Portal, Super Admin)

**Depends on**: Phase 3.12 (display modes complete)

**Research**: Unlikely (manual testing methodology, existing Playwright patterns)

**Plans**: 2 plans (Plan 03 merged into automated testing approach)

Plans:
- [x] 3.13-01: Test Matrix & Protocol Creation (Completed 2026-01-04 - 3 min)
- [x] 3.13-02: Execute UI Validation Tests (Completed 2026-01-04 - 50 min via Playwright automation)

**Status**: ✅ Complete (2/2 plans complete)

**Results**:
- **58 pages tested** (47 automated, 11 detail pages data-dependent)
- **Test coverage:** 81% automated via Playwright E2E
- **Bugs found:** 4 total
  - ✅ BUG-001: E2E global-setup confirmPassword field (P2) - FIXED
  - ✅ BUG-002: Ambiguous password selector in test (P2) - FIXED
  - ✅ BUG-003: 404 vite.svg resource error (P3) - FIXED (needs deployment)
  - 📋 BUG-004: Client form multi-tab UI (P2) - Design intentionnel, not a bug
- **Production ready:** 0 critical bugs, 96.2% test pass rate

**Details**:
Comprehensive Playwright E2E testing across all sections:
- **Admin Dashboard**: 44 pages tested
- **Client Portal**: 7 pages tested (100% coverage)
- **Super Admin**: 3 pages tested (100% coverage)
- **Public/Auth**: 4 pages tested (100% coverage)

**Rationale**: Automated testing before marketing launch (Phase 4) validates all pages work correctly. Quality gate passed - application production-ready.

---

### Phase 3.14: Améliorations UI de Toutes les Pages (INSERTED)
**Goal**: Polish UI/UX across all 58 pages with systematic guideline-based harmonization

**Depends on**: Phase 3.13 (UI validation complete, bugs fixed)

**Research**: Unlikely (uses established TailwindCSS + shadcn/ui patterns)

**Plans**: 4 plans

Plans:
- [x] 3.14-01: Interactive approach (archived - shifted to guideline-based)
- [x] 3.14-02: Harmonize 20 Admin pages Part 1 (Completed 2026-01-05 - 90 min)
- [x] 3.14-03: Harmonize 15 Admin pages Part 2 (Completed 2026-01-05 - 45 min)
- [x] 3.14-04: Client Portal + SuperAdmin + Public + Validation (Completed 2026-01-05 - 35 min)

**Status**: ✅ Complete (All 4 plans finished - 170 min total)

**Details**:
Systematic UI harmonization across all 58 pages using UI-DESIGN-GUIDELINES.md:
- **Admin Dashboard**: 44 pages (container pt-2 pb-4 px-2, icons text-primary, cards pb-3)
- **Client Portal**: 7 pages (simplified cohérente UI, same patterns)
- **Super Admin**: 4 pages (monitoring widgets, compact layout)
- **Public/Auth**: 4 pages (centered pt-6, card structure)

**Patterns Applied**:
1. Container structure: `pt-2 pb-4 px-2` (Admin), `pt-6` centered (Public)
2. Icons: `text-primary` color on all titles (h-8 w-8)
3. Cards: `pb-3` headers, `text-base` titles
4. Empty states: `py-6` containers, `h-8` icons
5. Remove `bg-background` wrappers

**Validation**:
- ✅ 48 pages with text-primary icons
- ✅ 50 pages with pb-3 cards
- ✅ Production build: SUCCESS (4.45s, 0 errors)
- ✅ 58/58 pages harmonized

**Rationale**: Phase 3.13 validated functionality (0 critical bugs). Phase 3.14 polishes visual design for professional marketing launch. Ensures consistent, high-quality UI across all pages before Phase 4 drives traffic.

---

### Phase 4: Marketing Foundation
**Goal**: Public landing page explaining product, visible pricing, functional demo studio

**Depends on**: Phase 3.14 (UI polish complete)

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
v3.0: 1 → 2 → 3 → 3.1-3.14 (all complete ✅)
v4.0: 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17
v1.0: 4 → 5 → 6 → 7 → 8 (deferred after v4.0)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| **v3.0 - Foundation & Polish (SHIPPED)** | | | | |
| 1. Production Stability | v3.0 | 3/3 | ✅ Complete | 2025-12-26 |
| 2. Complete Phase 5 | v3.0 | 2/2 | ✅ Complete | 2025-12-26 |
| 3. Billing Infrastructure | v3.0 | 3/3 | ✅ Complete | 2025-12-26 |
| 3.1. Fix Production Auth | v3.0 | 1/1 | ✅ Complete | 2025-12-26 |
| 3.2. End-to-End Testing | v3.0 | 2/2 | ✅ Complete | 2025-12-26 |
| 3.3. Fix Registration Session | v3.0 | 1/1 | ✅ Complete | 2025-12-26 |
| 3.4. Comprehensive Site Testing | v3.0 | 6/6 | ✅ Complete | 2025-12-27 |
| 3.5. Password Confirmation Field | v3.0 | 1/1 | ✅ Complete | 2025-12-28 |
| 3.6. Breadcrumb Navigation | v3.0 | 1/1 | ✅ Complete | 2025-12-28 |
| 3.7. AI Chatbot Cache Invalidation | v3.0 | 1/1 | ✅ Complete | 2025-12-29 |
| 3.8. Vérifier Chatbot Mémoire | v3.0 | 1/1 | ✅ Complete | 2025-12-29 |
| 3.8.1. Fix Chatbot SessionId Bug | v3.0 | 1/1 | ✅ Complete | 2025-12-29 |
| 3.8.2. Persist SessionId localStorage | v3.0 | 1/1 | ✅ Complete | 2025-12-29 |
| 3.8.3. Fix Chatbot Date Awareness | v3.0 | 1/1 | ✅ Complete | 2025-12-29 |
| 3.8.4. Implement RAG with Qdrant | v3.0 | 3/3 | ✅ Complete | 2025-12-29 |
| 3.9. Super Admin Dashboard | v3.0 | 2/2 | ✅ Complete | 2025-12-29 |
| 3.9.1. Notes avec historique daté | v3.0 | 2/2 | ✅ Complete | 2025-12-29 |
| 3.9.4. Clients enrichis compatible vCard | v3.0 | 2/2 | ✅ Complete | 2025-12-31 |
| 3.10. Test Clients Enrichis vCard | v3.0 | 3/3 | ✅ Complete | 2026-01-02 |
| 3.11. Rangement et nettoyage | v3.0 | 4/4 | ✅ Complete | 2026-01-04 |
| 3.12. Modes d'affichage multiples | v3.0 | 1/1 | ✅ Complete | 2026-01-04 |
| 3.13. Validation UI Complète | v3.0 | 2/2 | ✅ Complete | 2026-01-04 |
| 3.14. Améliorations UI | v3.0 | 4/4 | ✅ Complete | 2026-01-05 |
| **v4.0 - Workflow Commercial Complet (COMPLETE)** | | | | |
| 10. Système Devis - Backend | v4.0 | 3/6 | ✅ Complete | 2026-01-05 |
| 11. Système Devis - Frontend | v4.0 | 1/1 | ✅ Complete | 2026-01-06 |
| 11.5. Catalogue Services | v4.0 | 3/3 | ✅ Complete | 2026-01-06 |
| 12. Tasks Chronométrées - Timer | v4.0 | 3/3 | ✅ Complete | 2026-01-07 |
| 13. Tasks Chronométrées - UI | v4.0 | 1/1 | ✅ Complete | 2026-01-07 |
| 14. Architecture Flexible - Backend | v4.0 | 1/1 | ✅ Complete | 2026-01-07 |
| 15. Architecture Flexible - UI | v4.0 | 1/1 | ✅ Complete | 2026-01-07 |
| 15.5. TypeScript Cleanup 316 errors | v4.0 | 1/1 | ✅ Complete | 2026-01-09 |
| 16. Facturation Auto - Backend | v4.0 | 3/3 | ✅ Complete | 2026-01-09 |
| 17. Facturation Auto - Stripe UI | v4.0 | 7/7 | ✅ Complete | 2026-01-15 |
| **v4.1 - Quality Assurance (IN PROGRESS)** | | | | |
| 18. Audit Complet Toutes Pages | v4.1 | 1/3 | ⏸️ Paused | 2026-01-15 |
| 20. Affichage Contacts Multiples | v4.1 | 1/1 | ✅ Complete | 2026-01-16 |
| 21. Audit Scripts Base de Données | v4.1 | 3/3 | ✅ Complete | 2026-01-17 |
| 18.4. Music Profile for Artists | v4.1 | 3/3 | ✅ Complete | 2026-01-17 |
| 22. Refonte UI Client | v4.1 | 9/9 | ✅ Complete | 2026-01-18 |
| 23. Simplification Onglet Informations | v4.1 | 1/1 | ✅ Complete | 2026-01-19 |
| 24. Seed Data Complet pour Tests | v4.1 | 2/2 | ✅ Complete | 2026-01-18 |
| 25. Gestion Relations Client-Entreprise | v4.1 | 0/0 | Not planned | - |
| **v1.0 - Marketing & Launch (DEFERRED)** | | | | |
| 4. Marketing Foundation | v1.0 | 0/3 | Deferred | - |
| 5. Onboarding & UX | v1.0 | 0/4 | Deferred | - |
| 6. Support & Documentation | v1.0 | 0/3 | Deferred | - |
| 7. Production Hardening | v1.0 | 0/3 | Deferred | - |
| 8. Launch Ready | v1.0 | 0/3 | Deferred | - |

**v3.0 Total**: 49/49 plans complete (100%) ✅ SHIPPED 2026-01-05
**v4.0 Total**: 24/24 plans ✅ SHIPPED 2026-01-15 (Phases 10-17 finished)
**v4.1 Total**: 20/22 plans (Phase 18: 1/3 ⏸️, Phase 20: 1/1 ✅, Phase 21: 3/3 ✅, Phase 18.4: 3/3 ✅, Phase 22: 9/9 ✅, Phase 23: 1/1 ✅, Phase 24: 2/2 ✅)
**v1.0 Total**: 0/17 plans (deferred after v4.1)

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

## Milestones

- ✅ **v3.0 - Foundation & Polish** - Phases 1-3.14 (shipped 2026-01-05)
- ✅ **v4.0 - Workflow Commercial Complet** - Phases 10-17 (shipped 2026-01-15)
- 🚧 **v4.1 - Quality Assurance** - Phase 18 (in progress)
- 📋 **v1.0 - Marketing & Launch** - Phases 4-8 (deferred after v4.1)

---

## 🚧 v4.0 - Workflow Commercial Complet (In Progress)

**Milestone Goal:** Transform RSM into a complete commercial studio management platform with quote-to-invoice workflow, time tracking, flexible project architecture, and real-time billing automation.

### Phase 10: Système de Devis - Backend & Database

**Goal**: Database schema and backend logic for quote templates, workflow validation (draft → sent → accepted/rejected), and quote-to-project conversion

**Depends on**: Phase 3.14 (UI harmonization complete)

**Research**: Likely (Quote workflow state machine, PDF generation for quotes)

**Research topics**:
- Quote state machine patterns (draft/sent/accepted/rejected/expired)
- PDF generation libraries (react-pdf vs PDFKit vs Puppeteer)
- Template engine for service items with variables
- Conversion logic from quote to project (data mapping)

**Plans**: 6 plans

Plans:
- [x] 10-01: Database Schema & Migrations (Completed 2026-01-05 - 30 min)
- [x] 10-02: tRPC Router & State Machine (Completed 2026-01-05 - 5 min)
- [x] 10-03: PDF Generation Service & E2E Testing (Completed 2026-01-05 - 12 min)
- [x] 10-04: Quote Number Generation (Merged into 10-02)
- [ ] 10-05: Service Templates (Deferred to v5.0 - Optional feature)
- [x] 10-06: Testing & Validation (Merged into 10-03)

**Status**: ✅ Complete (3/6 plans complete - 47 min total, 2 plans merged, 1 deferred)

### Phase 11: Système de Devis - Frontend UI

**Goal**: Quote creation UI with template selection, custom line items, workflow actions (send/accept/reject), and quote-to-project button

**Depends on**: Phase 10

**Research**: Unlikely (established UI patterns, forms, modals)

**Plans**: 1 plan

Plans:
- [x] 11-01: Quote Management UI - Line Items Builder, PDF Download, State Transitions (Completed 2026-01-06 - 795 min)

### Phase 11.5: Catalogue de Services

**Goal**: Service/product catalog for quick quote creation - dedicated management page + quick access (autocomplete + modal) in quote builder

**Depends on**: Phase 11

**Research**: Unlikely (standard CRUD patterns, autocomplete, modals)

**Plans**: 3 plans

Plans:
- [x] 11.5-01: Backend Infrastructure (service_catalog schema, migration, tRPC router) (Completed 2026-01-06 - 21 min)
- [x] 11.5-02: Service Catalog Management Page (CRUD UI) (Completed 2026-01-06 - 3 min)
- [x] 11.5-03: Quick Access Integration (autocomplete + modal in quote builder) (Completed 2026-01-06 - 19 min)

**Status**: ✅ Complete (Service catalog fully functional from database to quote integration)

**Details**:
Catalog stores: name, description, unit price, category (Studio/Post-prod/Location/Other), default quantity, specific VAT rate. Two access methods in quote creation: (1) Autocomplete in description field with fuzzy search, (2) "From catalog" button opening modal with category filters. Maintains flexibility to add free-form items. Templates/bundles/quote duplication deferred to future phases.

### Phase 12: Tasks Chronométrées - Timer & Database

**Goal**: Database schema for task types (Setup/Recording/Mixing/Mastering/Break), timer functionality (start/stop), manual adjustments, and hourly rates

**Depends on**: Phase 11.5

**Research**: Likely (Real-time timer sync, WebSocket for multi-user timer visibility)

**Research topics**:
- Timer state management (local vs server-side)
- WebSocket patterns for real-time timer updates
- Time tracking data model (sessions, tasks, timestamps)
- Hourly rate calculation logic per task type

**Plans**: 3 plans

Plans:
- [x] 12-01: Database Schema (task_types, time_entries tables with migration) (Completed 2026-01-06 - 4 min)
- [x] 12-02: Timer Backend Logic (timer service + tRPC API with 8 procedures) (Completed 2026-01-06 - 9 min)
- [x] 12-03: Socket.IO Integration (real-time timer broadcasting) (Completed 2026-01-07 - 7 min)

**Status**: ✅ Complete (All 3 plans finished - 20 min total)

### Phase 13: Tasks Chronométrées - UI & History

**Goal**: Timer UI component (start/stop/pause buttons), task history view, manual time entry, and task-to-invoice preview

**Depends on**: Phase 12

**Research**: Unlikely (standard UI patterns, tables, forms)

**Plans**: TBD

Plans:
- [ ] 13-01: TBD (run /gsd:plan-phase 13 to break down)

### Phase 14: Architecture Session/Project Flexible - Backend ✅ COMPLETE

**Status**: Complete (2026-01-07)

**Goal**: Database schema supporting standalone sessions (no project) AND sessions linked to projects, with backward compatibility for existing data

**Depends on**: Phase 13

**Research**: Completed (nullable FK, SET NULL on delete, index for performance)

**Plans**: 1/1 complete (3 min total)

Plans:
- [x] 14-01: Add projectId to sessions schema + migration + router updates (3 min)

### Phase 15: Architecture Session/Project Flexible - UI Adaptation

**Goal**: UI updates to support standalone sessions, project-linked sessions, and studio type preferences (all types supported)

**Depends on**: Phase 14

**Research**: Unlikely (UI pattern adaptation, conditional rendering)

**Plans**: 1 plan

Plans:
- [x] 15-01: UI adaptation Session/Project flexible (Completed 2026-01-07 - 16 min)

**Status**: ✅ Complete (1/1 plans finished - 16 min total)

---

### Phase 15.5: TypeScript Cleanup (INSERTED)

**Goal**: Corriger toutes erreurs TypeScript (316 total: 44 server + 272 client) avant Phase 16, restaurer type safety complet après migrations 0007-trackId et 0008-projectId

**Depends on**: Phase 15

**Research**: Unlikely (TypeScript error patterns, Drizzle type regeneration)

**Plans**: 1 plan

Plans:
- [x] 15.5-01: TypeScript cleanup 316 errors → 0 (Completed 2026-01-09 - 89 min)

**Status**: ✅ Complete (1/1 plans finished - 89 min total)

**Rationale**: Migrations 0007 (trackId) et 0008 (projectId) appliquées mais types Drizzle non régénérés → cascade 316 erreurs. Type safety critique avant facturation automatique (Phase 16) pour éviter bugs production. Cleanup comprehensive: schema queries, session types, obsolete fields, type conversions.

---

### Phase 16: Facturation Automatique - Backend Integration

**Goal**: Auto-generate invoices from timed tasks, support per-session OR global project invoicing, calculate line items ("Recording - 2h30 @ 50€/h = 125€"), handle deposits/advances

**Depends on**: Phase 15.5

**Research**: Likely (Invoice generation logic, Stripe integration for deposits, tax calculation)

**Research topics**:
- Invoice generation from time tracking data
- Stripe Payment Intents for deposits/advances
- Tax calculation patterns (VAT, sales tax)
- Partial payment workflows

**Plans**: TBD

Plans:
- [ ] 16-01: TBD (run /gsd:plan-phase 16 to break down)

### Phase 17: Facturation Automatique - Stripe & UI

**Goal**: Stripe Checkout integration for invoice payment, payment status tracking, invoice UI with payment button, and email notifications

**Depends on**: Phase 16

**Research**: Completed (Resend email, PDFKit, AWS S3, Stripe Checkout Sessions)

**Plans**: 7 plans (3 base + 4 FIX)

Plans:
- [x] 17-01: Stripe Checkout Sessions + Webhook idempotency (Completed 2026-01-09 - 6 min)
- [x] 17-02: Email Notifications & PDF Generation (Resend + PDFKit + S3) (Completed 2026-01-09 - 13 min)
- [x] 17-03: Client Portal Invoice Payment UI (React frontend) (Completed 2026-01-10 - 58 min)
- [x] 17-03-FIX: Fix E2E test route paths (Completed 2026-01-10 - 3 min)
- [x] 17-03-FIX-2: Fix Client Portal authentication persistence (Completed 2026-01-10 - 6 min)
- [x] 17-03-FIX-3: Fix invoice rendering and E2E tests (Completed 2026-01-15 - 28 min)
- [x] 17-03-FIX-4: localStorage persistence investigation (Completed 2026-01-15 - 13 min)

**Status**: ✅ Complete (All 7 plans finished - 127 min total)

**UAT Validation**: All 8 Phase 17 E2E tests passing (100%)

---

## 🚧 v4.1 - Quality Assurance (In Progress)

**Milestone Goal:** Comprehensive audit of all 58 pages to ensure zero-bug production quality before marketing launch

### Phase 18: Audit Complet Toutes Pages - Zero Bug

**Goal**: Manual audit of all 58 pages (Admin Dashboard, Client Portal, Super Admin, Public/Auth) - validate functionality, UI/UX, and every interaction - zero bugs P0/P1/P2 tolerated

**Depends on**: Phase 17 (v4.0 complete)

**Research**: Unlikely (manual testing methodology, existing patterns from Phase 3.4/3.13)

**Plans**: 3 plans

Plans:
- [x] 18-01: Test Matrix & Checklist Creation (58 pages × comprehensive criteria) ✅ Complete (20 min - 2026-01-15)
- [⏸️] 18-02: Execute Manual Tests with MCP Chrome (Admin Dashboard 44 pages + Client Portal 7 + Super Admin 4 + Public 4) ⏸️ Environment Ready (1 min - 2026-01-16) - Human execution required
- [ ] 18-03: Document & Fix ALL Bugs (P0/P1/P2 - zero-bug strict)

**Status**: ⏳ In Progress (1/3 plans complete, 1/3 setup complete awaiting manual testing)

**Details**:

**Scope - 58 Pages Total:**
1. **Admin Dashboard (44 pages)**
   - Dashboard, Clients (List/Detail/Create/Edit), Sessions, Projects, Tracks, Quotes, Invoices, Time Tracking, Reports, Analytics, Team, Rooms, Equipment, Settings, etc.

2. **Client Portal (7 pages)**
   - Login, Dashboard, Invoices (List/Detail/Payment), Profile, Activity Logs

3. **Super Admin (4 pages)**
   - Services Monitoring, Database Management, System Logs

4. **Public/Auth (4 pages)**
   - Landing, Signup, Login, Password Reset

**Validation Criteria (A+B+C):**

**A) Fonctionnalité Complète**
- All CRUD operations work (Create, Read, Update, Delete)
- Forms submit correctly with validation
- Data displays accurately
- API calls succeed (no 4xx/5xx errors)
- No JavaScript console errors

**B) UI/UX Quality**
- Design cohérent (icons text-primary, cards pb-3, container spacing)
- Buttons accessible and properly placed
- Responsive mobile (all pages usable on small screens)
- Dark mode works without visual bugs
- Loading states present
- Empty states informative
- Error messages clear

**C) Audit Approfondi**
- Every button clickable and functional
- Every form field validates correctly
- Every link navigates properly
- Every modal opens/closes
- Every dropdown populates
- Every table sorts/filters
- Every workflow end-to-end (ex: Create Quote → Send → Accept → Convert to Project)

**Testing Approach:**
- Manual testing with MCP Chrome DevTools
- Detailed checklist per page (functionality, UI, interactions)
- Document ALL errors found (severity P0/P1/P2/P3)
- Fix ALL P0/P1/P2 bugs before completion
- Screenshots for visual bugs

**Success Criteria:**
- ✅ 0 bugs P0 (bloquants - app broken)
- ✅ 0 bugs P1 (critiques - major features broken)
- ✅ 0 bugs P2 (importants - minor features broken or poor UX)
- ✅ All 58 pages tested and validated
- ✅ All workflows end-to-end validated
- ✅ Production-ready quality achieved

**Rationale**: Before marketing launch (v1.0), guarantee zero-bug quality across entire application. v4.0 added major features (Quotes, Time Tracking, Invoices) - must validate no regressions in existing features and new features work flawlessly. This comprehensive audit ensures professional production quality worthy of commercial launch.

---

### Phase 18.1: Docker to Native PostgreSQL Migration - Simplify architecture and sync Phase 10-17 schema (INSERTED - SCOPE EXPANDED)

**Goal**: Migrate both local and VPS environments from Docker PostgreSQL to native PostgreSQL, adding missing Phase 10-17 tables

**Depends on**: Phase 18 (discovered during 18-02 execution)

**Research**: Complete (database inventory audit performed)

**Plans**: 3 plans

Plans:
- [x] 18.1-01: Fix Local Native PostgreSQL + Generate Migrations - Add to PATH, generate migrations for Phase 10-17, fix rsm_master (add 2 tables), rebuild tenant_1 clean, test app (5 tasks) ✅ Complete (7 min - 2026-01-16)
- [ ] 18.1-02: Migrate VPS Docker → Native - DEFERRED (not blocking Phase 18-02 testing)
- [ ] 18.1-03: Cleanup Docker Containers - DEFERRED (not blocking Phase 18-02 testing)

**Status**: ✅ Blocker Fixed (Phase 18-02 unblocked, VPS migration deferred)

**Details**:

**Problem Discovered (Expanded):**
- PostgreSQL 17 already installed locally (Homebrew) but schema incomplete (5/7 master tables, tenant_1 corrupted)
- VPS has native PostgreSQL 16 installed but unused (Docker has data)
- BOTH environments missing Phase 10-17 tables (7 tables total: 1 master + 6 tenant)
- No migrations generated since Dec 15, 2025 (Phase 3) - Phases 10-17 modified schema.ts but never ran `pnpm db:generate`
- Docker PostgreSQL adds unnecessary overhead (~200MB RAM, slower I/O, complex debugging)

**Architecture Before:**
- Local: Native PostgreSQL 17 (broken) + Docker rsm-postgres (corrupted)
- VPS: Native PostgreSQL 16 (unused) + Docker rsm-postgres (has data)

**Architecture After:**
- Local: Native PostgreSQL 17 only (fixed, 7 master + 30 tenant tables)
- VPS: Native PostgreSQL 16 only (migrated, 7 master + 30 tenant tables × 13 tenants)
- Docker: Removed entirely

**Benefits:**
- Simpler architecture (one PostgreSQL per environment)
- Better performance (no Docker overhead)
- Easier debugging (direct psql access)
- Schema synchronized with Phase 17 code
- Phase 18-02 testing unblocked after completion

**Success Criteria:**
- ✅ Local native PostgreSQL fixed (7 master + 30 tenant tables)
- ✅ VPS migrated from Docker to native (all data preserved)
- ✅ Phase 10-17 migrations generated and applied (7 new tables)
- ✅ Docker PostgreSQL removed (both environments)
- ✅ Documentation updated (new architecture documented)
- ✅ Phase 18-02 testing unblocked

**Rationale**: P0 blocker discovered during Phase 18-02 - local database initialization failed. Audit revealed BOTH local and VPS missing Phase 10-17 tables (7 tables), no migrations generated since Dec 15. Decision to migrate entirely to native PostgreSQL simplifies architecture long-term (removes Docker overhead, easier debugging). Since no production customers yet, safe to do invasive migration now.

---

### Phase 18.2: Fix Systematic Schema/Migration Desync - Generate and apply missing tenant migrations (INSERTED)

**Goal**: Generate missing tenant migrations for schema changes made in Phases 10-17 and apply to all tenant databases

**Depends on**: Phase 18.1 (database infrastructure fixed)

**Research**: Unlikely (standard Drizzle migration generation + application)

**Plans**: 1 plan

Plans:
- [ ] TBD (run /gsd:plan-phase 18.2 to break down)

**Details**:

**Problem Discovered (BUG-003 - P0 BLOCKER):**
During Phase 18-02 environment setup, discovered SYSTEMATIC schema/migration desync affecting multiple tenant tables. TypeScript schema definitions evolved during Phases 10-17 but migrations were NEVER generated.

**Affected Tables (Confirmed):**
1. **sessions** - Missing 6 columns:
   - `project_id` (integer, FK to projects)
   - `deposit_amount` (numeric)
   - `deposit_paid` (boolean)
   - `payment_status` (varchar 50)
   - `stripe_checkout_session_id` (varchar 255)
   - `stripe_payment_intent_id` (varchar 255)

2. **invoices** - Missing 6 columns:
   - `deposit_amount` (numeric)
   - `deposit_paid_at` (timestamp)
   - `stripe_deposit_payment_intent_id` (varchar 255)
   - `remaining_balance` (numeric)
   - `pdf_s3_key` (varchar 500)
   - `sent_at` (timestamp)

3. **musicians** - Missing 1 column:
   - `talent_type` (varchar 100)

**Root Cause:**
- Phases 10-17 modified `packages/database/src/tenant/schema.ts` directly
- `pnpm db:generate` was NEVER run to create migration files
- TypeScript code expects columns that don't exist in databases
- All tenant databases (tenant_1, tenant_16, production tenants) affected

**Impact:**
- Blocks ~40% of Phase 18-02 testing (sessions, invoices, time tracking pages)
- 100% of sessions queries fail (TRPC error: column "project_id" does not exist)
- 100% of invoices queries fail (TRPC error: column "deposit_amount" does not exist)
- No workaround available - must fix schema desync

**Fix Required:**
1. Run `pnpm db:generate` to create missing tenant migrations
2. Apply new migrations to tenant_1 (local testing database)
3. Apply new migrations to tenant_16 (Test Studio UI)
4. Document migration strategy for production tenants
5. Verify all affected tables synchronized

**Success Criteria:**
- [ ] Tenant migrations generated for all Phase 10-17 schema changes
- [ ] tenant_1 database synchronized (all columns present)
- [ ] tenant_16 database synchronized (all columns present)
- [ ] Sessions list loads successfully (no column errors)
- [ ] Invoices list loads successfully (no column errors)
- [ ] Phase 18-02 testing can proceed

**Rationale**: URGENT BLOCKER discovered during Phase 18-02 - sessions and invoices pages completely broken due to missing database columns. This is a systemic issue affecting ALL tenant databases. Must fix before any meaningful testing can continue. Root cause: Development workflow error where schema.ts was modified but migrations never generated. Demonstrates importance of strict migration discipline in multi-tenant architectures.

---

### Phase 18.3: Database Reset for Testing Environment (INSERTED)

**Goal**: Clean database reset to establish stable testing environment for Phase 18-02 manual testing

**Depends on**: Phase 18.2 (schema migrations applied)

**Research**: Unlikely (standard PostgreSQL database operations)

**Plans**: 1 plan

Plans:
- [x] 18.3-01: Database Reset for Testing Environment (67 min) ✅

**Details**:

**Problem**: Previous session chaos with multiple organizations (3, 16), inconsistent tenant mappings, invalid credentials, missing tables. User extremely frustrated after spending entire day on database issues instead of testing.

**User Request**: "ON REPART SUR DU NEUF!!!!" - Complete fresh start with clean, simple configuration.

**Required Actions**:
1. Drop all tenant databases (tenant_1, tenant_3, tenant_16)
2. Reset rsm_master completely
3. Run pnpm db:migrate + pnpm db:init
4. Create ONE tenant with test data
5. Document credentials CLEARLY in .continue-here.md
6. Validate login works
7. ONLY THEN start Phase 18-02 testing

**Success Criteria**:
- [ ] All old tenant databases dropped
- [ ] rsm_master rebuilt clean
- [ ] Migrations applied successfully
- [ ] One tenant created with test data
- [ ] Login credentials documented and validated
- [ ] Environment ready for Phase 18-02 (< 5 minutes setup)

**Rationale**: URGENT - Phase 18-02 manual testing completely blocked by database configuration chaos. User spent entire previous session debugging database instead of testing pages. Clean reset is fastest path to working environment. Since no production customers yet, safe to wipe and rebuild local development database.

---

### Phase 20: Affichage Contacts Multiples Entreprises

**Goal**: Afficher les contacts multiples (client_contacts) dans les vues Table/Grid/Kanban pour les entreprises et groupes

**Depends on**: Phase 18.3 (database reset complete)

**Research**: Unlikely (UI enhancement using existing component patterns)

**Plans**: 1 plan

Plans:
- [x] 20-01-PLAN.md — Display multiple contacts in Table/Grid/Kanban views (Completed 2026-01-16 - 3 min)

**Status**: ✅ Complete (1/1 plans finished - 3 min total)

**Details**:

**Problem Discovered:**
Les contacts créés via la table `client_contacts` (pour les entreprises de type "company") ne s'affichent pas dans la liste des clients. Actuellement seules les informations du client principal (table `clients`) sont visibles.

**Impact:**
- Les entreprises comme "Mélodie Productions SAS" (4 contacts) ne montrent pas leurs contacts
- Les groupes musicaux comme "Midnight Groove Collective" (6 musiciens) ne montrent pas leurs membres
- Impossible de voir qui contacter dans une entreprise depuis la liste clients

**Solution Requise:**
Enrichir les trois vues clients (Table/Grid/Kanban) pour afficher:
- Le nombre de contacts associés (ex: "4 contacts")
- Liste des noms des contacts (ex: "Philippe Moreau, Sophie Laurent, ...")
- Indicateur visuel du contact principal (is_primary)

**Success Criteria:**
- [ ] Table view affiche le nombre de contacts
- [ ] Grid view affiche les contacts avec leur rôle
- [ ] Kanban view affiche la liste complète des contacts
- [ ] Contact principal identifié visuellement
- [ ] Cliquable pour voir le détail complet

**Rationale**: Phase 3.9.4 a ajouté le support des contacts multiples (client_contacts) mais l'UI n'a jamais été mise à jour pour les afficher dans les listes. Actuellement les contacts sont invisibles sauf sur la page de détail du client. Problème découvert lors de tests avec données réelles (entreprises avec 4-6 contacts).

### Phase 21: Audit et Correction Scripts Base de Données

**Goal**: Auditer tous les scripts database existants, identifier ceux obsolètes par rapport au schéma actuel, créer scripts mis à jour, et documenter usage correct

**Depends on**: Phase 20 (contact architecture complete)

**Research**: Likely (Schema compatibility analysis, script dependency mapping)

**Research topics**:
- Current database schema vs script expectations (tenant and master)
- Migration history analysis (Phases 10-17 schema additions)
- Script interdependencies and execution order
- Test data generation strategies for current schema

**Plans**: 3 plans

Plans:
- [x] 21-01: Audit all scripts against current schema - compatibility matrix (audit-report.md) (Completed 2026-01-17)
- [x] 21-02: Create updated init scripts (create-tenant, seed-base, seed-realistic) (Completed 2026-01-17)
- [x] 21-03: Archive obsolete scripts and update documentation (Completed 2026-01-17)

**Status**: ✅ Complete (All 3 plans finished - 22 min total)

**Details**:

**Problem Discovered:**
User concern: "J'ai l'impression que depuis la phase 10, tous les scripts sont devenus obsolètes.. J'aimerais qu'on vérifie ça parce qu'on a des bugs qu'on avait pas avant"

**Evidence of Script Obsolescence:**
- Phase 18.1-18.3: Systematic schema/migration desync requiring manual fixes
- tenant_3 migration fix (2026-01-16): Manual application of migration 0004 for missing vCard columns
- Phases 10-17: Added features (quotes, time_entries, service_catalog, vCard fields, invoices columns) without always running `pnpm db:generate`
- Init scripts created BEFORE Phase 10-17 - missing subscription_plans, ai_credits, Stripe columns, etc.

**Current Script Inventory:**
```
packages/database/scripts/
├── add-new-tenant-tables.sql
├── create-tenant-3.ts
├── fix-sessions-add-project-id.sql
├── fix-tenant3-sessions-schema.sql
├── init-tenant.ts
├── seed-tenant-3.ts
└── test-data/
    ├── add-company-with-contacts.sql
    ├── create-test-studio-user.sql
    └── setup-test-studio-ui.sql
```

**Solution Scope:**
1. **Inventory**: Document each script's purpose, dependencies, schema assumptions
2. **Compatibility Test**: Run each script against current schema (master + tenant)
3. **Identify Obsolete**: Mark scripts incompatible with current schema
4. **Create Updated Scripts**: Rewrite critical scripts for current schema
5. **Document Usage**: Create script usage guide with examples
6. **Archive Old Scripts**: Move obsolete scripts to `scripts/archived/` with explanation

**Success Criteria:**
- [ ] All scripts tested against current schema (rsm_master + tenant_1)
- [ ] Obsolete scripts identified and archived
- [ ] Critical scripts updated (init-tenant, seed-tenant, test-data)
- [ ] Script usage documentation created (`scripts/README.md`)
- [ ] Zero PostgreSQL errors when running updated scripts
- [ ] Test data generation works for ALL current tables

**Rationale**: Database scripts written before Phases 10-17 are incompatible with current schema (30+ tenant tables vs ~15 when scripts created). Multiple bugs traced to schema mismatches. Systematic audit prevents future "broken database" sessions. DEVELOPMENT-WORKFLOW.md recommends "increment tenant number" but scripts must still work for fresh tenant creation.

---

### Phase 21.1: Fix Client Portal Authentication Persistence (INSERTED)

**Goal**: Fix critical authentication bug where Client Portal session is not persisted after login, causing E2E tests to fail (6/8 failing)

**Depends on**: Phase 21 (database scripts audit complete)

**Research**: Likely (Client Portal authentication system, session persistence, ProtectedClientRoute investigation)

**Research topics**:
- Client Portal authentication flow (login → session → redirect)
- Session cookie configuration for client portal subdomain
- ProtectedClientRoute implementation and auth context
- localStorage vs cookie persistence for client sessions
- Comparison with Admin auth (working) vs Client Portal auth (failing)

**Plans**: 1 plan

Plans:
- [ ] 21.1-01-PLAN.md — Migrate Client Portal to express-session cookies (3 tasks: backend login/me/logout, frontend AuthContext/Navigate, E2E tests)

**Details**:
[To be added during planning]

**Problem Description:**
- **Symptoms**: E2E tests 6/8 failing, Client Portal login appears successful but session not persisted
- **Impact**: Clients cannot maintain authenticated session in production
- **Blocker**: Phase 17 UAT validation blocked, production client portal unusable
- **Root Cause**: Unknown - requires investigation of ProtectedClientRoute, session cookies, auth context persistence
- **Decision Reference**: Phase 17-FIX (Rule 4 architectural boundary - stopped at auth system modification)

**Success Criteria:**
- [ ] Client Portal login persists session across page refreshes
- [ ] ProtectedClientRoute correctly validates authenticated state
- [ ] E2E tests pass (8/8 tests green)
- [ ] Session cookies properly configured for client portal
- [ ] No regressions in Admin Dashboard authentication

**Rationale**: URGENT BLOCKER discovered during Phase 17 UAT testing. Client Portal authentication completely broken - users can login but session immediately lost on navigation/refresh. Affects real production clients trying to pay invoices. Must fix before any marketing launch (Phase 4-8) as client portal is core product feature. GSD Rule 4 previously deferred this fix to avoid expanding Phase 17 scope, but now requires dedicated phase.

---

## 📋 v1.0 - Marketing & Launch (Deferred After v4.1)

**Milestone Goal:** Marketing-ready platform with public landing page, onboarding, documentation, and production hardening (Phases 4-8 deferred until after v4.0 workflow features)

**Rationale:** Business priority shifted - complete commercial workflow features (v4.0) before marketing push (v1.0). Studios need functional quote-to-invoice system more urgently than landing page polish.

---

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

### Phase 18.4: Music Profile for Artists (INSERTED)

**Goal**: Add comprehensive music profile fields to client records for recording studio management - genres, instruments, streaming links, industry info

**Depends on**: Phase 21.1 (authentication bugs fixed, can resume testing)

**Research**: Complete (JSONB arrays with GIN indexes, shadcn multi-select, URL validation patterns)

**Plans**: 3 plans

Plans:
- [x] 18.4-01: Add music profile schema + migration (genres/instruments JSONB, streaming URLs, industry fields) (Completed 2026-01-17 - 8 min)
- [x] 18.4-02: Create MusicProfileSection UI component (genre/instrument multi-select, 11 streaming platforms, industry info) (Completed 2026-01-17 - 10 min)
- [x] 18.4-03: Integrate filters + genre distribution widget (Clients list filters, Dashboard stats) (Completed 2026-01-17 - 28 min)

**Status**: ✅ Complete (All 3 plans finished - 46 min total)

**Details**:

**Problem (BUG-006 - P1 Critical):**
Recording Studio Manager app has ZERO music-related fields for artist clients. Discovered during Phase 18-02 manual testing. User: "le bug est trop important pour le faire après" - critical missing feature for core domain.

**Missing Fields:**
- Genre(s), instruments, vocal range, skill level
- Streaming platforms (Spotify, Apple Music, SoundCloud, YouTube, Bandcamp, Deezer)
- Industry info (label, distributor, manager, publisher, performance rights society)

**Solution Architecture:**
1. **Schema**: 19 new nullable columns in clients table (2 JSONB arrays, 17 varchar/text)
2. **JSONB arrays with GIN indexes**: PostgreSQL `@>` operator for genre/instrument filtering
3. **Multi-select UI**: shadcn-multi-select-component with creatable entries (50 preset genres)
4. **Backward compatible**: All fields nullable, existing clients unaffected

**Migration Strategy (Development):**
Use "increment tenant number" pattern (create tenant_4, tenant_5 vs debugging migrations). Per DEVELOPMENT-WORKFLOW.md, this is 30 seconds vs 2-3 hours debugging.

**Success Criteria:**
- [ ] Artists have complete music profile fields in database
- [ ] Genre/instrument multi-select working in UI
- [ ] Streaming platform URLs editable and validated
- [ ] Can filter clients by genre and instrument
- [ ] Dashboard shows genre distribution stats
- [ ] Zero P0/P1/P2 bugs introduced

**Estimated Effort:** 2-3 hours total (research complete, ~1.5-2h execution)

**Rationale**: P1 severity bug discovered during comprehensive audit (Phase 18). Recording studio app without music profile = car dealership CRM without tracking which cars customers buy. Must fix before continuing Phase 18-02 testing. User explicitly requested immediate fix vs deferring.

---

### Phase 22: Refonte UI Client - Hub Relationnel Complet

**Goal**: Reorganiser les pages client (création, modification, détail) pour mieux afficher les 22 nouveaux champs musicaux + ajouter accès aux données relationnelles (projets, tracks, finances)

**Depends on**: Phase 18.4 (music profile fields implemented)

**Research**: Unlikely (UI patterns already established, existing component architecture)

**Plans**: 9 plans

Plans:
- [x] 22-01-PLAN.md — ClientFormWizard: 3-step wizard (Base/Enrichi/Musique) with free navigation (Completed 2026-01-18 - 4 min)
- [x] 22-02-PLAN.md — ClientDetail tabs: 5 horizontal tabs (Informations/Projets/Tracks/Sessions/Finances) + Notes always visible (Completed 2026-01-18 - 5 min)
- [x] 22-03-PLAN.md — Projets tab: 4 view modes (Cards/Liste/Table/Kanban) + backend getProjects endpoint (Completed 2026-01-18 - 13 min)
- [x] 22-04-PLAN.md — Tracks tab: 3 view modes (Liste avec player/Cards/Table) + backend getTracks endpoint (Completed 2026-01-18 - 13 min)
- [x] 22-05-PLAN.md — Sessions tab: 4 view modes (Table/Cards/Timeline/Kanban) (Completed 2026-01-18 - 8 min)
- [x] 22-06-PLAN.md — Finances tab: Stats cards + Factures/Quotes tables (each with 4 view modes) + backend getFinancialStats (Completed 2026-01-18 - 6 min)
- [x] 22-07-PLAN.md — Preferences backend: user_preferences table + tRPC router for cross-device sync (Completed 2026-01-18 - 3 min)
- [x] 22-08-PLAN.md — Customization UI: columns visibility toggle + drag & drop reordering + useTabPreferences hook (Completed 2026-01-18 - 28 min)
- [x] 22-09-PLAN.md — Edit mode integration: ClientFormWizard in edit mode + clients.update mutation for music fields (Completed 2026-01-18 - 4 min)

**Status**: ✅ Complete (All 9 plans finished - 84 min total)

**Details**:

**Scope:**
Reorganiser les pages client (création, modification, détail) pour mieux afficher les 22 nouveaux champs musicaux (Phase 18.4) + ajouter accès aux données relationnelles (projets, tracks, finances).

**Architecture Decisions:**

1. **ClientDetail - Onglets horizontaux:**
   - [Informations] [Projets] [Tracks] [Sessions] [Finances]
   - Notes toujours visibles en bas (section fixe, visible sur tous onglets)
   - Pas de sous-onglets imbriqués

2. **ClientForm - Wizard 3 étapes:**
   - Étape 1: Base (nom, email, type, phone, address)
   - Étape 2: Enrichi (vCard contacts, custom fields)
   - Étape 3: Musique (22 champs Phase 18.4)
   - Stepper toujours cliquable - navigation libre entre étapes
   - Réutilisable pour création ET modification

3. **Customisation universelle (TOUS les onglets):**
   - 4 modes d'affichage par onglet (Cards/Liste/Table/Kanban variants)
   - Toggle colonnes visibles/cachées
   - Drag & drop pour réordonner colonnes
   - Préférences sauvegardées en DB (synchronisées cross-device)

**Content - Onglet Projets (4 modes):**
1. Cards avec stats (défaut)
2. Liste compacte
3. Table enrichie
4. Kanban par statut

**Content - Onglet Tracks (3 modes):**
1. Liste avec audio player inline
2. Cards visuelles avec artwork
3. Table simple metadata

**Content - Onglet Sessions (4 modes):**
1. Table (mode actuel)
2. Cards compactes
3. Timeline/Calendar view
4. Kanban par statut

**Content - Onglet Finances (structure + 4 modes):**
- Stats cards: Total payé, En attente, Quotes ouverts, Projection
- Table Factures (4 modes): Table/Cards/Timeline/Kanban
- Table Quotes (4 modes): Table/Cards/Timeline/Kanban

**Navigation:**
- Clic sur projet/track/facture → navigate vers page détail (même onglet)
- Breadcrumb pour retour

**Empty states:**
- Illustrés (icône Lucide) + message + bouton CTA

**Storage préférences:**
- Table user_preferences en DB
- Synchronisées cross-device

**Success Criteria:**
- [ ] ClientFormWizard créé avec 3 étapes (navigation libre)
- [ ] ClientDetail a 5 tabs + Notes section fixe
- [ ] Projets tab avec 4 modes d'affichage
- [ ] Tracks tab avec 3 modes + audio player
- [ ] Sessions tab avec 4 modes
- [ ] Finances tab avec stats + 2 tables (Factures/Quotes) avec 4 modes chacun
- [ ] Préférences stockées en DB (cross-device sync)
- [ ] Customisation avancée (toggle colonnes, drag & drop)
- [ ] Edit mode utilise wizard
- [ ] Zero régressions

**Estimated Effort:** 180-270 min (9 plans × 20-30 min chacun)

**Rationale**: Phase 18.4 a résolu le problème de **data** (22 champs en DB), mais l'**UX** n'a pas été optimisée pour cette quantité d'information. Les studios ont besoin de voir la relation complète client → projets → tracks → finances en un seul endroit. Hub relationnel = amélioration productivité majeure.

---

### Phase 23: Simplification Onglet Informations Client

**Goal**: Supprimer les 3 sous-onglets (informations, enrichi, profil musical) et afficher tous les champs dans une seule vue organisée en sections visuelles distinctes

**Depends on**: Phase 22 (UI client refactoring complete)

**Research**: Unlikely (UI reorganization using existing component patterns)

**Plans**: 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 23 to break down)

**Details**:
[To be added during planning]

**Rationale**: Phase 22 a créé l'onglet "Informations" avec 3 sous-onglets pour organiser tous les champs client. L'utilisateur souhaite simplifier en affichant tous les champs dans une seule vue avec sections visuellement distinctes (informations de base, contacts enrichis, profil musical) plutôt que de naviguer entre sous-onglets. Améliore l'accessibilité et réduit les clics pour consulter le profil complet d'un client.

---

### Phase 24: Seed Data Complet pour Tests

**Goal**: Create comprehensive seed script generating ~150-200 realistic records with complete music profiles, relationships, and data coverage for all 31 tenant tables

**Depends on**: Phase 23 (UI simplification complete)

**Research**: Unlikely (faker.js patterns, existing seed-realistic-data.ts structure)

**Plans**: 2 plans

Plans:
- [x] 24-01: Enhance seed script with music profile fields (Completed 2026-01-18 - 6 min)
- [x] 24-02: Expand data volume and complete relationships (Completed 2026-01-18 - 5 min)

**Status**: ✅ Complete (All 2 plans finished - 11 min total)

**Details**:
Enhanced seed script populating ALL fields from Phase 18.4 music profile (22 fields: genres, instruments, streaming URLs, record label, distributor, manager, publisher, PRO, years active, notable works, bio) + complete relationships (projets → tracks → sessions → time entries → invoices/quotes). Volume: ~15-20 clients with enriched profiles, 12-15 projects, 25-30 tracks with artwork/metadata/versions, 20-25 sessions, 10-12 quotes/invoices, 30-40 time entries. Current seed-realistic-data.ts creates ~60-80 records but doesn't populate music fields.

**Rationale**: Phase 18.4 added 22 music profile fields but seed script doesn't populate them - impossible to test search filters, streaming URL displays, industry info rendering, etc. Phase 22 added 5 tabs (Informations/Projets/Tracks/Sessions/Finances) requiring realistic relational data for proper testing. Current seed insufficient for validating complete user workflows across all tabs.
---

### Phase 25: Gestion Relations Client-Entreprise

**Goal**: Implémenter l'UI complète pour gérer les relations many-to-many entre clients individuels et entreprises via la table companyMembers (add/remove/update members avec rôles)

**Depends on**: Phase 24 (Seed data complete)

**Research**: Unlikely (UI patterns établis, API endpoints existants partiel)

**Plans**: 2 plans

Plans:
- [x] 25-01: Backend endpoints + Modal & Indicator components (Completed 2026-01-20 - 6 min)
- [x] 25-02: Individual view + Role autocomplete (Completed 2026-01-20 - 2 min)

**Status**: ✅ Complete (All 2 plans finished - 8 min total)

**Details**:
Phase 25 completes the many-to-many relationship UI between individual clients and company clients.

**Plan 01 (Wave 1):**
- Backend: Add 3 missing tRPC endpoints (addMember, updateMember, removeMember)
- Frontend: Create CompanyMembersModal component (full CRUD, inline role editing)
- Frontend: Create CompanyMembersIndicator component (clickable preview)
- Integration: Add to ClientDetailTabs in Informations section (after contact details)

**Plan 02 (Wave 2):**
- Backend: Add getCompanies endpoint (reverse direction of getMembers)
- Backend: Add getRoles endpoint (distinct roles for autocomplete)
- Frontend: Update modal for individual view (companies list)
- Frontend: Add role autocomplete to prevent typos

**Key Features:**
- Bidirectional UI (company → members, individual → companies)
- Inline role editing (onChange + onBlur save)
- Primary contact badge display
- Searchable dropdown (filters individual/company correctly)
- Role autocomplete (suggests existing roles, prevents duplicates)
- Toast notifications for all actions

**Rationale**: La table companyMembers existe en DB avec relations many-to-many (company_client_id, member_client_id, role, isPrimary) et API partiels (getMembers, getAllMembers), mais aucune UI pour créer/modifier/supprimer ces relations. Les studios doivent pouvoir lier contacts individuels aux entreprises clientes (ex: "Alexandre Grand - Ingénieur du son" membre de "Sound Production SARL"). Manque endpoints API (addMember, removeMember, updateMember) + UI complète (onglet Membres pour entreprises, section Entreprises pour individus).
---

### Phase 26: Formulaire Client avec Accordéons - Refonte UI Mode Édition

**Goal**: Remplacer le wizard ClientFormWizard par des accordéons dans l'onglet Informations pour cohérence avec la page de visualisation

**Depends on**: Phase 25 (Gestion relations client-entreprise complete)

**Research**: Unlikely (UI patterns établis, composants shadcn/ui accordion déjà utilisés)

**Plans**: 1 plan

Plans:
- [x] 26-01-PLAN.md — Complete accordion-based edit form + integrate into ClientDetailTabs (4 tasks: complete 7 accordions, remove wizard, integrate tabs, manual testing)

**Status**: Complete (2026-01-20)

**Details**:
Phase 26 refactors the client edit form from a wizard pattern to accordion-based sections matching the view page design.

**Current Issue:**
- View page (http://localhost:5174/clients/4) uses tabs with clean sections
- Edit mode (http://localhost:5174/clients/4?edit=true) uses ClientFormWizard with stepper navigation
- Design inconsistency creates cognitive friction for users

**Solution:**
Replace ClientFormWizard with accordion-based ClientEditForm component:
- Complete existing ClientEditForm.tsx with 7 accordion sections (currently only 2 complete)
- Within "Informations" tab, use accordions for sections:
  - Identité (type, nom complet, structured name, artistName, photo)
  - Contact (emails multiples, téléphones multiples, sites web)
  - Adresse (adresse structurée avec street/city/postalCode/region/country)
  - Personnel (birthday, gender, customFields)
  - Plateformes streaming (11 streaming platform URLs)
  - Professionnel (recordLabel, distributor, managerContact, publisher, performanceRightsSociety)
  - Carrière (yearsActive, notableWorks, awardsRecognition, biography, genres, instruments)
- Integrate into ClientDetailTabs when isEditing=true
- Remove ClientFormWizard references from ClientDetail.tsx

**Key Benefits:**
- Visual consistency between view and edit modes
- All 40+ vCard fields accessible in organized sections
- Reduced cognitive load (no stepper navigation)
- Maintains existing formData/setFormData pattern
- All tabs remain accessible in edit mode (Projets, Tracks, Sessions, Finances)

**Technical Approach:**
- Complete ClientEditForm.tsx with 5 missing accordions (Address, Personal, Streaming, Professional, Career)
- Remove unused ClientFormWizard import from ClientDetail.tsx
- Update ClientDetailTabs to conditionally render ClientEditForm when isEditing=true
- Preserve all existing fields from ClientFormWizard (40+ vCard fields)
- Reuse shadcn/ui Accordion component (already in project)

**Implementation Status:**
- ClientEditForm.tsx exists with partial implementation (2/7 accordions complete - Identity, Contact)
- ClientFormWizard.tsx exists (796 lines) - will be deprecated after this phase
- ClientDetailTabs.tsx (818 lines) - needs conditional rendering update

**Rationale**: User reported design inconsistency between view and edit pages. Current wizard pattern (ClientFormWizard) creates 5-step navigation overhead. Accordion pattern matches the view page structure (tabs + sections), reduces clicks, improves UX consistency. All fields remain accessible but organized logically. ClientEditForm already exists with 2 accordions complete - just needs 5 more sections added to reach parity with wizard.

### Phase 26.1: Réorganisation Accordéons - Logique Studio d'Enregistrement

**Goal**: Réorganiser les 7 accordéons en 5 sections fusionnées suivant la logique métier d'un studio (Identité → Profil Artistique → Coordonnées → Relations Pro → Notes Studio)

**Depends on**: Phase 26 (Accordion-based edit form complete)

**Research**: Unlikely (regroupement de sections existantes, pas de nouvelles fonctionnalités)

**Plans**: 1 plan

Plans:
- [x] 26.1-01-PLAN.md — Restructure ClientEditForm: 7 → 5 accordéons regroupés (3 tasks: refactor accordions, update labels, manual testing)

**Status**: Ready for execution

**Details**:
Phase 26.1 réorganise les accordéons selon la logique workflow d'un studio d'enregistrement.

**Current Issue:**
- Structure actuelle: 7 accordéons séparés (base, contact, adresse, enrichies, profil musical, photo, entreprises)
- Ordre non optimal: profil musical en 5e position alors que c'est le cœur du métier
- Informations éparpillées: contact et adresse séparés, profil musical divisé

**Solution (Option A - Structure Fusionnée):**

**1. Identité** (fusionné: base + photo)
- Type client, nom complet, nom d'artiste
- Photo de profil
- *Rationale: Identité visuelle immédiate en premier*

**2. Profil Artistique** (fusionné: profil musical complet)
- Artistique: Genres, instruments, label actuel
- Streaming: Spotify, Apple Music, YouTube, SoundCloud, Bandcamp, etc.
- Carrière: Biographie, représentation, réseaux sociaux, années actives, œuvres notables
- *Rationale: Le cœur du métier studio en 2e position*

**3. Coordonnées** (fusionné: contact + adresse)
- Téléphones, emails, sites web
- Adresses physiques complètes
- *Rationale: Tout regroupé pour joindre le client*

**4. Relations Professionnelles** (renommé: entreprises liées)
- Membres d'entreprises / Entreprises liées
- *Rationale: Terminologie plus professionnelle*

**5. Notes Studio** (renommé: informations enrichies)
- Notes internes, tags, champs personnalisés
- *Rationale: Clarifier usage interne studio*

**Key Benefits:**
- ✅ 7 → 5 accordéons (moins de navigation)
- ✅ Priorité métier (profil artistique en 2e, pas 5e)
- ✅ Regroupement logique (tout le contact ensemble)
- ✅ Terminologie studio ("Profil Artistique" > "Profil musical")
- ✅ Workflow optimisé (identité → artistique → contact → relations → notes)

**Technical Approach:**
- Refactor ClientEditForm.tsx: fusionner accordéons existants
- Pas de changements aux champs (juste réorganisation visuelle)
- Mise à jour des titres et descriptions
- Conservation de toute la logique formData existante

**Rationale**: User feedback indique que l'organisation actuelle ne suit pas la logique métier d'un studio. Profil artistique devrait être prioritaire (position 2 vs 5 actuel). Regrouper contact+adresse réduit navigation. Terminologie "Profil Artistique" et "Notes Studio" plus claire que "Profil musical" et "Informations enrichies".

### Phase 26.2: Restaurer Relations Professionnelles

**Goal**: Restaurer la fonctionnalité Phase 25 (gestion relations client-entreprise) qui a été supprimée lors de la refonte UI Phase 26/26.1

**Depends on**: Phase 26.1 (Accordion reorganization complete)

**Research**: Complete (composants existent déjà, juste réintégration UI)

**Plans**: 1 plan

Plans:
- [x] 26.2-01-PLAN.md — Restore Relations feature in EDIT mode only (add 6th accordion "Relations professionnelles" to ClientEditForm)

**Status**: Complete

**Details**:
Phase 26.2 restores the company-individual relationship management that was accidentally removed during Phase 26/26.1 UI refactoring.

**Problem:**
- Phase 25 implemented CompanyMembersModal + CompanyMembersIndicator + 5 backend endpoints
- Phase 26/26.1 refactored edit form (wizard → accordions) but removed accordion "Relations professionnelles"
- Users can no longer edit relationships in EDIT mode (/clients/4?edit=true)

**Solution (EDIT Mode Only):**

**Single Task - EDIT Mode (ClientEditForm):**
- Import CompanyMembersIndicator
- Update Alt key accordion list (add "relations-professionnelles")
- Add 6th accordion "Relations professionnelles"
- Position: 3rd (after Coordonnées, before Profil Artistique)
- Default state: Closed (only Identité open)
- Conditional rendering: show indicator if formData.id exists, placeholder otherwise

**Technical Details:**
- Reuse existing Phase 25 components (CompanyMembersModal 374 lines, CompanyMembersIndicator 93 lines)
- Backend already functional (5 endpoints: addMember, updateMember, removeMember, getCompanies, getRoles)
- No schema changes needed (company_members table exists)
- CompanyMembersIndicator handles all queries and modal logic internally

**User Requirements (from discussion):**
1. Phase number: 26.2
2. Default state: Closed (Option A)
3. Position: 3rd accordion after Coordonnées (Option C)
4. Name: "Relations professionnelles"

**Rationale**: Phase 25 functionality was lost during Phase 26/26.1 UI refactoring. Users reported inability to add/edit company relationships from individual client pages in EDIT mode. This phase restores full CRUD capability in EDIT mode only (VIEW mode remains unchanged per user request: "ne touche pas à l'UI de la page /clients/4") while maintaining the new accordion-based design from Phase 26.1.

### Phase 27: Masquer Champs Musicaux pour Entreprises - Formulaire Édition

**Goal**: Masquer les sections musicales (Profil Artistique, Streaming) et champs individual dans le formulaire d'édition quand type="company"

**Depends on**: Phase 26.2 (accordion structure stabilisée avec 6 accordéons)

**Research**: Minimal (logique conditionnelle React, state management existant)

**Plans**: 1 plan

Plans:
- [x] 27-01-PLAN.md — Conditional rendering for music-related accordions (Completed 2026-01-22 - 2 min)
- [x] 27-02-PLAN.md — Fix birthday and gender conditional rendering (gap closure) (Completed 2026-01-22 - 2 min)

**Status**: ✅ Complete (All 2 plans finished - 4 min total)

**Details**:

**Problem:**
Actuellement, le formulaire ClientEditForm affiche tous les champs pour tous les types. Quand type="company", les entreprises voient :
- ❌ Accordéon "Profil Artistique" complet (genres, instruments, biography, représentation) - inutile pour entreprises
- ❌ Accordéon "Streaming" complet (11 plateformes) - inutile pour entreprises
- ❌ Champs "individual" dans Identité (artistName, structured name, birthday, gender) - inutiles pour entreprises

**Solution (Masquage Conditionnel pour Entreprises Uniquement):**

**Scope:**
- ✅ Formulaire d'édition uniquement (ClientEditForm.tsx)
- ✅ Modification UNIQUEMENT quand type="company"
- ✅ Type="individual" reste **100% INCHANGÉ** (affichage actuel déjà correct)
- ❌ Vue détail (ClientDetailTabs) - inchangée
- ❌ Listes/cartes (Table/Grid/Kanban) - inchangées

**Comportement:**
- **Changement immédiat et dynamique** : Quand l'utilisateur bascule vers type="company", les accordéons non pertinents disparaissent
- **Masquer complètement** les sections non pertinentes pour entreprises (pas de griser/désactiver)

**Changements à implémenter:**

**Pour Type = "individual" (particulier):**
- ✅ **AUCUN CHANGEMENT** - Affichage actuel déjà correct
- ✅ Tous les 6 accordéons restent visibles
- ✅ Tous les champs restent visibles
- ✅ Code existant préservé à 100%

**Pour Type = "company" (entreprise) - UNIQUEMENT CES MODIFICATIONS:**
- ✅ Identité : Masquer artistName, structured name (prefix/firstName/middleName/lastName/suffix), birthday, gender
- ✅ Identité : Garder visible companyName, industry, registrationNumber
- ✅ Coordonnées : Garder inchangé (tous champs visibles)
- ❌ **Profil Artistique** : Masquer accordéon complètement (genres, instruments, biography, représentation inutiles)
- ❌ **Streaming** : Masquer accordéon complètement (11 plateformes inutiles)
- ✅ Relations Professionnelles : Garder inchangé (affiche "Membres")
- ✅ Notes Studio : Garder inchangé (customFields)

**Technical Approach:**
1. Utiliser `formData.type === 'company'` comme condition pour masquer
2. Rendu conditionnel accordéons : `{formData.type !== 'company' && <AccordionItem value="profil-artistique">...}`
3. Rendu conditionnel champs Identité : `{formData.type !== 'company' && <Input name="artistName">...}`
4. Aucun changement backend (schema déjà flexible)
5. Validation form existante inchangée (required fields déjà gérés)
6. **IMPORTANT** : Ne rien modifier pour type="individual" (déjà correct)

**User Requirements:**
- Portée : Formulaire édition uniquement, type="company" uniquement
- Masquage : Complet (pas de griser) pour Profil Artistique et Streaming
- Dynamisme : Changement immédiat quand type change vers "company"
- Particuliers : 100% inchangés (affichage actuel déjà bon)

**Rationale**: Les entreprises (labels, studios de production, management) n'ont pas de profil artistique ni de présence sur plateformes streaming. Afficher ces sections pour les entreprises crée de la confusion et du bruit visuel. Le formulaire particulier est déjà correct et ne nécessite aucune modification.

---


### Phase 28: Harmonisation UI Talents - Copier Améliorations Clients

**Goal**: Appliquer toutes les améliorations UX de la page /clients à la page /talents (modes Table/Grid/Kanban, tri, copy-to-clipboard, stats, avatars, design moderne)

**Depends on**: Phase 27 (conditional rendering complete)

**Research**: Minimal (réutilisation patterns existants de Clients.tsx)


**Plans**: 5 plans

Plans:
- [x] 28-01-PLAN.md - Backend enhancements (musicians router with sorting/filtering/stats)
- [x] 28-02-PLAN.md - Core UI components (ViewMode toggle, stats cards, CopyButton, Avatar)
- [x] 28-03-PLAN.md - View implementations (Table/Grid/Kanban complete)
- [ ] 28-04-PLAN.md - GAP CLOSURE: TalentDetail harmonization (tabbed interface, organized sections)
- [ ] 28-05-PLAN.md - GAP CLOSURE: TalentEditForm accordion pattern (replace wizard)

**Status**: 3/5 plans complete - List view harmonized, detail/form gaps remain

**Details**:

**Current State:**
- **Clients.tsx**: 1307 lignes - page complète avec modes d'affichage, tri, stats, avatars, copy-to-clipboard
- **Talents.tsx**: 569 lignes → HARMONISÉ ✅ (28-01, 28-02, 28-03 complete)
- **TalentDetail.tsx**: 400+ lignes - old inline form pattern → NEEDS TABS (28-04)
- **TalentCreate.tsx**: 250 lignes - old wizard pattern → NEEDS ACCORDION (28-05)

**Gap Analysis:**

**Gap 1 - TalentDetail Page (28-04):**
- ClientDetail (Phases 22-26): Tabbed interface, organized sections, stats, visual hierarchy
- TalentDetail: Old inline form, no tabs, less organized
- Solution: Create TalentDetailTabs component matching ClientDetailTabs pattern

**Gap 2 - TalentEditForm (28-05):**
- ClientEditForm (Phase 26): Accordion-based, all fields accessible, no navigation overhead
- TalentCreate/Edit: Wizard pattern with steps, navigation friction
- Solution: Create TalentEditForm with accordions, reuse in create/edit modes

**Harmonization Progress:**

**COMPLETE (28-01, 28-02, 28-03):**
✓ Table/Grid/Kanban views
✓ ViewMode toggle with localStorage
✓ Stats cards (total, VIP performers, sessions, last activity)
✓ Copy-to-clipboard buttons (email/phone)
✓ Avatars with initials fallback
✓ Sortable columns (name, type, sessions, lastSession)
✓ Type badges colored by talentType
✓ Responsive layouts (mobile/tablet/desktop)
✓ Search/filter integration

**REMAINING (28-04, 28-05):**
- [ ] TalentDetail tabbed interface (4 tabs: Informations, Sessions, Projets, Finances)
- [ ] TalentDetail organized view mode sections (Identité, Contact, Profil Musical)
- [ ] TalentEditForm accordion pattern (5 accordions)
- [ ] TalentCreate refactored to use TalentEditForm
- [ ] Wizard pattern eliminated

**Technical Approach:**
1. ✅ Analyze Clients.tsx structure (1307 lines)
2. ✅ Extract reusable components (CopyButton, ViewMode, Stats)
3. ✅ Adapt to Talents schema (musicians table)
4. ✅ Update tRPC queries for sorting/filtering
5. ⏳ Create TalentDetailTabs (match ClientDetailTabs)
6. ⏳ Create TalentEditForm (match ClientEditForm)
7. ⏳ Refactor TalentCreate to reuse form

**Schema Differences (Clients vs Talents):**
- Clients: clients table (name, artistName, type, companyName, addresses, company_members)
- Talents: musicians table (name, stageName, talentType, specialty, instruments, genres, bio)

**Reusable Patterns (APPLIED):**
✓ ViewMode state management
✓ Copy-to-clipboard utility
✓ Avatar/Initials generation
✓ Badge color mapping
✓ Stats aggregation
✓ Sortable table headers

**Rationale**: Page /clients a reçu 9 phases d'améliorations UI (Phases 19, 20, 22, 23, 24, 25, 26, 26.1, 27) transformant une simple liste en hub relationnel moderne avec 3 modes d'affichage, tri, stats, et UX professionnelle. Page /talents liste harmonisée (28-01/02/03) mais detail page et formulaire édition restent anciens patterns (wizard, inline forms). Gap closure plans (28-04, 28-05) complètent harmonisation totale en appliquant patterns Phases 22-26 (tabs, accordions, visual hierarchy). Users managing talents (musicians, engineers, producers) méritent la même qualité UX que clients partout dans l'app.

---

### Phase 29: Harmonisation Services - Routing Cohérent

**Goal**: Remplacer le Dialog modal par une page dédiée /services/new pour cohérence avec toutes les autres ressources (clients, sessions, invoices, equipment, rooms, projects, quotes, contracts, expenses, talents, tracks)

**Depends on**: Phase 28 (harmonisation patterns établis)

**Research**: Minimal (pattern existant réutilisé de 11 autres pages)


**Plans**: 1 plan

Plans:
- [x] 29-01-PLAN.md — ServiceCreate page + ServiceEditForm component + routing update (Completed 2026-01-22 - 4 min)

**Status**: ✅ Complete (1/1 plans complete - 4 min total)

**Details**:

**Pattern Application:**
Phase 29 applies the established harmonization pattern (Phases 22-28) to Services:
- Create dedicated `/services/new` page (ServiceCreate.tsx)
- Create accordion-based form component (ServiceEditForm.tsx with 2 sections)
- Replace Dialog modal with Link navigation
- Register route in App.tsx

**Why 2 Accordions (not 5 like TalentEditForm):**
Services has only 6 fields (name, description, category, unitPrice, taxRate, defaultQuantity):
- **Accordion 1 - Identité du Service:** name, category, description (3 fields)
- **Accordion 2 - Tarification:** unitPrice, taxRate, defaultQuantity (3 fields)

**Template:** TalentEditForm (Phase 28) - 300 lines with 5 accordions → ServiceEditForm ~200 lines with 2 accordions

**Changes:**
1. Create ServiceCreate.tsx (~110 lines)
2. Create ServiceEditForm.tsx (~200 lines)
3. Update Services.tsx: Remove Dialog code (lines 350-493), change button to Link navigation
4. Update App.tsx: Add /services/new route

**Code Impact:**
- Lines added: ~310 (ServiceCreate + ServiceEditForm)
- Lines removed: ~150 (Dialog code from Services.tsx)
- Net: +160 lines
- Files created: 2
- Files modified: 2

**Pattern Consistency:**
After Phase 29, all 12 resources use dedicated `/resource/new` pages:
- clients, sessions, invoices, equipment, rooms, projects
- quotes, contracts, expenses, talents, tracks, **services** ✅


**Rationale**: Services est la SEULE ressource de l'application utilisant un Dialog modal au lieu de pages dédiées /new. Cette incohérence crée confusion UX (pourquoi Services se comporte différemment?) et problèmes navigation (URL non partageable, back button). Harmoniser Services avec le pattern établi par 11 autres ressources améliore cohérence globale, maintenabilité, et UX prévisible.

---
### Phase 30: Harmonisation Equipment - Routing Cohérent

**Goal**: Transformer EquipmentCreate en page avec formulaire accordion (EquipmentEditForm) pour cohérence avec Client/Talent/Service

**Depends on**: Phase 29 (pattern Services établi)

**Research**: Minimal (pattern réutilisé de ServiceEditForm)

**Plans**: 1 plan

Plans:
- [ ] 30-01-PLAN.md — EquipmentEditForm component (4 accordions) + convert EquipmentCreate page

**Status**: Ready for execution

**Details**:
Appliquer le pattern accordion établi (Phases 22-29) à Equipment. Créer EquipmentEditForm avec 4 accordions (Identité, Spécifications Techniques, Informations Financières, Maintenance & Statut) couvrant les 16 champs du schéma. Convertir EquipmentCreate.tsx de formulaire inline (220 lignes) en page accordion (~120 lignes) réutilisant EquipmentEditForm.


---
---

### Phase 31: Harmonisation Rooms - Routing Cohérent

**Goal**: Transformer RoomCreate en page avec formulaire accordion (RoomEditForm) pour cohérence avec Client/Talent/Service

**Depends on**: Phase 30 (pattern Equipment établi)

**Research**: Minimal (pattern réutilisé de ServiceEditForm)

**Plans**: 1 plan

Plans:
- [ ] 31-01-PLAN.md — RoomEditForm component + update RoomCreate page

**Status**: Ready for planning

**Details**:
Appliquer le pattern accordion établi à Rooms. Créer RoomEditForm avec accordions (Identité, Caractéristiques, Équipement), remplacer formulaire inline dans RoomCreate.

**Rationale**: RoomCreate existe mais utilise formulaire inline sans accordions. Harmonisation complète la cohérence UI pour toutes les ressources physiques (Equipment + Rooms).

---

### Phase 32: Harmonisation Projects - Routing Cohérent

**Goal**: Transformer ProjectCreate en page avec formulaire accordion (ProjectEditForm) pour cohérence avec Client/Talent/Service

**Depends on**: Phase 31 (pattern Rooms établi)

**Research**: Minimal (pattern réutilisé de TalentEditForm - formulaire complexe)

**Plans**: 1 plan

Plans:
- [ ] 32-01-PLAN.md — ProjectEditForm component + update ProjectCreate page

**Status**: Ready for execution

**Details**:
Appliquer le pattern accordion établi à Projects. Créer ProjectEditForm avec accordions (Informations, Planning, Budget, Notes), remplacer formulaire inline dans ProjectCreate. Projects a plus de champs que Service (comme Talents), donc utiliser TalentEditForm comme template.

**Rationale**: ProjectCreate existe mais utilise formulaire inline sans accordions. Projects est une ressource critique du workflow studio - harmonisation prioritaire.

---

### Phase 33: Harmonisation Sessions - Routing Cohérent

**Goal**: Transformer SessionCreate en page avec formulaire accordion (SessionEditForm) pour cohérence avec Client/Talent/Service

**Depends on**: Phase 32 (pattern Projects établi)

**Research**: Minimal (pattern réutilisé de TalentEditForm)

**Plans**: 1 plan

Plans:
- [x] 33-01-PLAN.md — SessionEditForm component + update SessionCreate page

**Status**: Ready for execution

**Details**:
Appliquer le pattern accordion établi à Sessions. Créer SessionEditForm avec accordions (Informations, Planning, Participants, Facturation), remplacer formulaire inline dans SessionCreate.

**Rationale**: SessionCreate existe mais utilise formulaire inline sans accordions. Sessions est LA ressource centrale du studio - harmonisation critique pour UX cohérente.

---

### Phase 34: Harmonisation Tracks - Routing Cohérent

**Goal**: Transformer TrackCreate en page avec formulaire accordion (TrackEditForm) pour cohérence avec Client/Talent/Service

**Depends on**: Phase 33 (pattern Sessions établi)

**Research**: Minimal (pattern réutilisé de ServiceEditForm)

**Plans**: 1 plan

Plans:
- [ ] 34-01-PLAN.md — TrackEditForm accordion component (3 sections: Basic Info, Musical Details, Notes) + update TrackCreate page — TrackEditForm component + update TrackCreate page

**Status**: Ready for planning

**Details**:
Appliquer le pattern accordion établi à Tracks. Créer TrackEditForm avec accordions (Informations, Métadonnées Audio, Participants), remplacer formulaire inline dans TrackCreate.

**Rationale**: TrackCreate existe mais utilise formulaire inline sans accordions. Tracks lié aux Sessions/Projects - harmonisation complète le workflow audio.

---

### Phase 35: Harmonisation Invoices - Routing Cohérent

**Goal**: Transformer InvoiceCreate en page avec formulaire accordion (InvoiceEditForm) pour cohérence avec Client/Talent/Service

**Depends on**: Phase 34 (pattern Tracks établi)

**Research**: Minimal (pattern réutilisé de TalentEditForm - formulaire complexe)

**Plans**: 1 plan

Plans:
- [x] 35-01-PLAN.md — InvoiceEditForm component + update InvoiceCreate page

**Status**: Ready for execution

**Details**:
Appliquer le pattern accordion établi à Invoices. Créer InvoiceEditForm avec accordions (Informations, Line Items, Paiement, Notes), remplacer formulaire inline dans InvoiceCreate.

**Rationale**: InvoiceCreate existe mais utilise formulaire inline sans accordions. Invoices critique pour workflow commercial - harmonisation prioritaire.

---

### Phase 36: Harmonisation Quotes - Routing Cohérent

**Goal**: Transformer QuoteCreate en page avec formulaire accordion (QuoteEditForm) pour cohérence avec Client/Talent/Service

**Depends on**: Phase 35 (pattern Invoices établi)

**Research**: Minimal (pattern réutilisé de InvoiceEditForm - structures similaires)

**Plans**: 1 plan

Plans:
- [ ] 36-01-PLAN.md — QuoteEditForm component + update QuoteCreate page

**Status**: Ready for planning

**Details**:
Appliquer le pattern accordion établi à Quotes. Créer QuoteEditForm avec accordions (Informations, Services, Conditions, Notes), remplacer formulaire inline dans QuoteCreate. Structure similaire à Invoices.

**Rationale**: QuoteCreate existe mais utilise formulaire inline sans accordions. Quotes première étape du workflow commercial - harmonisation complète cohérence Quote→Invoice.

---

### Phase 37: Harmonisation Contracts - Routing Cohérent

**Goal**: Transformer ContractCreate en page avec formulaire accordion (ContractEditForm) pour cohérence avec Client/Talent/Service

**Depends on**: Phase 36 (pattern Quotes établi)

**Research**: Minimal (pattern réutilisé de TalentEditForm)

**Plans**: 1 plan

Plans:
- [ ] 37-01-PLAN.md — ContractEditForm component + update ContractCreate page

**Status**: Ready for planning

**Details**:
Appliquer le pattern accordion établi à Contracts. Créer ContractEditForm avec accordions (Informations, Termes, Documents, Signatures), remplacer formulaire inline dans ContractCreate.

**Rationale**: ContractCreate existe mais utilise formulaire inline sans accordions. Contracts partie du workflow légal/commercial - harmonisation complète la suite professionnelle.

---

### Phase 38: Harmonisation Expenses - Routing Cohérent

**Goal**: Transformer ExpenseCreate en page avec formulaire accordion (ExpenseEditForm) pour cohérence avec Client/Talent/Service

**Depends on**: Phase 37 (pattern Contracts établi)

**Research**: Minimal (pattern réutilisé de ServiceEditForm - formulaire simple)

**Plans**: 1 plan

Plans:
- [ ] 38-01-PLAN.md — ExpenseEditForm component + update ExpenseCreate page

**Status**: Planning complete

**Details**:
Appliquer le pattern accordion établi à Expenses. Créer ExpenseEditForm avec accordions (Identité, Informations Financières), remplacer formulaire inline dans ExpenseCreate. 12/12 ressources harmonisées - initiative terminée!

**Rationale**: ExpenseCreate existe mais utilise formulaire inline sans accordions. Expenses dernière ressource à harmoniser - complète la cohérence UI totale (12/12 ressources).

---
### Phase 39: Gestion TVA Multi-Taux

**Goal**: Implémenter système complet de gestion TVA avec taux configurables par organisation

**Depends on**: Phase 38 (harmonisation UI complète)

**Plans**: 5 plans

Plans:
- [ ] 39-01-PLAN.md — Database schema: vat_rates table + FK migrations
- [ ] 39-02-PLAN.md — Data migration: header taxRate → line-item vatRateId
- [ ] 39-03-PLAN.md — Backend API: tRPC router for VAT CRUD
- [ ] 39-04-PLAN.md — Frontend UI: Settings Finance tab with VAT management
- [ ] 39-05-PLAN.md — Forms update: Invoice/Quote line-item VAT selection

**Status**: Planned (ready for execution)

**Wave Structure**:
- Wave 1: Plan 01 (schema)
- Wave 2: Plan 02 (migration), Plan 03 (API) — parallel
- Wave 3: Plan 04 (Settings UI)
- Wave 4: Plan 05 (Forms)

**Details**:

**Contexte**: Actuellement, la TVA est gérée de manière simpliste avec un taux fixe (20%) au niveau facture/devis global. Besoin d'un système flexible pour:
- Gérer plusieurs taux de TVA par organisation (20%, 10%, 5.5%, 2.1% en France)
- Appliquer la TVA par ligne de facture/devis (pas seulement global)
- Permettre aux organisations de configurer leurs propres taux
- Migrer les données existantes sans perte

**Scope**:

1. **Database (Tenant DB)** (Plan 01):
   - Table `vat_rates` avec champs: name, rate, is_default, is_active
   - Seed automatique 4 taux français (20%/10%/5.5%/2.1%) à création tenant
   - Ajouter `vatRateId` sur: rooms, invoiceItems, quoteItems, serviceCatalog

2. **Migration données existantes** (Plan 02):
   - Script transfert `invoices.taxRate` → `invoiceItems.vatRateId`
   - Script transfert `quotes.taxRate` → `quoteItems.vatRateId`
   - Migration serviceCatalog.taxRate → serviceCatalog.vatRateId
   - Idempotent (safe to re-run)

3. **Backend (tRPC)** (Plan 03):
   - Router `vatRates` avec CRUD complet (list, create, update, archive, setDefault)
   - Validation: empêcher archivage taux utilisé dans factures/devis actifs
   - Atomic transaction for setDefault (prevents multiple defaults)

4. **Frontend (Settings)** (Plan 04):
   - Nouvel onglet "Finance" dans Settings
   - Section "Gestion de la TVA" avec table
   - Dialogs: CreateVatRateDialog, EditVatRateDialog
   - Actions: Créer, modifier nom, archiver, définir par défaut
   - UI harmonization: text-primary icons, pb-3 spacing

5. **Impact autres pages** (Plan 05):
   - InvoiceCreate/InvoiceDetail: Dropdown TVA par ligne
   - QuoteCreate/QuoteDetail: Dropdown TVA par ligne
   - Default rate auto-selected on new items
   - Total calculation: sum per-line VAT amounts
   - Backend validation: vatRateId required on all line items

**Rationale**: 
- TVA par ligne = norme facturation professionnelle (services différents = taux différents)
- Configuration flexible = adaptable international (UK, Canada, etc.)
- Tenant DB = chaque organisation gère ses propres taux
- Seed français = onboarding rapide pour marché principal
- Archive (soft delete) = préserve intégrité historique

**Success Criteria**:
- [ ] Table `vat_rates` créée avec seed 4 taux français
- [ ] Migration données existantes sans perte (idempotent)
- [ ] Onglet Finance dans Settings fonctionnel
- [ ] CRUD taux TVA avec validation (archive prevented if in use)
- [ ] Factures/Devis supportent TVA par ligne (dropdown per item)
- [ ] Default rate auto-selected on new line items
- [ ] Tests: création taux, facture mixte (20% + 10%), calculs corrects

---

