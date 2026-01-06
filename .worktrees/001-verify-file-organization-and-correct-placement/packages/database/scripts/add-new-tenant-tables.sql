-- Add missing unique constraints to existing tables
ALTER TABLE invoices ADD CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number);

-- Add missing columns to existing tables (from recent schema updates)
-- rooms: add missing columns
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'recording' NOT NULL;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS half_day_rate DECIMAL(10, 2);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS full_day_rate DECIMAL(10, 2);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS size INTEGER;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS has_isolation_booth BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS has_live_room BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS has_control_room BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS equipment_list TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_available_for_booking BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3498db';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

-- equipment: add missing columns
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES rooms(id);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS specifications TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS warranty_until TIMESTAMP;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'operational' NOT NULL;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS last_maintenance_at TIMESTAMP;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS next_maintenance_at TIMESTAMP;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS maintenance_notes TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

-- projects: add missing columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'recording' NOT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS genre VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS target_release_date TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(10, 2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium' NOT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_satisfaction INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS public_notes TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS metadata TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tags TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS color VARCHAR(7);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Create new tables
CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  contract_number VARCHAR(100) NOT NULL UNIQUE,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  project_id INTEGER REFERENCES projects(id),
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  terms TEXT NOT NULL,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  signed_at TIMESTAMP,
  value DECIMAL(10, 2),
  document_url VARCHAR(500),
  signed_document_url VARCHAR(500),
  signature_request_id VARCHAR(255),
  signed_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  description VARCHAR(500) NOT NULL,
  vendor VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  tax_amount DECIMAL(10, 2),
  expense_date TIMESTAMP NOT NULL,
  paid_at TIMESTAMP,
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  project_id INTEGER REFERENCES projects(id),
  equipment_id INTEGER REFERENCES equipment(id),
  receipt_url VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS musicians (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  stage_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  primary_instrument VARCHAR(100),
  instruments TEXT,
  bio TEXT,
  photo_url VARCHAR(500),
  hourly_rate DECIMAL(10, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(id),
  client_id INTEGER NOT NULL REFERENCES clients(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  payment_date TIMESTAMP NOT NULL DEFAULT NOW(),
  payment_method VARCHAR(50) NOT NULL,
  reference_number VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  transaction_id VARCHAR(255),
  processor VARCHAR(50),
  processor_fee DECIMAL(10, 2),
  net_amount DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  quote_number VARCHAR(100) NOT NULL UNIQUE,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  project_id INTEGER REFERENCES projects(id),
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
  tax_amount DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  converted_to_invoice_id INTEGER REFERENCES invoices(id),
  converted_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_items (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL REFERENCES quotes(id),
  session_id INTEGER REFERENCES sessions(id),
  equipment_id INTEGER REFERENCES equipment(id),
  description VARCHAR(500) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  title VARCHAR(255) NOT NULL,
  track_number INTEGER,
  duration INTEGER,
  isrc VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'recording',
  bpm INTEGER,
  key VARCHAR(20),
  lyrics TEXT,
  file_url VARCHAR(500),
  waveform_url VARCHAR(500),
  notes TEXT,
  technical_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS track_credits (
  id SERIAL PRIMARY KEY,
  track_id INTEGER NOT NULL REFERENCES tracks(id),
  musician_id INTEGER REFERENCES musicians(id),
  role VARCHAR(100) NOT NULL,
  credit_name VARCHAR(255) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
