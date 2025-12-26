# Recording Studio Manager - SaaS Commercial

## Vision

Transformer Recording Studio Manager en **plateforme SaaS commerciale prête à vendre** pour studios d'enregistrement professionnels.

**Le problème :** Les studios d'enregistrement utilisent des outils fragmentés (Excel, calendriers papier, emails) ou des solutions génériques inadaptées à leur métier spécifique (gestion projets musicaux, booking salles, équipement audio, facturation clients artistiques).

**Notre solution :** App SaaS multi-tenant spécialisée avec :
- Gestion complète studio (planning, clients, projets musicaux, équipement)
- Portail client pour booking + paiements en ligne (Stripe)
- **AI Chatbot complet (37 actions)** - Automatisation sessions, clients, analytics, invoices
- Architecture Database-per-Tenant (isolation données, conformité)
- Interface moderne React 19 + type safety end-to-end
- **Audio Management professionnel** - Upload versioning (demo/rough/final/master), audio player custom
- **20+ UX features avancées** - Command palette, notifications, theme toggle, search globale

**Pourquoi maintenant :**
- Infrastructure technique solide déjà construite (Phase 1-4 complétées)
- Stack moderne différenciante (React 19, tRPC 11, PostgreSQL multi-tenant)
- App déjà déployée en production avec SSL
- 97 commits en 7 jours montrent vélocité élevée
- Marché validé (version Legacy Python utilisée par studios)

## Problem

**Studios d'enregistrement perdent temps et argent avec outils inadaptés :**

**Pain points actuels :**
1. **Booking chaotique** - Double bookings, conflits salles, rappels manuels
2. **Gestion projets complexe** - Albums multi-pistes, crédits artistes, versioning fichiers audio
3. **Facturation inefficace** - Devis manuels, retards paiements, pas de paiement en ligne
4. **Portail client inexistant** - Clients doivent appeler/emailer pour tout
5. **Équipement non tracké** - Maintenance oubliée, matériel perdu
6. **Rapports financiers difficiles** - Pas de vue business globale

**Taille du marché :**
- Studios petits/moyens (1-20 personnes) : simplicité + prix abordable
- Studios enterprise (20+ personnes) : SSO, compliance, multi-sites
- Tous segments adressables avec pricing tiers

**Gap actuel :** Solutions existantes sont soit trop génériques (Trello, Asana) soit trop anciennes (interfaces 2010, pas de mobile).

## Success Criteria

Comment on sait que c'est prêt à vendre :

- [x] **Phase 5 complétée** - Projects Management 100% fonctionnel (track audio upload, versioning, comments, waveform player)
- [ ] **Production stable** - 0 erreurs CORS, authentification multi-tenant fonctionne, monitoring basique actif
- [x] **Stripe billing complet** - Subscriptions Free/Pro/Enterprise implémentées avec webhooks, Customer Portal, usage limits
- [ ] **Landing page publique** - recording-studio-manager.com explique le produit, pricing visible, CTA signup
- [ ] **Démo fonctionnelle** - Studio démo pré-rempli accessible publiquement pour trial
- [ ] **Support infrastructure** - Email support configuré, documentation utilisateur basique, FAQ
- [ ] **Tests end-to-end validés** - Signup → Dashboard → Booking → Payment → Project → Track upload fonctionne sans bug
- [ ] **Onboarding smooth** - Nouveau studio peut s'inscrire et booker une session en <5min
- [ ] **Performance acceptable** - Dashboard <2s load, API <500ms response time
- [ ] **Sécurité production** - HTTPS everywhere, CORS configuré, secrets sécurisés, backup DB automatique
- [ ] **Legal ready** - Terms of Service, Privacy Policy, GDPR compliance basique

## Scope

### Building (v1.0 Commercial)

