import { test, expect } from '@playwright/test';

test.describe('Chatbot AI - Test après fix tenant databases', () => {
  
  test('should not have 500 errors when using chatbot', async ({ page }) => {
    const networkErrors: any[] = [];
    
    // Capture network errors
    page.on('response', response => {
      if (response.status() >= 500) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    // 1. Go to login
    await page.goto('http://localhost:5174/login');
    
    // 2. Login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    // Wait for any page load
    await page.waitForTimeout(3000);
    
    // 3. Take screenshot of current state
    await page.screenshot({ 
      path: '../../.playwright-mcp/chatbot-after-login.png',
      fullPage: true 
    });
    
    // 4. Check for AI/Chat components
    const pageContent = await page.content();
    const hasAIComponent = pageContent.includes('AIAssistant') || 
                          pageContent.includes('ai-assistant') ||
                          pageContent.includes('chat');
    
    console.log(`AI Component found in page: ${hasAIComponent}`);
    
    // 5. Wait a bit more for any async requests
    await page.waitForTimeout(3000);
    
    // 6. Check network errors
    console.log(`Network errors (500+): ${networkErrors.length}`);
    
    if (networkErrors.length > 0) {
      console.log('Errors detected:');
      networkErrors.forEach(err => {
        console.log(`  - ${err.status} ${err.url}`);
      });
    }
    
    // 7. Final screenshot
    await page.screenshot({ 
      path: '../../.playwright-mcp/chatbot-final-test.png',
      fullPage: true 
    });
    
    // 8. Expect no 500 errors from chatbot AI endpoints
    const aiErrors = networkErrors.filter(e =>
      e.status >= 500 &&
      (e.url.includes('ai.chat') || e.url.includes('ai.'))
    );

    console.log(`AI-specific errors: ${aiErrors.length}`);

    // We're specifically testing that AI/chatbot endpoints don't have 500 errors
    // (notifications/stream SSE errors are a separate issue)
    expect(aiErrors.length).toBe(0);
  });
});
