# Vehicle CMS API Routes

Created 8 API route files for Vehicle CMS admin functionality.

## Admin Routes (requireAdmin: ADMIN_ROLE | OWNER_ROLE)

1. `src/app/api/admin/vehicle-types/route.ts` — GET list with `_count.vehicles`, POST create (code uniqueness check)
2. `src/app/api/admin/vehicle-types/[id]/route.ts` — GET with tabs + `_count.fields`, PATCH, DELETE (blocked if vehicles linked)
3. `src/app/api/admin/field-definitions/route.ts` — GET ordered by `isSystem desc, code asc`, POST (code uniqueness, isSystem=false)
4. `src/app/api/admin/field-definitions/[id]/route.ts` — GET, PATCH (system fields: only label/placeholder/unit editable), DELETE (blocked if isSystem or used in TabField)
5. `src/app/api/admin/vehicle-types/[id]/tabs/route.ts` — GET tabs with field count by order, POST (vehicleTypeId+code unique)
6. `src/app/api/admin/tabs/[id]/route.ts` — GET with fields+fieldDefinition, PATCH with bulk TabField reassignment (deleteMany+createMany in $transaction), DELETE cascades
7. `src/app/api/admin/role-display-config/route.ts` — GET with ?roleCode=&vehicleTypeId= filters, PUT upsert by roleCode_vehicleTypeId

## Public Route (auth only, no admin check)

8. `src/app/api/vehicle-config/[vehicleTypeId]/route.ts` — GET merged config: VehicleType + tabs + fields + fieldDefinitions, filtered by RoleDisplayConfig (visibleTabIds, visibleFieldIds)

## Patterns
- Auth: `auth.api.getSession({ headers: await headers() })` from `@/lib/auth`
- Prisma: `import { prisma } from '@/lib/prisma'`
- Next.js 15 params: `Promise<{ id: string }>` in route context type
- All admin routes: `export const dynamic = 'force-dynamic'`