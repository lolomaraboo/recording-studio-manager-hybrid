import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import Redis from 'ioredis';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers/index';
import { createContext } from './_core/context';
import { handleStripeWebhook } from './webhooks/stripe-webhook';
import uploadRouter from './routes/upload';

/**
 * Recording Studio Manager - tRPC Server
 *
 * Stack:
 * - Express: HTTP server
 * - tRPC: Type-safe API with end-to-end type safety
 * - PostgreSQL: Database-per-Tenant architecture
 * - Drizzle ORM: TypeScript-first ORM
 */

const PORT = process.env.PORT || 3001;

async function main() {
  const app = express();

  // Initialize Redis client for session storage
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  redis.on('connect', () => {
    console.log('✅ Redis connected for session storage');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
  });

  // Middleware
  app.use(
    cors({
      origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://192.168.8.50:5174',
        'http://192.168.8.50:5173',
      ],
      credentials: true,
    })
  );

  // Stripe webhook needs raw body for signature verification
  // MUST be before express.json() middleware
  app.post(
    '/api/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    handleStripeWebhook
  );

  app.use(express.json());
  app.use(
    session({
      store: new RedisStore({
        client: redis,
        prefix: 'rsm:session:',
      }),
      secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
    })
  );

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'recording-studio-manager-api',
    });
  });

  // Upload routes (before tRPC to handle multipart/form-data)
  app.use('/api/upload', uploadRouter);

  // tRPC middleware
  app.use(
    '/api/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // SSE Streaming endpoint for AI chat (Phase 2.3)
  app.post('/api/ai/stream', async (req, res) => {
    try {
      const { message, sessionId } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // TODO Phase 2.3: Implement full SSE streaming with auth
      // For now, send a placeholder response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      res.write(`data: ${JSON.stringify({ type: 'start', timestamp: new Date().toISOString() })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'chunk', data: { text: 'Streaming endpoint ready (Phase 2.3)' }, timestamp: new Date().toISOString() })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'complete', timestamp: new Date().toISOString() })}\n\n`);

      res.end();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 tRPC endpoint: http://localhost:${PORT}/api/trpc`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Export types for client usage
export type { AppRouter } from './routers/index';
