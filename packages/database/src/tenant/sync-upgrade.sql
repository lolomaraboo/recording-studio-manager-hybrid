-- ============================================================================
-- PHASE M0 — SYNC UPGRADE (macOS native app, offline-first sync)
--
-- Idempotent, additive upgrade for a TENANT database:
--   1. sync_uuid + sync_version columns on every synced table
--   2. sync_log changelog table (pull cursor source)
--   3. New workflow tables: session_staff, session_equipment, track_revisions
--   4. New workflow columns on sessions / projects / clients
--   5. Triggers: version bump + changelog + pg_notify('rsm_sync', …)
--
-- Apply: pnpm --filter database tsx src/scripts/apply-sync-upgrade.ts <tenant_db_name>
-- Safe to re-run. Designed for PostgreSQL >= 16.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Synced tables list + sync columns
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  synced_tables text[] := ARRAY[
    'clients', 'client_notes', 'client_contacts', 'company_members',
    'rooms', 'sessions', 'equipment', 'musicians',
    'projects', 'tracks', 'track_comments', 'track_credits',
    'quotes', 'quote_items', 'invoices', 'invoice_items', 'vat_rates', 'payments',
    'service_catalog', 'contracts', 'expenses', 'task_types', 'time_entries',
    'user_preferences'
  ];
BEGIN
  FOREACH t IN ARRAY synced_tables LOOP
    IF to_regclass(t) IS NULL THEN
      RAISE NOTICE 'Table % does not exist, skipping', t;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS sync_uuid uuid NOT NULL DEFAULT gen_random_uuid()', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS sync_version integer NOT NULL DEFAULT 1', t);

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = t || '_sync_uuid_unique' AND conrelid = to_regclass(t)
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I UNIQUE (sync_uuid)', t, t || '_sync_uuid_unique');
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 1b. Non-synced tables: columns only (schema.ts adds syncColumns to EVERY
-- table so Drizzle inserts reference them — the DB must have them even where
-- no sync triggers are attached).
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  unsynced_tables text[] := ARRAY[
    'notifications', 'ai_conversations', 'ai_action_logs',
    'client_portal_accounts', 'client_portal_magic_links',
    'client_portal_sessions', 'client_portal_activity_logs',
    'payment_transactions', 'stripe_webhook_events'
  ];
