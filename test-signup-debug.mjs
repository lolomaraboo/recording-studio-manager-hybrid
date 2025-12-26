import { chromium } from 'playwright';

/**
 * Debug script to inspect signup form structure
 */

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🌐 Navigating to signup page...');
  await page.goto('https://recording-studio-manager.com/signup');
  await page.waitForLoadState('networkidle');

  console.log('📸 Taking screenshot...');
  await page.screenshot({ path: 'test-signup-page.png', fullPage: true });

  console.log('🔍 Inspecting form inputs...');
  const inputs = await page.locator('input').all();
  console.log(`Found ${inputs.length} input elements`);

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const type = await input.getAttribute('type');
    const name = await input.getAttribute('name');
    const placeholder = await input.getAttribute('placeholder');
    const id = await input.getAttribute('id');

    console.log(`\nInput ${i + 1}:`);
    console.log(`  type: ${type}`);
    console.log(`  name: ${name}`);
    console.log(`  placeholder: ${placeholder}`);
    console.log(`  id: ${id}`);
  }

  console.log('\n🔍 Looking for submit button...');
  const buttons = await page.locator('button').all();
  console.log(`Found ${buttons.length} button elements`);

  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const text = await button.textContent();
    const type = await button.getAttribute('type');

    console.log(`\nButton ${i + 1}:`);
    console.log(`  text: ${text}`);
    console.log(`  type: ${type}`);
  }

  console.log('\n✅ Inspection complete. Browser will stay open for manual inspection.');
  console.log('Press Ctrl+C when done.');

  // Keep browser open for manual inspection
  await new Promise(() => {});
})();
