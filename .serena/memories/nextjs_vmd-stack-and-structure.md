Стек: Next.js 15.5.12, TypeScript strict, React 19.1.0; Tailwind v4 (Flex/Grid), clsx, tailwind-merge; Shadcn/ui, Lucide; TanStack Query v5 + persister; nuqs; Zustand; Prisma 7.4 + Postgres; Better-Auth; date-fns, sonner. Node >=20.19.0.

Скрипти: generate:locales перед dev/build; db:seed, db:clear, db:clear-statuses; clean для .next.

Структура: src/app/ (routes), src/features/ (products, management, currency, home, kanban, settings), src/lib/ (prisma, products-db, product-field-values, auth, query-client), src/config/ (navigation, permissions, product-documents, composite-field, field-constructor, locales).