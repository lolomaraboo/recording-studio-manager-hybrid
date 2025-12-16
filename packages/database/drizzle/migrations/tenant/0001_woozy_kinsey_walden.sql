CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"priority" varchar(50) DEFAULT 'normal' NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"action_url" varchar(500),
	"action_label" varchar(100),
	"metadata" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"client_id" integer,
	"project_id" integer,
	"session_id" integer,
	"invoice_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "musicians" ADD COLUMN "talent_type" varchar(50) DEFAULT 'musician' NOT NULL;--> statement-breakpoint
ALTER TABLE "musicians" ADD COLUMN "primary_instrument" varchar(100);--> statement-breakpoint
ALTER TABLE "musicians" ADD COLUMN "hourly_rate" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "musicians" ADD COLUMN "photo_url" varchar(500);--> statement-breakpoint
ALTER TABLE "musicians" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;