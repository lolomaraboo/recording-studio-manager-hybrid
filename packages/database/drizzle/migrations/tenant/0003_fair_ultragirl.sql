ALTER TABLE "sessions" ADD COLUMN "deposit_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "deposit_paid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "payment_status" varchar(50) DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "stripe_checkout_session_id" varchar(255);--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "stripe_payment_intent_id" varchar(255);--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "demo_url" varchar(500);--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "rough_mix_url" varchar(500);--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "final_mix_url" varchar(500);--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "master_url" varchar(500);--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "composer" varchar(300);--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "lyricist" varchar(300);--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "copyright_holder" varchar(300);--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "copyright_year" integer;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "genre_tags" text;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "mood" varchar(100);--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "language" varchar(50) DEFAULT 'fr';--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "explicit_content" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "patch_preset" text;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "instruments_used" text;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "microphones_used" text;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "effects_chain" text;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "daw_session_path" varchar(500);--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "recorded_in_room_id" integer;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_recorded_in_room_id_rooms_id_fk" FOREIGN KEY ("recorded_in_room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;