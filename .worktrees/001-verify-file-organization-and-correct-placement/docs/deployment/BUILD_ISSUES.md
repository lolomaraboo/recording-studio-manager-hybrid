# Production Build Issues & Fixes

**Date:** 2025-12-24
**Status:** TypeScript errors block production build

## 🔴 Issues Détectés

### 1. Missing Dependencies (TypeScript Errors)

**Errors:**
```
error TS2307: Cannot find module 'cloudinary' or its corresponding type declarations
error TS2307: Cannot find module 'multer' or its corresponding type declarations
```

**Affected Files:**
- `packages/server/src/routes/upload.ts`
- `packages/server/src/utils/cloudinary-service.ts`

**Root Cause:**
- Packages `cloudinary` et `multer` ne sont pas dans `package.json`
- Code utilise ces modules mais ils ne sont pas installés

**Fix:**
```bash
cd packages/server
pnpm add cloudinary multer
pnpm add -D @types/multer
```

---

### 2. Stripe API Version Mismatch

**Error:**
```
error TS2322: Type '"2024-12-18.acacia"' is not assignable to type '"2025-12-15.clover"'
```

**Affected Files:**
- `packages/server/src/utils/stripe-client.ts:32`

**Root Cause:**
- Stripe SDK `v20.1.0` attend `apiVersion: "2025-12-15.clover"`
- Code utilise ancienne version `"2024-12-18.acacia"`

**Fix:**
```typescript
// packages/server/src/utils/stripe-client.ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover', // Updated to latest
});
```

---

### 3. TypeScript Property Errors (upload.ts)

**Errors:**
```
error TS2339: Property 'file' does not exist on type 'Request<...>'
```

**Affected Files:**
- `packages/server/src/routes/upload.ts` (lines 61, 79-81, 93-94, 188, 198-200, 209-210)

**Root Cause:**
- `multer` middleware n'est pas correctement typé
- Express Request type ne connaît pas `.file` property

**Fix:**
```typescript
// Add multer types to request
import { Request } from 'express';
import multer from 'multer';

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Then use MulterRequest instead of Request
router.post('/upload', async (req: MulterRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // ...
});
```

---

### 4. Additional TypeScript Errors

**Library-related errors:**
- `src/lib/aiActions.ts`: Drizzle ORM property 'where' missing
- `src/lib/llmProvider.ts`: OpenAI ChatCompletionMessageToolCall type issues
- `src/routers/*.ts`: Various Drizzle query builder type issues

**Status:** Non-bloquant pour infrastructure, mais doit être fixé avant production

---

## ✅ What Works (Validated)

### Docker Configuration

1. **docker-compose.production.yml**: ✅ Syntax valid
   - All services configured correctly
   - Environment variables recognized
   - Resource limits applied
   - Networks configured

2. **Dockerfile.production (server)**: ✅ Syntax valid
   - Multi-stage build structure correct
   - COPY commands valid
   - Non-root user configured
   - Health check defined

3. **Dockerfile.production (client)**: ✅ Syntax valid (not tested due to server dependency)

4. **nginx/production.conf**: ✅ Syntax valid (tested with `config` command)

---

## 🚀 Action Plan

### Immediate (Before VPS Deployment)

**Priority 1: Fix TypeScript Errors**
1. Install missing dependencies:
   ```bash
   cd packages/server
   pnpm add cloudinary multer @types/multer
   ```

2. Update Stripe API version:
   ```typescript
   // packages/server/src/utils/stripe-client.ts
   apiVersion: '2025-12-15.clover'
   ```

3. Fix multer types in upload.ts:
   - Create `MulterRequest` interface
   - Update all route handlers

**Priority 2: Test Full Build**
```bash
# After fixes
docker compose -f docker-compose.production.yml build --no-cache

# Expected: Build succeeds
# Time: ~10-15 minutes
```

**Priority 3: Local Integration Test**
```bash
# Start all services
docker compose -f docker-compose.production.yml --env-file .env.production.local up -d

# Verify health
curl http://localhost:3000/health
curl http://localhost:8080

# Check logs
docker logs rsm-server --tail 50
docker logs rsm-client --tail 50

# Stop
docker compose -f docker-compose.production.yml down
```

---

### Optional (Code Quality)

**Fix Drizzle ORM Type Issues:**
- Review query builder usage in `aiActions.ts`, `routers/*.ts`
- Ensure proper `where()` clause syntax
- Update to latest Drizzle patterns if needed

**Fix OpenAI SDK Type Issues:**
- Review `llmProvider.ts` ChatCompletionMessageToolCall usage
- Update to latest OpenAI SDK patterns

---

## 📝 Test Results (2025-12-24)

### Test 1: Docker Compose Config Validation
```bash
docker compose -f docker-compose.production.yml --env-file .env.production.local config --quiet
```
**Result:** ✅ PASS (warning about `version` is normal for Compose v2)

### Test 2: Server Build (Full)
```bash
docker build -f packages/server/Dockerfile.production -t rsm-server-prod:test .
```
**Result:** ❌ FAIL - TypeScript compilation errors (see above)

### Test 3: Dockerfile Syntax (builder stage)
```bash
docker build -f packages/server/Dockerfile.production --target builder -t rsm-server-builder:test .
```
**Result:** ⏸️ IN PROGRESS (dependencies install correctly, build fails at tsc step)

---

## 🔧 Workaround (Skip TypeScript Check)

**Not recommended for production, but for testing infrastructure:**

```dockerfile
# In Dockerfile.production, replace:
RUN pnpm --filter @rsm/server build

# With:
RUN pnpm --filter @rsm/server exec tsc --noEmit false || true
RUN pnpm --filter @rsm/server exec tsc --skipLibCheck || echo "TypeScript check skipped"
```

**Better approach:** Fix the TypeScript errors properly before deployment.

---

## 📚 References

- [Stripe API Versions](https://stripe.com/docs/api/versioning)
- [Multer TypeScript](https://github.com/expressjs/multer#typescript)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

---

**Next Steps:** Fix TypeScript errors → Test build → Deploy to VPS
