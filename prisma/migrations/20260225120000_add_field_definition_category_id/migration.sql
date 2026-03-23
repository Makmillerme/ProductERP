-- Add category_id to field_definitions (nullable).
-- Existing rows remain global (category_id = NULL).
ALTER TABLE "field_definitions" ADD COLUMN IF NOT EXISTS "category_id" TEXT;

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS "field_definitions_category_id_idx" ON "field_definitions"("category_id");

-- FK constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'field_definitions_category_id_fkey'
  ) THEN
    ALTER TABLE "field_definitions"
      ADD CONSTRAINT "field_definitions_category_id_fkey"
      FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
