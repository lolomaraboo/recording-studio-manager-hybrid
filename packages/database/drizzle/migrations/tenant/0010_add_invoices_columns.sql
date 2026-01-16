-- Migration: Add missing invoices columns (Phase 16-17)
-- Adds deposit tracking, Stripe payment tracking, PDF storage, and email tracking

-- Add deposit amount (nullable - no deposit required by default)
ALTER TABLE "invoices" ADD COLUMN "deposit_amount" numeric(10,2);

-- Add deposit payment tracking
ALTER TABLE "invoices" ADD COLUMN "deposit_paid_at" timestamp;
ALTER TABLE "invoices" ADD COLUMN "stripe_deposit_payment_intent_id" varchar(255);

-- Add remaining balance (calculated field, nullable)
ALTER TABLE "invoices" ADD COLUMN "remaining_balance" numeric(10,2);

-- Add PDF storage (S3 key for generated invoice PDF)
ALTER TABLE "invoices" ADD COLUMN "pdf_s3_key" text;

-- Add email tracking (when invoice was sent to client)
ALTER TABLE "invoices" ADD COLUMN "sent_at" timestamp;
