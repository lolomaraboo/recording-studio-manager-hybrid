import { chromium } from 'playwright';

async function testChatbot() {
  console.log('\n🧪 Testing AI Chatbot with Playwright + Chromium\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Navigate
    console.log('\n1. 🌐 Opening http://localhost:5174...');
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/tmp/chat-test-1-home.png' });
    console.log('   ✅ Page loaded');

    // 2. Login
    console.log('\n2. 🔐 Logging in as alice@studiopro.com...');

    // Check if already logged in
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('   ✅ Already logged in');
    } else {
      // Navigate to login
      await page.goto('http://localhost:5174/login');
      await page.waitForLoadState('networkidle');

      await page.fill('input[type="email"]', 'alice@studiopro.com');
      await page.fill('input[type="password"]', 'Test123!');
      await page.click('button[type="submit"]');

      // Wait for dashboard to load (check for Dashboard heading instead of URL)
      await page.waitForSelector('h2:has-text("Dashboard")', { timeout: 15000 });
      console.log('   ✅ Login successful');
    }

    await page.screenshot({ path: '/tmp/chat-test-2-dashboard.png' });

    // 3. Verify AI Assistant is visible
    console.log('\n3. 👀 Checking AI Assistant panel...');
    const assistantPanel = await page.locator('text=AI Assistant').first();
    const isVisible = await assistantPanel.isVisible();
    console.log('   AI Assistant panel visible:', isVisible);
    await page.screenshot({ path: '/tmp/chat-test-3-assistant.png' });

    // 4. Test 1: Simple greeting
    console.log('\n4. 👋 Test 1: Simple Greeting');
    console.log('   📝 Typing: "Bonjour"');

    const input = await page.locator('input[placeholder*="message"]').first();
    await input.fill('Bonjour');
    await page.keyboard.press('Enter');

    console.log('   ⏳ Waiting for AI response...');
    await page.waitForTimeout(8000);
    await page.screenshot({ path: '/tmp/chat-test-4-greeting.png' });

    // Check for response
    const messages = await page.locator('.max-w-\\[80\\%\\]').count();
    console.log('   Messages in chat:', messages);

    // 5. Test 2: List clients
    console.log('\n5. 📋 Test 2: List Clients');
    console.log('   📝 Typing: "Liste les clients"');

    await input.fill('Liste les clients');
    await page.keyboard.press('Enter');

    console.log('   ⏳ Waiting for AI response...');
    await page.waitForTimeout(8000);
    await page.screenshot({ path: '/tmp/chat-test-5-list.png' });

    // 6. Test 3: Create Invoice
    console.log('\n6. 💰 Test 3: Create Invoice');
    console.log('   📝 Typing: "Crée une facture pour le client 6 de 1000 euros"');

    await input.fill('Crée une facture pour le client 6 de 1000 euros');
    await page.keyboard.press('Enter');

    console.log('   ⏳ Waiting for AI response...');
    await page.waitForTimeout(10000);
    await page.screenshot({ path: '/tmp/chat-test-6-invoice.png' });

    // 7. Test 4: Create Quote
    console.log('\n7. 📝 Test 4: Create Quote');
    console.log('   📝 Typing: "Crée un devis de 800 euros pour le client 6"');

    await input.fill('Crée un devis de 800 euros pour le client 6');
    await page.keyboard.press('Enter');

    console.log('   ⏳ Waiting for AI response...');
    await page.waitForTimeout(10000);
    await page.screenshot({ path: '/tmp/chat-test-7-quote.png' });

    // Final count
    const finalMessages = await page.locator('.max-w-\\[80\\%\\]').count();
    console.log('\n📊 Total messages in chat:', finalMessages);
    console.log('   (Expected: ~8 = 4 user + 4 assistant)');

    // Screenshots summary
    console.log('\n📸 Screenshots saved:');
    console.log('   - /tmp/chat-test-1-home.png');
    console.log('   - /tmp/chat-test-2-dashboard.png');
    console.log('   - /tmp/chat-test-3-assistant.png');
    console.log('   - /tmp/chat-test-4-greeting.png');
    console.log('   - /tmp/chat-test-5-list.png');
    console.log('   - /tmp/chat-test-6-invoice.png');
    console.log('   - /tmp/chat-test-7-quote.png');

    console.log('\n⏸️  Keeping browser open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: '/tmp/chat-test-error.png' });
    console.error('Error screenshot saved to /tmp/chat-test-error.png');
  } finally {
    await browser.close();
    console.log('\n🏁 Browser closed\n');
  }
}

testChatbot();
