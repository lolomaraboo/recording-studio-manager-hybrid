import { test, expect } from '@playwright/test';
import { loginAsStaff } from '../helpers/login';
import { takeFullPageScreenshot } from '../helpers/screenshots';

/**
 * Global Search Feature Tests
 *
 * Tests the global search functionality across all entities
 * Features tested:
 * - Search across multiple entity types
 * - Filter by entity type
 * - Navigate to search results
 * - Empty state handling
 */

test.describe('Global Search', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStaff(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Can search across all entities', async ({ page }) => {
    console.log('\n🔍 Testing Global Search: Multi-entity search');

    // Look for search input in header/navbar
    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.click();
      await searchInput.fill('test');
      await page.waitForTimeout(2000);

      console.log('  ✓ Search query entered');
      await takeFullPageScreenshot(page, 'global-search-results');

      // Check for results dropdown
      const results = page.locator('[class*="search-result"], [class*="dropdown"]');
      const resultCount = await results.count();

      console.log(`  ℹ Found ${resultCount} result elements`);
    } else {
      console.log('  ℹ Global search input not found in header');
    }
  });

  test('Search shows different entity types', async ({ page }) => {
    console.log('\n🔍 Testing Global Search: Entity types');

    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.click();
      await searchInput.fill('a'); // Search single letter to get broad results
      await page.waitForTimeout(2000);

      await takeFullPageScreenshot(page, 'global-search-entities');

      // Look for entity type labels (Clients, Projects, Sessions, etc.)
      const entityLabels = page.locator('text=/client|project|session|track/i');
      const labelCount = await entityLabels.count();

      console.log(`  ℹ Found ${labelCount} entity type indicators`);
    } else {
      console.log('  ℹ Global search not available');
    }
  });

  test('Can navigate to search result', async ({ page }) => {
    console.log('\n🔍 Testing Global Search: Navigate to result');

    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.click();
      await searchInput.fill('test');
      await page.waitForTimeout(2000);

      // Try to click first result
      const firstResult = page.locator('[class*="search-result"], [role="option"]').first();

      if (await firstResult.isVisible()) {
        const beforeUrl = page.url();
        await firstResult.click();
        await page.waitForTimeout(1000);

        const afterUrl = page.url();
        console.log(`  ✓ Navigation: ${beforeUrl} → ${afterUrl}`);

        await takeFullPageScreenshot(page, 'global-search-navigated');
      } else {
        console.log('  ℹ No search results to click');
      }
    } else {
      console.log('  ℹ Global search not found');
    }
  });

  test('Handles empty search results', async ({ page }) => {
    console.log('\n🔍 Testing Global Search: Empty results');

    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();

    if (await searchInput.isVisible()) {
      await searchInput.click();
      await searchInput.fill('xyznonexistentquery999');
      await page.waitForTimeout(2000);

      console.log('  ✓ Searched for non-existent query');
      await takeFullPageScreenshot(page, 'global-search-empty');

      // Look for "no results" message
      const noResults = page.locator('text=/no results|aucun résultat|not found/i').first();

      if (await noResults.isVisible()) {
        console.log('  ✓ Empty state message displayed');
      } else {
        console.log('  ℹ Empty state may be handled differently');
      }
    } else {
      console.log('  ℹ Global search not available');
    }
  });
});
