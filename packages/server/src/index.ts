import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers/index';
import { createContext } from './_core/context';

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

  // Middleware
  app.use(
    cors({
      origin: 'http://localhost:5175',
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(
    session({
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

  // tRPC middleware
  app.use(
    '/api/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

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
