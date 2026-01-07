-- Add project_id column to sessions table (nullable - optional project linkage)
ALTER TABLE "sessions" ADD COLUMN "project_id" integer;

-- Add foreign key constraint with SET NULL on delete (sessions survive project deletion)
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_project_id_projects_id_fk"
  FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;

-- Add index for query performance (common to filter sessions by project)
CREATE INDEX IF NOT EXISTS "sessions_project_id_idx" ON "sessions" ("project_id");
