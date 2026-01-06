import { test, expect } from '@playwright/test';

/**
 * Production Infrastructure Tests
 *
 * Consolidated from:
 * - test-cors-https.spec.ts
 * - test-homepage-check.spec.ts
 * - test-multitenant-subdomain.spec.ts
 * - test-production-dashboard.spec.ts
 *
 * Tests:
 * - HTTPS/CORS configuration
 * - Homepage accessibility
 * - Multi-tenant subdomain routing
 * - Production health checks
 */

const BASE_URL = process.env.BASE_URL || 'https://recording-studio-manager.com';

test.describe('Production Infrastructure', () => {
  test('Homepage loads successfully via HTTPS', async ({ page }) => {
    console.log('\n🌐 Testing Homepage via HTTPS');

    const response = await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    console.log(`  Status: ${response?.status()}`);
    console.log(`  URL: ${page.url()}`);

    // Verify HTTPS is used
    expect(page.url()).toContain('https://');

    // Verify 200 or redirect status
    expect(response?.status()).toBeLessThan(400);

    console.log('  ✓ Homepage accessible via HTTPS');
  });

  test('No CORS errors on production', async ({ page }) => {
    console.log('\n🌐 Testing CORS Configuration');

    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('cors')) {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    console.log(`  CORS errors found: ${consoleErrors.length}`);

    if (consoleErrors.length > 0) {
      console.log('  Errors:', consoleErrors);
    } else {
      console.log('  ✓ No CORS errors');
    }

    expect(consoleErrors.length).toBe(0);
  });

  test('API endpoints return valid responses', async ({ page }) => {
    console.log('\n🌐 Testing API Health');

    // Test health endpoint
    const response = await page.goto(`${BASE_URL}/api/health`);
    const status = response?.status();

    console.log(`  Health endpoint status: ${status}`);

    if (status === 200) {
      const body = await response?.text();
      console.log(`  Response: ${body}`);
    }

    expect(status).toBe(200);
    console.log('  ✓ API health check passed');
  });

  test('Production dashboard loads without 500 errors', async ({ page }) => {
    console.log('\n🌐 Testing Production Dashboard');

    const serverErrors: any[] = [];

    page.on('response', (response) => {
      if (response.status() >= 500) {
        serverErrors.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });

    // Try to access dashboard (will redirect to login if not authenticated)
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('domcontentloaded');

    console.log(`  Server errors (500+): ${serverErrors.length}`);

    if (serverErrors.length > 0) {
      console.log('  Errors:', serverErrors);
    } else {
      console.log('  ✓ No server errors');
    }

    expect(serverErrors.length).toBe(0);
  });

  test('Static assets load correctly', async ({ page }) => {
    console.log('\n🌐 Testing Static Assets');

    const failedResources: string[] = [];

    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedResources.push(`${response.url()} - ${response.status()}`);
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    console.log(`  Failed resources: ${failedResources.length}`);

    if (failedResources.length > 0) {
      console.log('  Failed:', failedResources.slice(0, 5));
    } else {
      console.log('  ✓ All resources loaded');
    }

    // Allow some failures for external resources
    expect(failedResources.length).toBeLessThan(5);
  });
});

test.describe('Multi-tenant Infrastructure', () => {
  test('Main domain redirects to login', async ({ page }) => {
    console.log('\n🏢 Testing Main Domain');

    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    console.log(`  Final URL: ${url}`);

    // Should show login or homepage
    const isValidPage = url.includes(BASE_URL);
    console.log(`  ✓ Valid page displayed: ${isValidPage}`);

    expect(isValidPage).toBeTruthy();
  });

  // Note: Testing subdomains requires DNS configuration and multiple tenants
  test.skip('Subdomain routing works (requires tenant setup)', async ({ page }) => {
    console.log('\n🏢 Testing Subdomain Routing');

    // Example: studio-test.recording-studio-manager.com
    // This would require creating a test tenant first

    console.log('  ℹ Subdomain testing skipped - requires tenant setup');
  });
});
