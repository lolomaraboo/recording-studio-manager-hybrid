import { test, expect } from '@playwright/test';

test.describe('Phase 12 - Timer UI Testing (Localhost)', () => {
  test('Explore app for timer functionality', async ({ page }) => {
    // Navigate to localhost
    await page.goto('http://localhost:5174/login');
    await page.waitForLoadState('networkidle');
    
    // Login with test account
    await page.fill('input[type="email"]', 'admin@test-studio-ui.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.screenshot({ path: '/tmp/phase12-localhost-dashboard.png', fullPage: true });
    
    console.log('✅ Logged in successfully');
    
    // Check sidebar for timer-related links
    const sidebarText = await page.locator('nav, aside, [role="navigation"]').allTextContents();
    console.log('Sidebar items:', sidebarText);
    
    // Navigate to Sessions page
    await page.goto('http://localhost:5174/sessions');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/tmp/phase12-localhost-sessions.png', fullPage: true });
    
    // Look for timer UI elements
    const pageText = await page.locator('body').textContent();
    const hasTimer = pageText?.includes('Timer') || pageText?.includes('Start') || pageText?.includes('Stop');
    console.log('Has timer-related text:', hasTimer);
    
    // Check for time tracking menu item
    const timeTrackingLink = await page.locator('a:has-text("Time"), a:has-text("Timer"), a:has-text("Tracking")').count();
    console.log('Time tracking links found:', timeTrackingLink);
    
    // Wait to allow manual inspection
    await page.waitForTimeout(3000);
  });
});
