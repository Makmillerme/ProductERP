# nextjs_vmd — стек і структура

- **Next.js 15** App Router, **TypeScript** (strict), **React 19**
- **Стилі:** Tailwind CSS v4 (тільки Flex/Grid), clsx, tailwind-merge
- **UI:** Shadcn/ui, Lucide React
- **Форми:** React Hook Form + Zod
- **Стейт:** Zustand (глобальний), nuqs (URL), TanStack Query (серверний)
- **БД:** Prisma, Postgres (локально пароль Rty45678+)
- **Утиліти:** date-fns, sonner

Корінь додатку: `nextjs_vmd/`. Вхід: `src/app/`, layout у `src/components/layout/`. Фічі в `src/features/` (наприклад `vehicles/`). API в `src/app/api/`. Ліба: `src/lib/` (query-client, vehicles-db, utils).
