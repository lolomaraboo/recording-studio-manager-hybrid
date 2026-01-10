import { test, expect } from '@playwright/test';

test('Phase 12 - Check for Timer UI', async ({ page }) => {
  // Login
  await page.goto('https://recording-studio-manager.com/login');
  await page.fill('input[type="email"]', 'admin@test-studio-ui.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard
  await page.waitForURL('**/dashboard');
  await page.screenshot({ path: '/tmp/phase12-dashboard.png', fullPage: true });
  
  // Check Sessions page
  await page.goto('https://recording-studio-manager.com/sessions');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/phase12-sessions.png', fullPage: true });
  
  // Look for timer-related elements
  const timerElements = await page.locator('[data-testid*="timer"], [class*="timer"], button:has-text("Start Timer"), button:has-text("Stop Timer")').count();
  console.log(`Found ${timerElements} timer-related elements`);
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/phase12-final.png', fullPage: true });
});
