-- Remove code column from product_statuses
ALTER TABLE "product_statuses" DROP COLUMN IF EXISTS "code";

-- Remove code column from categories
ALTER TABLE "categories" DROP COLUMN IF EXISTS "code";

-- Remove code column from product_types
ALTER TABLE "product_types" DROP COLUMN IF EXISTS "code";

-- Remove index and code column from tab_definitions
DROP INDEX IF EXISTS "tab_definitions_category_id_code_idx";
ALTER TABLE "tab_definitions" DROP COLUMN IF EXISTS "code";
