import { test } from '@playwright/test';

/**
 * Debug test to identify the 404 resource error on login page
 */

test('Identify 404 resource on login page', async ({ page }) => {
  const failedRequests: Array<{ url: string; status: number }> = [];

  // Listen to all requests
  page.on('response', async (response) => {
    if (response.status() === 404) {
      failedRequests.push({
        url: response.url(),
        status: response.status(),
      });
    }
  });

  await page.goto('https://recording-studio-manager.com/login');
  await page.waitForLoadState('networkidle');

  console.log('\n🔍 404 Errors Found:');
  if (failedRequests.length > 0) {
    failedRequests.forEach((req) => {
      console.log(`  ❌ ${req.status} - ${req.url}`);
    });
  } else {
    console.log('  ✅ No 404 errors found!');
  }

  // Take screenshot for reference
  await page.screenshot({ path: 'screenshots/login-404-debug.png', fullPage: true });
});
