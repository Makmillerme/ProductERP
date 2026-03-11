## Data Model Restructure - Completed

### Database Schema Changes (schema.prisma)
1. **ProductStatus** - new model: pipeline statuses (draft -> review -> active -> sold -> archive). Replaces hardcoded VEHICLE_STATUSES.
2. **Category** - new model: hierarchical grouping of VehicleTypes. Fields: id, name, code(unique), description, icon, order.
3. **VehicleType** - added `categoryId` FK to Category (nullable, SetNull).
4. **TabDefinition** - changed from `vehicleTypeId` to `categoryId` FK. Tabs belong to categories now.
5. **TabField** - added optional `vehicleTypeId` FK: null=all types in category, set=type-specific.
6. **FieldDefinition** - split old `fieldType` into `dataType`(string/integer/float/boolean/date/datetime) + `widgetType`(text_input/number_input/select/multiselect/checkbox/radio/textarea/datepicker/currency_input). Renamed `options` to `presetValues`. Added `validation` JSON.
7. **DataSourceMapping** - new model: maps external source fields to FieldDefinitions. Unique on [sourceType, sourceFieldCode].
8. **DisplayConfig** (renamed from RoleDisplayConfig) - added `userId`(nullable) for per-user overrides. Changed `vehicleTypeId` to `categoryId`. Priority: user > role > default.

### API Routes
- New CRUD: `/api/admin/statuses/[id]`, `/api/admin/categories/[id]`, `/api/admin/data-source-mappings/[id]`
- Moved: `/api/admin/vehicle-types/[id]/tabs` -> `/api/admin/categories/[id]/tabs`
- Updated: vehicle-types (categoryId), field-definitions (dataType/widgetType/validation/presetValues), tabs (categoryId), display-config (userId+categoryId), vehicle-config endpoint

### UI Components (features/management/components/vehicles-config/)
- `statuses-management.tsx` - CRUD table for ProductStatus
- `categories-management.tsx` - two-panel: categories + nested vehicle types
- `data-source-mappings-management.tsx` - CRUD for external field mappings
- Updated: tabs-config, field-definitions, role-display-config management components

### Navigation
Data Model page at `/management/data-model` with 5 tabs: Статуси | Категорії | Картка товару | Дані | Відображення

### Seed
`prisma/seed-vehicle-cms.ts` creates: 7 default statuses, default Category, default VehicleType, 33 system FieldDefinitions with proper dataType/widgetType mapping