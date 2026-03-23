-- Add product_status_id column
ALTER TABLE "products" ADD COLUMN "product_status_id" TEXT;

-- Add FK constraint
ALTER TABLE "products" ADD CONSTRAINT "products_product_status_id_fkey" 
  FOREIGN KEY ("product_status_id") REFERENCES "product_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index
CREATE INDEX "products_product_status_id_idx" ON "products"("product_status_id");

-- Drop status column
ALTER TABLE "products" DROP COLUMN IF EXISTS "status";
