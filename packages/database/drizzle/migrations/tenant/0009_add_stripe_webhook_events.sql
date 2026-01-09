-- Migration: Add stripe_webhook_events table for webhook idempotency
-- Phase 17-01: Stripe Checkout Sessions & Webhooks

CREATE TABLE IF NOT EXISTS "stripe_webhook_events" (
  "id" SERIAL PRIMARY KEY,
  "event_id" VARCHAR(255) NOT NULL UNIQUE,
  "event_type" VARCHAR(100) NOT NULL,
  "processed_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "invoice_id" INTEGER REFERENCES "invoices"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for fast event ID lookup (idempotency check)
CREATE INDEX IF NOT EXISTS "idx_webhook_events_event_id" ON "stripe_webhook_events"("event_id");
