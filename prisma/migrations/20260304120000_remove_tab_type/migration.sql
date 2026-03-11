-- Remove tab_type column from tab_definitions. Tabs are pages only; content is built from field blocks.
ALTER TABLE "tab_definitions" DROP COLUMN IF EXISTS "tab_type";
