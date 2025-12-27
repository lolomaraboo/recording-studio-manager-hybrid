import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import * as Sentry from '@sentry/node';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers/index.js';
import { createContext } from './_core/context.js';
import { handleStripeWebhook } from './webhooks/stripe-webhook.js';
import uploadRouter from './routes/upload.js';
import healthRouter from './routes/health.js';

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

// Initialize Sentry error tracking
if (process.env.SENTRY_DSN_BACKEND) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN_BACKEND,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.1, // 10% performance monitoring (free tier limit)
  });
  console.log('✅ Sentry error tracking initialized');
} else {
  console.warn('⚠️  SENTRY_DSN_BACKEND not set - error tracking disabled');
}

async function main() {
  const app = express();

  // Initialize Redis client for session storage
  const redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected for session storage');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
  });

  // Connect to Redis (required for redis v4+)
  await redis.connect();

  // Middleware
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        // Allow localhost for development
        const localhostPattern = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+):\d+$/;

        // Allow production HTTPS subdomains: https://*.recording-studio-manager.com
        const productionPattern = /^https:\/\/([a-z0-9-]+\.)?recording-studio-manager\.com$/;

        if (localhostPattern.test(origin) || productionPattern.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
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

  // Enable trust proxy for secure cookies behind Nginx reverse proxy
  app.set('trust proxy', 1);
  if (process.env.NODE_ENV === 'production') {
    console.log('✅ Express trust proxy enabled for production');
  }

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
        domain: process.env.NODE_ENV === 'production' ? '.recording-studio-manager.com' : undefined,
        sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
      },
    })
  );

  // Health check routes (public, no auth required)
  app.use('/api', healthRouter);

  // Upload routes (before tRPC to handle multipart/form-data)
  app.use('/api/upload', uploadRouter);

  // Debug logging for TRPC requests
  app.use('/api/trpc', (req, res, next) => {
    console.log('[TRPC Debug] Request:', {
      method: req.method,
      path: req.path,
      url: req.url,
      body: req.body,
    });
    next();
  });

  // tRPC middleware
  app.use(
    '/api/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError: ({ error, type, path }) => {
        console.error('[TRPC Error]', { type, path, error: error.message });
      },
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

  // Sentry error handler (MUST be after all routes)
  if (process.env.SENTRY_DSN_BACKEND) {
    app.use(Sentry.Handlers.errorHandler());
  }

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
