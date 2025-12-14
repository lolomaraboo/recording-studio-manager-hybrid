import 'dotenv/config';
import { beforeAll, afterAll } from 'vitest';

/**
 * Global test setup
 *
 * Runs once before all tests in the suite
 */
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');

  // For unit tests with mocked context, DATABASE_URL is optional
  // For integration tests, set DATABASE_URL in .env
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not set - using mocked DB connections');
  }

  console.log('✅ Test environment ready');
});

/**
 * Global test teardown
 *
 * Runs once after all tests complete
 */
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');

  // Close any open database connections
  // TODO: Add cleanup logic

  console.log('✅ Test cleanup complete');
});
