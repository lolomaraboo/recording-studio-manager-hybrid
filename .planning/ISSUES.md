# Deferred Issues & Infrastructure Blockers

Issues discovered during execution that require future attention.

---

## 🔴 Critical - Blocking Phase 3.1 Completion

### ISSUE-001: Production Database Not Initialized
**Discovered:** 2025-12-26 during Phase 3.1 Plan 01 (Task 3)
**Impact:** BLOCKING - Cannot verify authentication fix, health endpoint fails, 502 Bad Gateway
**Severity:** P0 - Production broken

**Description:**
Production VPS database (rsm_master) appears not to have migrations run. Health endpoint returns `{"error":"Not found"}` indicating routes may not be initialized properly.

**Symptoms:**
- `curl http://localhost:3002/health` → `{"error":"Not found"}`
- `curl https://recording-studio-manager.com` → 502 Bad Gateway
- Server logs show "✅ Redis connected" but no database connection message
- Playwright tests timeout on login page load

**Root Cause:**
After deploying server container with authentication fixes, database migrations were not executed. The production deployment process lacks explicit migration step.

**Resolution Steps:**
1. SSH into VPS: `ssh root@31.220.104.244`
2. Check if drizzle-kit is available:
   ```bash
   docker exec rsm-server find /app -name drizzle-kit -type f
   ```
3. Run migrations:
   ```bash
   docker exec rsm-server sh -c 'cd /app && npx drizzle-kit migrate'
   ```
   OR if drizzle-kit not found:
   ```bash
   docker exec rsm-server sh -c 'cd /app/packages/database && node dist/scripts/init.js'
   ```
4. Verify health endpoint:
   ```bash
   curl http://localhost:3002/health
   # Expected: {"status":"ok","timestamp":"...","database":"connected"}
   ```
5. Test production site:
   ```bash
   curl -I https://recording-studio-manager.com
   # Expected: HTTP/1.1 200 OK
   ```

**Prevention:**
- Add explicit migration step to `scripts/deploy-auth-fix.sh`
- Document database initialization in deployment guide
- Add health check validation step to deployment script

**Related Files:**
- `.planning/phases/3.1-fix-production-authentication-401-errors/3.1-01-SUMMARY.md`
- `scripts/deploy-auth-fix.sh`

**Time Estimate:** 30-60 minutes to resolve

---

## 🟡 Medium - VPS Infrastructure Issues (Resolved)

### ISSUE-002: VPS Docker DNS Resolution Failure
**Discovered:** 2025-12-26 during Phase 3.1 Plan 01 (Task 3)
**Status:** ✅ RESOLVED
**Severity:** P1 - Infrastructure broken

**Description:**
Docker containers on VPS using systemd-resolved (127.0.0.53) cannot resolve DNS for container names ("redis", "postgres") or external hosts ("registry.npmjs.org").

**Symptoms:**
- Server logs: `Error: getaddrinfo EAI_AGAIN redis`
- Build failures: `Error when performing request to https://registry.npmjs.org/pnpm/`
- Containers cannot communicate via Docker network

**Root Cause:**
VPS (Ubuntu 24.04) uses systemd-resolved which binds to 127.0.0.53. Docker containers inherit this resolver from `/etc/resolv.conf`, but 127.0.0.53 is not accessible from inside containers.

**Resolution:**
Created `/etc/docker/daemon.json`:
```json
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}
```

Then restarted Docker daemon:
```bash
systemctl restart docker
```

**Verification:**
- Containers now resolve "redis" and "postgres" correctly
- Server logs show: "✅ Redis connected for session storage"
- No more EAI_AGAIN errors

**Learnings:**
- Always configure Docker DNS on VPS with systemd-resolved
- Test container DNS resolution early in deployment process
- Document DNS config as part of VPS setup guide

**Related Commits:**
- Infrastructure fix documented in 3.1-01-SUMMARY.md

---

### ISSUE-003: Port 3001 Conflict with Orphaned docker-proxy
**Discovered:** 2025-12-26 during Phase 3.1 Plan 01 (Task 3)
**Status:** ✅ RESOLVED (workaround applied)
**Severity:** P1 - Deployment broken

**Description:**
Docker compose fails to start server container with error: "Bind for 0.0.0.0:3001 failed: port is already allocated"

**Symptoms:**
- `docker-compose up -d` fails on rsm-server container
- `netstat -tlnp | grep 3001` shows orphaned docker-proxy processes
- `docker-compose down` doesn't clean up port bindings

