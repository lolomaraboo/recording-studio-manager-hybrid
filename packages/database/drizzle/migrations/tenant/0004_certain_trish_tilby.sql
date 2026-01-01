CREATE TABLE "client_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"title" varchar(100),
	"email" varchar(255),
	"phone" varchar(50),
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE "track_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"track_id" integer NOT NULL,
	"version_type" varchar(50) NOT NULL,
	"author_id" integer NOT NULL,
	"author_name" varchar(255) NOT NULL,
	"author_type" varchar(50) DEFAULT 'client' NOT NULL,
	"content" text NOT NULL,
	"timestamp" numeric(10, 3) NOT NULL,
	"parent_id" integer,
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL,
	"edited_at" timestamp,
	"resolved_by" integer,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "first_name" varchar(100);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "last_name" varchar(100);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "middle_name" varchar(100);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "prefix" varchar(20);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "suffix" varchar(20);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "avatar_url" varchar(500);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "logo_url" varchar(500);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "phones" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "emails" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "websites" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "street" varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "postal_code" varchar(20);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "region" varchar(100);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "birthday" date;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "gender" varchar(20);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "custom_fields" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_notes" ADD CONSTRAINT "client_notes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_comments" ADD CONSTRAINT "track_comments_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_comments" ADD CONSTRAINT "track_comments_parent_id_track_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."track_comments"("id") ON DELETE cascade ON UPDATE no action;