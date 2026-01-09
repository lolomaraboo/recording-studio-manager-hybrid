-- Migration: Add deposit and advance payment fields to invoices table
-- Created: 2026-01-09
-- Phase: 16-02 (Stripe Deposits & Advances)

-- Add deposit fields to invoices table
ALTER TABLE "invoices" ADD COLUMN "deposit_amount" numeric(10, 2);
ALTER TABLE "invoices" ADD COLUMN "deposit_paid_at" timestamp;
ALTER TABLE "invoices" ADD COLUMN "stripe_deposit_payment_intent_id" varchar(255);
ALTER TABLE "invoices" ADD COLUMN "remaining_balance" numeric(10, 2);
