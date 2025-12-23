#!/usr/bin/env node
import { chromium } from 'playwright';

/**
 * Test Client Portal Profile Page
 *
 * Steps:
 * 1. Navigate to client login
 * 2. Login with test credentials
 * 3. Navigate to Profile page
 * 4. Take screenshot
 * 5. Test edit mode
 * 6. Test password change form
 */

const BASE_URL = 'http://localhost:5174';

async function testProfilePage() {
  console.log('🚀 Starting Profile Page test...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  try {
    // Step 1: Navigate to login
    console.log('Step 1: Navigating to client login...');
    await page.goto(`${BASE_URL}/client-portal/login`);
    await page.waitForLoadState('networkidle');
    console.log('✅ Login page loaded\n');

    // Step 2: Login
    console.log('Step 2: Logging in...');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL(`${BASE_URL}/client-portal`);
    await page.waitForLoadState('networkidle');
    console.log('✅ Login successful\n');

    // Step 3: Navigate to Profile page
    console.log('Step 3: Navigating to Profile page...');

    // Click Profile link in sidebar
    await page.click('a[href="/client-portal/profile"]');
    await page.waitForURL(`${BASE_URL}/client-portal/profile`);
    await page.waitForLoadState('networkidle');
    console.log('✅ Profile page loaded\n');

    // Step 4: Take screenshot of initial state
    console.log('Step 4: Taking screenshot of Profile page...');
    await page.screenshot({
      path: '.playwright-mcp/client-portal-profile-initial.png',
      fullPage: true,
    });
    console.log('✅ Screenshot saved: client-portal-profile-initial.png\n');

    // Step 5: Test Edit Profile mode
    console.log('Step 5: Testing Edit Profile mode...');
    await page.click('button:has-text("Edit Profile")');
    await page.waitForTimeout(500); // Wait for UI update

    // Modify some fields
    await page.fill('input#name', 'Test User Updated');
    await page.fill('input#phone', '+1 234 567 8900');

    // Take screenshot of edit mode
    await page.screenshot({
      path: '.playwright-mcp/client-portal-profile-edit-mode.png',
      fullPage: true,
    });
    console.log('✅ Edit mode screenshot saved\n');

    // Save changes
    console.log('Step 6: Saving profile changes...');
    await page.click('button:has-text("Save Changes")');
    await page.waitForTimeout(1500); // Wait for save animation
    console.log('✅ Profile saved\n');

    // Step 7: Test Password Change form
    console.log('Step 7: Testing Password Change form...');
    await page.click('button:has-text("Change Password")');
    await page.waitForTimeout(500);

    // Fill password form
    await page.fill('input#currentPassword', 'oldpassword123');
    await page.fill('input#newPassword', 'newpassword123');
    await page.fill('input#confirmPassword', 'newpassword123');

    // Take screenshot of password form
    await page.screenshot({
      path: '.playwright-mcp/client-portal-profile-password-form.png',
      fullPage: true,
    });
    console.log('✅ Password form screenshot saved\n');

    // Cancel password change
    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(500);

    // Final screenshot
    await page.screenshot({
      path: '.playwright-mcp/client-portal-profile-final.png',
      fullPage: true,
    });
    console.log('✅ Final screenshot saved\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL TESTS PASSED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nScreenshots saved:');
    console.log('  • client-portal-profile-initial.png');
    console.log('  • client-portal-profile-edit-mode.png');
    console.log('  • client-portal-profile-password-form.png');
    console.log('  • client-portal-profile-final.png');

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testProfilePage().catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
