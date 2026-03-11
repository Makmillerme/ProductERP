-- Vehicle → Product refactoring
-- Rename tables
ALTER TABLE "vehicles" RENAME TO "products";
ALTER TABLE "vehicle_media" RENAME TO "product_media";
ALTER TABLE "vehicle_documents" RENAME TO "product_documents";
ALTER TABLE "vehicle_types" RENAME TO "product_types";
ALTER TABLE "vehicle_field_values" RENAME TO "product_field_values";

-- products: rename columns
ALTER TABLE "products" RENAME COLUMN "vehicle_type_id" TO "product_type_id";
ALTER TABLE "products" RENAME COLUMN "vehicle_type" TO "product_type";

-- product_media: rename column
ALTER TABLE "product_media" RENAME COLUMN "vehicle_id" TO "product_id";

-- product_documents: rename column
ALTER TABLE "product_documents" RENAME COLUMN "vehicle_id" TO "product_id";

-- product_field_values: rename column
ALTER TABLE "product_field_values" RENAME COLUMN "vehicle_id" TO "product_id";

-- tab_fields: rename column
ALTER TABLE "tab_fields" RENAME COLUMN "vehicle_type_id" TO "product_type_id";

-- Rename indexes (PostgreSQL creates indexes with table_column pattern; Prisma may recreate)
-- FK constraints will auto-update with column renames in PostgreSQL
