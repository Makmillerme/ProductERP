## Vehicle Types Management UI (vehicles-config)

Created 4 files under `src/features/management/components/vehicles-config/`:

1. **types.ts** - Type definitions: VehicleTypeItem, FieldDefinitionItem, TabDefinitionItem, TabFieldItem, RoleDisplayConfigItem
2. **index.ts** - Barrel export for VehiclesConfig
3. **vehicles-config.tsx** - Parent component with 5 sub-tabs (nuqs key: vconfigtab): Типи авто, Поля, Таби та поля, Відображення, Налаштування. Only first tab is implemented.
4. **vehicle-types-management.tsx** - Full CRUD for VehicleType entity:
   - Search + create button layout (matches roles-management pattern)
   - Table columns: Назва, Код, Опис, Авто count, Автодетект, Дата створення
   - Sheet with form: name, code (auto-slugified from name), description (textarea)
   - Sheet footer: Delete (destructive, left) + Cancel/Save (right)
   - TanStack Query: queryKey ['admin', 'vehicle-types'], API endpoint /api/admin/vehicle-types
   - CRUD mutations with toast notifications

Pattern follows existing roles-management component structure.

### API Endpoints Expected
- GET /api/admin/vehicle-types - list all
- POST /api/admin/vehicle-types - create
- PATCH /api/admin/vehicle-types/:id - update
- DELETE /api/admin/vehicle-types/:id - delete