-- Phase 1 EAV: Remove hardcoded field columns from products.
-- All field data moves to ProductFieldValue (EAV).

-- Clear test data: products + dependent tables (media, documents, field_values)
TRUNCATE TABLE "products" CASCADE;

-- Drop field columns (indexes on these columns are dropped automatically)
ALTER TABLE "products"
  DROP COLUMN IF EXISTS "payload_json",
  DROP COLUMN IF EXISTS "vin",
  DROP COLUMN IF EXISTS "serial_number",
  DROP COLUMN IF EXISTS "product_type",
  DROP COLUMN IF EXISTS "brand",
  DROP COLUMN IF EXISTS "model",
  DROP COLUMN IF EXISTS "modification",
  DROP COLUMN IF EXISTS "year_model",
  DROP COLUMN IF EXISTS "producer_country",
  DROP COLUMN IF EXISTS "location",
  DROP COLUMN IF EXISTS "description",
  DROP COLUMN IF EXISTS "gross_weight_kg",
  DROP COLUMN IF EXISTS "payload_kg",
  DROP COLUMN IF EXISTS "engine_cm3",
  DROP COLUMN IF EXISTS "power_kw",
  DROP COLUMN IF EXISTS "wheel_formula",
  DROP COLUMN IF EXISTS "seats",
  DROP COLUMN IF EXISTS "transmission",
  DROP COLUMN IF EXISTS "mileage",
  DROP COLUMN IF EXISTS "body_type",
  DROP COLUMN IF EXISTS "condition",
  DROP COLUMN IF EXISTS "fuel_type",
  DROP COLUMN IF EXISTS "cargo_dimensions",
  DROP COLUMN IF EXISTS "mrn",
  DROP COLUMN IF EXISTS "uktzed",
  DROP COLUMN IF EXISTS "create_at_ccd",
  DROP COLUMN IF EXISTS "customs_value",
  DROP COLUMN IF EXISTS "customs_value_plus_10_vat",
  DROP COLUMN IF EXISTS "customs_value_plus_20_vat",
  DROP COLUMN IF EXISTS "cost_without_vat",
  DROP COLUMN IF EXISTS "cost_with_vat",
  DROP COLUMN IF EXISTS "vat_amount",
  DROP COLUMN IF EXISTS "currency";
