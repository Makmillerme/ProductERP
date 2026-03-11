# Parser Integration API Endpoints

Three API routes created under `src/app/api/admin/parser/` for Python VMD parser integration.
All require admin/owner auth via `requireAdmin()` pattern (same as other admin routes).

## 1. POST /api/admin/parser/import
File: `src/app/api/admin/parser/import/route.ts`

Accepts `{ vehicles: [...] }` array with snake_case fields from Python parser.
- Maps snake_case keys to Prisma camelCase via `FIELD_MAP`
- Coerces types: INT_FIELDS (yearModel, seats), FLOAT_FIELDS (weights, values, etc.)
- Auto-resolves VehicleType by name (case-insensitive), creates with `isAutoDetected: true` if missing
- Upserts: finds existing vehicle by `mrn` then `vin`, updates if found, creates if not
- Per-vehicle error handling (doesn't fail batch)
- Returns `{ created: number, updated: number, errors: string[] }`
- Uses in-request cache for VehicleType lookups

## 2. GET+POST /api/admin/parser/field-mapping
File: `src/app/api/admin/parser/field-mapping/route.ts`

**GET**: Returns all FieldDefinition entries as `{ fields: [{ code, systemColumn, label, fieldType, isSystem }] }`
**POST**: Accepts `{ fields: [{ code, label, fieldType?, systemColumn? }] }`, creates missing FieldDefinition entries as custom (non-system) fields. Returns `{ created: [...], existing: [...], errors: [...] }`

## 3. POST /api/admin/parser/auto-detect-types
File: `src/app/api/admin/parser/auto-detect-types/route.ts`

Accepts `{ types: ["Вантажний", "Причіп", ...] }`. For each type name:
- Case-insensitive lookup in VehicleType
- Creates missing types with `isAutoDetected: true` and slugified code
- Returns `{ created: [...], existing: [...], types: [{ id, name, code }] }`

## Shared Utility
File: `src/lib/slugify.ts`

Exports `slugify(text: string): string` — transliterates Ukrainian Cyrillic to Latin, lowercases, kebab-cases. Used by import and auto-detect-types endpoints for auto-generating VehicleType codes from Ukrainian names.