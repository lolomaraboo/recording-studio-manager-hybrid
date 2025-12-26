import { test } from '@playwright/test';

test('Debug registration form', async ({ page }) => {
  console.log('\n=== Debugging Registration Form ===\n');

  await page.goto('https://recording-studio-manager.com/register');
  await page.waitForLoadState('networkidle');

  // Take screenshot before filling
  await page.screenshot({ path: 'register-before.png', fullPage: true });
  console.log('Screenshot before: register-before.png');

  // List all form inputs
  const inputs = await page.locator('input').all();
  console.log(`\nFound ${inputs.length} input fields:`);
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const type = await input.getAttribute('type');
    const name = await input.getAttribute('name');
    const placeholder = await input.getAttribute('placeholder');
    console.log(`  ${i + 1}. type="${type}" name="${name}" placeholder="${placeholder}"`);
  }

  // Fill form
  console.log('\nFilling form...');
  const timestamp = Date.now();
  await page.fill('input[type="email"]', `test-debug-${timestamp}@example.com`);
  await page.fill('input[type="password"]', 'TestPassword123!');

  // Find studio name field
  const studioInputs = await page.locator('input:not([type="email"]):not([type="password"])').all();
  if (studioInputs.length > 0) {
    console.log(`Found ${studioInputs.length} other inputs, filling first as studio name`);
    await studioInputs[0].fill('Test Studio Name');
  }

  // Take screenshot after filling
  await page.screenshot({ path: 'register-filled.png', fullPage: true });
  console.log('Screenshot after: register-filled.png');

  // Find and log submit button
  const buttons = await page.locator('button').all();
  console.log(`\nFound ${buttons.length} buttons:`);
  for (const button of buttons) {
    const text = await button.textContent();
    const type = await button.getAttribute('type');
    console.log(`  - "${text?.trim()}" type="${type}"`);
  }

  // Monitor network requests
  console.log('\nMonitoring network...');
  const requests: string[] = [];
  page.on('request', req => {
    if (req.url().includes('/api/')) {
      requests.push(`${req.method()} ${req.url()}`);
      console.log(`  → ${req.method()} ${req.url()}`);
    }
  });

  page.on('response', async res => {
    if (res.url().includes('/api/')) {
      const status = res.status();
      console.log(`  ← ${status} ${res.url()}`);

      if (status >= 400) {
        try {
          const body = await res.text();
          console.log(`     Body: ${body.substring(0, 200)}`);
        } catch (e) {
          // Ignore
        }
      }
    }
  });

  // Click submit
  console.log('\nClicking submit button...');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Take screenshot after submit
  await page.screenshot({ path: 'register-after-submit.png', fullPage: true });
  console.log('Screenshot after submit: register-after-submit.png');

  console.log(`\nFinal URL: ${page.url()}`);
  console.log(`Total API requests: ${requests.length}`);
});
