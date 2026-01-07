-- Add track_id column to time_entries table
ALTER TABLE "time_entries" ADD COLUMN "track_id" integer;

-- Add foreign key constraint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_track_id_tracks_id_fk"
  FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE set null ON UPDATE no action;

-- Drop old CHECK constraint (session OR project)
ALTER TABLE "time_entries" DROP CONSTRAINT IF EXISTS "check_session_or_project";

-- Add new CHECK constraint (session OR project OR track)
ALTER TABLE "time_entries" ADD CONSTRAINT "check_session_or_project_or_track"
  CHECK (
    (session_id IS NOT NULL AND project_id IS NULL AND track_id IS NULL) OR
    (session_id IS NULL AND project_id IS NOT NULL AND track_id IS NULL) OR
    (session_id IS NULL AND project_id IS NULL AND track_id IS NOT NULL)
  );
