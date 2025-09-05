
-- Migration to add name column to captains table
ALTER TABLE "captains" ADD COLUMN IF NOT EXISTS "name" text NOT NULL DEFAULT 'Unknown Captain';
