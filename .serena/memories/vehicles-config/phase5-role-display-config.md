# Phase 5: Role Display Config Management

## File
`src/features/management/components/vehicles-config/role-display-config-management.tsx`

## What it does
Manages per-role display configuration for each VehicleType.

## Key Features
- Two selectors: Role (from `/api/roles`) and VehicleType (from `/api/admin/vehicle-types`)
- Fetches existing config from GET `/api/admin/role-display-config?roleCode=X&vehicleTypeId=Y`
- Config sections with checkboxes:
  - Visible tabs (from VehicleType tabs)
  - Visible fields (from FieldDefinitions)
  - Filterable fields
  - Searchable fields
  - Sortable fields
  - Table columns (with order numbers shown)
  - Default page size (number input, default 20)
- Saves via PUT `/api/admin/role-display-config`
- Config JSON: `{ visibleTabIds, visibleFieldIds, filterableFieldIds, searchableFieldIds, sortableFieldIds, tableColumnIds, defaultPageSize }`
- Uses `CheckboxSection` reusable component with optional order display

## API Endpoints Used
- GET `/api/roles` - list roles
- GET `/api/admin/vehicle-types` - list vehicle types
- GET `/api/admin/vehicle-types/[id]/tabs` - tabs for selected type
- GET `/api/admin/field-definitions` - all fields
- GET `/api/admin/role-display-config` - existing config
- PUT `/api/admin/role-display-config` - save/upsert config

## Integration
Wired into `vehicles-config.tsx` under the 'display' TabsContent.