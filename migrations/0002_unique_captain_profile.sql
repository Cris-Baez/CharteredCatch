-- Ensure only one captain profile exists per user by removing duplicates
DELETE FROM "captains" c1
USING "captains" c2
WHERE c1."user_id" = c2."user_id"
  AND c1."id" > c2."id";

-- Enforce uniqueness at the database level
CREATE UNIQUE INDEX IF NOT EXISTS "captains_user_id_unique" ON "captains" USING btree ("user_id");

-- Improve charter search performance
CREATE INDEX IF NOT EXISTS "idx_charters_location" ON "charters" USING btree ("location");
CREATE INDEX IF NOT EXISTS "idx_charters_target_species" ON "charters" USING btree ("target_species");
CREATE INDEX IF NOT EXISTS "idx_charters_is_listed" ON "charters" USING btree ("is_listed");
