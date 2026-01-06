-- Custom SQL migration file, put your code below! --
-- Migration: Add service_catalog table
-- Phase 11.5 Plan 01: Service Catalogue Schema & Router

CREATE TABLE IF NOT EXISTS "service_catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '20.00' NOT NULL,
	"default_quantity" numeric(10, 2) DEFAULT '1.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);