# Phase 17: Facturation Automatique - Stripe & UI
## Level 2 Discovery Report

**Date:** 2026-01-09
**Research Duration:** 30 minutes
**Researcher:** Claude Sonnet 4.5

---

## Executive Summary

This discovery covers four critical topics for implementing invoice payment flows with Stripe, email notifications, and PDF generation. Research focused on 2025 best practices, comparing alternatives, and identifying recommended approaches.

**Key Recommendations:**
- ✅ **Stripe Checkout Sessions** for invoice payments (preferred over Payment Links)
- ✅ **Webhook Events:** `checkout.session.completed` + `payment_intent.succeeded`
- ✅ **Email Service:** Resend (developer-friendly, React Email integration)
- ✅ **PDF Generation:** PDFKit (programmatic control) or Puppeteer (HTML templates)
- ✅ **PDF Storage:** AWS S3 (industry standard over filesystem)

---

## 1. Stripe Checkout Sessions for Invoice Payments

### Recommended Approach: Checkout Sessions API with Invoice Creation

**Implementation Pattern:**
```typescript
// Create Checkout Session for existing invoice
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: invoiceLineItems, // From Phase 16 invoice data
  customer: stripeCustomerId,
  metadata: {
    invoiceId: invoice.id.toString(),
    organizationId: ctx.organizationId.toString(),
    tenantDb: 'tenant_X',
  },
  invoice_creation: {
    enabled: true, // Generate Stripe invoice post-payment
  },
  success_url: `https://yourdomain.com/invoices/{CHECKOUT_SESSION_ID}/success`,
  cancel_url: `https://yourdomain.com/invoices/${invoice.id}/payment-cancelled`,
});
```

**Key Features:**
- ✅ Supports 100 line items (consolidate if more)
- ✅ Metadata tracks your internal invoice ID
- ✅ `invoice_creation.enabled` generates post-payment invoice PDF automatically
- ✅ Create new session per payment attempt (don't reuse)

### Handling Partial Payments (Deposits)

Stripe supports partial payments for invoices with specific configuration:

**Dashboard Method:**
- Click "Charge customer" on invoice details page
- Update amount to less than total (e.g., 30% deposit)
- Remaining balance stays visible on invoice

**Payment Plans (for multi-installment):**
- Select "Request in Multiple Payments" in invoice editor
- Default: 4 equal payments over 4 months
- Use "Use as deposit" to label first payment as deposit
- Subsequent payments auto-adjust to remaining balance

**Important Limitations:**
- ⚠️ Partial payments NOT supported for auto-charged subscription invoices
- ⚠️ Payment plans NOT compatible with Stripe Revenue Recognition
- ⚠️ Overpayments automatically credit customer balance

**For Recording Studio Manager:**
Since Phase 16 implements deposit calculation (e.g., 30% upfront), recommended approach:
1. Create Checkout Session with deposit amount only (not full invoice total)
2. Store `amountPaid` and `balance` in your invoice table
3. After deposit payment succeeds, update invoice status to `PARTIALLY_PAID`
4. When balance is paid, create new Checkout Session for remaining amount
5. Update status to `PAID` when `amountPaid >= totalAmount`

### Pros/Cons

**Checkout Sessions Pros:**
- ✅ Hosted payment page (no PCI compliance burden)
- ✅ Built-in support for 40+ payment methods
- ✅ Automatic invoice PDF generation
- ✅ 2025 update: Integrates with Billing, Tax, Adaptive Pricing with one line
- ✅ Metadata allows tracking your internal invoice ID
- ✅ Handles partial payments natively

**Checkout Sessions Cons:**
- ❌ Redirects user away from your app (breaks UX flow)
- ❌ Less UI customization than Payment Element
- ❌ Session expires after 24 hours (need regeneration)

**Alternative: Payment Links**
- ✅ No-code solution (shareable URL)
- ✅ Post-payment invoice generation
- ❌ Less programmatic control (can't pass metadata easily)
- ❌ Better for simple one-time payments, not complex invoices

**Alternative: Payment Element (embedded)**
- ✅ Fully customizable UI in your app
- ✅ No redirect (better UX)
- ❌ More complex implementation (requires Payment Intent API)
- ❌ You handle more payment logic

**Recommendation:** Use **Checkout Sessions** for MVP (faster implementation, lower risk). Consider migrating to Payment Element in Phase 18+ if embedded UX becomes critical.

---

## 2. Webhook Handling for Invoice Payments

### Recommended Events to Listen For

**Primary Events:**
1. `checkout.session.completed` - Fires when Checkout Session completes (user paid)
2. `payment_intent.succeeded` - Fires when payment succeeds (for delayed payment methods like SEPA)
3. `payment_intent.payment_failed` - Fires when payment fails (card declined, etc.)

**Optional Events (for advanced flows):**
4. `invoice.paid` - If using Stripe Invoicing API directly
5. `invoice.payment_failed` - For retry/dunning logic

### Idempotency Pattern (CRITICAL)

**Problem:** Stripe may send the same webhook multiple times due to network issues or retries.

**Solution:** Store processed event IDs to prevent duplicate actions.

**Implementation Pattern:**
```typescript
// Webhook handler
app.post('/api/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

  // 1. Check if event already processed (idempotency)
  const masterDb = getMasterDb();
  const existingEvent = await masterDb.query.stripeWebhookEvents.findFirst({
    where: eq(stripeWebhookEvents.eventId, event.id),
  });

  if (existingEvent) {
    console.log(`Event ${event.id} already processed, skipping`);
    return res.json({ received: true }); // ACK to Stripe
  }

  // 2. Process event based on type
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const invoiceId = parseInt(session.metadata.invoiceId);
      const organizationId = parseInt(session.metadata.organizationId);

      // Get tenant DB
      const tenantDb = await getTenantDb(organizationId);

      // Update invoice status atomically
      await tenantDb.update(invoices)
        .set({
          status: 'PAID',
          paidAt: new Date(),
          stripePaymentIntentId: session.payment_intent,
          stripeCheckoutSessionId: session.id,
        })
        .where(eq(invoices.id, invoiceId));

      // Trigger email notification (see Section 3)
      await sendInvoicePaidEmail(invoiceId, organizationId);

      break;
    }

    case 'payment_intent.succeeded': {
      // Handle delayed payment methods (SEPA, bank transfers)
      const paymentIntent = event.data.object;
      // Extract invoiceId from metadata
      break;
    }

    case 'payment_intent.payment_failed': {
      // Handle failed payments
      const paymentIntent = event.data.object;
      // Update invoice status to PAYMENT_FAILED
      // Trigger failure email
      break;
    }
  }

  // 3. Record event as processed (idempotency table)
  await masterDb.insert(stripeWebhookEvents).values({
    eventId: event.id,
    eventType: event.type,
    processedAt: new Date(),
  });

  res.json({ received: true });
});
```

**Idempotency Table Schema:**
```typescript
export const stripeWebhookEvents = pgTable('stripe_webhook_events', {
  id: serial('id').primaryKey(),
  eventId: text('event_id').notNull().unique(), // Stripe event.id
  eventType: text('event_type').notNull(),
  processedAt: timestamp('processed_at').notNull().defaultNow(),
});
```

### Webhook Best Practices (2025)

1. **Signature Verification:** Always verify `stripe-signature` header to prevent spoofing
2. **Raw Body Required:** Express needs `express.raw()` middleware for webhook endpoint
3. **ACK Within 5 Seconds:** Respond with `200 OK` quickly, process async if needed
4. **Retry Logic:** Stripe retries failed webhooks up to 3 days (exponential backoff)
5. **Test with Stripe CLI:** Use `stripe listen --forward-to localhost:3001/api/webhooks/stripe`

### Pros/Cons

**Webhooks Pros:**
- ✅ Real-time payment status updates
- ✅ Handles delayed payment methods automatically
- ✅ Reliable retry mechanism (Stripe-side)
- ✅ Event-driven architecture (decoupled)

**Webhooks Cons:**
- ❌ Requires HTTPS endpoint (can't test on localhost without Stripe CLI)
- ❌ Need idempotency handling (duplicate events)
- ❌ Ordering not guaranteed (race conditions possible)
- ❌ Debugging harder than polling

**Alternative: Polling**
- ✅ Simpler implementation (no webhook endpoint)
- ❌ Not real-time (delays in status updates)
- ❌ API rate limits if polling too frequently
- ❌ Not recommended by Stripe

**Recommendation:** Use **webhooks** for production (industry standard). Add idempotency table to prevent duplicate processing.

---

## 3. Email Notification Patterns

### Recommended Service: Resend

**Why Resend for Recording Studio Manager:**
- ✅ **React Email Integration:** You're already using React - reuse components for emails
- ✅ **Developer-First:** Clean API, simple setup, fast onboarding
- ✅ **Pricing:** Free tier = 3,000 emails/month (sufficient for MVP)
- ✅ **Modern Stack:** Built by creators of React Email framework
- ✅ **TypeScript Support:** Native TypeScript SDK

**When to Send Emails:**

| Trigger | Email Type | Timing |
|---------|-----------|--------|
| Invoice created (auto-generated) | Invoice notification | Immediate |
| Checkout Session completed | Payment confirmation | webhook: `checkout.session.completed` |
| Payment Intent succeeded | Payment received | webhook: `payment_intent.succeeded` |
| Payment Intent failed | Payment failed | webhook: `payment_intent.payment_failed` |
| Deposit paid (partial) | Deposit confirmation + balance reminder | webhook: `checkout.session.completed` |

**Implementation Pattern:**
```typescript
import { Resend } from 'resend';
import { InvoiceEmail } from './emails/InvoiceEmail'; // React Email component

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendInvoicePaidEmail(invoiceId: number, organizationId: number) {
  const tenantDb = await getTenantDb(organizationId);
  const invoice = await tenantDb.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
    with: { client: true, lineItems: true },
  });

  // Generate PDF (see Section 4)
  const pdfBuffer = await generateInvoicePDF(invoice);

  // Send email with PDF attachment
  await resend.emails.send({
    from: 'invoices@yourstudio.com',
    to: invoice.client.email,
    subject: `Invoice #${invoice.invoiceNumber} - Payment Received`,
    react: InvoiceEmail({ invoice }), // React component
    attachments: [
      {
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
}
```

**React Email Component Example:**
```tsx
// emails/InvoiceEmail.tsx
import { Html, Head, Body, Container, Heading, Text, Button } from '@react-email/components';

export function InvoiceEmail({ invoice }) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif' }}>
        <Container>
          <Heading>Payment Received</Heading>
          <Text>
            Thank you for your payment of €{invoice.totalAmount.toFixed(2)}.
          </Text>
          <Text>
            Invoice #{invoice.invoiceNumber} is now marked as paid.
          </Text>
          <Button href={`https://yourstudio.com/invoices/${invoice.id}`}>
            View Invoice
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

### Service Comparison

| Feature | Resend | SendGrid | Mailgun |
|---------|--------|----------|---------|
| **Free Tier** | 3,000/month | 100/day | 5,000/month (trial) |
| **Paid Start** | $20/month (50k) | $20/month (50k) | $15/month (10k) |
| **React Email** | ✅ Native | ❌ Manual | ❌ Manual |
| **Developer UX** | ✅✅✅ Excellent | ⚠️ Complex | ✅ Good |
| **Marketing Features** | ❌ Transactional only | ✅ Full suite | ⚠️ Limited |
| **Maturity** | ⚠️ Newer (2023) | ✅ Established | ✅ Established |
| **TypeScript SDK** | ✅ Native | ✅ Available | ✅ Available |

**Recommendation:** Use **Resend** for transactional emails (invoices, receipts). If you need marketing automation later (newsletters, campaigns), consider SendGrid.

**Alternative: SendGrid**
- ✅ Most comprehensive features (A/B testing, segmentation)
- ✅ Battle-tested by Uber, Booking.com
- ❌ More complex API (steeper learning curve)
- ❌ Overkill for pure transactional emails

**Alternative: Mailgun**
- ✅ Developer-focused (like Resend)
- ✅ Established since 2010 (used by Lyft, Wikipedia)
- ❌ No native React Email integration
- ❌ Dedicated IPs only at $90/month tier

---

## 4. Invoice PDF Generation

### Recommended Approaches (Two Options)

#### Option A: PDFKit (Programmatic Control) ✅ RECOMMENDED FOR MVP

**Why PDFKit:**
- ✅ Full control over layout and styling
- ✅ Lightweight (no Chromium dependency)
- ✅ Well-maintained since 2010+ (mature library)
- ✅ Low resource usage (fast generation)
- ✅ Deterministic output (no browser quirks)

**Implementation Pattern:**
```typescript
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

async function generateInvoicePDF(invoice: InvoiceWithRelations): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];

    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);

    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('INVOICE', { align: 'right' });
    doc.fontSize(10).text(`#${invoice.invoiceNumber}`, { align: 'right' });
    doc.moveDown();

    // Billing info
    doc.fontSize(12).text('Bill To:');
    doc.fontSize(10).text(invoice.client.name);
    doc.text(invoice.client.email);
    doc.moveDown();

    // Line items table
    doc.fontSize(10);
    const tableTop = 250;
    let y = tableTop;

    // Table headers
    doc.text('Description', 50, y);
    doc.text('Hours', 300, y);
    doc.text('Rate', 380, y);
    doc.text('Amount', 480, y, { align: 'right' });

    y += 20;
    doc.moveTo(50, y).lineTo(550, y).stroke(); // Line under headers
    y += 10;

    // Line items
    invoice.lineItems.forEach((item) => {
      doc.text(item.description, 50, y);
      doc.text(item.quantity.toString(), 300, y);
      doc.text(`€${item.unitPrice.toFixed(2)}`, 380, y);
      doc.text(`€${item.totalAmount.toFixed(2)}`, 480, y, { align: 'right' });
      y += 20;
    });

    // Totals
    y += 10;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 20;
    doc.text('Subtotal:', 380, y);
    doc.text(`€${invoice.subtotalAmount.toFixed(2)}`, 480, y, { align: 'right' });
    y += 20;
    doc.text(`Tax (${invoice.taxRate}%):`, 380, y);
    doc.text(`€${invoice.taxAmount.toFixed(2)}`, 480, y, { align: 'right' });
    y += 20;
    doc.fontSize(12).text('Total:', 380, y);
    doc.text(`€${invoice.totalAmount.toFixed(2)}`, 480, y, { align: 'right' });

    // Footer
    doc.fontSize(8).text('Thank you for your business!', 50, 750, { align: 'center' });

    doc.end();
  });
}
```

**Pros:**
- ✅ Full layout control (pixel-perfect positioning)
- ✅ Fast generation (< 100ms per invoice)
- ✅ Low memory footprint
- ✅ Works in serverless environments (AWS Lambda)

**Cons:**
- ❌ Manual layout calculations (x, y coordinates)
- ❌ No CSS styling (programmatic only)
- ❌ Complex layouts require more code

---

#### Option B: Puppeteer (HTML Templates) 🎨 RECOMMENDED FOR COMPLEX DESIGNS

**Why Puppeteer:**
- ✅ Reuse existing HTML/CSS skills
- ✅ Perfect for complex, branded invoices
- ✅ Pixel-perfect browser rendering
- ✅ Can render React components server-side

**Implementation Pattern:**
```typescript
import puppeteer from 'puppeteer';
import { renderToStaticMarkup } from 'react-dom/server';
import { InvoicePDFTemplate } from './templates/InvoicePDFTemplate';

