-- CreateTable: field_definition_categories (many-to-many FieldDefinition <-> Category)
CREATE TABLE "field_definition_categories" (
    "field_definition_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "field_definition_categories_pkey" PRIMARY KEY ("field_definition_id","category_id")
);

-- CreateTable: field_definition_product_types (many-to-many FieldDefinition <-> ProductType)
CREATE TABLE "field_definition_product_types" (
    "field_definition_id" TEXT NOT NULL,
    "product_type_id" TEXT NOT NULL,

    CONSTRAINT "field_definition_product_types_pkey" PRIMARY KEY ("field_definition_id","product_type_id")
);

-- Migrate data: categoryId -> field_definition_categories
INSERT INTO "field_definition_categories" ("field_definition_id", "category_id")
SELECT "id", "category_id" FROM "field_definitions" WHERE "category_id" IS NOT NULL;

-- Add FK constraints for field_definition_categories
ALTER TABLE "field_definition_categories" ADD CONSTRAINT "field_definition_categories_field_definition_id_fkey"
    FOREIGN KEY ("field_definition_id") REFERENCES "field_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "field_definition_categories" ADD CONSTRAINT "field_definition_categories_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add FK constraints for field_definition_product_types
ALTER TABLE "field_definition_product_types" ADD CONSTRAINT "field_definition_product_types_field_definition_id_fkey"
    FOREIGN KEY ("field_definition_id") REFERENCES "field_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "field_definition_product_types" ADD CONSTRAINT "field_definition_product_types_product_type_id_fkey"
    FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "field_definition_categories_field_definition_id_idx" ON "field_definition_categories"("field_definition_id");
CREATE INDEX "field_definition_categories_category_id_idx" ON "field_definition_categories"("category_id");
CREATE INDEX "field_definition_product_types_field_definition_id_idx" ON "field_definition_product_types"("field_definition_id");
CREATE INDEX "field_definition_product_types_product_type_id_idx" ON "field_definition_product_types"("product_type_id");

-- Drop old category_id from field_definitions
ALTER TABLE "field_definitions" DROP CONSTRAINT IF EXISTS "field_definitions_category_id_fkey";
DROP INDEX IF EXISTS "field_definitions_category_id_idx";
ALTER TABLE "field_definitions" DROP COLUMN IF EXISTS "category_id";
