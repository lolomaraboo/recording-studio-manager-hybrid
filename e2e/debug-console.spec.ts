import { test } from '@playwright/test';

test('Debug console errors on /clients/new', async ({ page }) => {
  const consoleMessages: string[] = [];
  const consoleErrors: string[] = [];
  const networkRequests: string[] = [];

  // Capture console messages
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(text);
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleErrors.push(text);
    }
  });

  // Capture network requests
  page.on('request', request => {
    networkRequests.push(`${request.method()} ${request.url()}`);
  });

  // Navigate to login
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  // Login
  await page.fill('input[type="email"]', 'test@studio.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Wait for redirect
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

  // Navigate to /clients/new
  console.log('\n=== Navigating to /clients/new ===');
  await page.goto('/clients/new');

  // Wait a bit to collect console messages
  await page.waitForTimeout(5000);

  // Print console errors
  console.log('\n=== Console Errors/Warnings ===');
  if (consoleErrors.length === 0) {
    console.log('No console errors or warnings');
  } else {
    consoleErrors.forEach(err => console.log(err));
  }

  // Print last 10 network requests
  console.log('\n=== Last 10 Network Requests ===');
  networkRequests.slice(-10).forEach(req => console.log(req));

  // Keep browser open for 30 seconds
  console.log('\n=== Waiting 30s to observe behavior ===');
  await page.waitForTimeout(30000);
});