BEGIN
  FOREACH t IN ARRAY unsynced_tables LOOP
    IF to_regclass(t) IS NULL THEN CONTINUE; END IF;
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS sync_uuid uuid NOT NULL DEFAULT gen_random_uuid()', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS sync_version integer NOT NULL DEFAULT 1', t);
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Sync log (append-only changelog; DELETE rows double as tombstones)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_log (
  id bigserial PRIMARY KEY,
  table_name varchar(100) NOT NULL,
  row_uuid uuid NOT NULL,
  op varchar(10) NOT NULL, -- 'insert' | 'update' | 'delete'
  sync_version integer NOT NULL DEFAULT 1,
  at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sync_log_id_table_idx ON sync_log (id, table_name);

-- ----------------------------------------------------------------------------
-- 3. New workflow tables (GAP-1, GAP-2, GAP-3)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS session_staff (
  id serial PRIMARY KEY,
  sync_uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  sync_version integer NOT NULL DEFAULT 1,
  session_id integer NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id integer NOT NULL,
  role varchar(50) NOT NULL DEFAULT 'engineer',
  status varchar(50) NOT NULL DEFAULT 'assigned',
  notes text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT session_staff_sync_uuid_unique UNIQUE (sync_uuid)
);

CREATE TABLE IF NOT EXISTS session_equipment (
  id serial PRIMARY KEY,
  sync_uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  sync_version integer NOT NULL DEFAULT 1,
  session_id integer NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  equipment_id integer NOT NULL REFERENCES equipment(id),
  daily_rate numeric(10, 2),
  notes text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT session_equipment_sync_uuid_unique UNIQUE (sync_uuid)
);

CREATE TABLE IF NOT EXISTS track_revisions (
  id serial PRIMARY KEY,
  sync_uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  sync_version integer NOT NULL DEFAULT 1,
  track_id integer NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  stage varchar(50) NOT NULL DEFAULT 'mix',
  file_url varchar(500),
  status varchar(50) NOT NULL DEFAULT 'submitted',
  client_feedback text,
  internal_notes text,
  is_billable boolean NOT NULL DEFAULT false,
  submitted_at timestamp NOT NULL DEFAULT now(),
  responded_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT track_revisions_sync_uuid_unique UNIQUE (sync_uuid)
);

CREATE TABLE IF NOT EXISTS shares (
  id serial PRIMARY KEY,
  sync_uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  sync_version integer NOT NULL DEFAULT 1,
  project_id integer REFERENCES projects(id),
  track_id integer REFERENCES tracks(id),
  share_token varchar(64) NOT NULL,
  recipient_email varchar(255),
  expires_at timestamp,
  max_access integer,
  access_count integer NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'active',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT shares_sync_uuid_unique UNIQUE (sync_uuid),
  CONSTRAINT shares_share_token_unique UNIQUE (share_token)
);

-- Universal-studio workflow (2026-06): sessions without room/client, session
-- kind/location, invoice↔project, track↔session, talent booking on sessions.
ALTER TABLE sessions ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE sessions ALTER COLUMN room_id DROP NOT NULL;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS kind varchar(50) NOT NULL DEFAULT 'studio';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS location varchar(255);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS project_id integer REFERENCES projects(id);
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS session_id integer REFERENCES sessions(id);

CREATE TABLE IF NOT EXISTS session_talents (
  id serial PRIMARY KEY,
  sync_uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  sync_version integer NOT NULL DEFAULT 1,
  session_id integer NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  musician_id integer NOT NULL REFERENCES musicians(id),
  role varchar(100),
  status varchar(50) NOT NULL DEFAULT 'booked',
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT session_talents_sync_uuid_unique UNIQUE (sync_uuid)
);

CREATE TABLE IF NOT EXISTS leads (
  id serial PRIMARY KEY,
  sync_uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  sync_version integer NOT NULL DEFAULT 1,
  name varchar(255) NOT NULL,
  contact_email varchar(255),
  contact_phone varchar(50),
  source varchar(100),
  status varchar(50) NOT NULL DEFAULT 'new',
  notes text,
  converted_client_id integer REFERENCES clients(id),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT leads_sync_uuid_unique UNIQUE (sync_uuid)
);

CREATE TABLE IF NOT EXISTS tasks (
  id serial PRIMARY KEY,
  sync_uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  sync_version integer NOT NULL DEFAULT 1,
  title varchar(255) NOT NULL,
  status varchar(50) NOT NULL DEFAULT 'todo',
  due_date timestamp,
  assignee varchar(255),
  project_id integer REFERENCES projects(id) ON DELETE CASCADE,
  session_id integer REFERENCES sessions(id) ON DELETE CASCADE,
  client_id integer REFERENCES clients(id) ON DELETE CASCADE,
  notes text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT tasks_sync_uuid_unique UNIQUE (sync_uuid)
);

CREATE TABLE IF NOT EXISTS documents (
  id serial PRIMARY KEY,
  sync_uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  sync_version integer NOT NULL DEFAULT 1,
  name varchar(255) NOT NULL,
  url varchar(1000) NOT NULL,
  doc_type varchar(100),
  client_id integer REFERENCES clients(id) ON DELETE CASCADE,
  project_id integer REFERENCES projects(id) ON DELETE CASCADE,
  session_id integer REFERENCES sessions(id) ON DELETE SET NULL,
  track_id integer REFERENCES tracks(id) ON DELETE SET NULL,
  notes text,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT documents_sync_uuid_unique UNIQUE (sync_uuid)
);

CREATE TABLE IF NOT EXISTS availability (
  id serial PRIMARY KEY,
  sync_uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  sync_version integer NOT NULL DEFAULT 1,
  subject_type varchar(20) NOT NULL,
  subject_id integer NOT NULL,
  start_time timestamp NOT NULL,
  end_time timestamp NOT NULL,
  kind varchar(20) NOT NULL DEFAULT 'unavailable',
  notes text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT availability_sync_uuid_unique UNIQUE (sync_uuid)
);

-- ----------------------------------------------------------------------------
-- 3b. Schema catch-up for legacy tenants (created before the quotes FSM
-- refactor) — additive, aligns the DB with the current schema.ts.
-- ----------------------------------------------------------------------------
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS sent_at timestamp;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS responded_at timestamp;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS expires_at timestamp;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS validity_days integer NOT NULL DEFAULT 30;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS internal_notes text;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS converted_to_project_id integer REFERENCES projects(id);
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

-- Legacy NOT NULL columns dropped from the current schema: relax them so
-- inserts written against schema.ts succeed on old tenants.
DO $$
DECLARE
  col text;
BEGIN
  FOREACH col IN ARRAY ARRAY['valid_until', 'title', 'description', 'issue_date'] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'quotes' AND column_name = col AND is_nullable = 'NO'
    ) THEN
      EXECUTE format('ALTER TABLE quotes ALTER COLUMN %I DROP NOT NULL', col);
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 4. New workflow columns on existing tables
-- ----------------------------------------------------------------------------
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS booking_type varchar(50) NOT NULL DEFAULT 'hourly';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS series_id uuid;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recurrence_rule text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS included_revisions integer NOT NULL DEFAULT 2;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS default_deposit_percent numeric(5, 2);