**Root Cause:**
Docker daemon crash or improper shutdown left docker-proxy processes (PIDs 40556, 40561) holding port 3001. These processes survive `docker-compose down` and even `systemctl restart docker`.

**Resolution:**
Changed production port from 3001 → 3002:
1. Updated `docker-compose.production.yml` line 137: `127.0.0.1:3002:3000`
2. Updated Nginx config: `sed -i 's/3001/3002/g' /etc/nginx/sites-available/recording-studio-manager`
3. Killed orphaned processes: `kill 40556 40561` (one-time cleanup)
4. Reloaded Nginx: `systemctl reload nginx`

**Alternative (not chosen):**
Could have debugged root cause of orphaned docker-proxy processes, but changing port was faster and equally effective.

**Prevention:**
- Use unique ports for each service (avoid reusing ports from legacy deployments)
- Add port conflict checks to deployment script
- Document known port allocations in deployment guide

**Related Commits:**
- `7eef7cd` - fix(production): change server port from 3001 to 3002

**Time Spent:** ~60 minutes debugging + multiple deployment attempts

---

### ISSUE-004: VITE_API_URL Not Configured in Production Build
**Discovered:** 2025-12-26 during Phase 3.1 Plan 01 (Task 4 - Testing)
**Status:** ✅ RESOLVED
**Severity:** P1 - Frontend broken

**Description:**
Frontend JavaScript bundle uses hardcoded `localhost:3001` for API calls instead of production backend. Browser shows 0 API requests in Playwright tests.

**Symptoms:**
- Playwright test logs: "Total API requests: 0"
- Browser DevTools shows no network activity to `/api/*`
- Registration/login forms submit but nothing happens

**Root Cause:**
Vite environment variables (VITE_*) are replaced at **build time**, not runtime. Docker image was built without VITE_API_URL set, so Vite used default from vite.config.ts.

**Resolution:**
1. Added to `packages/client/Dockerfile`:
   ```dockerfile
   ARG VITE_API_URL=/api
   ENV VITE_API_URL=${VITE_API_URL}
   ```
2. Set in `docker-compose.yml`:
   ```yaml
   environment:
     VITE_API_URL: /api
   ```
3. Rebuilt client with `--no-cache` flag to ensure ARG is applied

**Verification:**
- `docker exec rsm-client cat /usr/share/nginx/html/assets/*.js | grep -o "VITE_API_URL"`
- Expected: No references to localhost:3001

**Learnings:**
- VITE_* variables must be set at Docker build time (ARG/ENV before RUN build)
- Cannot change Vite env vars at container startup
- Always rebuild without cache when changing build ARGs

**Related Commits:**
- `4f42aef` - fix: Configure VITE_API_URL for production browser access

**Time Spent:** ~30 minutes debugging + full client rebuild (~1 minute)

---

### ISSUE-005: Local Client Container Port 80 Conflict
**Discovered:** 2025-12-26 during Phase 3.1 Plan 01 (Local testing)
**Status:** ✅ RESOLVED
**Severity:** P2 - Local dev broken

**Description:**
Local Docker client container fails to start: "failed to bind host port 0.0.0.0:80/tcp: address already in use"

**Symptoms:**
- `docker-compose up -d client` fails
- `netstat -tlnp | grep :80` shows host Nginx using port 80

**Root Cause:**
Host machine has Nginx running on port 80 for production proxying. Local dev `docker-compose.yml` tried to bind client container to same port.

**Resolution:**
Changed `docker-compose.yml` line 86:
```yaml
ports:
  - "8080:80"  # Map container port 80 to host port 8080
```

**Verification:**
- Local site accessible at http://localhost:8080
- Production site still works at https://recording-studio-manager.com (port 80)

**Learnings:**
- Development and production configs should use different host ports
- Document port mappings in README.md
- Consider using .env files for port configuration

**Related Commits:**
- `e1f731c` - fix: Map client container to port 8080 instead of 80

---

## 🟢 Low - Technical Debt / Future Improvements

### ISSUE-006: Debug Logging Left in Production Code
**Created:** 2025-12-26 during Phase 3.1 Plan 01 (Task 2)
**Status:** TODO
**Severity:** P3 - Code quality

**Description:**
Temporary debug logging added to `packages/server/src/_core/context.ts` for diagnosing session issues. This logs session IDs, user data, and cookie headers on every request in production.

**Code Location:**
```typescript
// Debug: Log session state (REMOVE after fix verified)
if (process.env.NODE_ENV === 'production') {
  console.log('[Auth Debug] Session ID:', opts.req.sessionID);
  console.log('[Auth Debug] Session data:', { userId: session.userId, organizationId: session.organizationId });
  console.log('[Auth Debug] Cookie header:', opts.req.headers.cookie);
}
```

