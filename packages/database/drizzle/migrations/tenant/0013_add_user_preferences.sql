-- Migration: Add user_preferences table for cross-device preference synchronization
-- Created: 2026-01-19
-- Phase: 22-07

CREATE TABLE IF NOT EXISTS "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"scope" varchar(100) NOT NULL,
	"preferences" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_scope_unique" UNIQUE("user_id", "scope")
);
