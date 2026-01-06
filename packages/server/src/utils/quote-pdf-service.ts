import PDFDocument from 'pdfkit';
import { getTenantDb } from '@rsm/database/connection';
import { quotes, type Quote, type QuoteItem, type Client } from '@rsm/database/tenant';
import { eq } from 'drizzle-orm';

/**
 * Generate a PDF for a quote
 * @param quoteId - The ID of the quote to generate PDF for
 * @param organizationId - The organization ID (for tenant DB access)
 * @returns Promise resolving to a Buffer containing the PDF data
 */
export const generateQuotePDF = async (quoteId: number, organizationId: number): Promise<Buffer> => {
  const tenantDb = await getTenantDb(organizationId);

  // Fetch quote with items and client
  const quote = await tenantDb.query.quotes.findFirst({
    where: eq(quotes.id, quoteId),
    with: {
      items: {
        orderBy: (items, { asc }) => [asc(items.displayOrder)],
      },
      client: true,
    },
  }) as (Quote & { items: QuoteItem[]; client: Client }) | undefined;

  if (!quote) {
    throw new Error('Quote not found');
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header - Quote Title
    doc.fontSize(24).text('QUOTE', { align: 'center' });
    doc.moveDown(0.5);

    // Quote metadata
    doc.fontSize(10);
    doc.text(`Quote Number: ${quote.quoteNumber}`, 50, doc.y);
    doc.text(`Date: ${quote.createdAt.toLocaleDateString('en-GB')}`, { align: 'right' });

    if (quote.expiresAt) {
      doc.moveDown(0.3);
      doc.text(`Valid Until: ${quote.expiresAt.toLocaleDateString('en-GB')}`, 50, doc.y);
      doc.text(`Status: ${quote.status.replace(/_/g, ' ').toUpperCase()}`, { align: 'right' });
    }

    doc.moveDown(1.5);

    // Client info section
    doc.fontSize(12).text('Bill To:', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10);
    doc.text(quote.client.name);

    if (quote.client.email) {
      doc.text(`Email: ${quote.client.email}`);
    }

    if (quote.client.phone) {
      doc.text(`Phone: ${quote.client.phone}`);
    }

    doc.moveDown(1.5);

    // Items table header
    const tableTop = doc.y;
    const descriptionX = 50;
    const qtyX = 300;
    const priceX = 350;
    const amountX = 450;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Description', descriptionX, tableTop, { width: 240 });
    doc.text('Qty', qtyX, tableTop, { width: 40, align: 'right' });
    doc.text('Price', priceX, tableTop, { width: 80, align: 'right' });
    doc.text('Amount', amountX, tableTop, { width: 95, align: 'right' });

    // Draw line under header
    doc.moveTo(descriptionX, tableTop + 15)
       .lineTo(545, tableTop + 15)
       .stroke();

    // Items table body
    let position = tableTop + 25;
    doc.font('Helvetica');

    quote.items.forEach((item) => {
      // Check if we need a new page
      if (position > 700) {
        doc.addPage();
        position = 50;
      }

      // Item description (may wrap)
      const descriptionHeight = doc.heightOfString(item.description, { width: 240 });
      doc.text(item.description, descriptionX, position, { width: 240 });

      // Align other columns to the top of the description
      doc.text(item.quantity.toString(), qtyX, position, { width: 40, align: 'right' });
      doc.text(`€${parseFloat(item.unitPrice).toFixed(2)}`, priceX, position, { width: 80, align: 'right' });
      doc.text(`€${parseFloat(item.amount).toFixed(2)}`, amountX, position, { width: 95, align: 'right' });

      position += Math.max(descriptionHeight, 15) + 5;
    });

    // Add some space before totals
    position += 10;

    // Draw line above totals
    doc.moveTo(priceX, position)
       .lineTo(545, position)
       .stroke();

    position += 10;

    // Totals section
    doc.font('Helvetica');

    // Subtotal
    doc.text('Subtotal:', priceX, position, { width: 80, align: 'right' });
    doc.text(`€${parseFloat(quote.subtotal).toFixed(2)}`, amountX, position, { width: 95, align: 'right' });
    position += 18;

    // Tax
    doc.text(`Tax (${parseFloat(quote.taxRate).toFixed(0)}%):`, priceX, position, { width: 80, align: 'right' });
    doc.text(`€${parseFloat(quote.taxAmount).toFixed(2)}`, amountX, position, { width: 95, align: 'right' });
    position += 18;

    // Total (bold)
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('Total:', priceX, position, { width: 80, align: 'right' });
    doc.text(`€${parseFloat(quote.total).toFixed(2)}`, amountX, position, { width: 95, align: 'right' });

    position += 30;
    doc.font('Helvetica').fontSize(10);

    // Terms & Conditions
    if (quote.terms) {
      // Check if we need a new page
      if (position > 650) {
        doc.addPage();
        position = 50;
      }

      doc.fontSize(11).font('Helvetica-Bold');
      doc.text('Terms & Conditions:', descriptionX, position, { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(9);
      doc.text(quote.terms, descriptionX, doc.y, { width: 495, align: 'left' });
      position = doc.y + 15;
    }

    // Notes (client-visible)
    if (quote.notes) {
      // Check if we need a new page
      if (position > 650) {
        doc.addPage();
        position = 50;
      }

      doc.fontSize(11).font('Helvetica-Bold');
      doc.text('Notes:', descriptionX, position, { underline: true });
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(9);
      doc.text(quote.notes, descriptionX, doc.y, { width: 495, align: 'left' });
    }

    doc.end();
  });
};
