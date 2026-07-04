-- Stripe Connect columns on organizations (master DB). Idempotent.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_connect_account_id varchar(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_connect_status varchar(30) NOT NULL DEFAULT 'none';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_connect_onboarded_at timestamp;
-- Bank details for "pay by transfer" instructions
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS bank_name varchar(200);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS bank_iban varchar(60);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS bank_bic varchar(20);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS bank_holder varchar(200);
