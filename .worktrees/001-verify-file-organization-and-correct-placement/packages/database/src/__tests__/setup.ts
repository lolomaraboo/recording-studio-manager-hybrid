/**
 * Test Setup for Database Tests
 *
 * This file runs before all tests and sets up the test environment:
 * - Loads environment variables
 * - Ensures DATABASE_URL is available
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (../../.env from this file)
const envPath = resolve(__dirname, '../../.env');
config({ path: envPath });

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set in .env for tests');
}

console.log('✅ Test environment loaded');
