/**
 * Test script for quote PDF generation
 * Generates a PDF for a quote and saves it to /tmp/test-quote.pdf
 */

import { generateQuotePDF } from '../utils/quote-pdf-service';
import { writeFileSync } from 'fs';

async function testQuotePDF() {
  try {
    // Test with quote ID 1 and organization ID 1
    // This assumes test data exists in tenant_1 database
    console.log('Generating PDF for quote ID 1...');

    const pdfBuffer = await generateQuotePDF(1, 1);

    console.log(`PDF generated successfully! Size: ${pdfBuffer.length} bytes`);

    // Save to file for manual verification
    const outputPath = '/tmp/test-quote.pdf';
    writeFileSync(outputPath, pdfBuffer);

    console.log(`PDF saved to: ${outputPath}`);

    // Verify PDF magic number
    const magicNumber = pdfBuffer.toString('utf-8', 0, 4);
    if (magicNumber === '%PDF') {
      console.log('✅ PDF magic number verified: %PDF');
    } else {
      console.error('❌ Invalid PDF magic number:', magicNumber);
      process.exit(1);
    }

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error generating PDF:', error);
    process.exit(1);
  }
}

testQuotePDF();