**Core Product (Must Have) :**
- ✅ Multi-tenant architecture (Database-per-Tenant PostgreSQL) - FAIT
- ✅ Client Portal complet (10 features: auth email/password, magic link, password reset, booking, payments, dashboard, profile, activity logs) - FAIT
- ✅ Stripe Integration (Checkout Sessions, webhooks, subscriptions) - FAIT
- ✅ **AI Chatbot COMPLET (37 actions)** - Sessions(5), Clients(5), Analytics(5), Invoices(4), Quotes(4), Rooms(2), Equipment(2), Projects(3), Musicians(1) - FAIT
- ✅ **Audio System professionnel** - Upload Cloudinary, versioning (demo/rough/final/master), AudioPlayer custom HTML5, TrackDetail avec 3 cartes Phase 5 - FAIT
- ✅ **20 UX Components avancés** - Command Palette (Cmd+K), Notification Center, Dark/Light Theme, Global Search, Toast, Breadcrumbs, Status Badges, Loading Skeletons, Delete Confirmations, Responsive Mobile - FAIT
- ✅ Projects Management (11/12 items = 92%, Item 12 = Tests E2E optionnels, 100% fonctionnel) - FAIT
- 🟡 Production HTTPS stable (CORS fix déployé, database initialization bloquée ISSUE-001)
- 🔴 Monitoring basique (Uptime Kuma déployé, Sentry DSN à configurer)
- 🔴 Email notifications (endpoints prêts, templates Resend à implémenter)

**Go-to-Market :**
- Landing page marketing (hero, features, pricing, testimonials, CTA)
- Pricing page (**RÉEL Stripe 28 nov:** Studio Free €0/mois, Studio Pro €19/mois ou €190/an, Studio Enterprise €59/mois ou €590/an + Packs IA 2€/5€/7€)
- Démo publique (studio-demo.recording-studio-manager.com pré-rempli)
- Documentation utilisateur (guides: setup, booking, projects, invoicing)
- Support email (support@recording-studio-manager.com avec Resend)
- Legal pages (Terms, Privacy, GDPR compliance)

**Note:** Pricing strategy updated 28 nov 2024 (vs initial roadmap €29/€99/€299) - Plan Free added for acquisition, tiers repositioned -34% to -80% for market competitiveness, AI credit packs added for usage-based monetization.

**Polish Production :**
- Onboarding flow nouveau studio (wizard 3 étapes)
- Dashboard analytics (revenue, bookings ce mois, clients actifs)
- Performance optimization (lazy loading, caching, CDN assets)
- Error boundaries + user-friendly error messages
- Mobile responsive (toutes pages utilisables sur mobile)
- Backup automatique databases (daily snapshots)

**Billing Infrastructure :**
- Stripe Customer Portal (clients gèrent leur subscription)
- Usage-based limits (Starter: 50 sessions/mois, Pro: unlimited)
- Trial period (14 jours gratuit pour tous)
- Downgrade/upgrade flows
- Invoice generation automatique

### Not Building (v1.0)

**Reporté à v2.0 Enterprise (6-9 mois) :**

*Note: 15 features existent en production dans Version Claude (Python) mais pas encore portées vers Hybrid. Voir `.planning/ROADMAP_V2_ENTERPRISE.md` pour détails complets.*

**Phase 9 - Security & Compliance (🔴 Critical, 6-8 weeks):**
- SSO/SAML (Okta, Auth0, Azure AD) - Required by 80% Fortune 500
- 2FA TOTP avec backup codes - Compliance requirement (SOC2, GDPR)
- Audit logs SOC2-ready - Enterprise compliance mandatory

**Phase 10 - Localization (🟡 High, 4-6 weeks):**
- i18n (6 langues: EN, FR, ES, DE, IT, PT) - International expansion
- Multi-devises (EUR, USD, GBP, CAD, JPY, AUD) - Global payments

**Phase 11 - Customization (🟡 Medium, 3-4 weeks):**
- White-label branding complet - Reseller/OEM channel
- Custom domains par tenant - Enterprise branding
- Theme manager - Per-org customization

**Phase 12 - Integrations (🟢 Medium, 4-6 weeks):**
- Google Calendar sync bidirectional - Popular integration
- Twilio SMS notifications - Client communications
- DocuSign e-signature - Contract automation

**Phase 13 - Infrastructure (🟢 Low, 4-6 weeks):**
- Multi-région deployment (AWS us-east-1 + eu-west-1 + ap-southeast-1) - Global scale
- PostgreSQL streaming replication - High availability
- Backup manager automated - Disaster recovery
- Advanced rate limiting (Redis) - DDoS protection
- Prometheus + Grafana monitoring - Production observability

**Total effort:** ~200KB Python code to port, 25-35 weeks (6-9 months), $100k-150k budget

**Alternative technologies (decided against):**
- ~~S3 storage~~ → Using Cloudinary instead (simpler, 25GB free tier)
- ~~MySQL~~ → PostgreSQL only (advanced features needed)
- ~~Single-Database~~ → Database-per-Tenant for isolation

