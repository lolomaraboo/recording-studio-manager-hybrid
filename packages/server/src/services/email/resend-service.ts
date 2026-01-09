import { Resend } from 'resend';
import { render } from '@react-email/render';
import { InvoiceEmail } from '../../emails/InvoiceEmail';
import type { Invoice, InvoiceItem } from '@rsm/database/tenant';
import type { Client } from '@rsm/database/tenant';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface InvoiceWithLineItems extends Invoice {
  client: Client;
  items: InvoiceItem[];
}

export interface SendInvoiceEmailParams {
  to: string;
  subject: string;
  invoiceData: InvoiceWithLineItems;
  pdfBuffer?: Buffer; // Optional PDF attachment
}

/**
 * Send invoice email via Resend
 *
 * @param params - Email parameters including recipient, subject, invoice data, and optional PDF
 * @returns Resend email response
 * @throws Error if email send fails
 */
export async function sendInvoiceEmail(params: SendInvoiceEmailParams) {
  const { to, subject, invoiceData, pdfBuffer } = params;

  // Render React Email component to HTML
  const html = await render(InvoiceEmail({ invoice: invoiceData }));

  const { data, error } = await resend.emails.send({
    from: `${process.env.STUDIO_NAME || 'Recording Studio'} <invoices@${process.env.EMAIL_DOMAIN || 'recording-studio-manager.com'}>`,
    to,
    subject,
    html,
    attachments: pdfBuffer ? [
      {
        filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    ] : [],
  });

  if (error) {
    throw new Error(`Email send failed: ${error.message}`);
  }

  return data;
}
