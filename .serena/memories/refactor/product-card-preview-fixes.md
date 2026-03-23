# Product Card Preview & Configuration Fixes

## 1. EAV Placeholder Removed
- Removed EAV placeholder. All fields render by widgetType using actual widgets.
- productKey: system = systemColumn; non-system = code ?? fieldDefinition.id
- update signature extended to support custom keys

## 2. Field Uniqueness
- assignedFieldIds / assignedInCard collect from ALL tabs
- API tabs GET includes fields with fieldDefinitionId

## 3. Full-width: computeGridLayout already enforces new row
## 4. Sync: React Query invalidation on both paths