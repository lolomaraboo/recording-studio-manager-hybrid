import { chromium } from 'playwright';

async function testChatbot() {
  console.log('🚀 Test simplifié du chatbot...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const networkErrors = [];
  page.on('response', response => {
    if (response.status() === 500 && response.url().includes('ai.chat')) {
      networkErrors.push({
        url: response.url(),
        status: response.status()
      });
    }
  });

  try {
    console.log('1️⃣ Navigation vers login...');
    await page.goto('http://localhost:5174/login');
    await page.waitForLoadState('domcontentloaded');
    
    console.log('2️⃣ Remplissage du formulaire...');
    await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'test123');
    
    console.log('3️⃣ Soumission du login...');
    await page.click('button[type="submit"]');
    
    // Wait for any navigation
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`   URL actuelle: ${currentUrl}\n`);
    
    // 4. Try to interact with chatbot regardless of URL
    console.log('4️⃣ Recherche du chatbot...');
    await page.waitForTimeout(2000);
    
    // Look for chatbot textarea/input
    const chatInput = await page.$('textarea, input[type="text"]').catch(() => null);
    
    if (chatInput) {
      console.log('   ✅ Input de chat trouvé');
      console.log('   Envoi d\'un message test...');
      await chatInput.fill('Hello from Playwright test');
      await page.keyboard.press('Enter');
      
      console.log('   Attente de la réponse (5s)...');
      await page.waitForTimeout(5000);
    } else {
      console.log('   ⚠️  Input de chat non trouvé');
    }
    
    // 5. Check network errors
    console.log('\n5️⃣ Vérification des erreurs chatbot...');
    if (networkErrors.length > 0) {
      console.log('   ❌ ERREURS DÉTECTÉES:');
      networkErrors.forEach(err => {
        console.log(`      ${err.status} ${err.url}`);
      });
    } else {
      console.log('   ✅ Aucune erreur 500 sur ai.chat');
    }
    
    // 6. Screenshot
    await page.screenshot({ 
      path: '.playwright-mcp/chatbot-final-state.png',
      fullPage: true 
    });
    console.log('\n6️⃣ Screenshot: .playwright-mcp/chatbot-final-state.png');
    
    // Keep browser open for inspection
    console.log('\n⏸️  Browser reste ouvert 10s pour inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
  } finally {
    await browser.close();
    
    if (networkErrors.length === 0) {
      console.log('\n✅ TEST RÉUSSI - Aucune erreur chatbot détectée');
    } else {
      console.log('\n❌ TEST ÉCHOUÉ - Erreurs chatbot détectées');
      process.exit(1);
    }
  }
}

testChatbot();
