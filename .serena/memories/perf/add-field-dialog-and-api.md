# Add Field Dialog & API Performance Fixes

## 1. Not All Widgets Showing
- **Cause:** field-definitions API clamped pageSize to max 100. Client requested 500.
- **Fix:** Increased max pageSize from 100 to 500 in GET /api/admin/field-definitions.

## 2. Slow Loading / Many Requests
- **Targeted invalidation:** ProductCardPreviewModal add/remove mutations now invalidate only:
  - product-config for current productTypeId (not all)
  - list-config for categoryId
  - admin/category-tabs, admin/tab-detail
- **TabsConfigManagement:** update/delete mutations also invalidate product-config and list-config so preview stays in sync.
- **Note:** get-session called per API route is expected (auth). First-request compilation (Turbopack) adds one-time latency.