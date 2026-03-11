# Dynamic Vehicle CMS Implementation

## Overview
Full 7-phase implementation of a dynamic vehicle data management CMS.

## Database Models (schema.prisma)
6 new models added:
- **VehicleType** - defines types of vehicles (e.g., Cargo, Trailer, etc.)
- **FieldDefinition** - field definitions with code, label, fieldType (text/number/select/date/textarea/currency), isSystem flag, systemColumn mapping
- **TabDefinition** - tab definitions per vehicle type (tabType: fields/gallery/documents)
- **TabField** - links fields to tabs with order, colSpan, isRequired, sectionTitle
- **VehicleFieldValue** - EAV table for custom (non-system) field values
- **RoleDisplayConfig** - per-role visibility config (JSON: visibleTabIds, filterableFieldIds, etc.)

Vehicle model updated with `vehicleTypeId` FK to VehicleType.

## API Routes
### Admin CMS Management
- `/api/admin/vehicle-types` - CRUD for vehicle types
- `/api/admin/vehicle-types/[id]/tabs` - tabs per type
- `/api/admin/field-definitions` - CRUD for field definitions
- `/api/admin/tabs/[id]` - tab detail with bulk field update
- `/api/admin/role-display-config` - per-role display config (GET/PUT upsert)

### Parser Integration
- `/api/admin/parser/import` - POST batch import vehicles from Python parser
- `/api/admin/parser/field-mapping` - GET/POST field mappings
- `/api/admin/parser/auto-detect-types` - POST auto-create vehicle types

### Public Config
- `/api/vehicle-config/default` - GET default vehicle type ID
- `/api/vehicle-config/[vehicleTypeId]` - GET merged config filtered by role

## UI Components
All in `src/features/management/components/vehicles-config/`:
- **VehiclesConfig** - main wrapper with sub-tabs via nuqs
- **VehicleTypesManagement** - CRUD table for vehicle types
- **FieldDefinitionsManagement** - CRUD table for field definitions (system fields read-only)
- **TabsConfigManagement** - tab/field assignment per vehicle type
- **RoleDisplayConfigManagement** - per-role visibility checkboxes

## Dynamic Rendering
- `src/features/vehicles/hooks/use-vehicle-config.ts` - hook to fetch merged config
- `src/features/vehicles/components/dynamic-field-renderer.tsx` - renders fields dynamically based on fieldType and systemColumn
- `vehicle-detail-sheet.tsx` refactored to use DynamicTabs component that renders tabs/fields from DB config
- Fallback tabs provided when config hasn't loaded yet

## Seed Data
- `prisma/seed-vehicle-cms.ts` - seeds 33 system FieldDefinitions, 1 default VehicleType, 5 default TabDefinitions with TabField assignments
- System fields map to existing Vehicle model columns
- Default tabs mirror the previously hardcoded structure (Авто, Фото та відео, ВМД, Вартість, Документи)

## Permission
- `vehicles_config` permission section added to `src/config/permissions.ts` (view/edit actions)

## Migration
- `20260303105124_add_vehicle_cms_models` - adds all 6 new tables + vehicleTypeId index on vehicles