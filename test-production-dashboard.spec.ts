import { test, expect } from '@playwright/test';

test.describe('Production Dashboard Authentication', () => {
  test('should register and access dashboard on production', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    const studioName = `Studio ${timestamp}`;

    console.log('\n🔐 Testing Production Dashboard Authentication');
    console.log('==============================================');
    console.log(`📧 Email: ${email}`);
    console.log(`🏢 Studio: ${studioName}\n`);

    // Step 1: Navigate to register page
    console.log('📝 Step 1: Navigating to /register...');
    await page.goto('http://recording-studio-manager.com/register');
    await page.waitForLoadState('domcontentloaded');
    console.log('✅ Page loaded\n');

    // Step 2: Fill registration form
    console.log('📝 Step 2: Filling registration form...');
    await page.fill('#name', 'Test User Playwright');
    await page.fill('#email', email);
    await page.fill('#password', 'password123');
    await page.fill('#organizationName', studioName);
    console.log('✅ Form filled\n');

    // Step 3: Submit registration
    console.log('🚀 Step 3: Submitting registration...');
    await page.click('button[type="submit"]');

    // Wait for redirect and navigation
    await page.waitForTimeout(5000);
    const currentUrl = page.url();
    console.log(`✅ Redirected to: ${currentUrl}\n`);

    // Step 4: Check if dashboard loads
    console.log('📊 Step 4: Checking dashboard...');
    try {
      await page.waitForSelector('h2:has-text("Dashboard")', { timeout: 10000 });
      console.log('✅ Dashboard header found!');

      // Check for stats widget
      const hasStats = await page.locator('text=Statistiques').isVisible();
      console.log(`✅ Statistics widget visible: ${hasStats}`);

      // Take screenshot
      await page.screenshot({
        path: '.playwright-mcp/production-dashboard-success.png',
        fullPage: true
      });
      console.log('✅ Screenshot saved to .playwright-mcp/production-dashboard-success.png\n');

      // Success assertions
      expect(hasStats).toBe(true);
      console.log('✅ TEST PASSED: Dashboard is working!\n');

    } catch (error) {
      console.log('❌ Dashboard not found, checking what page we landed on...');

      // Take screenshot of error state
      await page.screenshot({
        path: '.playwright-mcp/production-dashboard-error.png',
        fullPage: true
      });

      const pageContent = await page.content();
      console.log('Current page title:', await page.title());
      console.log('Current URL:', page.url());

      // Check for error messages
      const errorMsg = await page.locator('text=/error|unauthorized|login/i').first().textContent().catch(() => 'No error found');
      console.log('Error message:', errorMsg);

      throw error;
    }
  });
});