**Impact:**
- Logs expose session IDs and user data (potential security concern)
- Increased log volume in production
- Not critical but should be removed after authentication verified working

**Resolution:**
Remove debug logging block after Phase 3.1 verification complete (Task 4).

**Time Estimate:** 2 minutes

---

### ISSUE-007: Deployment Script Missing Migration Step
**Created:** 2025-12-26 during Phase 3.1 Plan 01 analysis
**Status:** TODO
**Severity:** P3 - Process improvement

**Description:**
Current `scripts/deploy-auth-fix.sh` rebuilds and restarts server but doesn't run database migrations. This caused ISSUE-001 (database not initialized).

**Proposed Enhancement:**
Add migration step to deployment script:
```bash
echo "6️⃣ Running database migrations..."
docker exec rsm-server sh -c 'cd /app && npx drizzle-kit migrate'
```

**Benefits:**
- Prevents database initialization issues on future deployments
- Makes deployment process more robust and repeatable
- Reduces manual intervention required

**Time Estimate:** 15 minutes to add + test

---

### ISSUE-008: No Automated Rollback Strategy
**Created:** 2025-12-26 during Phase 3.1 Plan 01 infrastructure debugging
**Status:** TODO
**Severity:** P3 - Production operations

**Description:**
Current deployment process doesn't include rollback capability. If deployment fails (as happened with DNS/port issues), no quick way to restore previous working version.

**Risks:**
- Extended downtime during failed deployments
- Manual intervention required to restore service
- No version tracking of deployed code

**Proposed Solution:**
1. Tag Docker images with git commit SHA
2. Keep previous image available
3. Add rollback command to deployment script:
   ```bash
   # Rollback to previous version
   docker tag rsm-server:current rsm-server:rollback
   docker-compose -f docker-compose.production.yml up -d
   ```

**Time Estimate:** 1-2 hours to implement + document

---

### ISSUE-009: VPS Resource Monitoring Not Configured
**Created:** 2025-12-26 during Phase 3.1 Plan 01 infrastructure work
**Status:** TODO
**Severity:** P3 - Operations visibility

**Description:**
No monitoring of VPS resource usage (CPU, RAM, disk, network). During debugging, couldn't quickly see if issues were resource-related.

**Missing Metrics:**
- CPU usage per container
- Memory usage per container
- Disk space remaining
- Network bandwidth
- Container restart count

**Proposed Solution:**
Add basic resource monitoring to deployment:
- Docker stats collection
- Disk space alerts (when <10% free)
- Memory pressure detection

**Related to:**
- Phase 1 Plan 2 (monitoring setup) - focused on application health, not VPS resources

**Time Estimate:** 2-3 hours for basic monitoring setup

---

---

## 🟡 Medium - Enterprise Features Missing (From Claude Version)

### ISSUE-010: GSD Roadmap Misalignment with Reality
**Discovered:** 2025-12-26 during deep analysis of 3 versions
**Status:** DOCUMENTED
**Severity:** P2 - Planning accuracy

**Description:**
Comprehensive comparison of Claude, Manus, and Hybrid versions revealed major discrepancies between GSD planning and actual implementation:

**Pricing Mismatch:**
- GSD Roadmap: €29/€99/€299
- Stripe Reality (28 nov): €0/€19/€59 + packs IA (2€/5€/7€)
- Impact: -50% to -80% price difference, undocumented Free tier

**Features Over-delivered:**
- 93+ features implemented but not in GSD
- AI Chatbot: 37 actions (vs "assistant" vague)
- Client Portal: 10 features (vs auth + booking)
- Audio System: 4 pro components (vs upload simple)
- Testing: 92.63% coverage (not mentioned)

**Enterprise Features Missing:**
- 15 features from Claude version not ported to Hybrid
- ~200KB Python code (SSO, 2FA, i18n, monitoring, etc.)
- Estimated: 6-9 months effort to port

**Resolution:**
Created `.planning/DEEP_ANALYSIS_3_VERSIONS.md` with full inventory. Requires:
1. Update PROJECT.md with discovered features
2. Update ROADMAP.md with realistic Phase v2.0 (Enterprise)
3. Document pricing strategy decision
4. Plan enterprise features roadmap

**Related Files:**
- `.planning/DEEP_ANALYSIS_3_VERSIONS.md`
- `.planning/FEATURES_INVENTORY.md`

**Time Estimate:** Documentation 2-3h, Enterprise roadmap planning 1-2 days