async function generateInvoicePDF(invoice: InvoiceWithRelations): Promise<Buffer> {
  // Render React component to HTML
  const html = renderToStaticMarkup(<InvoicePDFTemplate invoice={invoice} />);

  // Launch headless browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Generate PDF
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
  });

  await browser.close();
  return pdfBuffer;
}
```

**React Template Component:**
```tsx
// templates/InvoicePDFTemplate.tsx
export function InvoicePDFTemplate({ invoice }) {
  return (
    <html>
      <head>
        <style>{`
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { display: flex; justify-content: space-between; }
          .invoice-number { font-size: 24px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
          .total { font-size: 18px; font-weight: bold; text-align: right; }
        `}</style>
      </head>
      <body>
        <div className="header">
          <div>
            <h1>Your Studio Name</h1>
            <p>123 Music Lane, Paris</p>
          </div>
          <div>
            <div className="invoice-number">INVOICE #{invoice.invoiceNumber}</div>
            <p>Date: {new Date(invoice.issueDate).toLocaleDateString()}</p>
          </div>
        </div>

        <h2>Bill To:</h2>
        <p>{invoice.client.name}</p>
        <p>{invoice.client.email}</p>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Hours</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item) => (
              <tr key={item.id}>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>€{item.unitPrice.toFixed(2)}</td>
                <td>€{item.totalAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="total">
          <p>Subtotal: €{invoice.subtotalAmount.toFixed(2)}</p>
          <p>Tax ({invoice.taxRate}%): €{invoice.taxAmount.toFixed(2)}</p>
          <p>Total: €{invoice.totalAmount.toFixed(2)}</p>
        </div>
      </body>
    </html>
  );
}
```

**Pros:**
- ✅ Familiar HTML/CSS workflow
- ✅ Complex layouts easy to build
- ✅ Can reuse React components
- ✅ Print-ready output

**Cons:**
- ❌ High resource usage (Chromium = ~200MB RAM per instance)
- ❌ Slower generation (500ms - 2s per invoice)
- ❌ Not ideal for serverless (Chromium binary size)
- ❌ Requires `puppeteer` dependency (~300MB installed)

---

### Library Comparison

| Feature | PDFKit | Puppeteer | React-PDF |
|---------|--------|-----------|-----------|
| **Learning Curve** | Medium | Low (if you know HTML/CSS) | Medium (React syntax) |
| **Performance** | ✅✅✅ Fast (<100ms) | ⚠️ Slower (500ms-2s) | ✅✅ Fast (~200ms) |
| **Memory Usage** | ✅ Low (~20MB) | ❌ High (~200MB) | ✅ Low (~30MB) |
| **Serverless** | ✅ Excellent | ⚠️ Challenging | ✅ Excellent |
| **Layout Control** | ✅ Programmatic | ✅✅✅ CSS | ✅ React components |
| **Complex Designs** | ⚠️ Manual calculations | ✅✅✅ Easy | ✅✅ Moderate |
| **Maintenance** | ✅ Stable (2010+) | ✅ Active | ✅ Active |

**React-PDF Note:**
- Uses PDFKit under the hood
- React component syntax for PDF generation
- Good middle ground between PDFKit and Puppeteer
- Slightly steeper learning curve (custom components like `<Document>`, `<Page>`, `<Text>`)

---

### PDF Storage Recommendations

#### Recommended: AWS S3 (or S3-Compatible Storage)

**Why S3:**
- ✅ **Scalability:** Auto-scales, no disk space limits
- ✅ **Cost-Effective:** Pay only for storage used (~$0.023/GB/month)
- ✅ **Durability:** 99.999999999% durability (11 nines)
- ✅ **Security:** Server-side encryption (SSE), private buckets
- ✅ **Critical for Cloud:** Required for ephemeral infrastructure (Heroku, Docker, serverless)

**Implementation Pattern:**
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: 'eu-west-3' }); // Paris

async function storeInvoicePDF(invoiceId: number, pdfBuffer: Buffer): Promise<string> {
  const key = `invoices/${invoiceId}/${Date.now()}-invoice.pdf`;

  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: pdfBuffer,
    ContentType: 'application/pdf',
    ServerSideEncryption: 'AES256', // Encrypt at rest
    Metadata: {
      invoiceId: invoiceId.toString(),
    },
  }));

  return `https://${process.env.S3_BUCKET_NAME}.s3.eu-west-3.amazonaws.com/${key}`;
}
```

**S3 Best Practices:**
1. **Private Buckets:** Never make invoice bucket public
2. **Signed URLs:** Generate temporary URLs for client access
3. **Versioning:** Enable S3 versioning for audit trail
4. **Lifecycle Policies:** Auto-delete old versions after 7 years (legal retention)
5. **Encryption:** Always use SSE (server-side encryption)

**Signed URL Example:**
```typescript
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

