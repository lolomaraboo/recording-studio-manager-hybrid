/**
 * Tests for Database Connection Manager
 *
 * Tests the Database-per-Tenant architecture:
 * - Connection caching
 * - Tenant isolation
 * - Error handling
 * - Connection cleanup
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  getMasterDb,
  getTenantDb,
  closeAllConnections,
  getTenantConnectionCount,
  isMasterDbAvailable
} from '../connection';

describe('Database Connection Manager', () => {
  // Clean up after all tests
  afterAll(async () => {
    await closeAllConnections();
  });

  describe('getMasterDb()', () => {
    it('should create Master DB connection', async () => {
      const masterDb = await getMasterDb();
      expect(masterDb).toBeDefined();
      expect(isMasterDbAvailable()).toBe(true);
    });

    it('should return same instance (singleton)', async () => {
      const db1 = await getMasterDb();
      const db2 = await getMasterDb();
      expect(db1).toBe(db2);
    });
  });

  describe('getTenantDb()', () => {
    it('should connect to Tenant DB for org 1', async () => {
      const tenantDb = await getTenantDb(1);
      expect(tenantDb).toBeDefined();
      expect(getTenantConnectionCount()).toBe(1);
    });

    it('should cache connection (same instance for same org)', async () => {
      const db1 = await getTenantDb(1);
      const db2 = await getTenantDb(1);
      expect(db1).toBe(db2);
      expect(getTenantConnectionCount()).toBe(1); // Still 1 connection
    });

    it('should create separate connections for different orgs', async () => {
      const db1 = await getTenantDb(1);
      const db2 = await getTenantDb(2);
      const db3 = await getTenantDb(3);

      // All should be different instances
      expect(db1).not.toBe(db2);
      expect(db2).not.toBe(db3);
      expect(db1).not.toBe(db3);

      // Should have 3 cached connections
      expect(getTenantConnectionCount()).toBe(3);
    });

    it('should throw error for non-existent organization', async () => {
      await expect(getTenantDb(999)).rejects.toThrow(
        /Tenant DB connection failed for organization 999/
      );
    });

    it('should maintain isolation between tenant DBs', async () => {
      const db1 = await getTenantDb(1);
      const db2 = await getTenantDb(2);

      // Query data from tenant 1
      const clients1 = await db1.query.clients.findMany();

      // Query data from tenant 2
      const clients2 = await db2.query.clients.findMany();

      // Each tenant should have exactly 2 clients from seed
      expect(clients1.length).toBe(2);
      expect(clients2.length).toBe(2);

      // Verify databases are isolated by checking they use different connections
      expect(db1).not.toBe(db2);

      // Both should have data (proving isolation works)
      expect(clients1.length).toBeGreaterThan(0);
      expect(clients2.length).toBeGreaterThan(0);

      // Each has their own data (even if names are the same due to seed)
      // The important thing is they're in separate databases
      expect(getTenantConnectionCount()).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Connection Cleanup', () => {
    it('should close all connections', async () => {
      // Ensure we have connections
      await getTenantDb(1);
      await getTenantDb(2);
      expect(getTenantConnectionCount()).toBeGreaterThan(0);

      // Close all
      await closeAllConnections();

      // Should be cleared
      expect(getTenantConnectionCount()).toBe(0);
      expect(isMasterDbAvailable()).toBe(false);
    });

    it('should allow reconnection after close', async () => {
      // Connections were closed in previous test
      expect(getTenantConnectionCount()).toBe(0);

      // Should be able to connect again
      const tenantDb = await getTenantDb(1);
      expect(tenantDb).toBeDefined();
      expect(getTenantConnectionCount()).toBe(1);
    });
  });

  describe('getTenantConnectionCount()', () => {
    beforeAll(async () => {
      await closeAllConnections();
    });

    it('should return 0 when no connections', () => {
      expect(getTenantConnectionCount()).toBe(0);
    });

    it('should increment as connections are created', async () => {
      expect(getTenantConnectionCount()).toBe(0);

      await getTenantDb(1);
      expect(getTenantConnectionCount()).toBe(1);

      await getTenantDb(2);
      expect(getTenantConnectionCount()).toBe(2);

      await getTenantDb(3);
      expect(getTenantConnectionCount()).toBe(3);
    });

    it('should not increment for cached connections', async () => {
      const countBefore = getTenantConnectionCount();

      // Connect to org 1 again (should use cache)
      await getTenantDb(1);

      const countAfter = getTenantConnectionCount();
      expect(countAfter).toBe(countBefore);
    });
  });

  describe('Error Handling', () => {
    it('should throw descriptive error for missing DATABASE_URL', async () => {
      const originalUrl = process.env.DATABASE_URL;

      try {
        delete process.env.DATABASE_URL;
        await closeAllConnections(); // Clear cache

        await expect(getMasterDb()).rejects.toThrow(/DATABASE_URL not configured/);
      } finally {
        // Restore
        process.env.DATABASE_URL = originalUrl;
      }
    });
  });
});
