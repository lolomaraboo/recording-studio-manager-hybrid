import { describe, it, expect } from 'vitest';
import { appRouter } from '../routers/index';
import type { TrpcContext } from '../_core/context';

/**
 * Create mock context for testing
 */
function createMockContext(overrides?: Partial<TrpcContext>): TrpcContext {
  return {
    req: {} as any,
    res: {} as any,
    user: null,
    organizationId: null,
    tenantDb: null,
    getTenantDb: async () => {
      throw new Error('No tenant DB in test context');
    },
    ...overrides,
  };
}

describe('tRPC Routers', () => {
  describe('Auth Router', () => {
    it('should return null for unauthenticated user in auth.me', async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toBeNull();
    });

    it('should return user info for authenticated user in auth.me', async () => {
      const ctx = createMockContext({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        },
        organizationId: 1,
      });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toMatchObject({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        organizationId: 1,
      });
    });

    it('should accept valid login credentials', async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
    });
  });

  describe('Protected Procedures', () => {
    it('should throw UNAUTHORIZED for protected procedure without user', async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.sessions.list()).rejects.toThrow('You must be logged in');
    });

    it('should throw error when no tenant DB available', async () => {
      const ctx = createMockContext({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        },
        organizationId: null, // No organization
      });
      const caller = appRouter.createCaller(ctx);

      // Mock getTenantDb throws this error
      await expect(caller.sessions.list()).rejects.toThrow(
        'No tenant DB in test context'
      );
    });
  });

  describe('Admin Procedures', () => {
    it('should throw UNAUTHORIZED for admin procedure without user', async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.organizations.list()).rejects.toThrow('You must be logged in');
    });

    it('should throw FORBIDDEN for admin procedure with non-admin user', async () => {
      const ctx = createMockContext({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user', // Not admin
        },
      });
      const caller = appRouter.createCaller(ctx);

      await expect(caller.organizations.list()).rejects.toThrow('You must be an admin');
    });
  });

  describe('Type Safety', () => {
    it('should have correct router structure', () => {
      // Verify we can call all expected routers
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      expect(caller.auth).toBeDefined();
      expect(caller.organizations).toBeDefined();
      expect(caller.sessions).toBeDefined();
      expect(caller.clients).toBeDefined();
      expect(caller.invoices).toBeDefined();
    });
  });
});
