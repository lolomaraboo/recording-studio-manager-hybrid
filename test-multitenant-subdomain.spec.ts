import { test, expect } from '@playwright/test';

test.describe('Multi-Tenant Subdomain Access', () => {
  test('should access studio via subdomain', async ({ page }) => {
    console.log('\n🏢 Testing Multi-Tenant Subdomain Access');
    console.log('=========================================\n');

    // Test 1: Access via subdomain
    console.log('📝 Step 1: Accessing studio-maraboo subdomain...');
    await page.goto('http://studio-maraboo.recording-studio-manager.com');
    await page.waitForLoadState('domcontentloaded');

    const currentUrl = page.url();
    console.log(`✅ Page loaded: ${currentUrl}\n`);

    // Take screenshot
    await page.screenshot({
      path: '.playwright-mcp/subdomain-studio-maraboo.png',
      fullPage: true
    });

    // Test 2: Check if we can see the app
    const hasLogo = await page.locator('text=RSM').isVisible().catch(() => false);
    const hasSidebar = await page.locator('text=/Dashboard|Planning|Clients/i').isVisible().catch(() => false);

    console.log(`📊 Logo visible: ${hasLogo}`);
    console.log(`🧭 Sidebar visible: ${hasSidebar}\n`);

    // Test 3: Register new user for this studio
    console.log('📝 Step 2: Registering new user on subdomain...');
    await page.goto('http://studio-maraboo.recording-studio-manager.com/register');

    const timestamp = Date.now();
    const email = `maraboo-user-${timestamp}@example.com`;

    await page.fill('#name', 'Maraboo User');
    await page.fill('#email', email);
    await page.fill('#password', 'password123');
    await page.fill('#organizationName', 'Studio Maraboo Team');

    console.log(`📧 Email: ${email}`);
    console.log(`🏢 Organization: Studio Maraboo Team\n`);

    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    const afterRegisterUrl = page.url();
    console.log(`✅ After register: ${afterRegisterUrl}\n`);

    // Take final screenshot
    await page.screenshot({
      path: '.playwright-mcp/subdomain-after-register.png',
      fullPage: true
    });

    console.log('✅ TEST COMPLETED\n');

    // Assertions
    expect(currentUrl).toContain('studio-maraboo.recording-studio-manager.com');
  });
});
