/**
 * PDF Generation Module
 *
 * Uses pdfkit to generate professional PDF documents for:
 * - Quotes/Estimates
 * - Invoices
 * - Contracts
 */

import PDFDocument from 'pdfkit';

interface CompanyInfo {
  name: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  website?: string;
  logoPath?: string;
}

interface ClientInfo {
  name: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface QuoteData {
  quoteNumber: string;
  title: string;
  description?: string;
  issueDate: Date;
  validUntil: Date;
  client: ClientInfo;
  items: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  terms?: string;
  notes?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  client: ClientInfo;
  items: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  isPaid?: boolean;
  paidAt?: Date;
}

interface ContractData {
  contractNumber: string;
  title: string;
  client: ClientInfo;
  content: string;
  effectiveDate?: Date;
  expirationDate?: Date;
}

// Default company info (should be overridden per tenant)
const DEFAULT_COMPANY: CompanyInfo = {
  name: 'Studio Pro Recording',
  address: '123 Music Street',
  city: 'Los Angeles, CA 90001',
  phone: '+1 (555) 123-4567',
  email: 'contact@studiopro.com',
  website: 'www.studiopro.com',
};

/**
 * Generate a professional quote PDF
 */
export function generateQuotePDF(
  data: QuoteData,
  company: CompanyInfo = DEFAULT_COMPANY
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(company.name, 50, 50);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(company.address, 50, 80)
        .text(company.city, 50, 95);

      if (company.phone) {
        doc.text(`Tel: ${company.phone}`, 50, 110);
      }
      if (company.email) {
        doc.text(`Email: ${company.email}`, 50, 125);
      }

      // Quote title
      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#6b21a8') // Purple
        .text('QUOTE', 400, 50, { align: 'right' });

      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#000000')
        .text(`#${data.quoteNumber}`, 400, 85, { align: 'right' });

      // Quote details
      doc
        .fontSize(10)
        .text(`Issue Date: ${formatDate(data.issueDate)}`, 400, 105, { align: 'right' })
        .text(`Valid Until: ${formatDate(data.validUntil)}`, 400, 120, { align: 'right' });

      // Divider
      doc
        .moveTo(50, 155)
        .lineTo(545, 155)
        .strokeColor('#e5e7eb')
        .stroke();

      // Client info
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('Bill To:', 50, 175);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(data.client.name, 50, 195);

      if (data.client.email) {
        doc.text(data.client.email, 50, 210);
      }
      if (data.client.address) {
        doc.text(data.client.address, 50, 225);
      }
      if (data.client.city) {
        doc.text(`${data.client.city}${data.client.country ? ', ' + data.client.country : ''}`, 50, 240);
      }

      // Quote title and description
      if (data.title) {
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(`Project: ${data.title}`, 50, 275);
      }

      if (data.description) {
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(data.description, 50, 295, { width: 495 });
      }

      // Items table
      let yPos = data.description ? 330 : 295;

      // Table header
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#ffffff');

      doc
        .rect(50, yPos, 495, 25)
        .fill('#6b21a8');

      doc
        .fillColor('#ffffff')
        .text('Description', 55, yPos + 8, { width: 250 })
        .text('Qty', 310, yPos + 8, { width: 50, align: 'center' })
        .text('Unit Price', 365, yPos + 8, { width: 80, align: 'right' })
        .text('Amount', 450, yPos + 8, { width: 90, align: 'right' });

      yPos += 25;

      // Table rows
      doc.font('Helvetica').fillColor('#000000');

      data.items.forEach((item, index) => {
        const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
        doc.rect(50, yPos, 495, 25).fill(bgColor);

        doc
          .fillColor('#000000')
          .text(item.description, 55, yPos + 8, { width: 250 })
          .text(item.quantity.toString(), 310, yPos + 8, { width: 50, align: 'center' })
          .text(formatCurrency(item.unitPrice), 365, yPos + 8, { width: 80, align: 'right' })
          .text(formatCurrency(item.amount), 450, yPos + 8, { width: 90, align: 'right' });

        yPos += 25;
      });

      // Totals
      yPos += 10;
      doc
        .fontSize(10)
        .text('Subtotal:', 365, yPos, { width: 80, align: 'right' })
        .text(formatCurrency(data.subtotal), 450, yPos, { width: 90, align: 'right' });

      yPos += 18;
      doc
        .text(`Tax (${data.taxRate}%):`, 365, yPos, { width: 80, align: 'right' })
        .text(formatCurrency(data.taxAmount), 450, yPos, { width: 90, align: 'right' });

      yPos += 18;
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('Total:', 365, yPos, { width: 80, align: 'right' })
        .fillColor('#6b21a8')
        .text(formatCurrency(data.total), 450, yPos, { width: 90, align: 'right' });

      // Terms & conditions
      if (data.terms) {
        yPos += 50;
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Terms & Conditions:', 50, yPos);

        doc
          .fontSize(9)
          .font('Helvetica')
          .text(data.terms, 50, yPos + 15, { width: 495 });
      }

      // Notes
      if (data.notes) {
        yPos += data.terms ? 80 : 50;
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Notes:', 50, yPos);

        doc
          .fontSize(9)
          .font('Helvetica')
          .text(data.notes, 50, yPos + 15, { width: 495 });
      }

      // Footer
      doc
        .fontSize(8)
        .fillColor('#9ca3af')
        .text(
          'This quote is valid for acceptance until the date specified above.',
          50,
          750,
          { align: 'center', width: 495 }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a professional invoice PDF
 */
export function generateInvoicePDF(
  data: InvoiceData,
  company: CompanyInfo = DEFAULT_COMPANY
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(company.name, 50, 50);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(company.address, 50, 80)
        .text(company.city, 50, 95);

      // Invoice title
      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .fillColor(data.isPaid ? '#16a34a' : '#6b21a8')
        .text(data.isPaid ? 'PAID' : 'INVOICE', 400, 50, { align: 'right' });

      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#000000')
        .text(`#${data.invoiceNumber}`, 400, 85, { align: 'right' });

      doc
        .fontSize(10)
        .text(`Issue Date: ${formatDate(data.issueDate)}`, 400, 105, { align: 'right' })
        .text(`Due Date: ${formatDate(data.dueDate)}`, 400, 120, { align: 'right' });

      if (data.isPaid && data.paidAt) {
        doc.text(`Paid: ${formatDate(data.paidAt)}`, 400, 135, { align: 'right' });
      }

      // Divider
      doc
        .moveTo(50, 160)
        .lineTo(545, 160)
        .strokeColor('#e5e7eb')
        .stroke();

      // Client info
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('Bill To:', 50, 180);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(data.client.name, 50, 200);

      if (data.client.email) {
        doc.text(data.client.email, 50, 215);
      }

      // Items table
      let yPos = 260;

      // Table header
      doc
        .fontSize(10)
        .font('Helvetica-Bold');

      doc
        .rect(50, yPos, 495, 25)
        .fill('#6b21a8');

      doc
        .fillColor('#ffffff')
        .text('Description', 55, yPos + 8, { width: 250 })
        .text('Qty', 310, yPos + 8, { width: 50, align: 'center' })
        .text('Unit Price', 365, yPos + 8, { width: 80, align: 'right' })
        .text('Amount', 450, yPos + 8, { width: 90, align: 'right' });

      yPos += 25;

      // Table rows
      doc.font('Helvetica').fillColor('#000000');

      data.items.forEach((item, index) => {
        const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
        doc.rect(50, yPos, 495, 25).fill(bgColor);

        doc
          .fillColor('#000000')
          .text(item.description, 55, yPos + 8, { width: 250 })
          .text(item.quantity.toString(), 310, yPos + 8, { width: 50, align: 'center' })
          .text(formatCurrency(item.unitPrice), 365, yPos + 8, { width: 80, align: 'right' })
          .text(formatCurrency(item.amount), 450, yPos + 8, { width: 90, align: 'right' });

        yPos += 25;
      });

      // Totals
      yPos += 10;
      doc
        .fontSize(10)
        .text('Subtotal:', 365, yPos, { width: 80, align: 'right' })
        .text(formatCurrency(data.subtotal), 450, yPos, { width: 90, align: 'right' });

      yPos += 18;
      doc
        .text(`Tax (${data.taxRate}%):`, 365, yPos, { width: 80, align: 'right' })
        .text(formatCurrency(data.taxAmount), 450, yPos, { width: 90, align: 'right' });

      yPos += 18;
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .text('Total:', 365, yPos, { width: 80, align: 'right' })
        .fillColor(data.isPaid ? '#16a34a' : '#6b21a8')
        .text(formatCurrency(data.total), 450, yPos, { width: 90, align: 'right' });

      // Notes
      if (data.notes) {
        yPos += 50;
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Notes:', 50, yPos);

        doc
          .fontSize(9)
          .font('Helvetica')
          .text(data.notes, 50, yPos + 15, { width: 495 });
      }

      // Footer
      doc
        .fontSize(8)
        .fillColor('#9ca3af')
        .text(
          'Thank you for your business!',
          50,
          750,
          { align: 'center', width: 495 }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a contract PDF
 */
export function generateContractPDF(
  data: ContractData,
  company: CompanyInfo = DEFAULT_COMPANY
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(company.name, 50, 50, { align: 'center' });

      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#6b21a8')
        .text('CONTRACT', 50, 85, { align: 'center' });

      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#000000')
        .text(`Contract #${data.contractNumber}`, 50, 115, { align: 'center' });

      // Divider
      doc
        .moveTo(50, 140)
        .lineTo(545, 140)
        .strokeColor('#e5e7eb')
        .stroke();

      // Title
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(data.title, 50, 160, { align: 'center' });

      // Parties
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Between:', 50, 200);

      doc
        .fontSize(11)
        .font('Helvetica')
        .text(`${company.name} ("The Company")`, 70, 220)
        .text('and', 50, 240, { align: 'center' })
        .text(`${data.client.name} ("The Client")`, 70, 260);

      if (data.client.email) {
        doc.text(`Email: ${data.client.email}`, 70, 280);
      }

      // Dates
      if (data.effectiveDate || data.expirationDate) {
        doc.font('Helvetica-Bold').text('Term:', 50, 315);
        doc.font('Helvetica');
        if (data.effectiveDate) {
          doc.text(`Effective Date: ${formatDate(data.effectiveDate)}`, 70, 335);
        }
        if (data.expirationDate) {
          doc.text(`Expiration Date: ${formatDate(data.expirationDate)}`, 70, 355);
        }
      }

      // Content
      const contentY = data.effectiveDate || data.expirationDate ? 390 : 315;
      doc
        .fontSize(11)
        .font('Helvetica')
        .text(data.content, 50, contentY, { width: 495, align: 'justify' });

      // Signature blocks
      const sigY = 650;
      doc
        .moveTo(50, sigY)
        .lineTo(200, sigY)
        .stroke();

      doc
        .moveTo(350, sigY)
        .lineTo(500, sigY)
        .stroke();

      doc
        .fontSize(10)
        .text('Company Representative', 50, sigY + 5)
        .text(company.name, 50, sigY + 20)
        .text('Date: ____________', 50, sigY + 35);

      doc
        .text('Client Signature', 350, sigY + 5)
        .text(data.client.name, 350, sigY + 20)
        .text('Date: ____________', 350, sigY + 35);

      // Footer
      doc
        .fontSize(8)
        .fillColor('#9ca3af')
        .text(
          `Contract #${data.contractNumber} - Generated ${formatDate(new Date())}`,
          50,
          780,
          { align: 'center', width: 495 }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Helper functions
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export type { CompanyInfo, ClientInfo, LineItem, QuoteData, InvoiceData, ContractData };
