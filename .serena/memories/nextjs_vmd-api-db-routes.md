# nextjs_vmd — API та БД

- **API роути:** `src/app/api/vehicles/route.ts` (GET list, POST create), `src/app/api/vehicles/[id]/route.ts` (GET, PATCH, DELETE). Default sortKey created_at desc у list.
- **Робота з БД:** `src/lib/vehicles-db.ts` — listVehicles (pagination, search, filter, sort), getVehicle, createVehicle, updateVehicle, deleteVehicle. Default sort у listVehicles.
- **Prisma:** схема в `prisma/schema.prisma`, клієнт генерується в node_modules. Підключення через DATABASE_URL у .env.
