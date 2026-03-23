-- AlterTable
ALTER TABLE "tab_definitions" ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT false;

-- Create default "Головна" tab for categories that have no tabs
INSERT INTO "tab_definitions" ("id", "category_id", "name", "icon", "tab_config", "order", "is_system", "created_at", "updated_at")
SELECT
  gen_random_uuid()::text,
  c.id,
  'Головна',
  NULL,
  NULL,
  0,
  true,
  NOW(),
  NOW()
FROM "categories" c
WHERE NOT EXISTS (
  SELECT 1 FROM "tab_definitions" t WHERE t.category_id = c.id
);
