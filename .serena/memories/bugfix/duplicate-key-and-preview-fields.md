# Bugfix: Duplicate Key + Preview Real Fields

## Issue 1: Duplicate React Key in product-detail-sheet.tsx
- **Root Cause (original):** PATCH `/api/admin/tabs/[id]` accepted duplicate `fieldDefinitionId` entries. Fixed with server-side dedup + client-side guard in `addFieldMut`.
- **Root Cause (persistent):** product-config API returns BOTH generic (`productTypeId: null`) AND product-type-specific fields for the same `fieldDefinitionId`. When two such records exist in `tab.fields`, `fieldById` Map (keyed by `fieldDefinitionId`) keeps only the last one, but `computeGridLayout` receives all entries → two grid items resolve to the same `f.id` → React duplicate key.
- **Fix:** Added `dedupedFields` using `Map.reduce` that deduplicates by `fieldDefinitionId`, preferring the product-type-specific entry over the generic one. Both preview and non-preview branches use `dedupedFields` instead of raw `tab.fields`.

## Issue 2: Preview Shows Grid Editor Instead of Real Fields
- Replaced `FieldGridEditor` with actual `DynamicFieldRenderer` widgets + "+" buttons for empty grid cells + "X" remove button on hover.

## Files Changed
- `src/app/api/admin/tabs/[id]/route.ts` — server-side dedup in PATCH
- `src/features/products/components/product-detail-sheet.tsx` — dedup + real field rendering in preview
- `src/features/management/components/product-card-preview-modal.tsx` — client-side dedup guard in addFieldMut