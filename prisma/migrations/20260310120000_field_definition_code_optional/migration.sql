-- FieldDefinition.code: make optional (nullable)
-- Allows fields without code; formulas use id when code is null

ALTER TABLE "field_definitions" ALTER COLUMN "code" DROP NOT NULL;
