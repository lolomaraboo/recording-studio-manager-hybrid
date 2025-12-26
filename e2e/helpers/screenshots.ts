import { Page } from '@playwright/test';
import path from 'path';

/**
 * Screenshot helpers for E2E tests
 * Provides utilities for capturing and organizing screenshots
 */

const SCREENSHOTS_DIR = 'screenshots';

/**
 * Take a full page screenshot
 */
export async function takeFullPageScreenshot(
  page: Page,
  name: string
): Promise<void> {
  const filename = sanitizeFilename(name);
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, `${filename}.png`),
    fullPage: true,
  });
}

/**
 * Take a screenshot of specific element
 */
export async function takeElementScreenshot(
  page: Page,
  selector: string,
  name: string
): Promise<void> {
  const filename = sanitizeFilename(name);
  const element = page.locator(selector);
  await element.screenshot({
    path: path.join(SCREENSHOTS_DIR, `${filename}.png`),
  });
}

/**
 * Take a screenshot with timestamp
 */
export async function takeTimestampedScreenshot(
  page: Page,
  name: string
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${sanitizeFilename(name)}-${timestamp}`;
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, `${filename}.png`),
    fullPage: true,
  });
}

/**
 * Take screenshots of all pages in a list
 */
export async function screenshotAllPages(
  page: Page,
  pages: Array<{ url: string; name: string }>
): Promise<void> {
  for (const { url, name } of pages) {
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');
    await takeFullPageScreenshot(page, name);
  }
}

/**
 * Sanitize filename for screenshots
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Ensure screenshots directory exists
 */
export async function ensureScreenshotsDir(): Promise<void> {
  const fs = await import('fs');
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
}

/**
 * Screenshot helper for debugging failures
 */
export async function debugScreenshot(page: Page, testName: string): Promise<void> {
  const timestamp = Date.now();
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, `debug-${sanitizeFilename(testName)}-${timestamp}.png`),
    fullPage: true,
  });
}