async function getInvoicePDFUrl(invoiceId: number): Promise<string> {
  const invoice = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: invoice.pdfS3Key,
  });

  // Generate signed URL (expires in 1 hour)
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
```

---

#### Alternative: Filesystem Storage ❌ NOT RECOMMENDED

**Why Avoid Filesystem:**
- ❌ **Not Scalable:** Fixed disk space, manual expansion
- ❌ **Ephemeral Risk:** Files lost on container restart (Docker, Heroku)
- ❌ **No Redundancy:** Single point of failure
- ❌ **Backup Complexity:** Manual backup processes
- ❌ **Performance:** High disk I/O under load

**Only Use Filesystem If:**
- You're running on a single, persistent server
- You manage backups manually
- You never plan to scale horizontally

**If You Must Use Filesystem:**
```typescript
import fs from 'fs/promises';
import path from 'path';

async function storeInvoicePDF(invoiceId: number, pdfBuffer: Buffer): Promise<string> {
  const dir = path.join(process.cwd(), 'storage', 'invoices', invoiceId.toString());
  await fs.mkdir(dir, { recursive: true });

  const filename = `${Date.now()}-invoice.pdf`;
  const filepath = path.join(dir, filename);

  await fs.writeFile(filepath, pdfBuffer);
  return `/invoices/${invoiceId}/${filename}`; // Relative URL
}
```

**Warning:** This will NOT work in Docker/Heroku without persistent volumes.

---

### PDF Versioning & Audit Trail

**Why Version PDFs:**
- Legal requirement: Invoices must be immutable once issued
- Clients may dispute charges (need original PDF proof)
- Tax audits require historical invoices

**Recommended Pattern:**
```typescript
export const invoicePdfs = pgTable('invoice_pdfs', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id').notNull().references(() => invoices.id),
  version: integer('version').notNull(), // 1, 2, 3...
  s3Key: text('s3_key').notNull(),
  s3Url: text('s3_url').notNull(),
  generatedAt: timestamp('generated_at').notNull().defaultNow(),
  generatedBy: integer('generated_by').references(() => users.id), // Who generated it
  reason: text('reason'), // "original", "correction", "reissue"
});
```

**Workflow:**
1. Invoice created → Generate PDF version 1
2. Payment received → Generate PDF version 2 with "PAID" stamp
3. Invoice corrected → Generate PDF version 3 with "CORRECTED" annotation
4. Always serve latest version, but keep all versions for audit

---

## Implementation Recommendations

### Phase 17 Proposed Subtasks

Based on this discovery, I recommend breaking Phase 17 into these subtasks:

#### **17-01: Stripe Checkout Integration**
- Create Checkout Session API endpoint
- Handle deposit vs full payment logic
- Redirect to Checkout, handle success/cancel URLs
- Store Checkout Session ID in invoices table

#### **17-02: Webhook Handler with Idempotency**
- Create `/api/webhooks/stripe` endpoint
- Add `stripeWebhookEvents` table for idempotency
- Handle `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
- Update invoice status atomically
- Test with Stripe CLI