**Explicitement hors scope :**
- Gestion multi-sites (studios avec plusieurs locations)
- Intégrations comptables (QuickBooks, Xero) - Export CSV suffit
- CRM avancé (campaigns, email marketing)
- Gestion RH (payroll, contrats employés)
- Marketplace plugins/extensions

## Context

**État actuel du projet (2025-12-24) :**

**Historique :**
- **Version Legacy (Python/Flask)** déployée en production depuis 1+ an sur VPS Hostinger
- **Version Hybrid (TypeScript)** démarrée il y a ~3 mois
- **97 commits en 7 jours** (17-24 déc) montrent sprint intense vers production

**Code existant :**
- **Monorepo pnpm** : packages/shared, database, server, client
- **42 pages UI React** complètes avec shadcn/ui (Admin: 37 pages, Client Portal: 5 pages)
- **20+ routers tRPC** avec 33+ endpoints type-safe
- **Database-per-Tenant RÉEL** : 35 tables (29 tenant + 6 master), migrations Drizzle
- **Production déployée** sur VPS 31.220.104.244 avec Docker + Nginx + SSL
- **AI Chatbot** : 37 actions, SSE streaming, anti-hallucination detection (4 règles)
- **Audio Management** : Cloudinary upload, 4 versions/track, AudioPlayer custom (227 lignes)
- **Testing** : Playwright E2E (chat, booking, auth, navigation), Vitest unit (92.63% coverage)

**État technique :**
- ✅ **Phase 1-4 (100%)** : Infrastructure, UI Components, 42 Pages, Client Portal (10 features), Stripe (subscriptions + webhooks)
- ✅ **Phase 5 (92% → 100% fonctionnel)** : Projects Management (11/12 items, Item 12 = Tests E2E optionnels)
- ✅ **AI Chatbot (100%)** : 37 actions, SSE streaming, anti-hallucination, Playwright tests 4/4 passing
- ✅ **Audio System (100%)** : Upload Cloudinary, versioning 4 versions, AudioPlayer HTML5 custom
- 🟡 **Production** : CORS fix + auth fix déployés (8 commits), bloqué par ISSUE-001 (database initialization)
- ✅ **GSD Phases complétées** : Phase 1 (Production Stability), Phase 2 (Complete Phase 5), Phase 3 (Billing Infrastructure)

