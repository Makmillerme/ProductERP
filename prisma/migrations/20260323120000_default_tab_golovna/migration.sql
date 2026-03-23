-- Clear all tab data (user said technical data is for testing only)
DELETE FROM "tab_fields";
DELETE FROM "tab_definitions";

-- Create default "Головна" tab for each category (first tab, system, not deletable)
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
FROM "categories" c;
