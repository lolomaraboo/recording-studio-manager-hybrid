-- Add missing project_id column to sessions table
-- This column is defined in schema.ts but was never migrated to actual databases
-- Date: 2026-01-17
-- Issue: Drizzle SELECT includes project_id but column doesn't exist

-- Add project_id with nullable foreign key to projects table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS project_id integer;

-- Add foreign key constraint (after column exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sessions_project_id_projects_id_fk'
    AND table_name = 'sessions'
  ) THEN
    ALTER TABLE sessions ADD CONSTRAINT sessions_project_id_projects_id_fk
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Verify schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sessions' AND column_name = 'project_id';
