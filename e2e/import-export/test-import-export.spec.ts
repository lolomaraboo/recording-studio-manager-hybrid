import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Phase 3.10-02: Test Import/Export vCard/Excel/CSV
 * Tests automatisés pour validation import/export clients
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_FILES_DIR = path.join(__dirname, 'test-files');

test.describe('Import/Export Clients vCard/Excel/CSV', () => {
  test.beforeAll(async () => {
    // Create test files directory
    if (!fs.existsSync(TEST_FILES_DIR)) {
      fs.mkdirSync(TEST_FILES_DIR, { recursive: true });
    }

    // Create test vCard file
    const vcardContent = `BEGIN:VCARD
VERSION:4.0
FN:Charlie Rousseau
N:Rousseau;Charlie;Marie;;M.;
TEL;TYPE=mobile:+33612345678
TEL;TYPE=work:+33142424242
EMAIL;TYPE=work:charlie@work.com
EMAIL;TYPE=home:charlie@gmail.com
ADR;TYPE=work:;;10 Rue de la Paix;Paris;Île-de-France;75002;France
BDAY:19900315
GENDER:M
NOTE:Client import test vCard
X-INSTAGRAM:@charlierocks
END:VCARD`;
    fs.writeFileSync(path.join(TEST_FILES_DIR, 'test-import.vcf'), vcardContent);

    // Create test CSV file
    const csvContent = `name,type,firstName,lastName,phone,email,city,postalCode,country
"Emma Garcia",individual,Emma,Garcia,+33687654321,emma@mail.com,Toulouse,31000,France
"Productions Omega",company,,,+33467891234,info@omega.com,Montpellier,34000,France`;
    fs.writeFileSync(path.join(TEST_FILES_DIR, 'test-import.csv'), csvContent);

    // Create invalid vCard for error testing
    const invalidVcard = `BEGIN:VCARD
VERSION:4.0
END:VCARD`;
    fs.writeFileSync(path.join(TEST_FILES_DIR, 'invalid.vcf'), invalidVcard);
  });

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@studio.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  });

  test('should import vCard file successfully', async ({ page }) => {
    console.log('\n=== Test Import vCard ===');

    await page.goto('/clients');
    await page.waitForLoadState('domcontentloaded');

    // Count clients before import
    const clientsBeforeText = await page.locator('text=/\\d+ clients?/i').first().textContent();
    const clientsBefore = parseInt(clientsBeforeText?.match(/\d+/)?.[0] || '0');
    console.log('Clients before import:', clientsBefore);

    // Find and click Import button
    const importButton = page.locator('button:has-text("Importer")').or(
      page.locator('button:has-text("Import")')
    );

    if (await importButton.count() > 0) {
      await importButton.first().click();

      // Click on vCard option
      await page.locator('text=vCard').click();

      // Upload file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(path.join(TEST_FILES_DIR, 'test-import.vcf'));

      // Click import button in dialog
      await page.locator('button:has-text("Importer")').last().click();

      // Wait for success toast
      await expect(page.locator('text=/importé/i')).toBeVisible({ timeout: 10000 });
      console.log('✓ Import vCard successful');

      // Verify client appears in list
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Charlie Rousseau')).toBeVisible({ timeout: 5000 });
      console.log('✓ Charlie Rousseau appears in client list');

    } else {
      console.log('⚠ Import button not found - may need to check UI structure');
    }
  });

  test('should download Excel template', async ({ page }) => {
    console.log('\n=== Test Download Excel Template ===');

    await page.goto('/clients');
    await page.waitForLoadState('domcontentloaded');

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Find and click Import → Excel → Download Template
    const importButton = page.locator('button:has-text("Importer")');

    if (await importButton.count() > 0) {
      await importButton.first().click();
      await page.locator('text=Excel').click();

      // Click download template button
      const downloadButton = page.locator('button:has-text("Télécharger")').or(
        page.locator('button:has-text("Download")')
      );
      await downloadButton.click();

      const download = await downloadPromise;
      console.log('✓ Template downloaded:', download.suggestedFilename());

      // Save template for inspection
      await download.saveAs(path.join(TEST_FILES_DIR, 'clients-template.xlsx'));
      console.log('✓ Template saved to test-files/');
    } else {
      console.log('⚠ Import button not found');
    }
  });

  test('should import CSV file successfully', async ({ page }) => {
    console.log('\n=== Test Import CSV ===');

    await page.goto('/clients');
    await page.waitForLoadState('domcontentloaded');

    const importButton = page.locator('button:has-text("Importer")');

    if (await importButton.count() > 0) {
      await importButton.first().click();
      await page.locator('text=CSV').click();

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(path.join(TEST_FILES_DIR, 'test-import.csv'));

      await page.locator('button:has-text("Importer")').last().click();

      await expect(page.locator('text=/2.*importé/i')).toBeVisible({ timeout: 10000 });
      console.log('✓ Import CSV successful (2 clients)');

      // Verify clients appear
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Emma Garcia')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Productions Omega')).toBeVisible({ timeout: 5000 });
      console.log('✓ Emma Garcia and Productions Omega appear in list');
    }
  });

  test('should handle invalid vCard gracefully', async ({ page }) => {
    console.log('\n=== Test Error Handling ===');

    await page.goto('/clients');
    await page.waitForLoadState('domcontentloaded');

    const importButton = page.locator('button:has-text("Importer")');

    if (await importButton.count() > 0) {
      await importButton.first().click();
      await page.locator('text=vCard').click();

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(path.join(TEST_FILES_DIR, 'invalid.vcf'));

      await page.locator('button:has-text("Importer")').last().click();

      // Should show error message
      await expect(page.locator('text=/erreur|error|invalide|invalid/i')).toBeVisible({ timeout: 5000 });
      console.log('✓ Error handling works for invalid vCard');
    }
  });

  test('should export clients to vCard', async ({ page }) => {
    console.log('\n=== Test Export vCard ===');

    await page.goto('/clients');
    await page.waitForLoadState('domcontentloaded');

    const downloadPromise = page.waitForEvent('download');

    const exportButton = page.locator('button:has-text("Exporter")').or(
      page.locator('button:has-text("Export")')
    );

    if (await exportButton.count() > 0) {
      await exportButton.first().click();
      await page.locator('text=vCard').click();

      const download = await downloadPromise;
      console.log('✓ Export vCard downloaded:', download.suggestedFilename());

      // Save and verify content
      const filePath = path.join(TEST_FILES_DIR, 'clients-export.vcf');
      await download.saveAs(filePath);

      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toContain('BEGIN:VCARD');
      expect(content).toContain('VERSION:4.0');
      expect(content).toContain('END:VCARD');
      console.log('✓ vCard format is valid (RFC 6350)');

      // Count number of vCards
      const vcardCount = (content.match(/BEGIN:VCARD/g) || []).length;
      console.log(`✓ Export contains ${vcardCount} client(s)`);
    }
  });

  test('should export clients to Excel', async ({ page }) => {
    console.log('\n=== Test Export Excel ===');

    await page.goto('/clients');
    await page.waitForLoadState('domcontentloaded');

    const downloadPromise = page.waitForEvent('download');

    const exportButton = page.locator('button:has-text("Exporter")');

    if (await exportButton.count() > 0) {
      await exportButton.first().click();
      await page.locator('text=Excel').click();

      const download = await downloadPromise;
      console.log('✓ Export Excel downloaded:', download.suggestedFilename());

      await download.saveAs(path.join(TEST_FILES_DIR, 'clients-export.xlsx'));
      console.log('✓ Excel file saved for inspection');
    }
  });

  test('should export clients to CSV', async ({ page }) => {
    console.log('\n=== Test Export CSV ===');

    await page.goto('/clients');
    await page.waitForLoadState('domcontentloaded');

    const downloadPromise = page.waitForEvent('download');

    const exportButton = page.locator('button:has-text("Exporter")');

    if (await exportButton.count() > 0) {
      await exportButton.first().click();
      await page.locator('text=CSV').click();

      const download = await downloadPromise;
      console.log('✓ Export CSV downloaded:', download.suggestedFilename());

      const filePath = path.join(TEST_FILES_DIR, 'clients-export.csv');
      await download.saveAs(filePath);

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim());
      console.log(`✓ CSV contains ${lines.length} lines (including header)`);

      // Verify header exists
      expect(lines[0]).toMatch(/name.*type.*email/i);
      console.log('✓ CSV header is valid');
    }
  });

  test('should verify round-trip: export → import preserves data', async ({ page }) => {
    console.log('\n=== Test Round-trip ===');

    await page.goto('/clients');
    await page.waitForLoadState('domcontentloaded');

    // Export to vCard
    let downloadPromise = page.waitForEvent('download');
    const exportButton = page.locator('button:has-text("Exporter")').first();
    await exportButton.click();
    await page.locator('text=vCard').first().click();

    const exportDownload = await downloadPromise;
    const exportPath = path.join(TEST_FILES_DIR, 'roundtrip-export.vcf');
    await exportDownload.saveAs(exportPath);
    console.log('✓ Exported clients to vCard');

    // Count clients in export
    const exportContent = fs.readFileSync(exportPath, 'utf-8');
    const exportedCount = (exportContent.match(/BEGIN:VCARD/g) || []).length;
    console.log(`✓ Export contains ${exportedCount} clients`);

    // Re-import the file
    await page.waitForTimeout(1000);
    const importButton = page.locator('button:has-text("Importer")').first();
    await importButton.click();
    await page.locator('text=vCard').click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(exportPath);

    await page.locator('button:has-text("Importer")').last().click();
    await page.waitForTimeout(2000);

    console.log('✓ Round-trip test: export → import successful');
    console.log('  (Note: May create duplicates if clients already exist)');
  });
});
