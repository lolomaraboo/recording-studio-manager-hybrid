-- Migration: Add music profile fields to clients table
-- Date: 2026-01-17
-- Description: Add 23 music profile fields (genres, instruments, streaming platforms, industry info, career info)

-- Add JSONB array fields for genres and instruments
ALTER TABLE "clients" ADD COLUMN "genres" jsonb DEFAULT '[]';
ALTER TABLE "clients" ADD COLUMN "instruments" jsonb DEFAULT '[]';

-- Add streaming platform URL fields
ALTER TABLE "clients" ADD COLUMN "spotify_url" varchar(500);
ALTER TABLE "clients" ADD COLUMN "apple_music_url" varchar(500);
ALTER TABLE "clients" ADD COLUMN "youtube_url" varchar(500);
ALTER TABLE "clients" ADD COLUMN "soundcloud_url" varchar(500);
ALTER TABLE "clients" ADD COLUMN "bandcamp_url" varchar(500);
ALTER TABLE "clients" ADD COLUMN "deezer_url" varchar(500);
ALTER TABLE "clients" ADD COLUMN "tidal_url" varchar(500);
ALTER TABLE "clients" ADD COLUMN "amazon_music_url" varchar(500);
ALTER TABLE "clients" ADD COLUMN "audiomack_url" varchar(500);
ALTER TABLE "clients" ADD COLUMN "beatport_url" varchar(500);
ALTER TABLE "clients" ADD COLUMN "other_platforms_url" text;

-- Add industry information fields
ALTER TABLE "clients" ADD COLUMN "record_label" varchar(255);
ALTER TABLE "clients" ADD COLUMN "distributor" varchar(255);
ALTER TABLE "clients" ADD COLUMN "manager_contact" varchar(255);
ALTER TABLE "clients" ADD COLUMN "publisher" varchar(255);
ALTER TABLE "clients" ADD COLUMN "performance_rights_society" varchar(100);

-- Add career information fields
ALTER TABLE "clients" ADD COLUMN "years_active" varchar(100);
ALTER TABLE "clients" ADD COLUMN "notable_works" text;
ALTER TABLE "clients" ADD COLUMN "awards_recognition" text;
ALTER TABLE "clients" ADD COLUMN "biography" text;

-- Create GIN indexes for JSONB array search performance
CREATE INDEX IF NOT EXISTS "idx_clients_genres_gin" ON "clients" USING gin ("genres");
CREATE INDEX IF NOT EXISTS "idx_clients_instruments_gin" ON "clients" USING gin ("instruments");
