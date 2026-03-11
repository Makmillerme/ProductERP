# nextjs_vmd — контекст проєкту

Next.js 15 (App Router) додаток парсера ВМД. Стек: TypeScript, React 19, Tailwind v4, Shadcn/ui, TanStack Query (з персистенцією в localStorage), nuqs, Prisma/Postgres.

Ключові шляхи:
- `src/features/vehicles/` — таблиця авто, CRUD, sheet, пагінація, фільтри, сортування
- `src/app/api/vehicles/` — API роути
- `src/components/layout/providers.tsx` — PersistQueryClientProvider (no-op persister на сервері)
- `src/lib/query-client.ts`, `vehicles-db.ts`

Проєкт активовано в Serena як окремий проєкт (не vmd / new_nodejs_vmd_parser).
