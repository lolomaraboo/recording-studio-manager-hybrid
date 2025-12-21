# Redis Setup for AI Chatbot

**Status:** ⏸️ To be installed later (Week 1 Day 6-7)

## Why Redis?

Redis is used for:
1. **AI Credits caching** - Fast access to org credit balances
2. **Rate limiting** - Prevent API abuse
3. **Session storage** - AI conversation sessions

## Installation (macOS)

```bash
# Install Redis via Homebrew
brew install redis

# Start Redis service
brew services start redis

# Verify installation
redis-cli ping
# Expected: PONG
```

## Configuration

Redis URL is configured in `packages/server/.env`:
```
REDIS_URL=redis://localhost:6379
```

## Usage in Code

```typescript
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

// Example: Cache AI credits
await redis.set(`ai_credits:org_${orgId}`, credits, "EX", 3600); // 1 hour TTL
```

## Testing Redis Connection

```typescript
// packages/server/src/lib/redis.ts
import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

redis.on("connect", () => {
  console.log("[Redis] Connected successfully");
});

redis.on("error", (err) => {
  console.error("[Redis] Connection error:", err);
});
```

## AI Credits System

Credits are tracked in PostgreSQL (`ai_credits` table in Master DB) but cached in Redis for performance:

```typescript
// Check cache first
let credits = await redis.get(`ai_credits:org_${orgId}`);

// Cache miss → Fetch from DB
if (!credits) {
  credits = await db.select().from(aiCredits).where(eq(aiCredits.organizationId, orgId));
  await redis.set(`ai_credits:org_${orgId}`, credits, "EX", 3600);
}
```

## Credits Limits by Plan

Configured in `.env`:
- `AI_CREDITS_TRIAL=100` (trial plan)
- `AI_CREDITS_PRO=1000` (pro plan)
- `AI_CREDITS_ENTERPRISE=10000` (enterprise plan)

---

**Next Steps:**
1. Install Redis (Day 6-7)
2. Create `packages/server/src/lib/redis.ts`
3. Create `packages/server/src/lib/aiCreditsManager.ts`
4. Integrate with AI router

**Created:** 2025-12-20
**Phase:** 2.1 - Infrastructure
