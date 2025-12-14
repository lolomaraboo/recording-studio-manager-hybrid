import { defineConfig } from 'vitest/config';
import path from 'path';
import { config } from 'dotenv';

// Load .env from project root BEFORE running tests
const envPath = path.resolve(__dirname, '../../.env');
config({ path: envPath });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.config.ts',
        '**/scripts/**',
        '**/index.ts',           // Exclude re-export files
        '**/__tests__/setup.ts'  // Exclude test setup
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    },
    include: ['**/*.{test,spec}.{js,ts}'],
    // Remove setupFiles since we're loading env in config
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
