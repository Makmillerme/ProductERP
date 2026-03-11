# Phase 4: Tabs Config Management

## File
`src/features/management/components/vehicles-config/tabs-config-management.tsx`

## What it does
Manages tab definitions and field assignments per VehicleType.

## Key Features
- VehicleType selector (fetches from `/api/admin/vehicle-types`)
- Tab list displayed as ordered cards with Badge for tabType (fields/gallery/documents)
- Sheet for create/edit tab: name, code (auto-slugify), icon (lucide name), tabType, order
- For tabType 'fields': full field assignment management (add/remove fields, configure order, colSpan, isRequired, sectionTitle per field)
- For tabType 'documents': JSON textarea for tabConfig
- For tabType 'gallery': auto-render info message
- Save via PATCH `/api/admin/tabs/[id]` with fields array
- Delete tab via DELETE `/api/admin/tabs/[id]`
- Create tab via POST `/api/admin/vehicle-types/[id]/tabs`

## API Endpoints Used
- GET `/api/admin/vehicle-types` - list types
- GET `/api/admin/vehicle-types/[id]/tabs` - list tabs for type
- GET `/api/admin/tabs/[id]` - tab detail with fields
- GET `/api/admin/field-definitions` - all field definitions
- POST `/api/admin/vehicle-types/[id]/tabs` - create tab
- PATCH `/api/admin/tabs/[id]` - update tab + fields
- DELETE `/api/admin/tabs/[id]` - delete tab

## Integration
Wired into `vehicles-config.tsx` under the 'tabs' TabsContent.