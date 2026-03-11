# nextjs_vmd — фіча vehicles

**Шляхи:**
- `src/features/vehicles/components/vehicles-page.tsx` — головна сторінка: таблиця, пагінація, фільтри, сортування, sheet create/edit, nuqs (page, pageSize, view, sort, filter)
- `src/features/vehicles/queries.ts` — vehiclesKeys, useVehicles, useVehicle, useCreateVehicle, useUpdateVehicle, useDeleteVehicle; мутації роблять setQueriesData (оптимістично) + invalidateQueries; refetchVehiclesLists(queryClient)
- `src/features/vehicles/api.ts` — fetch з cache: "no-store"; DELETE при 404 повертає успіх (ідемпотентність)
- `src/features/vehicles/components/vehicle-detail-sheet.tsx` — форма в sheet
- Типи в `src/features/vehicles/types.ts`

**Сортування за замовчуванням:** sort.key = "created_at", sort.dir = "desc" (від нових до старих).
**pageSize:** nuqs, значення обмежені PAGE_SIZES; для API/обчислень використовується pageSizeClamped (fallback DEFAULT_PAGE_SIZE).
