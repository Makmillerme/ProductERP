# Visual Field Grid Editor on Product Card Preview

## What
Product card preview (via Eye button on Display page) now shows a 3-column visual grid with:
- Assigned fields as cards (with label, widget type, delete button)
- "+" buttons in empty cells to add new fields
- Bottom row always has 3 "+" buttons for appending

## Architecture

### New files
- `features/products/lib/grid-layout.ts` — `computeGridLayout(fields, cols)` utility
  - Calculates grid positions, fills empty cells with placeholders
  - Full-width widgets (textarea, gallery, files, composite) always span full row
- `features/products/components/field-grid-editor.tsx` — `FieldGridEditor` component
  - Props: fields (GridField[]), onClickAdd, onRemoveField, disabled, cols
  - Renders 3-col CSS grid with field cards and "+" buttons
- `features/products/components/add-field-dialog.tsx` — `AddFieldDialog` reusable component
  - Searchable field list grouped by: category fields, global, other categories
  - Props: open, onOpenChange, onSelectField, groupedFields, loading, categoryName

### Modified files
- `product-detail-sheet.tsx` — DynamicTabs shows FieldGridEditor when previewMode=true
  - New props: onClickAddField(tabId), onRemoveField(tabId, fieldDefId)
- `product-card-preview-modal.tsx` — manages add/remove field mutations
  - addFieldMut: fetches tab detail, appends field, PATCHes tab
  - removeFieldMut: fetches tab detail, removes field, PATCHes tab
  - Invalidates: product-config, admin/tab-detail, admin/category-tabs

### Sync
Both TabsConfigManagement and ProductCardPreview use the same React Query keys:
- `["product-config", productTypeId]`
- `["admin", "category-tabs", categoryId]`
- `["admin", "tab-detail", tabId]`
When one view adds/removes a field, the other auto-refreshes.

### i18n
- `productsConfig.tabsConfig.searchFieldsPlaceholder` — uk: "Пошук поля…", en: "Search field…"