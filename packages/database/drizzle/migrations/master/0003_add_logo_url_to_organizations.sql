-- Migration: Add logo_url to organizations
-- Phase: 20.1-01 (Database reset fix)
-- Created: 2026-01-17
-- Description: Adds logo_url column to organizations table

ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "logo_url" varchar(500);
