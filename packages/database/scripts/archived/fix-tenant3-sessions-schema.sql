-- Fix tenant_3 sessions table schema
-- Add missing payment columns to match tenant_9 (working schema)
-- Date: 2026-01-17
-- Issue: sessions.list query fails because schema.ts expects columns that don't exist

-- Add missing columns (in order matching tenant_9)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS deposit_amount numeric(10,2);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS deposit_paid boolean NOT NULL DEFAULT false;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS payment_status character varying(50) NOT NULL DEFAULT 'unpaid';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS stripe_checkout_session_id character varying(255);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS stripe_payment_intent_id character varying(255);

-- Verify schema
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'sessions'
ORDER BY ordinal_position;
