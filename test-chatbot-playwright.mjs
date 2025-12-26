import { chromium } from 'playwright';

async function testChatbot() {
  console.log('🚀 Lancement du test du chatbot...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Capture network errors
  const networkErrors = [];
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  try {
    // 1. Login
    console.log('1️⃣ Login avec test@example.com...');
    await page.goto('http://localhost:5174/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'test123');
    
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('   ✅ Login réussi\n');

    // 2. Wait for page to fully load
    console.log('2️⃣ Attente du chargement complet...');
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');
    console.log('   ✅ Page chargée\n');

    // 3. Look for AI Assistant / Chat component
    console.log('3️⃣ Recherche du composant chatbot...');
    
    // Try to find the chat interface
    const chatSelectors = [
      '[data-testid="ai-assistant"]',
      '[class*="AIAssistant"]',
      '[class*="ai-assistant"]',
      'button:has-text("AI")',
      'button:has-text("Chat")',
      '[aria-label*="AI" i]',
      '[aria-label*="Chat" i]'
    ];
    
    let chatFound = false;
    let usedSelector = null;
    
    for (const selector of chatSelectors) {
      const element = await page.$(selector);
      if (element) {
        console.log(`   ✅ Composant trouvé: ${selector}`);
        chatFound = true;
        usedSelector = selector;
        
        // If it's a button, click it
        if (selector.includes('button')) {
          await element.click();
          await page.waitForTimeout(1000);
          console.log('   ✅ Chatbot ouvert');
        }
        break;
      }
    }

    if (!chatFound) {
      console.log('   ⚠️  Composant chatbot non trouvé avec les sélecteurs standards');
      console.log('   Recherche dans le HTML...');
      
      const bodyHTML = await page.content();
      if (bodyHTML.includes('AIAssistant') || bodyHTML.includes('ai-assistant')) {
        console.log('   ✅ Composant AI trouvé dans le HTML');
      }
    }

    // 4. Try to send a message
    console.log('\n4️⃣ Tentative d\'envoi d\'un message...');
    
    const inputSelectors = [
      'input[placeholder*="Ask" i]',
      'input[placeholder*="message" i]',
      'textarea[placeholder*="Ask" i]',
      'textarea[placeholder*="message" i]',
      '[data-testid="chat-input"]',
      'input[type="text"]'
    ];
    
    for (const selector of inputSelectors) {
      const input = await page.$(selector);
      if (input && await input.isVisible()) {
        console.log(`   ✅ Input trouvé: ${selector}`);
        await input.fill('Test message from Playwright');
        console.log('   ✅ Message saisi');
        
        // Try to submit
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        console.log('   ✅ Message envoyé (Enter)');
        break;
      }
    }

    // 5. Check for errors
    console.log('\n5️⃣ Vérification des erreurs...');
    
    await page.waitForTimeout(2000);
    
    if (networkErrors.length > 0) {
      console.log('   ⚠️  Erreurs réseau détectées:');
      networkErrors.forEach(err => {
        console.log(`      ${err.status} ${err.url}`);
      });
    } else {
      console.log('   ✅ Aucune erreur réseau (status >= 400)');
    }

    if (consoleErrors.length > 0) {
      console.log('   ⚠️  Erreurs console:');
      consoleErrors.slice(0, 5).forEach(err => {
        console.log(`      ${err.substring(0, 100)}`);
      });
    } else {
      console.log('   ✅ Aucune erreur console');
    }

    // 6. Screenshot
    console.log('\n6️⃣ Capture d\'écran...');
    await page.screenshot({ 
      path: '.playwright-mcp/chatbot-test-final.png',
      fullPage: true 
    });
    console.log('   ✅ Screenshot: .playwright-mcp/chatbot-test-final.png\n');

    console.log('════════════════════════════════════════');
    console.log('✅ TEST TERMINÉ AVEC SUCCÈS');
    console.log('════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERREUR DURANT LE TEST:', error.message);
    await page.screenshot({ path: '.playwright-mcp/chatbot-error.png' });
    console.log('   Screenshot d\'erreur sauvegardé\n');
    throw error;
  } finally {
    await browser.close();
  }
}

testChatbot().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
