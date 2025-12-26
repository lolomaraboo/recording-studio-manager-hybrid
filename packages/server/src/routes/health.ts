import { Router } from 'express';
import { getMasterDb } from '@rsm/database/connection';
import { sql } from 'drizzle-orm';
import Redis from 'ioredis';

/**
 * Health Check Routes
 *
 * Public endpoints (no authentication required) for monitoring system status.
 * Used by UptimeRobot and internal monitoring.
 */

const router = Router();

/**
 * GET /api/health - Basic health check
 * Returns: { status: "ok", timestamp, uptime }
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
});

/**
 * GET /api/health/db - PostgreSQL database health
 * Checks: Master DB connection
 */
router.get('/health/db', async (_req, res) => {
  try {
    const masterDb = await getMasterDb();

    // Query master DB to verify connection
    const result = await masterDb.execute(sql`SELECT 1 as health_check`);

    if (result && result.rows && result.rows.length > 0) {
      res.status(200).json({
        status: 'ok',
        service: 'postgresql',
        timestamp: Date.now(),
      });
    } else {
      throw new Error('Unexpected query result');
    }
  } catch (error: any) {
    console.error('Database health check failed:', error);
    res.status(503).json({
      status: 'error',
      service: 'postgresql',
      error: error.message,
      timestamp: Date.now(),
    });
  }
});

/**
 * GET /api/health/redis - Redis health check
 * Checks: Redis connection with ping
 */
router.get('/health/redis', async (_req, res) => {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  try {
    const pong = await redis.ping();

    if (pong === 'PONG') {
      res.status(200).json({
        status: 'ok',
        service: 'redis',
        timestamp: Date.now(),
      });
    } else {
      throw new Error('Redis ping failed');
    }
  } catch (error: any) {
    console.error('Redis health check failed:', error);
    res.status(503).json({
      status: 'error',
      service: 'redis',
      error: error.message,
      timestamp: Date.now(),
    });
  } finally {
    await redis.quit();
  }
});

/**
 * GET /api/health/full - Comprehensive health check
 * Checks: All services (PostgreSQL, Redis)
 * Returns: 200 if all healthy, 503 if any unhealthy
 */
router.get('/health/full', async (_req, res) => {
  const checks = {
    server: { status: 'ok', uptime: process.uptime() },
    database: { status: 'unknown' as 'ok' | 'error', error: null as string | null },
    redis: { status: 'unknown' as 'ok' | 'error', error: null as string | null },
  };

  // Check PostgreSQL
  try {
    const masterDb = await getMasterDb();
    const result = await masterDb.execute(sql`SELECT 1 as health_check`);

    if (result && result.rows && result.rows.length > 0) {
      checks.database.status = 'ok';
    } else {
      checks.database.status = 'error';
      checks.database.error = 'Unexpected query result';
    }
  } catch (error: any) {
    checks.database.status = 'error';
    checks.database.error = error.message;
  }

  // Check Redis
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  try {
    const pong = await redis.ping();

    if (pong === 'PONG') {
      checks.redis.status = 'ok';
    } else {
      checks.redis.status = 'error';
      checks.redis.error = 'Redis ping failed';
    }
  } catch (error: any) {
    checks.redis.status = 'error';
    checks.redis.error = error.message;
  } finally {
    await redis.quit();
  }

  // Determine overall status
  const allHealthy = checks.database.status === 'ok' && checks.redis.status === 'ok';
  const statusCode = allHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: allHealthy ? 'ok' : 'degraded',
    timestamp: Date.now(),
    checks,
  });
});

export default router;
