import { test } from '@playwright/test';

test('Check production homepage structure', async ({ page }) => {
  console.log('\n=== Checking Production Homepage ===\n');

  await page.goto('https://recording-studio-manager.com');
  await page.waitForLoadState('networkidle');

  console.log(`Current URL: ${page.url()}`);
  console.log(`Page title: ${await page.title()}`);

  // Take screenshot
  await page.screenshot({ path: 'homepage.png', fullPage: true });
  console.log('Screenshot saved to: homepage.png');

  // Get page content
  const bodyText = await page.locator('body').textContent();
  console.log('\nPage text content (first 500 chars):');
  console.log(bodyText?.substring(0, 500));

  // Find all links
  const links = await page.locator('a').all();
  console.log(`\nFound ${links.length} links on page`);

  for (const link of links.slice(0, 10)) {
    const text = await link.textContent();
    const href = await link.getAttribute('href');
    console.log(`  - "${text?.trim()}" -> ${href}`);
  }

  // Find all buttons
  const buttons = await page.locator('button').all();
  console.log(`\nFound ${buttons.length} buttons on page`);

  for (const button of buttons.slice(0, 10)) {
    const text = await button.textContent();
    console.log(`  - "${text?.trim()}"`);
  }
});
