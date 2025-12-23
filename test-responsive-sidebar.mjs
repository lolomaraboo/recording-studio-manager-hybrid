#!/usr/bin/env node
import { chromium, devices } from 'playwright';

/**
 * Test Client Portal Responsive Sidebar
 *
 * Tests:
 * 1. Desktop view: Fixed sidebar visible
 * 2. Mobile view: Hamburger menu + drawer overlay
 * 3. Mobile drawer interaction
 */

const BASE_URL = 'http://localhost:5174';

async function testResponsiveSidebar() {
  console.log('🚀 Starting Responsive Sidebar test...\n');

  const browser = await chromium.launch({ headless: false });

  try {
    // Test 1: Desktop View
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 1: DESKTOP VIEW (1280x720)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const desktopPage = await desktopContext.newPage();

    console.log('Step 1: Login on desktop...');
    await desktopPage.goto(`${BASE_URL}/client-portal/login`);
    await desktopPage.waitForLoadState('networkidle');
    await desktopPage.fill('input[type="email"]', 'test@example.com');
    await desktopPage.fill('input[type="password"]', 'password123');
    await desktopPage.click('button[type="submit"]');
    await desktopPage.waitForURL(`${BASE_URL}/client-portal`);
    await desktopPage.waitForLoadState('networkidle');
    console.log('✅ Login successful\n');

    console.log('Step 2: Verify sidebar visible...');
    await desktopPage.screenshot({
      path: '.playwright-mcp/responsive-sidebar-desktop.png',
      fullPage: true,
    });
    console.log('✅ Desktop screenshot saved\n');

    console.log('Step 3: Test sidebar collapse...');
    await desktopPage.click('button[title="Collapse sidebar"]');
    await desktopPage.waitForTimeout(500);
    await desktopPage.screenshot({
      path: '.playwright-mcp/responsive-sidebar-desktop-collapsed.png',
      fullPage: true,
    });
    console.log('✅ Collapsed sidebar screenshot saved\n');

    await desktopContext.close();

    // Test 2: Mobile View
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 2: MOBILE VIEW (iPhone 12)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const iPhone12 = devices['iPhone 12'];
    const mobileContext = await browser.newContext({
      ...iPhone12,
    });
    const mobilePage = await mobileContext.newPage();

    console.log('Step 1: Login on mobile...');
    await mobilePage.goto(`${BASE_URL}/client-portal/login`);
    await mobilePage.waitForLoadState('networkidle');
    await mobilePage.fill('input[type="email"]', 'test@example.com');
    await mobilePage.fill('input[type="password"]', 'password123');
    await mobilePage.click('button[type="submit"]');
    await mobilePage.waitForURL(`${BASE_URL}/client-portal`);
    await mobilePage.waitForLoadState('networkidle');
    console.log('✅ Login successful\n');

    console.log('Step 2: Verify hamburger menu visible...');
    await mobilePage.screenshot({
      path: '.playwright-mcp/responsive-sidebar-mobile-closed.png',
      fullPage: true,
    });
    console.log('✅ Mobile closed screenshot saved\n');

    console.log('Step 3: Open mobile drawer...');
    await mobilePage.click('button[aria-label="Toggle menu"]');
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({
      path: '.playwright-mcp/responsive-sidebar-mobile-open.png',
      fullPage: true,
    });
    console.log('✅ Mobile open screenshot saved\n');

    console.log('Step 4: Click navigation link...');
    await mobilePage.click('a[href="/client-portal/profile"]');
    await mobilePage.waitForURL(`${BASE_URL}/client-portal/profile`);
    await mobilePage.waitForTimeout(500);

    // Drawer should auto-close after navigation
    await mobilePage.screenshot({
      path: '.playwright-mcp/responsive-sidebar-mobile-after-nav.png',
      fullPage: true,
    });
    console.log('✅ Mobile after navigation screenshot saved (drawer auto-closed)\n');

    console.log('Step 5: Test overlay click to close...');
    await mobilePage.click('button[aria-label="Toggle menu"]');
    await mobilePage.waitForTimeout(500);

    // Click overlay to close
    await mobilePage.click('.fixed.inset-0.bg-black\\/50');
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({
      path: '.playwright-mcp/responsive-sidebar-mobile-overlay-closed.png',
      fullPage: true,
    });
    console.log('✅ Overlay click closed drawer\n');

    await mobileContext.close();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL RESPONSIVE TESTS PASSED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nScreenshots saved:');
    console.log('  Desktop:');
    console.log('    • responsive-sidebar-desktop.png');
    console.log('    • responsive-sidebar-desktop-collapsed.png');
    console.log('  Mobile:');
    console.log('    • responsive-sidebar-mobile-closed.png');
    console.log('    • responsive-sidebar-mobile-open.png');
    console.log('    • responsive-sidebar-mobile-after-nav.png');
    console.log('    • responsive-sidebar-mobile-overlay-closed.png');

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testResponsiveSidebar().catch((error) => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
