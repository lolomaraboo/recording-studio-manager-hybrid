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
**Goal**: Stripe subscription billing with 3 pricing tiers (Starter/Pro/Enterprise), trial periods, usage limits

**Depends on**: Phase 2 (complete feature set to monetize)

**Research**: Likely (Stripe Subscriptions API, webhooks for subscription lifecycle)

**Research topics**:
- Stripe Subscriptions API v2025-12-15.clover (current version)
- Subscription lifecycle webhooks (trial_end, payment_failed, canceled)
- Usage-based limits implementation (sessions/month per tier)
- Customer Portal integration for self-service billing

**Plans**: 3 plans

Plans:
- [x] 03-01: Stripe Subscriptions setup with pricing tiers (€29/€99/€299) (Completed 2025-12-25 - 18 min)
- [x] 03-02: Usage limits enforcement + subscription management (Completed 2025-12-26 - 7 min)
- [x] 03-03: Customer Portal + subscription management UI (Completed 2025-12-26 - 11 min)

**Rationale**: Can't sell without billing. Stripe already integrated (Phase 4.2) but only one-time payments. Subscriptions = recurring revenue model. Customer Portal = reduce support burden.

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
Phases execute sequentially: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Production Stability | 3/3 | ✅ Complete | 2025-12-26 |
| 2. Complete Phase 5 | 2/2 | ✅ Complete | 2025-12-26 |
| 3. Billing Infrastructure | 2/3 | In progress | - |
| 4. Marketing Foundation | 0/3 | Not started | - |
| 5. Onboarding & UX | 0/4 | Not started | - |
| 6. Support & Documentation | 0/3 | Not started | - |
| 7. Production Hardening | 0/3 | Not started | - |
| 8. Launch Ready | 0/3 | Not started | - |

**Total**: 7/24 plans complete (29.2%)

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

After v1.0 ships: Features like SSO, 2FA, multi-région, i18n become v2.0+ milestones.