#### **17-03: Email Notifications with Resend**
- Set up Resend account and API key
- Create React Email templates (invoice created, payment received, payment failed)
- Implement email service functions
- Trigger emails from webhook handlers
- Test email delivery

#### **17-04: PDF Generation with PDFKit**
- Implement PDFKit invoice generation function
- Design invoice layout (header, line items, totals, footer)
- Add PDF generation to invoice creation flow
- Store PDF metadata in invoices table

#### **17-05: S3 Storage Integration**
- Set up AWS S3 bucket (or Cloudflare R2 alternative)
- Implement PDF upload to S3
- Add `invoice_pdfs` table for versioning
- Implement signed URL generation for secure access
- Test PDF retrieval from client portal

#### **17-06: Client Portal Invoice UI**
- Display invoices list with status badges
- Show invoice details with line items
- "Pay Now" button → redirects to Stripe Checkout
- Download PDF button → generates signed S3 URL
- Payment status indicators (DRAFT, SENT, PARTIALLY_PAID, PAID, OVERDUE)

---

## Technical Considerations

### Environment Variables Needed
```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Resend
RESEND_API_KEY=re_...

# AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-west-3
S3_BUCKET_NAME=rsm-invoices-prod

# App URLs
APP_URL=https://yourstudio.com
STRIPE_SUCCESS_URL=https://yourstudio.com/invoices/success
STRIPE_CANCEL_URL=https://yourstudio.com/invoices/cancel
```

