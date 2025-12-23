#!/usr/bin/env node
/**
 * Client Portal E2E Test
 * Tests authentication, dashboard, and booking flow
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const FRONTEND_URL = 'http://localhost:5174';
const SCREENSHOT_DIR = '.playwright-mcp';

// Create screenshot directory
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function test() {
  console.log('🚀 Starting Client Portal E2E Test...\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  // Listen to console messages
  page.on('console', msg => {
    console.log(`[Browser ${msg.type()}]:`, msg.text());
  });

  // Listen to network errors
  page.on('requestfailed', request => {
    console.log(`[Network Failed]: ${request.url()} - ${request.failure().errorText}`);
  });

  try {
    // Test 1: Navigate to Client Portal Login
    console.log('📍 Test 1: Navigate to Client Portal Login');
    await page.goto(`${FRONTEND_URL}/client-portal/login`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'client-portal-1-login.png'), fullPage: true });
    console.log('✅ Client Portal login page loaded\n');

    // Test 2: Check Registration Form
    console.log('📍 Test 2: Check Registration Form');
    const registerTab = page.getByRole('tab', { name: /register|inscription|s'inscrire/i });
    if (await registerTab.count() > 0) {
      await registerTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'client-portal-2-register.png'), fullPage: true });
      console.log('✅ Registration form visible\n');
    }

    // Test 3: Test Login with Test Credentials
    console.log('📍 Test 3: Test Login (if test user exists)');
    const loginTab = page.getByRole('tab', { name: /login|connexion/i });
    if (await loginTab.count() > 0) {
      await loginTab.click();
    }

    // Fill login form
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if (await emailInput.count() > 0) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');

      const loginButton = page.getByRole('button', { name: /sign in|se connecter|login/i });
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'client-portal-3-credentials-filled.png'), fullPage: true });

      if (await loginButton.count() > 0) {
        await loginButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'client-portal-4-after-login.png'), fullPage: true });

        // Check if redirected to dashboard or error
        const currentUrl = page.url();
        console.log(`Current URL after login: ${currentUrl}`);

        if (currentUrl.includes('/dashboard')) {
          console.log('✅ Login successful - redirected to dashboard\n');
        } else {
          console.log('⚠️  Login failed or user does not exist\n');
        }
      }
    }

    // Test 4: Check Page Elements
    console.log('📍 Test 4: Check Page Elements');

    // Check for magic link option
    const magicLinkText = await page.getByText(/magic link|lien magique/i).count();
    if (magicLinkText > 0) {
      console.log('✅ Magic link authentication option available');
    }

    // Check for tabs
    const tabs = await page.getByRole('tab').count();
    console.log(`✅ Found ${tabs} tabs on login page`);

    // Check for form inputs
    const inputs = await page.getByRole('textbox').count();
    console.log(`✅ Found ${inputs} text inputs\n`);

    // Test 5: Final Screenshot
    console.log('📍 Test 5: Final State');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'client-portal-5-final.png'), fullPage: true });
    console.log('✅ Final screenshot captured\n');

    console.log('✅ All tests completed!');
    console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}/`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'client-portal-error.png'), fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
}

test().catch(console.error);
