# [DEPRECATED] Див. api/admin-routes-product-cms. Vehicle CMS Admin API Routes (Restructured)

All admin routes use `requireAdmin()` auth guard (checks ADMIN_ROLE or OWNER_ROLE).
All use `export const dynamic = "force-dynamic"`.

## New Routes

### Statuses (`/api/admin/statuses`)
- `route.ts` - GET (list ordered by order asc), POST (create with isDefault handling)
- `[id]/route.ts` - GET, PATCH (with isDefault transaction), DELETE (blocks if isDefault)
- Model: `ProductStatus`

### Categories (`/api/admin/categories`)
- `route.ts` - GET (with _count of vehicleTypes & tabs), POST (validates code uniqueness)
- `[id]/route.ts` - GET, PATCH, DELETE (blocks if has vehicleTypes)
- `[id]/tabs/route.ts` - GET (tabs for category), POST (create tab for category)
- Model: `Category`

### Data Source Mappings (`/api/admin/data-source-mappings`)
- `route.ts` - GET (with fieldDefinition info), POST (validates unique [sourceType, sourceFieldCode])
- `[id]/route.ts` - GET, PATCH, DELETE
- Model: `DataSourceMapping`

## Updated Routes

### Vehicle Types (`/api/admin/vehicle-types`)
- Now includes `categoryId` and `category` info in responses
- POST accepts `categoryId` parameter
- PATCH allows updating `categoryId`
- Tabs route REMOVED from here (moved to Categories)

### Tabs (`/api/admin/tabs/[id]`)
- GET supports `?vehicleTypeId=` filter (returns fields where vehicleTypeId is null OR matches)
- PATCH `fields` array now accepts `vehicleTypeId` per field for type-specific assignments

### Field Definitions (`/api/admin/field-definitions`)
- Uses `dataType` + `widgetType` instead of old `fieldType`
- Uses `validation` + `presetValues` instead of old `options`
- POST requires `code`, `label`, `dataType`

### Display Config (`/api/admin/role-display-config`)
- Now uses `DisplayConfig` model (was `RoleDisplayConfig`)
- GET filters by `?roleCode=`, `?userId=`, `?categoryId=`
- PUT upserts with composite key [roleCode, userId, categoryId]

### Vehicle Config (`/api/vehicle-config`)
- `[vehicleTypeId]/route.ts` - Looks up VehicleType -> categoryId -> fetches tabs from category
  - Filters TabFields by vehicleTypeId (null = all types, or matching type)
  - Applies DisplayConfig with priority: user+category > user > role+category > role
- `default/route.ts` - Returns default type ID AND categoryId + category info