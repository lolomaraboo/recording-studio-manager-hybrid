/**
 * Phase 3.10-02: Test Import/Export via API directe
 * Script pour tester import/export vCard/Excel/CSV
 */

import fs from 'fs/promises';
import path from 'path';

const API_URL = 'https://recording-studio-manager.com/api/trpc';

// Test credentials
const TEST_EMAIL = 'test@studio.com';
const TEST_PASSWORD = 'password123';

async function login(): Promise<string> {
  console.log('\n=== Login ===');
  const response = await fetch(`${API_URL}/auth.login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  // Extract session cookie
  const cookies = response.headers.get('set-cookie');
  console.log('✓ Login successful');
  return cookies || '';
}

async function testVCardImport(sessionCookie: string) {
  console.log('\n=== Test vCard Import ===');

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

  // Create FormData with vCard file
  const formData = new FormData();
  const blob = new Blob([vcardContent], { type: 'text/vcard' });
  formData.append('file', blob, 'test-import.vcf');

  const response = await fetch(`${API_URL}/clients.importVCard`, {
    method: 'POST',
    headers: {
      Cookie: sessionCookie,
    },
    body: formData,
  });

  if (!response.ok) {
    console.log('✗ vCard import failed:', response.status, await response.text());
    return false;
  }

  const result = await response.json();
  console.log('✓ vCard import successful:', result);
  return true;
}

async function testCSVImport(sessionCookie: string) {
  console.log('\n=== Test CSV Import ===');

  const csvContent = `name,type,firstName,lastName,phone,email,city,postalCode,country
"Emma Garcia",individual,Emma,Garcia,+33687654321,emma@mail.com,Toulouse,31000,France
"Productions Omega",company,,,+33467891234,info@omega.com,Montpellier,34000,France`;

  const formData = new FormData();
  const blob = new Blob([csvContent], { type: 'text/csv' });
  formData.append('file', blob, 'test-import.csv');

  const response = await fetch(`${API_URL}/clients.importCSV`, {
    method: 'POST',
    headers: {
      Cookie: sessionCookie,
    },
    body: formData,
  });

  if (!response.ok) {
    console.log('✗ CSV import failed:', response.status, await response.text());
    return false;
  }

  const result = await response.json();
  console.log('✓ CSV import successful:', result);
  return true;
}

async function testVCardExport(sessionCookie: string) {
  console.log('\n=== Test vCard Export ===');

  const response = await fetch(`${API_URL}/clients.exportVCard`, {
    method: 'POST',
    headers: {
      Cookie: sessionCookie,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clientIds: [] }), // Empty = export all
  });

  if (!response.ok) {
    console.log('✗ vCard export failed:', response.status);
    return false;
  }

  const vcardData = await response.text();

  // Verify vCard format
  if (!vcardData.includes('BEGIN:VCARD') || !vcardData.includes('VERSION:4.0')) {
    console.log('✗ Invalid vCard format');
    return false;
  }

  const vcardCount = (vcardData.match(/BEGIN:VCARD/g) || []).length;
  console.log(`✓ vCard export successful: ${vcardCount} client(s)`);

  // Save to file for inspection
  await fs.writeFile('/tmp/clients-export.vcf', vcardData);
  console.log('✓ Saved to /tmp/clients-export.vcf');

  return true;
}

async function testExcelExport(sessionCookie: string) {
  console.log('\n=== Test Excel Export ===');

  const response = await fetch(`${API_URL}/clients.exportExcel`, {
    method: 'POST',
    headers: {
      Cookie: sessionCookie,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clientIds: [] }),
  });

  if (!response.ok) {
    console.log('✗ Excel export failed:', response.status);
    return false;
  }

  const buffer = await response.arrayBuffer();
  console.log(`✓ Excel export successful: ${buffer.byteLength} bytes`);

  await fs.writeFile('/tmp/clients-export.xlsx', Buffer.from(buffer));
  console.log('✓ Saved to /tmp/clients-export.xlsx');

  return true;
}

async function testCSVExport(sessionCookie: string) {
  console.log('\n=== Test CSV Export ===');

  const response = await fetch(`${API_URL}/clients.exportCSV`, {
    method: 'POST',
    headers: {
      Cookie: sessionCookie,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ clientIds: [] }),
  });

  if (!response.ok) {
    console.log('✗ CSV export failed:', response.status);
    return false;
  }

  const csvData = await response.text();
  const lines = csvData.split('\n').filter(l => l.trim());

  console.log(`✓ CSV export successful: ${lines.length} lines`);

  await fs.writeFile('/tmp/clients-export.csv', csvData);
  console.log('✓ Saved to /tmp/clients-export.csv');

  return true;
}

async function testDownloadTemplate(sessionCookie: string) {
  console.log('\n=== Test Download Excel Template ===');

  const response = await fetch(`${API_URL}/clients.downloadExcelTemplate`, {
    method: 'POST',
    headers: {
      Cookie: sessionCookie,
    },
  });

  if (!response.ok) {
    console.log('✗ Template download failed:', response.status);
    return false;
  }

  const buffer = await response.arrayBuffer();
  console.log(`✓ Template download successful: ${buffer.byteLength} bytes`);

  await fs.writeFile('/tmp/clients-template.xlsx', Buffer.from(buffer));
  console.log('✓ Saved to /tmp/clients-template.xlsx');

  return true;
}

async function main() {
  console.log('🧪 Testing Import/Export vCard/Excel/CSV');
  console.log('==========================================');

  try {
    const sessionCookie = await login();

    const results = {
      vcardImport: await testVCardImport(sessionCookie),
      csvImport: await testCSVImport(sessionCookie),
      templateDownload: await testDownloadTemplate(sessionCookie),
      vcardExport: await testVCardExport(sessionCookie),
      excelExport: await testExcelExport(sessionCookie),
      csvExport: await testCSVExport(sessionCookie),
    };

    console.log('\n=== Test Results Summary ===');
    console.log('vCard Import:', results.vcardImport ? '✓ PASS' : '✗ FAIL');
    console.log('CSV Import:', results.csvImport ? '✓ PASS' : '✗ FAIL');
    console.log('Excel Template:', results.templateDownload ? '✓ PASS' : '✗ FAIL');
    console.log('vCard Export:', results.vcardExport ? '✓ PASS' : '✗ FAIL');
    console.log('Excel Export:', results.excelExport ? '✓ PASS' : '✗ FAIL');
    console.log('CSV Export:', results.csvExport ? '✓ PASS' : '✗ FAIL');

    const passCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.values(results).length;

    console.log(`\nTotal: ${passCount}/${totalCount} tests passed`);

    if (passCount === totalCount) {
      console.log('\n✅ All import/export tests PASSED');
      process.exit(0);
    } else {
      console.log('\n⚠️ Some tests FAILED');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

main();
