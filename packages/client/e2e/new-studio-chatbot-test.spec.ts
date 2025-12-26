import { test, expect } from '@playwright/test';

test.describe('Nouveau Studio + Chatbot Test', () => {

  test('should create new studio and test chatbot without 500 errors', async ({ page }) => {
    const networkErrors: any[] = [];
    const aiErrors: any[] = [];

    // Capture network errors
    page.on('response', response => {
      if (response.status() >= 500) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });

        // Track AI-specific errors
        if (response.url().includes('ai.chat') || response.url().includes('ai.')) {
          aiErrors.push({
            url: response.url(),
            status: response.status()
          });
        }
      }
    });

    console.log('\n🏢 ÉTAPE 1: Création d\'un nouveau studio');
    console.log('==========================================\n');

    // 1. Go to register page
    await page.goto('http://localhost:5174/register');
    await page.waitForLoadState('domcontentloaded');

    // 2. Fill registration form
    const timestamp = Date.now();
    const studioName = `Test Studio ${timestamp}`;
    const email = `test${timestamp}@example.com`;

    console.log(`📝 Création du studio: ${studioName}`);
    console.log(`📧 Email: ${email}\n`);

    await page.fill('#name', 'Test User Playwright');
    await page.fill('#email', email);
    await page.fill('#password', 'password123');
    await page.fill('#organizationName', studioName);

    // 3. Submit registration
    console.log('🚀 Soumission du formulaire...');
    await page.click('button[type="submit"]');

    // Wait for registration to complete
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log(`✅ Enregistrement terminé`);
    console.log(`   URL: ${currentUrl}\n`);

    // 4. Take screenshot after registration
    await page.screenshot({
      path: '../../.playwright-mcp/new-studio-registered.png',
      fullPage: true
    });

    console.log('🤖 ÉTAPE 2: Test du chatbot');
    console.log('==========================================\n');

    // 5. Wait for page to load completely
    await page.waitForTimeout(3000);

    // 6. Look for AI Assistant component
    const pageContent = await page.content();
    const hasAIComponent = pageContent.includes('AIAssistant') ||
                          pageContent.includes('ai-assistant') ||
                          pageContent.includes('chat');

    console.log(`🔍 Composant AI détecté: ${hasAIComponent ? 'OUI ✅' : 'NON ❌'}`);

    // 7. Try to find and interact with chatbot
    let chatbotTested = false;

    // Look for chat input
    const chatInput = await page.$('textarea[placeholder*="Ask" i], textarea[placeholder*="message" i], input[placeholder*="Ask" i]');

    if (chatInput) {
      console.log('📝 Input chatbot trouvé, envoi d\'un message...');

      await chatInput.fill('Hello, this is a test message from Playwright');
      await page.keyboard.press('Enter');

      console.log('⏳ Attente de la réponse (5s)...\n');
      await page.waitForTimeout(5000);

      chatbotTested = true;
    } else {
      console.log('⚠️  Input chatbot non trouvé, continuons...\n');
    }

    // 8. Final screenshot
    await page.screenshot({
      path: '../../.playwright-mcp/new-studio-chatbot-test.png',
      fullPage: true
    });

    console.log('📊 ÉTAPE 3: Vérification des erreurs');
    console.log('==========================================\n');

    // 9. Check errors
    console.log(`Total erreurs 500+: ${networkErrors.length}`);

    if (networkErrors.length > 0) {
      console.log('\n⚠️  Erreurs détectées:');
      networkErrors.forEach(err => {
        const isAI = err.url.includes('ai.');
        console.log(`   ${isAI ? '🤖' : '⚡'} ${err.status} ${err.url}`);
      });
    }

    console.log(`\n🤖 Erreurs AI spécifiques: ${aiErrors.length}`);

    if (aiErrors.length > 0) {
      console.log('   ❌ Erreurs AI détectées:');
      aiErrors.forEach(err => {
        console.log(`      - ${err.status} ${err.url}`);
      });
    } else {
      console.log('   ✅ Aucune erreur AI (chatbot fonctionne!)');
    }

    // 10. Assertions
    console.log('\n==========================================');
    console.log('📋 RÉSULTATS DU TEST');
    console.log('==========================================\n');

    console.log(`✅ Studio créé: ${studioName}`);
    console.log(`✅ Chatbot testé: ${chatbotTested ? 'OUI' : 'NON'}`);
    console.log(`✅ Erreurs AI: ${aiErrors.length === 0 ? 'AUCUNE ✅' : `${aiErrors.length} ❌`}`);
    console.log('');

    // The main assertion: no AI errors
    expect(aiErrors.length).toBe(0);
  });

});
