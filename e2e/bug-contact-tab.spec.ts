import { test } from '@playwright/test';

test('Contact tab bug - visual inspection', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@studio.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

  // Navigate to /clients/new
  await page.goto('/clients/new');
  await page.waitForLoadState('domcontentloaded');

  console.log('\n=== Initial state ===');
  console.log('URL:', page.url());

  // Click on Contact tab
  console.log('\n=== Clicking on Contact tab ===');
  const contactTab = page.locator('[role="tab"]:has-text("Contact")');
  await contactTab.click();

  // Wait a bit
  await page.waitForTimeout(1000);

  // Check tab state
  const dataState = await contactTab.getAttribute('data-state');
  console.log('Contact tab data-state after click:', dataState);

  // Check if Contact content is visible
  const contactContent = page.locator('[role="tabpanel"]:has-text("Téléphones")');
  const isVisible = await contactContent.isVisible();
  console.log('Contact content visible:', isVisible);

  // Keep browser open for manual inspection
  console.log('\n=== Browser will stay open for 60 seconds for inspection ===');
  await page.waitForTimeout(60000);
});