---

### ISSUE-011: 15 Enterprise Features Not Ported from Claude
**Discovered:** 2025-12-26 during version comparison
**Status:** TODO (v2.0 roadmap)
**Severity:** P2 - Feature completeness

**Description:**
Version Claude (Python) has 15 enterprise features implemented and in production that are completely absent from Hybrid version:

**Priority 1 (Security & Compliance):**
1. SSO/SAML (17KB) - Okta, Auth0, Azure AD
2. 2FA TOTP (6KB) - Two-factor with backup codes
3. Audit logs SOC2 (17KB) - Compliance-ready logging

**Priority 2 (Localization & Customization):**
4. i18n (8KB) - 6 languages (EN, FR, ES, DE, IT, PT)
5. Multi-devises (16KB) - 6 currencies with exchange
6. White-label (30KB) - Branding + theme customization

**Priority 3 (Integrations):**
7. Google Calendar (20KB) - Bidirectional sync
8. Twilio SMS (19KB) - Notifications
9. DocuSign (12KB) - E-signature

**Priority 4 (Infrastructure):**
10. Multi-région (16KB) - AWS deployment
11. DB Replication (17KB) - PostgreSQL streaming
12. Backup manager (15KB) - Automated snapshots
13. Advanced rate limit (17KB) - Redis-based
14. Prometheus/Grafana (13KB) - Monitoring
15. Compliance manager (7KB) - GDPR/CCPA

**Impact:**
- Hybrid cannot serve enterprise customers without these
- Competitive disadvantage vs Claude version
- Estimated effort: 25-35 weeks (6-9 months, 1 dev)

**Proposed Roadmap:**
See `.planning/DEEP_ANALYSIS_3_VERSIONS.md` Section "Roadmap de Convergence"

**Time Estimate:** Full implementation 6-9 months

---

### ISSUE-012: Undocumented Technology Decisions
**Discovered:** 2025-12-26 during code analysis
**Status:** TODO - Documentation needed
**Severity:** P3 - Knowledge management

**Description:**
Several major technology decisions made during Hybrid development are not documented in GSD:

**Decisions Found:**
1. **Cloudinary vs S3** - Audio storage choice (not documented why)
2. **Magic Link auth** - Passwordless login added (not planned)
3. **Device fingerprinting** - Security feature (not mentioned)
4. **Custom HTML5 player** - 227 lines (vs assuming library)
5. **Pricing strategy** - €19/€59 vs €29/€99 (why -66%?)
6. **Free tier addition** - Not in roadmap, why added?
7. **AI credit packs** - Separate pricing (business model change)

**Impact:**
- Future developers won't understand rationale
- Risk of reversing good decisions without context
- Difficult to onboard new team members

**Resolution:**
Document all major decisions in:
- PROJECT.md (technical choices)
- ROADMAP.md (feature choices)
- New file: `docs/DECISIONS_LOG.md`

**Time Estimate:** 3-4 hours to document thoroughly

---

## Issue Summary

**By Severity:**
- P0 Critical: 1 (ISSUE-001 - Database not initialized) 🔴 BLOCKING
- P1 High: 4 (ISSUE-002 through ISSUE-005) ✅ All resolved
- P2 Medium: 3 (ISSUE-010, ISSUE-011, ISSUE-012) - Strategic gaps
- P3 Low: 5 (ISSUE-006 through ISSUE-009) - Technical debt / improvements

**By Category:**
- **Infrastructure:** 5 issues (1 blocking, 4 resolved)
- **Documentation:** 2 issues (GSD alignment, tech decisions)
- **Features:** 1 issue (15 enterprise features missing)
- **Process:** 3 issues (deployment, rollback, monitoring)

**By Status:**
- Open: 8 (1 critical, 3 medium priority, 4 low priority)
- Resolved: 4 (all infrastructure issues)

**Next Actions:**
1. **IMMEDIATE:** Resolve ISSUE-001 (database initialization) to unblock Phase 3.1
2. **This Week:** Document discovered features and decisions (ISSUE-010, ISSUE-012)
3. **This Month:** Create v2.0 Enterprise roadmap (ISSUE-011)
4. **Short-term:** Clean up debug logging (ISSUE-006)
5. **Medium-term:** Improve deployment (ISSUE-007, ISSUE-008)
6. **Long-term:** Add VPS monitoring (ISSUE-009), implement enterprise features

---

*Last updated: 2025-12-26*
*Phase: 3.1-fix-production-authentication-401-errors*
*Analysis: Deep comparison of 3 versions completed*
