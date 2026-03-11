-- CreateTable
CREATE TABLE "vehicles" (
    "id" SERIAL NOT NULL,
    "processed_file_id" INTEGER,
    "mrn" TEXT,
    "vin" TEXT,
    "model" TEXT,
    "customs_value" TEXT,
    "create_at_ccd" TEXT,
    "pdf_url" TEXT,
    "payload_json" TEXT NOT NULL DEFAULT '{}',
    "brief_pdf_path" TEXT,
    "vehicle_type" TEXT,
    "brand" TEXT,
    "uktzed" TEXT,
    "description" TEXT,
    "producer_country" TEXT,
    "gross_weight" TEXT,
    "net_weight" TEXT,
    "gross_weight_kg" INTEGER,
    "net_weight_kg" INTEGER,
    "payload_kg" INTEGER,
    "engine_cm3" INTEGER,
    "seats" INTEGER,
    "power_kw" DOUBLE PRECISION,
    "wheel_formula" TEXT,
    "year_model" INTEGER,
    "year_calendar" INTEGER,
    "quantity" DOUBLE PRECISION,
    "serial_number" TEXT,
    "unit_human" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicles_mrn_idx" ON "vehicles"("mrn");

-- CreateIndex
CREATE INDEX "vehicles_vin_idx" ON "vehicles"("vin");

-- CreateIndex
CREATE INDEX "vehicles_vehicle_type_idx" ON "vehicles"("vehicle_type");

-- CreateIndex
CREATE INDEX "vehicles_brand_idx" ON "vehicles"("brand");

-- CreateIndex
CREATE INDEX "vehicles_year_model_idx" ON "vehicles"("year_model");

-- CreateIndex
CREATE INDEX "vehicles_uktzed_idx" ON "vehicles"("uktzed");