-- ----------------------------------------------------------------------------
-- 5. Trigger functions
-- ----------------------------------------------------------------------------

-- Bump sync_version on every UPDATE (optimistic concurrency for sync push)
CREATE OR REPLACE FUNCTION rsm_sync_bump_version() RETURNS trigger AS $$
BEGIN
  NEW.sync_version := OLD.sync_version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Append to sync_log + notify listeners (Socket.IO bridge reads pg_notify)
CREATE OR REPLACE FUNCTION rsm_sync_log_change() RETURNS trigger AS $$
DECLARE
  v_uuid uuid;
  v_version integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_uuid := OLD.sync_uuid;
    v_version := OLD.sync_version;
  ELSE
    v_uuid := NEW.sync_uuid;
    v_version := NEW.sync_version;
  END IF;

  INSERT INTO sync_log (table_name, row_uuid, op, sync_version)
  VALUES (TG_TABLE_NAME, v_uuid, lower(TG_OP), v_version);

  PERFORM pg_notify('rsm_sync', json_build_object(
    'table', TG_TABLE_NAME,
    'op', lower(TG_OP),
    'uuid', v_uuid
  )::text);

  RETURN NULL; -- AFTER trigger
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 6. Attach triggers to every synced table (incl. new workflow tables)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  synced_tables text[] := ARRAY[
    'clients', 'client_notes', 'client_contacts', 'company_members',
    'rooms', 'sessions', 'equipment', 'musicians',
    'projects', 'tracks', 'track_comments', 'track_credits',
    'quotes', 'quote_items', 'invoices', 'invoice_items', 'vat_rates', 'payments',
    'service_catalog', 'contracts', 'expenses', 'task_types', 'time_entries',
    'user_preferences',
    'session_staff', 'session_equipment', 'track_revisions', 'shares', 'session_talents',
    'leads', 'tasks', 'documents', 'availability'
  ];
BEGIN
  FOREACH t IN ARRAY synced_tables LOOP
    IF to_regclass(t) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('DROP TRIGGER IF EXISTS rsm_sync_bump_version_trg ON %I', t);
    EXECUTE format(
      'CREATE TRIGGER rsm_sync_bump_version_trg BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION rsm_sync_bump_version()', t);

    EXECUTE format('DROP TRIGGER IF EXISTS rsm_sync_log_trg ON %I', t);
    EXECUTE format(
      'CREATE TRIGGER rsm_sync_log_trg AFTER INSERT OR UPDATE OR DELETE ON %I
       FOR EACH ROW EXECUTE FUNCTION rsm_sync_log_change()', t);
  END LOOP;
END $$;
