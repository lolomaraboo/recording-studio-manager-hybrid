/**
 * Test CORS HTTPS Fix - Phase 1 Plan 1 Verification
 *
 * Verifies that production accepts HTTPS origins without CORS errors
 */

import { test, expect } from '@playwright/test';

test.describe('CORS HTTPS Verification', () => {
  test('should access production via HTTPS without CORS errors', async ({ page }) => {
    const corsErrors: string[] = [];
    const apiErrors: string[] = [];

    // Capture console errors (CORS errors appear here)
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('CORS') || text.includes('blocked')) {
          corsErrors.push(text);
        }
      }
    });

    // Capture failed requests
    page.on('requestfailed', (request) => {
      const failure = request.failure();
      if (failure) {
        apiErrors.push(`${request.url()} - ${failure.errorText}`);
      }
    });

    console.log('🔍 Testing HTTPS access to production...');

    // Visit production HTTPS URL
    const response = await page.goto('https://app.recording-studio-manager.com', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log(`📡 Response status: ${response?.status()}`);

    // Verify page loaded
    expect(response?.status()).toBe(200);

    // Wait for any API calls to complete
    await page.waitForTimeout(2000);

    // Check for CORS errors
    if (corsErrors.length > 0) {
      console.error('❌ CORS Errors detected:');
      corsErrors.forEach(err => console.error(`  - ${err}`));
    } else {
      console.log('✅ No CORS errors detected');
    }

    // Check for API failures
    if (apiErrors.length > 0) {
      console.error('❌ API Request failures:');
      apiErrors.forEach(err => console.error(`  - ${err}`));
    } else {
      console.log('✅ No API request failures');
    }

    // Verify no CORS errors occurred
    expect(corsErrors).toHaveLength(0);

    // Take a screenshot for verification
    await page.screenshot({
      path: '.playwright-mcp/cors-https-verification.png',
      fullPage: true
    });

    console.log('📸 Screenshot saved to .playwright-mcp/cors-https-verification.png');
  });

  test('should make successful API call to /health endpoint', async ({ page }) => {
    console.log('🔍 Testing /health endpoint via HTTPS...');

    // Navigate to base domain first to establish origin
    await page.goto('https://app.recording-studio-manager.com', {
      waitUntil: 'domcontentloaded',
    });

    // Make API call to health endpoint (same domain - nginx reverse proxy)
    const healthResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/health', {
          method: 'GET',
          credentials: 'include',
        });

        return {
          status: response.status,
          ok: response.ok,
          data: await response.json(),
        };
      } catch (error: any) {
        return {
          status: 0,
          ok: false,
          error: error.message,
        };
      }
    });

    console.log('📡 Health endpoint response:', healthResponse);

    // Verify health check succeeded
    expect(healthResponse.status).toBe(200);
    expect(healthResponse.ok).toBe(true);
    expect(healthResponse.data).toHaveProperty('status', 'ok');
    expect(healthResponse.data).toHaveProperty('service', 'recording-studio-manager-api');

    console.log('✅ Health endpoint accessible via HTTPS');
  });

  test('should test tRPC endpoint accessibility', async ({ page }) => {
    console.log('🔍 Testing tRPC endpoint...');

    const corsErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error' && (msg.text().includes('CORS') || msg.text().includes('blocked'))) {
        corsErrors.push(msg.text());
      }
    });

    await page.goto('https://app.recording-studio-manager.com', {
      waitUntil: 'networkidle',
    });

    // Try to make a tRPC call (same domain - nginx reverse proxy)
    const trpcResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/trpc/auth.getSession', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        return {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
        };
      } catch (error: any) {
        return {
          status: 0,
          ok: false,
          error: error.message,
        };
      }
    });

    console.log('📡 tRPC response:', trpcResponse);

    // Verify no CORS errors
    if (corsErrors.length > 0) {
      console.error('❌ CORS errors detected:', corsErrors);
    }
    expect(corsErrors).toHaveLength(0);

    // Verify response received (tRPC endpoints should respond, even if not authenticated)
    expect(trpcResponse.status).toBeGreaterThan(0);

    console.log('✅ tRPC endpoint accessible without CORS errors');
  });
});