### Dependencies to Add
```bash
# Stripe
pnpm add stripe @stripe/stripe-js

# Email
pnpm add resend react-email
pnpm add -D @react-email/components

# PDF (choose one)
pnpm add pdfkit @types/pdfkit  # Option A
# OR
pnpm add puppeteer  # Option B

# AWS S3
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Testing Strategy

**Unit Tests:**
- Test invoice PDF generation (snapshot testing)
- Test email template rendering
- Test webhook idempotency logic

**Integration Tests:**
- Test Stripe Checkout Session creation
- Test webhook processing with test events
- Test S3 upload/download

**E2E Tests (Playwright):**
- Test full payment flow: Create invoice → Pay → Receive email → Download PDF
- Test partial payment (deposit) flow
- Test payment failure handling

---

## Risk Assessment

### Low Risk ✅
- PDF generation with PDFKit (mature library, straightforward)
- Email sending with Resend (simple API, good docs)

### Medium Risk ⚠️
- Webhook idempotency (requires careful testing)
- S3 signed URLs (security considerations)
- Partial payment tracking (accounting logic complexity)

### High Risk ❌
- Stripe webhook replay attacks (mitigated by signature verification)
- Race conditions (multiple webhooks updating same invoice)
- PDF versioning compliance (legal requirements vary by region)

### Mitigation Strategies
1. **Idempotency Table:** Prevents duplicate webhook processing
2. **Database Transactions:** Ensure atomic invoice status updates
3. **Signature Verification:** Always verify Stripe webhook signatures
4. **Audit Logging:** Log all payment events for debugging
5. **PDF Immutability:** Never overwrite existing PDFs, always version

---

## Next Steps

1. **Decision:** Choose PDF generation approach (PDFKit vs Puppeteer)
   - Recommendation: Start with PDFKit for MVP, migrate to Puppeteer if complex branding needed
2. **Decision:** Choose S3 provider (AWS S3 vs Cloudflare R2 vs DigitalOcean Spaces)
   - Recommendation: AWS S3 (most mature, best docs, lowest risk)
3. **Create Phase 17 PLAN.md** with subtasks 17-01 through 17-06
4. **Set up accounts:**
   - Stripe Test Mode account
   - Resend account (free tier)
   - AWS S3 bucket (or alternative)
5. **Review Phase 16 invoice data structure** to ensure compatibility with Stripe metadata

---

## Sources

### Stripe Checkout & Invoices
- [Checkout Sessions | Stripe API Reference](https://docs.stripe.com/api/checkout/sessions)
- [Build a checkout page with the Checkout Sessions API](https://docs.stripe.com/payments/quickstart-checkout-sessions)
- [Email receipts and paid invoices](https://docs.stripe.com/payments/checkout/receipts)
- [How Checkout works](https://docs.stripe.com/payments/checkout/how-checkout-works)
- [Our top product updates from Sessions 2025](https://stripe.com/blog/top-product-updates-sessions-2025)

### Stripe Partial Payments
- [Accept partial payments for invoices](https://docs.stripe.com/invoicing/partial-payments)
- [Create invoice payment plans](https://docs.stripe.com/invoicing/payment-plans)
- [Deposit invoice: What it is and how to use one](https://stripe.com/resources/more/deposit-invoices-101-what-they-are-and-how-to-use-them)
- [Adds support for partial payments on invoices](https://docs.stripe.com/changelog/basil/2025-05-28/partial-payments)
- [Adds support for multiple (partial) payments on invoices](https://docs.stripe.com/changelog/basil/2025-03-31/add-support-for-multiple-partial-payments-on-invoices)

### Stripe Webhooks
- [Types of events | Stripe API Reference](https://docs.stripe.com/api/events/types)
- [Stripe Webhooks: Complete Guide with Event Examples](https://www.magicbell.com/blog/stripe-webhooks-guide)
- [Receive Stripe events in your webhook endpoint](https://docs.stripe.com/webhooks)
- [Handle payment events with webhooks](https://docs.stripe.com/webhooks/handling-payment-events)
- [Building a Payment System with Spring Boot, Stripe, Redis Idempotency & Webhooks](https://medium.com/@bharathdayals/building-a-spring-boot-stripe-checkout-redis-idempotency-system-complete-guide-58f063dbb244)

### Payment Links vs Checkout Comparison
- [Choosing between Payment Links, Invoicing, Checkout, and Payment Element](https://support.stripe.com/questions/choosing-between-payment-links-invoicing-checkout-and-payment-element)
- [Compare the Checkout Sessions and Payment Intents APIs](https://docs.stripe.com/payments/checkout-sessions-and-payment-intents-comparison)
- [Stripe Invoicing Beats Stripe Payments – Top 7 Advantages](https://trykintsugi.com/blog/stripe-invoicing-vs-stripe-payments)

### Email Services
- [SendGrid vs Mailgun: Which Platform Is Better? [2025]](https://moosend.com/blog/sendgrid-vs-mailgun/)
- [7 Best SendGrid Alternatives for Transactional Emails (2025)](https://www.sender.net/blog/sendgrid-alternative/)
- [SendGrid vs Mailgun: Find Out Which is Better for You [2026]](https://mailtrap.io/blog/sendgrid-vs-mailgun/)
- [Easy and Cost-Effective Transactional Email APIs Compared (2025)](https://www.notificationapi.com/blog/transactional-email-apis)
- [The 11 best transactional email services for developers in 2026](https://knock.app/blog/the-top-transactional-email-services-for-developers)

### PDF Generation
- [Popular Libraries 2025 for PDF Generation Using Node JS](https://pdfnoodle.com/blog/popular-libraries-2025-for-pdf-generation-using-node-js)
- [Best JavaScript PDF libraries 2025: A complete guide](https://www.nutrient.io/blog/javascript-pdf-libraries/)
- [Best HTML to PDF libraries for Node.js](https://blog.logrocket.com/best-html-pdf-libraries-node-js/)
- [Top JavaScript PDF generator libraries for 2025](https://www.nutrient.io/blog/top-js-pdf-libraries/)
- [PDF Generation in Node.js: Puppeteer vs PDFKit](https://www.leadwithskills.com/blogs/pdf-generation-nodejs-puppeteer-pdfkit)
- [How to Generate PDFs in 2025](https://dev.to/michal_szymanowski/how-to-generate-pdfs-in-2025-26gi)

### S3 Storage
- [Uploading Files to AWS S3 with Node.js](https://stackabuse.com/uploading-files-to-aws-s3-with-node-js/)
- [Step-by-Step Guide to Managing Files on AWS S3 Using Node.js](https://medium.com/@induwara99/step-by-step-guide-to-managing-files-on-aws-s3-using-node-js-112f7e32e631)
- [File Upload Strategies with AWS S3, Node.js, Express, React, and Uppy](https://www.fullstackfoundations.com/blog/javascript-upload-file-to-s3)
- [File Uploads in Node.js the Safe Way: Validation, Limits, and Storing to S3](https://dev.to/prateekshaweb/file-uploads-in-nodejs-the-safe-way-validation-limits-and-storing-to-s3-4a86)
- [Using AWS S3 to Store Static Assets and File Uploads | Heroku](https://devcenter.heroku.com/articles/s3)
- [How S3 Differs from Traditional File Storage](https://medium.com/@nsit.saurabh/how-s3-differs-from-traditional-file-storage-object-storage-explained-7912b00a06c5)

---

## Conclusion

Phase 17 is well-positioned to build on Phase 16's solid backend foundation. The recommended stack (Stripe Checkout Sessions + Resend + PDFKit + S3) balances developer experience, performance, and scalability.

**Key Takeaways:**
1. ✅ Use Stripe Checkout Sessions for MVP (faster, lower risk than Payment Element)
2. ✅ Implement webhook idempotency from day 1 (prevents bugs)
3. ✅ Use Resend for emails (React Email integration is powerful)
4. ✅ Start with PDFKit for PDFs (simpler, faster)
5. ✅ Store PDFs in S3 (industry standard, required for cloud deployments)

**Estimated Implementation Time:**
- 17-01 (Checkout): 4-6 hours
- 17-02 (Webhooks): 6-8 hours
- 17-03 (Emails): 4-6 hours
- 17-04 (PDFs): 6-8 hours
- 17-05 (S3): 4-6 hours
- 17-06 (UI): 8-10 hours

**Total:** 32-44 hours (~1-1.5 weeks)

**Ready for Planning Phase:** ✅ Yes - All technical decisions have sufficient research backing.
