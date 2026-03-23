-- Allow duplicate codes: remove unique constraints
-- Category, ProductType, TabDefinition, ProductStatus, Role, FieldDefinition

DROP INDEX IF EXISTS "roles_code_key";
DROP INDEX IF EXISTS "product_statuses_code_key";
DROP INDEX IF EXISTS "categories_code_key";
DROP INDEX IF EXISTS "product_types_code_key";
DROP INDEX IF EXISTS "field_definitions_code_key";
DROP INDEX IF EXISTS "tab_definitions_category_id_code_key";

-- Add non-unique indexes for filtering (if not exists)
CREATE INDEX IF NOT EXISTS "categories_code_idx" ON "categories"("code");
CREATE INDEX IF NOT EXISTS "product_types_code_idx" ON "product_types"("code");
CREATE INDEX IF NOT EXISTS "field_definitions_code_idx" ON "field_definitions"("code");
