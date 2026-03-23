-- Add category_id to products (for products without productTypeId)
ALTER TABLE "products" ADD COLUMN "category_id" TEXT;

-- Add FK constraint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index
CREATE INDEX "products_category_id_idx" ON "products"("category_id");
