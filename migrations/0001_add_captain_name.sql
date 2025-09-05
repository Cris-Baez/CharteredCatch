
-- Migration: Add name column to captains table
ALTER TABLE captains ADD COLUMN name TEXT NOT NULL DEFAULT 'Captain';

-- Update existing captains with default names based on their license numbers
UPDATE captains SET name = 'Captain ' || SUBSTRING(license_number, 1, 3) WHERE name = 'Captain';
