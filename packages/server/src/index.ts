import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import * as Sentry from '@sentry/node';
import { setupExpressErrorHandler } from '@sentry/node';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { appRouter } from './routers/index.js';
import { createContext } from './_core/context.js';
import { handleStripeWebhook } from './webhooks/stripe-webhook.js';
import uploadRouter from './routes/upload.js';
import healthRouter from './routes/health.js';
import { notificationBroadcaster } from './lib/notificationBroadcaster.js';
import { socketAuthMiddleware } from './middleware/socket-auth.js';

// Augment express-session types to include custom session data
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    organizationId?: number;
  }
}

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

  // Create HTTP server for Socket.IO integration
  const httpServer = createServer(app);

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

  // Initialize Qdrant collection for chatbot RAG
  try {
    const { initializeQdrantCollection } = await import('./lib/rag/index.js').catch(() => ({ initializeQdrantCollection: null }));
    if (initializeQdrantCollection) {
      await initializeQdrantCollection();
    } else {
      console.warn('⚠️  RAG module not available, skipping Qdrant initialization');
    }
  } catch (error) {
    console.error('⚠️  Failed to initialize Qdrant collection:', error);
    console.warn('⚠️  Server will continue without RAG functionality');
  }

  // Middleware
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        // Check environment variable allowed origins first
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

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

  app.use(express.json({ limit: '10mb' })); // Increased for vCard/Excel/CSV imports

  // Enable trust proxy for secure cookies behind Nginx reverse proxy
  app.set('trust proxy', 1);
  if (process.env.NODE_ENV === 'production') {
    console.log('✅ Express trust proxy enabled for production');
  }

  // Store session middleware for Socket.IO authentication
  const sessionMiddleware = session({
    store: new RedisStore({
      client: redis,
      prefix: 'rsm:session:',
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      // ⚠️ TEMPORARY DEV CONFIG - See ISSUE-011 in .planning/ISSUES.md
      // TODO: Before production deployment, change to:
      //   secure: process.env.NODE_ENV === 'production',
      //   domain: process.env.NODE_ENV === 'production' ? '.recording-studio-manager.com' : undefined,
      secure: false, // Allow cookies over HTTP for localhost development
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      domain: undefined, // No domain restriction for localhost
      sameSite: 'lax', // Allow cross-origin cookies for localhost dev (5174 → 3002)
    },
  });

  app.use(sessionMiddleware);

  // Initialize Socket.IO server for real-time timer updates
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? /^https:\/\/([a-z0-9-]+\.)?recording-studio-manager\.com$/
        : 'http://localhost:5174',
      credentials: true,
    },
  });

  // Store io instance for use in routes/services
  app.set('io', io);

  // Socket.IO authentication middleware
  io.use((socket, next) => socketAuthMiddleware(socket, next, sessionMiddleware));

  // Socket.IO connection handler
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] User connected: ${socket.data.userId} (org: ${socket.data.organizationId})`);

    // Join organization-specific room for scoped broadcasting
    socket.join(`org:${socket.data.organizationId}`);

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User disconnected: ${socket.data.userId}`);
    });
  });

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

  // SSE Streaming endpoint for real-time notifications
  app.get('/api/notifications/stream', async (req, res) => {
    let userId: number | undefined;
    let organizationId: number | undefined;

    // Development mode: check for test headers or query params
    const testUserId = req.headers['x-test-user-id'] as string | undefined;
    const testOrgId = req.headers['x-test-org-id'] as string | undefined;
    const queryUserId = req.query.userId as string | undefined;
    const queryOrgId = req.query.orgId as string | undefined;

    if (process.env.NODE_ENV === 'development' && (testUserId || queryUserId) && (testOrgId || queryOrgId)) {
      // Dev mode bypass with test headers or query params (EventSource doesn't support headers)
      userId = parseInt(testUserId || queryUserId!);
      organizationId = parseInt(testOrgId || queryOrgId!);
      console.log('[SSE Auth Debug] Dev mode bypass:', { userId, organizationId, source: testUserId ? 'headers' : 'query' });
    } else if (req.session && req.session.userId && req.session.organizationId) {
      // Normal flow: Get user from session
      userId = req.session.userId;
      organizationId = req.session.organizationId;
      console.log('[SSE Auth Debug] Session auth:', { userId, organizationId });
    }

    // Check authentication
    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

    // Register client with broadcaster
    const clientId = notificationBroadcaster.addClient(userId, organizationId, res);

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

    // Keep-alive ping every 30 seconds to prevent connection timeout
    const keepAliveInterval = setInterval(() => {
      try {
        res.write(`:keep-alive ${new Date().toISOString()}\n\n`);
      } catch (error) {
        clearInterval(keepAliveInterval);
        notificationBroadcaster.removeClient(clientId);
      }
    }, 30000);

    // Cleanup on client disconnect
    req.on('close', () => {
      clearInterval(keepAliveInterval);
      notificationBroadcaster.removeClient(clientId);
    });
  });

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Sentry error handler (MUST be after all routes)
  if (process.env.SENTRY_DSN_BACKEND) {
    setupExpressErrorHandler(app);
  }

  // Start server (use httpServer for Socket.IO support)
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 tRPC endpoint: http://localhost:${PORT}/api/trpc`);
    console.log(`🔌 Socket.IO ready for real-time updates`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Export types for client usage
export type { AppRouter } from './routers/index';
