-- Remove pdf_url and brief_pdf_path (legacy from old Python parser, not used in this project)
ALTER TABLE "products"
  DROP COLUMN IF EXISTS "pdf_url",
  DROP COLUMN IF EXISTS "brief_pdf_path";
