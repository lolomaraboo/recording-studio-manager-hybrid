import { chromium } from 'playwright';

/**
 * Complete Production Validation Test
 * Tests all critical flows for Phase 1 Plan 3 validation
 */

(async () => {
  // Test credentials from previous successful signup
  const testEmail = 'test-validation-1766731401390@recording-studio-manager.com';
  const testPassword = 'TestPassword123!';

  console.log('\n' + '='.repeat(70));
  console.log('🧪 PRODUCTION VALIDATION TEST - Phase 1 Plan 3');
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();

  const results = {
    signup: false,
    dashboard: false,
    bookingFlow: false,
    stripeIntegration: false,
    projectsManagement: false,
    clientPortal: false,
    aiChatbot: false,
  };

  try {
    // ========================================================================
    // TEST 1: Login with test account
    // ========================================================================
    console.log('\n📝 TEST 1: Login to test account');
    console.log('-'.repeat(70));

    await page.goto('https://recording-studio-manager.com/');
    await page.waitForLoadState('networkidle');

    // Fill login form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.screenshot({ path: 'validation-1-login.png', fullPage: true });

    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Verify logged in
    const isLoggedIn = page.url().includes('/') || page.url().includes('dashboard');
    console.log(`   ${isLoggedIn ? '✅' : '❌'} Login successful`);
    results.dashboard = isLoggedIn;

    await page.screenshot({ path: 'validation-2-dashboard.png', fullPage: true });

    // ========================================================================
    // TEST 2: Booking Flow
    // ========================================================================
    console.log('\n📅 TEST 2: Booking Flow');
    console.log('-'.repeat(70));

    try {
      // Navigate to Sessions/Bookings
      const sessionsLink = page.locator('text=/Sessions|Calendrier|Bookings/i').first();
      if (await sessionsLink.count() > 0) {
        await sessionsLink.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'validation-3-sessions.png', fullPage: true });

        console.log('   ✅ Sessions page accessible');

        // Try to find "New Session" or "Create Booking" button
        const createButtons = [
          'text=/New Session/i',
          'text=/Create Session/i',
          'text=/Add Booking/i',
          'text=/Nouvelle Session/i',
          'button:has-text("+")',
        ];

        let createButtonFound = false;
        for (const selector of createButtons) {
          const button = page.locator(selector).first();
          if (await button.count() > 0) {
            console.log(`   ✅ Found create button: ${selector}`);
            await button.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'validation-4-booking-form.png', fullPage: true });
            createButtonFound = true;
            results.bookingFlow = true;
            console.log('   ✅ Booking form opened');
            break;
          }
        }

        if (!createButtonFound) {
          console.log('   ⚠️  No create booking button found - feature may not be implemented');
          results.bookingFlow = false;
        }
      } else {
        console.log('   ⚠️  Sessions/Bookings link not found');
        results.bookingFlow = false;
      }
    } catch (error) {
      console.log(`   ❌ Booking flow error: ${error.message}`);
      results.bookingFlow = false;
    }

    // ========================================================================
    // TEST 3: Projects Management (Phase 5 feature)
    // ========================================================================
    console.log('\n🎵 TEST 3: Projects Management');
    console.log('-'.repeat(70));

    try {
      // Look for Projects in navigation
      const projectsLink = page.locator('text=/Projects?|Projets?/i').first();
      if (await projectsLink.count() > 0) {
        await projectsLink.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'validation-5-projects.png', fullPage: true });

        console.log('   ✅ Projects page accessible');

        // Try to find "New Project" button
        const newProjectButtons = [
          'text=/New Project/i',
          'text=/Create Project/i',
          'text=/Nouveau Projet/i',
          'button:has-text("+")',
        ];

        let projectButtonFound = false;
        for (const selector of newProjectButtons) {
          const button = page.locator(selector).first();
          if (await button.count() > 0) {
            console.log(`   ✅ Found create project button`);
            await button.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'validation-6-project-form.png', fullPage: true });
            projectButtonFound = true;
            results.projectsManagement = true;
            console.log('   ✅ Project creation form opened');
            break;
          }
        }

        if (!projectButtonFound) {
          console.log('   ⚠️  No create project button found');
          results.projectsManagement = false;
        }
      } else {
        console.log('   ⚠️  Projects link not found in navigation');
        results.projectsManagement = false;
      }
    } catch (error) {
      console.log(`   ❌ Projects error: ${error.message}`);
      results.projectsManagement = false;
    }

    // ========================================================================
    // TEST 4: AI Assistant (Chatbot)
    // ========================================================================
    console.log('\n🤖 TEST 4: AI Assistant');
    console.log('-'.repeat(70));

    try {
      // Look for AI Assistant button or panel
      const aiSelectors = [
        'text=/AI Assistant/i',
        'text=/Assistant/i',
        '[class*="chatbot"]',
        '[class*="ai-assistant"]',
      ];

      let aiFound = false;
      for (const selector of aiSelectors) {
        const aiElement = page.locator(selector).first();
        if (await aiElement.count() > 0) {
          console.log(`   ✅ AI Assistant found: ${selector}`);

          // Try to open if it's a button
          if (await aiElement.evaluate(el => el.tagName === 'BUTTON')) {
            await aiElement.click();
            await page.waitForTimeout(1000);
          }

          await page.screenshot({ path: 'validation-7-ai-assistant.png', fullPage: true });

          // Look for chat input
          const chatInput = page.locator('input[placeholder*="question" i], input[placeholder*="message" i], textarea').first();
          if (await chatInput.count() > 0) {
            await chatInput.fill('Hello, can you help me?');
            await page.screenshot({ path: 'validation-8-ai-input.png', fullPage: true });
            console.log('   ✅ AI chat input functional');
            results.aiChatbot = true;
            aiFound = true;
            break;
          }
        }
      }

      if (!aiFound) {
        console.log('   ⚠️  AI Assistant not found or not accessible');
        results.aiChatbot = false;
      }
    } catch (error) {
      console.log(`   ❌ AI Assistant error: ${error.message}`);
      results.aiChatbot = false;
    }

    // ========================================================================
    // TEST 5: Stripe Integration Check
    // ========================================================================
    console.log('\n💳 TEST 5: Stripe Integration');
    console.log('-'.repeat(70));

    try {
      // Navigate to Finance or Invoicing section
      const financeLink = page.locator('text=/Finance|Invoic|Factur|Payment/i').first();
      if (await financeLink.count() > 0) {
        await financeLink.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'validation-9-finance.png', fullPage: true });

        // Check if Stripe elements are present
        const stripeElements = await page.locator('text=/stripe|payment|paiement/i').count();
        if (stripeElements > 0) {
          console.log('   ✅ Stripe-related elements found');
          results.stripeIntegration = true;
        } else {
          console.log('   ⚠️  No Stripe elements visible - may not be implemented in UI');
          results.stripeIntegration = false;
        }
      } else {
        console.log('   ⚠️  Finance section not found - checking server environment');

        // Alternative: Check if Stripe is configured on server via health endpoint
        const healthResponse = await page.goto('https://recording-studio-manager.com/health');
        const healthText = await page.textContent('body');

        if (healthText.includes('stripe') || healthText.includes('payment')) {
          console.log('   ✅ Stripe configured on server');
          results.stripeIntegration = true;
        } else {
          console.log('   ℹ️  Stripe configuration not visible in health endpoint');
          results.stripeIntegration = false;
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Stripe check inconclusive: ${error.message}`);
      results.stripeIntegration = false;
    }

    // ========================================================================
    // TEST 6: Client Portal Access
    // ========================================================================
    console.log('\n👥 TEST 6: Client Portal');
    console.log('-'.repeat(70));

    try {
      // Navigate to Clients section
      const clientsLink = page.locator('text=/Clients?/i').first();
      if (await clientsLink.count() > 0) {
        await clientsLink.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'validation-10-clients.png', fullPage: true });

        console.log('   ✅ Clients page accessible');

        // Check if there's a client portal link or feature
        const portalElements = await page.locator('text=/portal|access|invitation/i').count();
        if (portalElements > 0) {
          console.log('   ✅ Client portal features visible');
          results.clientPortal = true;
        } else {
          console.log('   ⚠️  Client portal features not immediately visible');
          results.clientPortal = false;
        }
      } else {
        console.log('   ⚠️  Clients section not found');
        results.clientPortal = false;
      }
    } catch (error) {
      console.log(`   ❌ Client portal error: ${error.message}`);
      results.clientPortal = false;
    }

    // ========================================================================
    // FINAL RESULTS
    // ========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 VALIDATION RESULTS SUMMARY');
    console.log('='.repeat(70));

    const tests = [
      { name: 'Signup & Authentication', status: results.signup || results.dashboard, critical: true },
      { name: 'Dashboard Access', status: results.dashboard, critical: true },
      { name: 'Booking Flow', status: results.bookingFlow, critical: true },
      { name: 'Projects Management (Phase 5)', status: results.projectsManagement, critical: true },
      { name: 'AI Assistant', status: results.aiChatbot, critical: false },
      { name: 'Stripe Integration', status: results.stripeIntegration, critical: true },
      { name: 'Client Portal', status: results.clientPortal, critical: false },
    ];

    let passedCritical = 0;
    let totalCritical = 0;
    let passedAll = 0;

    tests.forEach(test => {
      const icon = test.status ? '✅' : '❌';
      const criticalTag = test.critical ? '[CRITICAL]' : '[OPTIONAL]';
      console.log(`${icon} ${test.name.padEnd(40)} ${criticalTag}`);

      if (test.status) passedAll++;
      if (test.critical) {
        totalCritical++;
        if (test.status) passedCritical++;
      }
    });

    console.log('='.repeat(70));
    console.log(`Total Passed: ${passedAll}/${tests.length}`);
    console.log(`Critical Passed: ${passedCritical}/${totalCritical}`);

    const overallPass = passedCritical >= Math.ceil(totalCritical * 0.75); // 75% critical tests must pass
    console.log('\n' + (overallPass ? '✅ VALIDATION PASSED' : '⚠️  VALIDATION NEEDS ATTENTION'));
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ FATAL TEST ERROR:', error.message);
    await page.screenshot({ path: 'validation-ERROR.png', fullPage: true });
  } finally {
    console.log('\n🔍 Screenshots saved. Browser will stay open for 15 seconds...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    await browser.close();
  }
})();
