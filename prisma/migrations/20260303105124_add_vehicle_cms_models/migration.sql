/*
  Warnings:

  - You are about to drop the column `gross_weight` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `net_weight` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `net_weight_kg` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `unit_human` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `year_calendar` on the `vehicles` table. All the data in the column will be lost.
  - The `customs_value` column on the `vehicles` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "vehicles" DROP COLUMN "gross_weight",
DROP COLUMN "net_weight",
DROP COLUMN "net_weight_kg",
DROP COLUMN "quantity",
DROP COLUMN "unit_human",
DROP COLUMN "year_calendar",
ADD COLUMN     "body_type" TEXT,
ADD COLUMN     "cargo_dimensions" TEXT,
ADD COLUMN     "condition" TEXT,
ADD COLUMN     "cost_with_vat" DOUBLE PRECISION,
ADD COLUMN     "cost_without_vat" DOUBLE PRECISION,
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "customs_value_plus_10_vat" DOUBLE PRECISION,
ADD COLUMN     "customs_value_plus_20_vat" DOUBLE PRECISION,
ADD COLUMN     "fuel_type" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "mileage" DOUBLE PRECISION,
ADD COLUMN     "modification" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "transmission" TEXT,
ADD COLUMN     "vat_amount" DOUBLE PRECISION,
ADD COLUMN     "vehicle_type_id" TEXT,
DROP COLUMN "customs_value",
ADD COLUMN     "customs_value" DOUBLE PRECISION,
ALTER COLUMN "gross_weight_kg" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "payload_kg" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "engine_cm3" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "vehicle_documents" (
    "id" SERIAL NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "folder" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT,
    "file_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_auto_detected" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_definitions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "field_type" TEXT NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "system_column" TEXT,
    "options" TEXT,
    "unit" TEXT,
    "default_value" TEXT,
    "placeholder" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tab_definitions" (
    "id" TEXT NOT NULL,
    "vehicle_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "icon" TEXT,
    "tab_type" TEXT NOT NULL DEFAULT 'fields',
    "tab_config" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tab_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tab_fields" (
    "id" TEXT NOT NULL,
    "tab_definition_id" TEXT NOT NULL,
    "field_definition_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "col_span" INTEGER NOT NULL DEFAULT 1,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "section_title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tab_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_field_values" (
    "id" TEXT NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "field_definition_id" TEXT NOT NULL,
    "text_value" TEXT,
    "numeric_value" DOUBLE PRECISION,
    "date_value" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_display_configs" (
    "id" TEXT NOT NULL,
    "role_code" TEXT NOT NULL,
    "vehicle_type_id" TEXT,
    "config" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_display_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_documents_vehicle_id_idx" ON "vehicle_documents"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_types_code_key" ON "vehicle_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "field_definitions_code_key" ON "field_definitions"("code");

-- CreateIndex
CREATE INDEX "tab_definitions_vehicle_type_id_idx" ON "tab_definitions"("vehicle_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "tab_definitions_vehicle_type_id_code_key" ON "tab_definitions"("vehicle_type_id", "code");

-- CreateIndex
CREATE INDEX "tab_fields_tab_definition_id_idx" ON "tab_fields"("tab_definition_id");

-- CreateIndex
CREATE UNIQUE INDEX "tab_fields_tab_definition_id_field_definition_id_key" ON "tab_fields"("tab_definition_id", "field_definition_id");

-- CreateIndex
CREATE INDEX "vehicle_field_values_vehicle_id_idx" ON "vehicle_field_values"("vehicle_id");

-- CreateIndex
CREATE INDEX "vehicle_field_values_field_definition_id_idx" ON "vehicle_field_values"("field_definition_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_field_values_vehicle_id_field_definition_id_key" ON "vehicle_field_values"("vehicle_id", "field_definition_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_display_configs_role_code_vehicle_type_id_key" ON "role_display_configs"("role_code", "vehicle_type_id");

-- CreateIndex
CREATE INDEX "vehicles_vehicle_type_id_idx" ON "vehicles"("vehicle_type_id");

-- CreateIndex
CREATE INDEX "vehicles_created_at_idx" ON "vehicles"("created_at");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tab_definitions" ADD CONSTRAINT "tab_definitions_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tab_fields" ADD CONSTRAINT "tab_fields_tab_definition_id_fkey" FOREIGN KEY ("tab_definition_id") REFERENCES "tab_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tab_fields" ADD CONSTRAINT "tab_fields_field_definition_id_fkey" FOREIGN KEY ("field_definition_id") REFERENCES "field_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_field_values" ADD CONSTRAINT "vehicle_field_values_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_field_values" ADD CONSTRAINT "vehicle_field_values_field_definition_id_fkey" FOREIGN KEY ("field_definition_id") REFERENCES "field_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_display_configs" ADD CONSTRAINT "role_display_configs_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
