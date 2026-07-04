-- Stripe Connect columns on organizations (master DB). Idempotent.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_connect_account_id varchar(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_connect_status varchar(30) NOT NULL DEFAULT 'none';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_connect_onboarded_at timestamp;
