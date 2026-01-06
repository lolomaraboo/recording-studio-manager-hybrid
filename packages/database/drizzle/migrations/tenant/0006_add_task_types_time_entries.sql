-- Task Types table
CREATE TABLE IF NOT EXISTS "task_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"hourly_rate" numeric(10, 2) NOT NULL,
	"category" varchar(50) DEFAULT 'billable' NOT NULL,
	"color" varchar(7),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Time Entries table
CREATE TABLE IF NOT EXISTS "time_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_type_id" integer NOT NULL,
	"session_id" integer,
	"project_id" integer,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"duration_minutes" integer,
	"hourly_rate_snapshot" numeric(10, 2) NOT NULL,
	"manually_adjusted" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "check_session_or_project" CHECK (session_id IS NOT NULL OR project_id IS NOT NULL)
);

-- Foreign keys
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_task_type_id_task_types_id_fk" FOREIGN KEY ("task_type_id") REFERENCES "public"."task_types"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