**Infrastructure production :**
- **VPS** : Hostinger KVM 1 (4GB RAM, 2 vCPU) à 31.220.104.244
- **Domaine** : recording-studio-manager.com (wildcard SSL via Let's Encrypt)
- **Containers** : rsm-server, rsm-client, rsm-postgres, rsm-redis (UP depuis 3-8h)
- **Monitoring** : Aucun (juste health checks Docker)
- **Backups** : Aucun automatisé

**Stack technique (confirmé RÉEL) :**
- Frontend: React 19.1 + TypeScript 5.9 strict + Vite 7 + TailwindCSS 4 + shadcn/ui
- Backend: Express 4 + tRPC 11 + TypeScript + jose (JWT)
- Database: PostgreSQL 15 Database-per-Tenant (rsm_master + tenant_N)
- ORM: Drizzle 0.44 (type-safe, migrations SQL)
- Cache: Redis 7 (sessions persistantes)
- Payments: Stripe SDK v20.1.0 (API version 2025-12-15.clover)
- AI: Anthropic SDK (Claude) pour chatbot 37 actions
- Email: Resend API
- Storage: Cloudinary (logo uploads)
- DevOps: Docker Compose + Nginx reverse proxy

**Décisions architecturales clés :**
1. **Database-per-Tenant** choisi vs Single-DB car isolation données critique pour SaaS
2. **tRPC** choisi vs REST car type safety end-to-end réduit bugs
3. **PostgreSQL** vs MySQL car features avancées (JSON, full-text search)
4. **Monorepo** pour partage types entre frontend/backend
5. **Docker** pour reproducibilité dev → prod

**Alternatives explorées et rejetées :**
- Version Manus (MySQL single-DB) : Moins d'isolation, getTenantDb() commenté
- Version Legacy (Python/Flask) : Tech stack ancienne, maintenance difficile
- Shared database avec organizationId : Risque fuite données entre tenants

**Feedback utilisateurs (version Legacy) :**
- ✅ "Gestion booking meilleure que calendrier Google"
- ✅ "Portail client évite 50% des appels téléphone"
- ❌ "Manque gestion projets musicaux" → Motivé Phase 5
- ❌ "Interface datée" → Motivé refonte React moderne

## Constraints

**Budget cloud :**
- **Phase actuelle** : VPS unique Hostinger ~€20/mois (4GB RAM, 2 vCPU)
- **Scaling strategy** : Optimiser coûts tant que <100 tenants, puis évaluer multi-région basé sur revenue
- **Database** : PostgreSQL local sur VPS (pas RDS managed pour économie)
- **Rationale** : Bootstrap mode, pas de financement externe, revenue-driven scaling

**Stack technique :**
- **Locked-in** : TypeScript, PostgreSQL, tRPC (refonte = 3+ mois perdus)
- **Flexible** : Email provider, storage, monitoring tools
- **Rationale** : Stack moderne = argument marketing (vs concurrence tech legacy)

**Compatibilité :**
- **Aucune intégration tierce requise v1.0** (studios utilisent Excel/email)
- **Export CSV** suffit pour comptabilité externe
- **Rationale** : Simplicité > intégrations complexes pour early adopters

**Sécurité & Compliance :**
- **HTTPS obligatoire** (Let's Encrypt wildcard SSL actif)
- **GDPR basique** requis (Privacy Policy, data export, right to delete)
- **Backups** : Daily snapshots PostgreSQL minimum
- **Pas de SOC2/HIPAA** requis (studios ne sont pas healthcare/finance)
- **Rationale** : Studios stockent données artistiques, pas médicales/financières sensibles

**Performance :**
- **Target** : Dashboard <2s load, API <500ms, support 100 tenants simultanés
- **Acceptable** : 1 VPS suffit jusqu'à 500 tenants avec optimisations
- **Rationale** : Majorité traffic = booking (faible fréquence vs SaaS classique)

**Timeline :**
- **Pas de deadline imposée** : On construit jusqu'à qualité commerciale
- **Rythme actuel** : 97 commits en 7 jours = vélocité élevée soutenable court terme
- **Risque burnout** : Prioriser features critiques, éviter perfectionnisme

**Limites techniques VPS :**
- **4GB RAM** : Limite ~20-30 tenant DBs chargés simultanément en cache
- **2 vCPU** : API peut ralentir si >50 requêtes/sec
- **Storage 100GB** : Suffisant pour 1000+ studios (files audio sur Cloudinary)
- **Mitigation** : Connection pooling PostgreSQL, Redis caching, lazy loading

## Recent Discoveries (2025-12-26)

**Deep comparative analysis of 3 versions revealed:**

**93+ Features Implemented (Not Originally Planned):**
- ✅ AI Chatbot: 37 actions vs "assistant" vague in planning
- ✅ Client Portal: 10 features (magic link auth, device fingerprinting) vs basic auth
- ✅ Audio System: 4 professional components (Cloudinary, custom player 227 lines)
- ✅ 20 UX Components: Cmd+K, dark mode, global search, notifications, etc.
- ✅ Testing: 92.63% coverage (Playwright E2E + Vitest unit) - not mentioned in roadmap
- ✅ 52 pages delivered vs 39 planned (+33%)
- ✅ 35 database tables vs ~20 expected (+75%)

**15 Enterprise Features Missing (Exist in Claude Python version):**
- See `.planning/ROADMAP_V2_ENTERPRISE.md` for full details
- ~200KB Python code to port to TypeScript
- Estimated 6-9 months development effort
- Critical for enterprise customers (SSO, 2FA, compliance)

**Technology Decisions (Not Documented):**
1. Cloudinary instead of S3 - Simpler, 25GB free tier, faster setup
2. Magic Link authentication - Modern UX, passwordless option
3. Device fingerprinting - Enhanced security tracking
4. Custom HTML5 audio player - Zero dependencies, full control
5. Pricing strategy change - €0/€19/€59 vs €29/€99/€299 planned
6. Free tier addition - Freemium acquisition strategy
7. AI credit packs - Usage-based monetization model

**Documentation Created:**
- `.planning/DEEP_ANALYSIS_3_VERSIONS.md` - Full comparison (Claude vs Manus vs Hybrid)
- `.planning/EXECUTIVE_SUMMARY.md` - Executive summary with recommendations
- `.planning/ROADMAP_V2_ENTERPRISE.md` - Detailed v2.0 enterprise roadmap
- `.planning/DECISIONS_LOG.md` - Technical decisions log (7 undocumented choices explained)
- `.planning/ISSUES.md` - Updated with ISSUE-010 (planning gaps), ISSUE-011 (missing features), ISSUE-012 (undocumented decisions)

## Decisions Made

Décisions prises durant exploration initiale :

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Architecture multi-tenant** | Database-per-Tenant (PostgreSQL physique) | Isolation données maximale, conformité RGPD, performance indépendante par tenant. Single-DB avec organizationId = risque fuite données. |
| **Phase 5 avant Phase 4.3 P2** | Projects Management prioritaire vs Infrastructure polish | Feature différenciante business > optimisations invisibles. Feedback beta: "manque gestion projets" = churn risk. |
| **Production sur VPS unique** | Hostinger 4GB vs AWS multi-région | Budget-conscious, scaling basé sur tenants réels. Multi-région = $500+/mois prématuré. |
| **CORS HTTPS à fixer** | Ajouter https:// au pattern subdomain | Backend accepte http:// mais bloque https:// → Production broken. Fix critique avant marketing. |
| **Pricing tiers 3 niveaux** | Free €0, Pro €19/€190, Enterprise €59/€590 + AI packs | Adresser tous segments avec freemium. Free = acquisition, Pro = petits studios, Enterprise = moyens/gros. Prix repositionnés -34% à -80% vs plan initial pour compétitivité marché. AI packs (2€/5€/7€) = usage-based monetization. |
| **English-first, i18n later** | v1.0 English seulement | Marché US/UK = 60%+ studios, i18n = 6 semaines dev. French Canada + Europe = v2.0 après traction. |
| **Stripe billing vs build custom** | Stripe Subscriptions + Customer Portal | Time-to-market, PCI compliance gratuit, webhooks robustes. Custom billing = 4+ semaines. |
| **Monitoring basique v1.0** | Health checks + Sentry errors vs Prometheus/Grafana | <100 tenants = simple suffit. Prometheus = overhead ops prématuré. |
| **Commit modifs avant roadmap** | Fix CORS + commit auth.ts avant planifier phases | Code non committé = risque perte. Production stable = fondation pour features. |
| **Features futures reportées** | SSO, 2FA, multi-région → v2.0+ | 80/20 rule: 20% features = 80% value. Enterprise features post-traction. |

## Open Questions

Choses à clarifier durant exécution :

- [x] **Item 11 Phase 5** : ✅ RÉSOLU - Item 11 = Documentation Phase 5 (FAIT), Item 12 = Tests E2E (optionnel, 100% fonctionnel sans)
- [x] **CORS fix approach** : ✅ RÉSOLU - Cookie domain `.recording-studio-manager.com`, sameSite: lax, trust proxy configuré
- [x] **Pricing validation** : ✅ RÉSOLU - €0/€19/€59 configuré dans Stripe (28 nov 2024). Repositionné -34% à -80% vs plan initial pour compétitivité marché. Tester avec beta users pour valider adoption freemium.
- [ ] **Onboarding steps** : 3 étapes (Account → Studio Info → First Room) suffisantes ?
- [ ] **Demo data** : Combien de sessions/clients/projects pré-remplir studio-demo ?
- [ ] **Backup strategy** : Daily snapshots suffisant OU continuous replication requise ?
- [ ] **Email templates** : Designs custom OU templates Resend par défaut OK ?
- [ ] **Mobile support** : Responsive suffit OU PWA pour installation home screen ?
- [ ] **Error tracking** : Sentry suffisant OU aussi besoin logs structurés (Loki) ?
- [ ] **Legal review** : Terms/Privacy DIY avec templates OU avocat requis ?
- [ ] **Performance budget** : Quelles métriques tracker (Lighthouse score, Core Web Vitals) ?
- [ ] **Feature flags** : Implémenter système pour rollout progressif nouvelles features ?
- [ ] **Multi-language content** : Landing page English OU aussi French pour Canada/Europe ?

---

*Initialized: 2025-12-24*
*Current Phase: 5 (92% - Projects Management)*
*Production Status: Deployed with CORS blocker*
*Next Milestone: v1.0 Commercial Launch*
