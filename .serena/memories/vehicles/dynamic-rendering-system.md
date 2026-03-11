## Dynamic Vehicle Rendering System (Created 2026-03-03)

### Files Created

1. **`src/features/vehicles/hooks/use-vehicle-config.ts`** — TanStack Query hook that fetches vehicle config for a given vehicleTypeId from `/api/vehicle-config/{vehicleTypeId}`. Exports types: `VehicleConfigTab`, `VehicleConfigTabField`, `VehicleConfigResponse`. Uses 5 min staleTime.

2. **`src/app/api/vehicle-config/default/route.ts`** — GET endpoint that returns the default vehicle type (code='default') with auth check via better-auth.

3. **`src/features/vehicles/components/dynamic-field-renderer.tsx`** — Client component that renders a single field dynamically based on `VehicleConfigTabField.fieldDefinition.fieldType` and `systemColumn`. Supports: text, number, textarea, select, date, currency field types. Special handling for: cargo_dimensions (3-input L×W×H), vin (syncs serial_number), created_at (read-only). Non-system fields show EAV placeholder. Uses same date picker pattern as vehicle-detail-sheet.

### Architecture
- Config-driven UI: fields and tabs are defined in DB (VehicleType → TabDefinition → TabFieldMapping → FieldDefinition)
- Role-based visibility: RoleDisplayConfig filters tabs/fields per user role
- System fields map to Vehicle table columns via `systemColumn`; non-system fields will use EAV (future)
- The existing `vehicle-detail-sheet.tsx` has hardcoded fields; dynamic-field-renderer enables config-driven rendering