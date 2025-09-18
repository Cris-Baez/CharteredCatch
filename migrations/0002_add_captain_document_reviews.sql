-- Create table to track document review status and approvals
CREATE TABLE IF NOT EXISTS "captain_document_reviews" (
  "id" serial PRIMARY KEY,
  "captain_id" integer NOT NULL REFERENCES "captains"("id") ON DELETE CASCADE,
  "document_type" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "reviewed_by" varchar REFERENCES "users"("id"),
  "reviewed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_captain_document_reviews_unique"
  ON "captain_document_reviews" ("captain_id", "document_type");
